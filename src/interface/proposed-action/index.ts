export enum ProposedActionType {
  CreateNews = 'create_news',
  RouteComment = 'route_comment',
  FinishNews = 'finish_news',
  Publish = 'publish',
  Track = 'track',
  Untrack = 'untrack',
}

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
