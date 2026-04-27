import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ProposedActionRepository } from 'src/repository/proposed-action/proposed-action.repository';
import {
  ProposedActionCreate,
  ProposedActionStatus,
  ProposedActionType,
  ProposedActionUpdate,
} from 'src/interface/proposed-action';

/**
 * Allowed actionType strings as of the 2026-04-27 cross-repo plan.
 *
 * `finish_news` was dropped from this set 2026-04-27 (Phase 8.3); the
 * yvote_automation apply.py shim handles legacy in-flight rows by
 * rewriting them to `publish` at apply-time, so this set is now the
 * canonical taxonomy. Anything outside it is a 400 from create/update.
 */
const ALLOWED_ACTION_TYPES = new Set<string>([
  ProposedActionType.CreateNews,
  ProposedActionType.RouteComment,
  ProposedActionType.PromoteType,
  ProposedActionType.Publish,
  ProposedActionType.Track,
  ProposedActionType.Untrack,
  ProposedActionType.EditComment,
  ProposedActionType.FillNews,
]);

const ALLOWED_STATUSES = new Set<string>([
  ProposedActionStatus.Pending,
  ProposedActionStatus.Approved,
  ProposedActionStatus.Rejected,
  ProposedActionStatus.Applied,
  ProposedActionStatus.Obsolete,
]);

/**
 * Per-actionType payload-shape sanity check. The API enforces only the
 * top-level required fields — full schema validation lives in the
 * conductor's apply.py because that's where the action is consumed.
 *
 * The point of this validator is to fail fast for typos
 * (e.g. `commentTyep`, `newId`) at PA-creation time so they don't sit
 * in the queue until apply blows up.
 */
function validatePayloadShape(
  actionType: string,
  payload: Record<string, unknown> | undefined,
  newsId: number | null | undefined,
): string | null {
  const p = payload || {};
  switch (actionType) {
    case ProposedActionType.CreateNews:
      if (!p.title || typeof p.title !== 'string')
        return 'create_news payload missing string `title`';
      if (!p.newsType || typeof p.newsType !== 'string')
        return 'create_news payload missing string `newsType`';
      return null;
    case ProposedActionType.RouteComment:
      if (!p.commentType || typeof p.commentType !== 'string')
        return 'route_comment payload missing string `commentType`';
      if (!p.commentPayload || typeof p.commentPayload !== 'object')
        return 'route_comment payload missing object `commentPayload`';
      if (p.targetNewsId === undefined && (newsId === undefined || newsId === null))
        return 'route_comment requires `targetNewsId` (in payload) or `newsId` (top-level)';
      return null;
    case ProposedActionType.PromoteType:
      if (newsId === undefined || newsId === null)
        return 'promote_type requires top-level `newsId`';
      if (!p.fromType || typeof p.fromType !== 'string')
        return 'promote_type payload missing string `fromType`';
      if (!p.toType || typeof p.toType !== 'string')
        return 'promote_type payload missing string `toType`';
      return null;
    case ProposedActionType.Publish:
      if (newsId === undefined || newsId === null)
        return `${actionType} requires top-level \`newsId\``;
      return null;
    case ProposedActionType.Track:
    case ProposedActionType.Untrack:
      if (newsId === undefined || newsId === null)
        return `${actionType} requires top-level \`newsId\``;
      return null;
    case ProposedActionType.FillNews:
      // FillNews is "(re)generate the type-specific content fields for
      // an existing row". Always needs newsId. Optional payload field
      // `generatedContent` lets a worker pre-bake the field map so the
      // apply path can use the fast-path (no pipeline run); without it,
      // apply runs the full type-specific pipeline. We don't enforce
      // payload shape here — the conductor's apply.py owns that schema.
      if (newsId === undefined || newsId === null)
        return 'fill_news requires top-level `newsId`';
      return null;
    case ProposedActionType.EditComment:
      // EditComment requires top-level newsId + payload identifying
      // which comment to edit; the conductor's apply.py owns the rest
      // of the schema (commentType / matcher / new fields).
      if (newsId === undefined || newsId === null)
        return 'edit_comment requires top-level `newsId`';
      return null;
    default:
      return null;
  }
}

@Injectable()
export class ProposedActionService {
  constructor(
    @Inject(ProposedActionRepository)
    private readonly repo: ProposedActionRepository,
  ) {}

  async create(data: ProposedActionCreate) {
    if (!data || !data.actionType) {
      throw new BadRequestException('proposed-action: `actionType` is required');
    }
    if (!ALLOWED_ACTION_TYPES.has(data.actionType)) {
      throw new BadRequestException(
        `proposed-action: unknown actionType '${data.actionType}'. ` +
          `Allowed: ${[...ALLOWED_ACTION_TYPES].join(', ')}`,
      );
    }
    const shapeError = validatePayloadShape(
      data.actionType,
      data.payload as Record<string, unknown> | undefined,
      data.newsId,
    );
    if (shapeError) {
      throw new BadRequestException(`proposed-action: ${shapeError}`);
    }
    return await this.repo.create(data);
  }

  async getById(id: number) {
    return await this.repo.findById(id);
  }

  async list(options: {
    status?: ProposedActionStatus;
    newsId?: number;
    offset?: number;
    limit?: number;
  }) {
    return await this.repo.list(options);
  }

  async update(id: number, patch: ProposedActionUpdate) {
    if (patch && patch.status !== undefined && !ALLOWED_STATUSES.has(patch.status)) {
      throw new BadRequestException(
        `proposed-action: unknown status '${patch.status}'. ` +
          `Allowed: ${[...ALLOWED_STATUSES].join(', ')}`,
      );
    }
    return await this.repo.update(id, patch);
  }

  async approve(id: number) {
    return await this.repo.update(id, { status: ProposedActionStatus.Approved });
  }

  async reject(id: number) {
    return await this.repo.update(id, { status: ProposedActionStatus.Rejected });
  }

  async markApplied(id: number) {
    return await this.repo.update(id, { status: ProposedActionStatus.Applied });
  }

  async delete(id: number) {
    return await this.repo.delete(id);
  }
}
