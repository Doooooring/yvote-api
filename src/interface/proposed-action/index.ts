export enum ProposedActionType {
  CreateNews = 'create_news',
  RouteComment = 'route_comment',
  PromoteType = 'promote_type',
  Publish = 'publish',
  Track = 'track',
  Untrack = 'untrack',
  EditComment = 'edit_comment',
  FillNews = 'fill_news',
}

// Note: `finish_news` was removed from this enum 2026-04-27 (Phase 8.3 of
// the cross-repo plan). The yvote_automation `apply.py` shim from Step
// 2.2.4 still recognizes any in-flight `finish_news` rows on the DB and
// rewrites them to `publish` at apply-time, so dropping the enum value
// here only blocks NEW POSTs of `actionType=finish_news` — by design.
//
// `fill_news` was added 2026-04-28 (single-tier rule, Phase 8.5):
// per-row content (re)generation. Fires the type-specific pipeline that
// fills subtitle / agendaList / summary / etc. Preserves the row's
// `state` (works on draft state=1 AND already-published state=0 rows).
// Owner-fired via /adminjae2 Fill button or Telegram `fill <id>`.
// Auto-approved for cabinet/weekly/economics so routine drafts auto-
// fill end-to-end. EditComment is the existing per-comment edit action.

export enum ProposedActionStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Applied = 'applied',
  Obsolete = 'obsolete',
}

export enum ProposedActionSource {
  ClaudeTriage = 'claude_triage',
  ClaudeFinished = 'claude_finished',
  ClaudeAnticipation = 'claude_anticipation',
  User = 'user',
}

export interface ProposedActionPayload {
  [key: string]: unknown;
}

export interface ProposedActionCreate {
  actionType: ProposedActionType;
  payload: ProposedActionPayload;
  source: ProposedActionSource;
  newsId?: number | null;
  note?: string | null;
}

export interface ProposedActionUpdate {
  status?: ProposedActionStatus;
  appliedAt?: Date | string | null;
  payload?: ProposedActionPayload;
  note?: string | null;
}
