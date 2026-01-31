export type EventType =
  | 'DecisionProduced'
  | 'VerifierResult'
  | 'OverrideRecorded'
  | 'UserFeedbackSubmitted'
  | 'ToolCallCompleted';

export interface BaseEvent {
  event_type: EventType;
  tenant_id: string;
  timestamp: string;
}

export interface DecisionProducedEvent extends BaseEvent {
  event_type: 'DecisionProduced';
  case_id: string;
  case_type: string;
  decision: string;
  confidence: number;
}

export interface VerifierResultEvent extends BaseEvent {
  event_type: 'VerifierResult';
  case_id: string;
  passed: boolean;
  downgrade_reason?: string;
}

export interface OverrideRecordedEvent extends BaseEvent {
  event_type: 'OverrideRecorded';
  case_id: string;
  original_decision: string;
  override_decision: string;
}

export interface UserFeedbackSubmittedEvent extends BaseEvent {
  event_type: 'UserFeedbackSubmitted';
  case_id: string;
  feedback_type: string;
}

export interface ToolCallCompletedEvent extends BaseEvent {
  event_type: 'ToolCallCompleted';
  tool_name: string;
  case_id?: string;
  duration_ms: number;
}

export type TelemetryEvent =
  | DecisionProducedEvent
  | VerifierResultEvent
  | OverrideRecordedEvent
  | UserFeedbackSubmittedEvent
  | ToolCallCompletedEvent;
