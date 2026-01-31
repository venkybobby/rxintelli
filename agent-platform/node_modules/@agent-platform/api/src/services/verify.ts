import { redact } from '@agent-platform/shared';
import { agentVerifierRejectsTotal } from '@agent-platform/shared';
import { storeEvent } from './eventsStore.js';
import type { AgentRunResponse, SchedulingDecision } from '../types/agent.js';
import type { VerifierResultEvent } from '../types/events.js';

const VALID_DECISIONS: SchedulingDecision[] = [
  'schedule_ok',
  'auth_required',
  'docs_missing',
  'human_review',
];

/**
 * Verify response and optionally downgrade. Redact scheduler_message.
 */
export function verifyResponse(
  tenantId: string,
  caseId: string,
  response: AgentRunResponse
): AgentRunResponse {
  let decision = response.decision;
  let evidenceRefs = response.evidence_refs;
  let passed = true;
  let downgradeReason: string | undefined;

  if (!VALID_DECISIONS.includes(decision)) {
    decision = 'human_review';
    passed = false;
    downgradeReason = 'invalid_decision_enum';
  }

  if (decision === 'auth_required' && evidenceRefs.length === 0) {
    decision = 'human_review';
    passed = false;
    downgradeReason = 'auth_required_requires_evidence';
  }

  if (!passed) {
    agentVerifierRejectsTotal.inc({ tenant_id: tenantId });
  }

  const verifierEvent: VerifierResultEvent = {
    event_type: 'VerifierResult',
    tenant_id: tenantId,
    timestamp: new Date().toISOString(),
    case_id: caseId,
    passed,
    ...(downgradeReason && { downgrade_reason: downgradeReason }),
  };
  storeEvent(verifierEvent);

  return {
    ...response,
    decision,
    evidence_refs: evidenceRefs,
    scheduler_message: redact(response.scheduler_message),
  };
}
