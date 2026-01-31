import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

export const register = new Registry();
collectDefaultMetrics({ register });

export const agentRequestLatencyMs = new Histogram({
  name: 'agent_request_latency_ms',
  help: 'Agent request latency in milliseconds',
  labelNames: ['tenant_id', 'case_type', 'experiment_id', 'variant'],
  buckets: [10, 25, 50, 100, 200, 500, 1000, 2500, 5000],
  registers: [register],
});

export const agentToolLatencyMs = new Histogram({
  name: 'agent_tool_latency_ms',
  help: 'Agent tool call latency in milliseconds',
  labelNames: ['tenant_id', 'tool_name'],
  buckets: [5, 10, 25, 50, 100, 200, 500],
  registers: [register],
});

export const agentVerifierRejectsTotal = new Counter({
  name: 'agent_verifier_rejects_total',
  help: 'Total number of verifier rejections',
  labelNames: ['tenant_id'],
  registers: [register],
});

export const agentHumanReviewTotal = new Counter({
  name: 'agent_human_review_total',
  help: 'Total number of human review decisions',
  labelNames: ['tenant_id', 'case_type'],
  registers: [register],
});
