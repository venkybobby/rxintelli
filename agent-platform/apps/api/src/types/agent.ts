export type SchedulingDecision =
  | 'schedule_ok'
  | 'auth_required'
  | 'docs_missing'
  | 'human_review';

export interface ExistingAuth {
  status: string;
  expires_at: string;
}

export interface AgentRunPayload {
  payer: string;
  plan_type: string;
  cpt_codes: string[];
  icd_codes?: string[];
  place_of_service: string;
  existing_auth: ExistingAuth | null;
  member_id: string | null;
}

export interface AgentRunRequest {
  case_type: 'scheduling_auth';
  case_id: string;
  payload: AgentRunPayload;
}

export interface ExperimentInfo {
  experiment_id: string;
  variant: 'control' | 'treatment';
}

export interface AgentRunResponse {
  decision: SchedulingDecision;
  confidence: number;
  missing_fields: string[];
  evidence_refs: string[];
  scheduler_message: string;
  experiment: ExperimentInfo | null;
  latency_ms: number;
}
