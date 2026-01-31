import { trace } from '@opentelemetry/api';
import { cacheKey, cacheGet, cacheSet } from '../services/cache.js';
import { evaluateRules } from '../services/rulesEngine.js';
import {
  callTool,
  type ToolName,
} from '../services/toolBrokerClient.js';
import { assignExperiment } from '../services/experiments.js';
import {
  rulesDecisionTtl,
  eligibilityTtl,
  authStatusTtl,
} from '../services/speedPolicy.js';
import { storeEvent } from '../services/eventsStore.js';
import { getSchedulerMessage } from '../prompts/promptManager.js';
import {
  agentRequestLatencyMs,
  agentToolLatencyMs,
  agentHumanReviewTotal,
} from '@agent-platform/shared';
import type {
  AgentRunRequest,
  AgentRunResponse,
  AgentRunPayload,
  SchedulingDecision,
  ExperimentInfo,
} from '../types/agent.js';
import type {
  EligibilityResult,
  AuthStatusResult,
  PolicyKbResult,
} from '../types/tools.js';
import type { DecisionProducedEvent, ToolCallCompletedEvent } from '../types/events.js';
import { getTracer } from '../services/telemetry.js';

const tracer = getTracer();

function requiredFields(payload: AgentRunPayload): string[] {
  const missing: string[] = [];
  if (!payload.payer?.trim()) missing.push('payer');
  if (!payload.plan_type?.trim()) missing.push('plan_type');
  if (!payload.cpt_codes?.length || !payload.cpt_codes[0]?.trim())
    missing.push('cpt_codes');
  if (!payload.place_of_service?.trim()) missing.push('place_of_service');
  return missing;
}

interface ToolResults {
  policyKb: PolicyKbResult;
  eligibility?: EligibilityResult;
  authStatus?: AuthStatusResult;
}

function makeDecision(
  tenantId: string,
  caseId: string,
  payload: AgentRunPayload,
  results: ToolResults,
  experiment: ExperimentInfo | null
): { decision: SchedulingDecision; confidence: number; evidence_refs: string[] } {
  const { policyKb, eligibility, authStatus } = results;

  if (policyKb.rule_id && policyKb.decision === 'schedule_ok') {
    return {
      decision: 'schedule_ok',
      confidence: policyKb.confidence,
      evidence_refs: policyKb.evidence_refs,
    };
  }

  if (policyKb.rule_id && policyKb.decision === 'auth_required') {
    const existingAuth = payload.existing_auth ?? authStatus?.existing_auth;
    if (existingAuth?.status === 'active') {
      return {
        decision: 'schedule_ok',
        confidence: 0.9,
        evidence_refs: [...policyKb.evidence_refs, 'existing_auth:active'],
      };
    }
    if (eligibility && !eligibility.coverage_active) {
      agentHumanReviewTotal.inc({ tenant_id: tenantId, case_type: 'scheduling_auth' });
      return {
        decision: 'human_review',
        confidence: 0.5,
        evidence_refs: [...policyKb.evidence_refs, 'eligibility:inactive'],
      };
    }
    return {
      decision: 'auth_required',
      confidence: policyKb.confidence,
      evidence_refs: policyKb.evidence_refs,
    };
  }

  if (policyKb.decision === 'human_review' && !policyKb.rule_id) {
    agentHumanReviewTotal.inc({ tenant_id: tenantId, case_type: 'scheduling_auth' });
    return {
      decision: 'human_review',
      confidence: 0.4,
      evidence_refs: [],
    };
  }

  return {
    decision: 'human_review',
    confidence: 0.5,
    evidence_refs: policyKb.evidence_refs,
  };
}

export async function runSchedulerAuth(
  tenantId: string,
  req: AgentRunRequest
): Promise<AgentRunResponse> {
  const startTime = Date.now();
  const { case_id, case_type, payload } = req;
  const stickyKey = `${tenantId}:${case_id}`;
  const experiment = assignExperiment(case_type, stickyKey);

  return tracer.startActiveSpan(
    'schedulerAuth.run',
    { attributes: { 'tenant.id': tenantId, 'case.id': case_id } },
    async (span) => {
      try {
        const missing = requiredFields(payload);
        if (missing.length > 0) {
          const msg = getSchedulerMessage(case_type, 'docs_missing', {
            missing_fields: missing.join(', '),
          });
          span.setAttribute('decision', 'docs_missing');
          span.end();
          const latency = Date.now() - startTime;
          agentRequestLatencyMs.observe(
            {
              tenant_id: tenantId,
              case_type,
              experiment_id: experiment?.experiment_id ?? '',
              variant: experiment?.variant ?? 'control',
            },
            latency
          );
          return {
            decision: 'docs_missing',
            confidence: 1,
            missing_fields: missing,
            evidence_refs: [],
            scheduler_message: msg,
            experiment,
            latency_ms: latency,
          };
        }

        const cpt = payload.cpt_codes[0];
        const cacheKeyRules = cacheKey(
          tenantId,
          'rules',
          payload.payer,
          payload.plan_type,
          cpt,
          payload.place_of_service
        );

        const cached = cacheGet<{ decision: SchedulingDecision; confidence: number; evidence_refs: string[] }>(
          cacheKeyRules
        );
        if (cached) {
          span.setAttribute('cache.hit', true);
          const msg = getSchedulerMessage(case_type, cached.decision);
          const latency = Date.now() - startTime;
          agentRequestLatencyMs.observe(
            {
              tenant_id: tenantId,
              case_type,
              experiment_id: experiment?.experiment_id ?? '',
              variant: experiment?.variant ?? 'control',
            },
            latency
          );
          const response: AgentRunResponse = {
            decision: cached.decision,
            confidence: cached.confidence,
            missing_fields: [],
            evidence_refs: cached.evidence_refs,
            scheduler_message: msg,
            experiment,
            latency_ms: latency,
          };
          storeEvent({
            event_type: 'DecisionProduced',
            tenant_id: tenantId,
            timestamp: new Date().toISOString(),
            case_id,
            case_type,
            decision: cached.decision,
            confidence: cached.confidence,
          } as DecisionProducedEvent);
          span.end();
          return response;
        }

        const toolOptions = {
          tenant_id: tenantId,
          member_id: payload.member_id ?? null,
          existing_auth: payload.existing_auth ?? null,
          payer: payload.payer,
          plan_type: payload.plan_type,
          cpt_code: cpt,
          place_of_service: payload.place_of_service,
        };

        const onToolCompleted = (toolName: string, durationMs: number) => {
          agentToolLatencyMs.observe({ tenant_id: tenantId, tool_name: toolName }, durationMs);
          storeEvent({
            event_type: 'ToolCallCompleted',
            tenant_id: tenantId,
            timestamp: new Date().toISOString(),
            tool_name: toolName,
            case_id,
            duration_ms: durationMs,
          } as ToolCallCompletedEvent);
        };

        const treatmentProceedEarly =
          experiment?.experiment_id === 'EXP-A2' && experiment?.variant === 'treatment';

        const policyPromise = callTool<PolicyKbResult>(
          'policy_kb_lookup',
          toolOptions,
          onToolCompleted
        );

        let eligibilityPromise: Promise<EligibilityResult> | null = null;
        if (payload.member_id) {
          eligibilityPromise = callTool<EligibilityResult>(
            'eligibility_check_270_271',
            toolOptions,
            onToolCompleted
          );
        }

        const needAuthLookup = !payload.existing_auth;
        const authPromise = needAuthLookup
          ? callTool<AuthStatusResult>('auth_status_lookup', toolOptions, onToolCompleted)
          : Promise.resolve({ existing_auth: payload.existing_auth } as AuthStatusResult);

        let policyKb: PolicyKbResult;
        let eligibility: EligibilityResult | undefined;
        let authStatus: AuthStatusResult | undefined;

        if (treatmentProceedEarly) {
          policyKb = await policyPromise;
          if (
            policyKb.rule_id &&
            (policyKb.decision === 'auth_required' || policyKb.decision === 'schedule_ok') &&
            policyKb.confidence >= 0.9
          ) {
            const results: ToolResults = {
              policyKb,
              eligibility: eligibilityPromise ? await eligibilityPromise : undefined,
              authStatus: await authPromise,
            };
            const decisionResult = makeDecision(
              tenantId,
              case_id,
              payload,
              results,
              experiment
            );
            cacheSet(cacheKeyRules, decisionResult, rulesDecisionTtl);
            const msg = getSchedulerMessage(case_type, decisionResult.decision);
            const latency = Date.now() - startTime;
            agentRequestLatencyMs.observe(
              {
                tenant_id: tenantId,
                case_type,
                experiment_id: experiment?.experiment_id ?? '',
                variant: experiment?.variant ?? 'control',
              },
              latency
            );
            storeEvent({
              event_type: 'DecisionProduced',
              tenant_id: tenantId,
              timestamp: new Date().toISOString(),
              case_id,
              case_type,
              decision: decisionResult.decision,
              confidence: decisionResult.confidence,
            } as DecisionProducedEvent);
            span.setAttribute('decision', decisionResult.decision);
            span.setAttribute('exp.early_exit', true);
            span.end();
            return {
              decision: decisionResult.decision,
              confidence: decisionResult.confidence,
              missing_fields: [],
              evidence_refs: decisionResult.evidence_refs,
              scheduler_message: msg,
              experiment,
              latency_ms: latency,
            };
          }
        }

        const settled = await Promise.allSettled([
          policyPromise,
          eligibilityPromise ?? Promise.resolve(undefined),
          authPromise,
        ]);

        policyKb =
          settled[0].status === 'fulfilled'
            ? settled[0].value
            : {
                rule_id: null,
                decision: 'human_review',
                confidence: 0.4,
                evidence_refs: [],
              };
        eligibility =
          settled[1].status === 'fulfilled' ? settled[1].value : undefined;
        authStatus =
          settled[2].status === 'fulfilled' ? settled[2].value : undefined;

        const decisionResult = makeDecision(
          tenantId,
          case_id,
          payload,
          { policyKb, eligibility, authStatus },
          experiment
        );

        cacheSet(cacheKeyRules, decisionResult, rulesDecisionTtl);

        const msg = getSchedulerMessage(case_type, decisionResult.decision);
        const latency = Date.now() - startTime;

        agentRequestLatencyMs.observe(
          {
            tenant_id: tenantId,
            case_type,
            experiment_id: experiment?.experiment_id ?? '',
            variant: experiment?.variant ?? 'control',
          },
          latency
        );

        storeEvent({
          event_type: 'DecisionProduced',
          tenant_id: tenantId,
          timestamp: new Date().toISOString(),
          case_id,
          case_type,
          decision: decisionResult.decision,
          confidence: decisionResult.confidence,
        } as DecisionProducedEvent);

        span.setAttribute('decision', decisionResult.decision);
        span.end();

        return {
          decision: decisionResult.decision,
          confidence: decisionResult.confidence,
          missing_fields: [],
          evidence_refs: decisionResult.evidence_refs,
          scheduler_message: msg,
          experiment,
          latency_ms: latency,
        };
      } catch (err) {
        span.recordException(err as Error);
        span.end();
        throw err;
      }
    }
  );
}
