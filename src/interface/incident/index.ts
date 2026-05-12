/**
 * Incident — a free-form parse / scrape / apply error or warning surfaced
 * to the owner at /adminjae2's IncidentsLane. Distinct from
 * ProposedAction: incidents are NOT typed write proposals, they are
 * narrative reports of system trouble that the owner reads, dismisses,
 * or marks resolved. Free-form questions a manager has for the owner
 * still go via Telegram, NEVER through this table — see
 * `feedback_q_and_a_policy` in MEMORY.md (yvote_automation).
 *
 * Designed for the 2026-04-27 cross-repo plan, phase 6.
 */

export enum IncidentSource {
  Scrape = 'scrape',
  Parse = 'parse',
  Apply = 'apply',
  Manager = 'manager',
  Conductor = 'conductor',
  Other = 'other',
}

export enum IncidentSeverity {
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
}

export enum IncidentStatus {
  Open = 'open',
  Dismissed = 'dismissed',
  Resolved = 'resolved',
}

export interface IncidentDetails {
  [key: string]: unknown;
}

export interface IncidentCreate {
  source: IncidentSource;
  severity: IncidentSeverity;
  message: string;
  details?: IncidentDetails;
  newsId?: number | null;
  proposedActionId?: number | null;
}

export interface IncidentUpdate {
  status?: IncidentStatus;
  details?: IncidentDetails;
  message?: string;
}
