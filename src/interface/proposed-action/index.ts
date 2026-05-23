export enum ProposedActionType {
  CreateNews = 'create_news',
  RouteComment = 'route_comment',
  SplitComment = 'split_comment',
  PromoteType = 'promote_type',
  Publish = 'publish',
  Unpublish = 'unpublish',
  Track = 'track',
  Untrack = 'untrack',
  EditNews = 'edit_news',
  EditComment = 'edit_comment',
}

// Note: `finish_news` was removed from this enum 2026-04-27 (Phase 8.3 of
// the cross-repo plan). The yvote_automation `apply.py` shim from Step
// 2.2.4 still recognizes any in-flight `finish_news` rows on the DB and
// rewrites them to `publish` at apply-time, so dropping the enum value
// here only blocks NEW POSTs of `actionType=finish_news` — by design.
// EditNews/EditComment are owner-approved edit actions.

export enum ProposedActionStatus {
  // Renamed 2026-05-04: 'pending' → 'waiting' to disambiguate from
  // News.state 'pending' (= draft). Migration
  // RenameProposedActionPendingToWaiting1777822084423 rewrites existing
  // rows. The conductor's apply.py + adminjae2 UI move in lockstep.
  Waiting = 'waiting',
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

export interface ProposedActionBatchCreate {
  actions: ProposedActionCreate[];
}

export interface ProposedActionUpdate {
  status?: ProposedActionStatus;
  appliedAt?: Date | string | null;
  payload?: ProposedActionPayload;
  note?: string | null;
}
