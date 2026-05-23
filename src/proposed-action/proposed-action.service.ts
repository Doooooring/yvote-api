import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ProposedActionRepository } from 'src/repository/proposed-action/proposed-action.repository';
import {
  ProposedActionBatchCreate,
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
  ProposedActionType.SplitComment,
  ProposedActionType.PromoteType,
  ProposedActionType.Publish,
  ProposedActionType.Unpublish,
  ProposedActionType.Track,
  ProposedActionType.Untrack,
  ProposedActionType.EditNews,
  ProposedActionType.EditComment,
]);

const ALLOWED_STATUSES = new Set<string>([
  ProposedActionStatus.Waiting,
  ProposedActionStatus.Approved,
  ProposedActionStatus.Rejected,
  ProposedActionStatus.Applied,
  ProposedActionStatus.Obsolete,
]);

/**
 * Parse an ISO-8601 timestamp string supplied via query string.
 * Returns undefined when the input is undefined; throws BadRequest
 * when present but unparseable so callers see a clear 400 instead of
 * silently being ignored.
 */
function parseFilterDate(raw: string | undefined, field: string): Date | undefined {
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(
      `proposed-action: ${field} must be an ISO-8601 timestamp (got '${raw}')`,
    );
  }
  return d;
}

function validateCommentPayloadEntries(
  entries: unknown[],
  label: string,
): string | null {
  for (const cp of entries) {
    if (!cp || typeof cp !== 'object')
      return `${label} entries must be objects`;
    const ct = (cp as Record<string, unknown>).commentType;
    if (!ct || typeof ct !== 'string')
      return `${label} entry missing string \`commentType\``;
  }
  return null;
}

function validateOptionalCommentPayloadArray(
  raw: unknown,
  label: string,
): string | null {
  if (raw === undefined) return null;
  if (!Array.isArray(raw)) return `${label} must be an array`;
  return validateCommentPayloadEntries(raw, label);
}

function validateSplitSourceReplacement(
  replacement: Record<string, unknown>,
  label: string,
): string | null {
  if (replacement.sourceNewsId === undefined)
    return `${label} missing \`sourceNewsId\``;
  if (
    !replacement.sourceCommentType ||
    typeof replacement.sourceCommentType !== 'string'
  )
    return `${label} missing string \`sourceCommentType\``;
  if (
    replacement.sourceCommentId === undefined &&
    !replacement.sourceCommentTitle
  )
    return `${label} requires \`sourceCommentId\` or \`sourceCommentTitle\``;
  return validateOptionalCommentPayloadArray(
    replacement.sourceRemainders,
    `${label} sourceRemainders`,
  );
}

/**
 * Per-actionType payload-shape sanity check. The API enforces only the
 * top-level required fields — full schema validation lives in the
 * conductor's apply.py because that's where the action is consumed.
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
    case ProposedActionType.RouteComment: {
      // Two accepted shapes:
      //   - Single:  { commentType: <string>, commentPayload: <object>, ... }
      //   - Batch:   { commentPayloads: [<object>, ...], ... }   (per-entry
      //     commentType lives inside each entry; conductor's apply.py
      //     groups by per-entry commentType at apply time).
      // The batch form is what the dailyscrape AI topical step emits when
      // multiple items match the same target news; previously rejected by
      // this validator, which silently lost comments on the conductor side.
      const hasBatch =
        Array.isArray(p.commentPayloads) && p.commentPayloads.length > 0;
      if (hasBatch) {
        for (const cp of p.commentPayloads as unknown[]) {
          if (!cp || typeof cp !== 'object')
            return 'route_comment commentPayloads entries must be objects';
          const ct = (cp as Record<string, unknown>).commentType;
          if (!ct || typeof ct !== 'string')
            return 'route_comment batch entry missing string `commentType`';
        }
      } else {
        if (!p.commentType || typeof p.commentType !== 'string')
          return 'route_comment payload missing string `commentType`';
        if (!p.commentPayload || typeof p.commentPayload !== 'object')
          return 'route_comment payload missing object `commentPayload`';
      }
      if (p.targetNewsId === undefined && (newsId === undefined || newsId === null))
        return 'route_comment requires `targetNewsId` (in payload) or `newsId` (top-level)';
      return null;
    }
    case ProposedActionType.SplitComment: {
      const sourceReplacements = p.sourceReplacements;
      const hasBatchedSources =
        Array.isArray(sourceReplacements) && sourceReplacements.length > 0;
      if (sourceReplacements !== undefined && !hasBatchedSources)
        return 'split_comment sourceReplacements must be a non-empty array';
      if (hasBatchedSources) {
        for (const replacement of sourceReplacements as unknown[]) {
          if (!replacement || typeof replacement !== 'object')
            return 'split_comment sourceReplacements entries must be objects';
          const err = validateSplitSourceReplacement(
            replacement as Record<string, unknown>,
            'split_comment sourceReplacement',
          );
          if (err) return err;
        }
      } else {
        if (p.sourceNewsId === undefined)
          return 'split_comment payload missing `sourceNewsId`';
        if (!p.sourceCommentType || typeof p.sourceCommentType !== 'string')
          return 'split_comment payload missing string `sourceCommentType`';
        if (p.sourceCommentId === undefined && !p.sourceCommentTitle)
          return 'split_comment requires `sourceCommentId` or `sourceCommentTitle`';
      }
      if (!Array.isArray(p.destinations) || p.destinations.length === 0)
        return 'split_comment destinations must be a non-empty array';
      for (const destination of p.destinations as unknown[]) {
        if (!destination || typeof destination !== 'object')
          return 'split_comment destination entries must be objects';
        const d = destination as Record<string, unknown>;
        if (d.targetNewsId === undefined)
          return 'split_comment destination missing `targetNewsId`';
        if (!Array.isArray(d.commentPayloads) || d.commentPayloads.length === 0)
          return 'split_comment destination commentPayloads must be a non-empty array';
        const err = validateCommentPayloadEntries(
          d.commentPayloads as unknown[],
          'split_comment commentPayloads',
        );
        if (err) return err;
      }
      const remainderErr = validateOptionalCommentPayloadArray(
        p.sourceRemainders,
        'split_comment sourceRemainders',
      );
      if (remainderErr) return remainderErr;
      return null;
    }
    case ProposedActionType.PromoteType:
      if (newsId === undefined || newsId === null)
        return 'promote_type requires top-level `newsId`';
      if (!p.fromType || typeof p.fromType !== 'string')
        return 'promote_type payload missing string `fromType`';
      if (!p.toType || typeof p.toType !== 'string')
        return 'promote_type payload missing string `toType`';
      return null;
    case ProposedActionType.Publish:
    case ProposedActionType.Unpublish:
      if (newsId === undefined || newsId === null)
        return `${actionType} requires top-level \`newsId\``;
      return null;
    case ProposedActionType.Track:
    case ProposedActionType.Untrack:
      if (newsId === undefined || newsId === null)
        return `${actionType} requires top-level \`newsId\``;
      return null;
    case ProposedActionType.EditNews:
      if (newsId === undefined || newsId === null)
        return 'edit_news requires top-level `newsId`';
      if (p.fields !== undefined) {
        if (!p.fields || typeof p.fields !== 'object' || Array.isArray(p.fields))
          return 'edit_news `fields` must be an object';
      }
      return null;
    case ProposedActionType.EditComment:
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

  private validateCreateData(data: ProposedActionCreate) {
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
  }

  private assertStatusTransition(
    row: { id?: number; status?: string; appliedAt?: unknown },
    targetStatus: ProposedActionStatus,
  ) {
    const current = row.status;
    if (!current || !ALLOWED_STATUSES.has(current)) {
      throw new BadRequestException(
        `proposed-action: row ${row.id ?? '?'} has unknown status '${current}'`,
      );
    }

    if (current === targetStatus) return;

    if (row.appliedAt || current === ProposedActionStatus.Applied) {
      throw new BadRequestException(
        `proposed-action: already applied action ${row.id ?? '?'} cannot move to ${targetStatus}`,
      );
    }

    const allowed =
      (current === ProposedActionStatus.Waiting &&
        [
          ProposedActionStatus.Approved,
          ProposedActionStatus.Rejected,
          ProposedActionStatus.Obsolete,
        ].includes(targetStatus)) ||
      (current === ProposedActionStatus.Approved &&
        [
          ProposedActionStatus.Applied,
          ProposedActionStatus.Obsolete,
        ].includes(targetStatus)) ||
      (current === ProposedActionStatus.Rejected &&
        targetStatus === ProposedActionStatus.Obsolete);

    if (!allowed) {
      throw new BadRequestException(
        `proposed-action: cannot change status from ${current} to ${targetStatus}`,
      );
    }
  }

  private async updateStatus(id: number, status: ProposedActionStatus) {
    const row = await this.repo.findById(id);
    if (!row) return row;
    this.assertStatusTransition(row, status);
    if (row.status === status) return row;
    return await this.repo.update(id, { status });
  }

  async create(data: ProposedActionCreate) {
    this.validateCreateData(data);
    return await this.repo.create(data);
  }

  async createBatch(data: ProposedActionBatchCreate) {
    if (!data || !Array.isArray(data.actions) || data.actions.length === 0) {
      throw new BadRequestException(
        'proposed-action: `actions` must be a non-empty array',
      );
    }
    for (const action of data.actions) {
      this.validateCreateData(action);
    }
    return await this.repo.createBatch(data.actions);
  }

  async getById(id: number) {
    return await this.repo.findById(id);
  }

  async list(options: {
    /** One or more statuses (`status IN (...)` if length > 1). */
    statuses?: string[];
    newsId?: number;
    /** Exact match on actionType (e.g. "publish"). */
    actionType?: string;
    /** Substring match on note (LIKE %note%). */
    note?: string;
    /** ISO timestamp string; matches createdAt >= this value. */
    createdAfter?: string;
    /** ISO timestamp string; matches createdAt <= this value. */
    createdBefore?: string;
    offset?: number;
    limit?: number;
  }) {
    if (options.statuses && options.statuses.length > 0) {
      for (const s of options.statuses) {
        if (!ALLOWED_STATUSES.has(s)) {
          throw new BadRequestException(
            `proposed-action: unknown status '${s}'. ` +
              `Allowed: ${[...ALLOWED_STATUSES].join(', ')}`,
          );
        }
      }
    }
    if (options.actionType !== undefined && !ALLOWED_ACTION_TYPES.has(options.actionType)) {
      throw new BadRequestException(
        `proposed-action: unknown actionType '${options.actionType}'. ` +
          `Allowed: ${[...ALLOWED_ACTION_TYPES].join(', ')}`,
      );
    }
    const createdAfterDate = parseFilterDate(options.createdAfter, 'createdAfter');
    const createdBeforeDate = parseFilterDate(options.createdBefore, 'createdBefore');
    return await this.repo.list({
      statuses: options.statuses,
      newsId: options.newsId,
      actionType: options.actionType,
      note: options.note,
      createdAfter: createdAfterDate,
      createdBefore: createdBeforeDate,
      offset: options.offset,
      limit: options.limit,
    });
  }

  async update(id: number, patch: ProposedActionUpdate) {
    if (patch && patch.status !== undefined && !ALLOWED_STATUSES.has(patch.status)) {
      throw new BadRequestException(
        `proposed-action: unknown status '${patch.status}'. ` +
          `Allowed: ${[...ALLOWED_STATUSES].join(', ')}`,
      );
    }
    if (patch && patch.status !== undefined) {
      const row = await this.repo.findById(id);
      if (!row) return row;
      this.assertStatusTransition(row, patch.status as ProposedActionStatus);
    }
    return await this.repo.update(id, patch);
  }

  async approve(id: number) {
    return await this.updateStatus(id, ProposedActionStatus.Approved);
  }

  async reject(id: number) {
    return await this.updateStatus(id, ProposedActionStatus.Rejected);
  }

  async markApplied(id: number) {
    return await this.updateStatus(id, ProposedActionStatus.Applied);
  }

  async delete(id: number) {
    return await this.repo.delete(id);
  }
}
