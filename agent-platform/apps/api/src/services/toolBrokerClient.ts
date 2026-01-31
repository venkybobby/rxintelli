import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { hashToBucket } from '@agent-platform/shared';
import { evaluateRules } from './rulesEngine.js';
import type {
  EligibilityResult,
  AuthStatusResult,
  PolicyKbResult,
} from '../types/tools.js';

let toolsConfig: Record<string, { simulated_latency_ms: number }> = (() => {
  try {
    const configPath = path.join(__dirname, '..', 'config', 'tools.yaml');
    const content = fs.readFileSync(configPath, 'utf8');
    const cfg = yaml.load(content) as {
      tools?: Record<string, { simulated_latency_ms: number }>;
    };
    return cfg?.tools ?? {};
  } catch {
    return {
      eligibility_check_270_271: { simulated_latency_ms: 50 },
      auth_status_lookup: { simulated_latency_ms: 30 },
      policy_kb_lookup: { simulated_latency_ms: 20 },
    };
  }
})();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulated eligibility check. Returns coverage_active based on member_id hash parity.
 */
async function eligibilityCheck(
  tenantId: string,
  memberId: string
): Promise<EligibilityResult> {
  const cfg = toolsConfig.eligibility_check_270_271 ?? { simulated_latency_ms: 50 };
  await delay(cfg.simulated_latency_ms);
  const bucket = hashToBucket(`${tenantId}:${memberId}`, 2);
  return { coverage_active: bucket === 0 };
}

/**
 * Simulated auth status lookup.
 */
async function authStatusLookup(
  tenantId: string,
  existingAuth: { status: string; expires_at: string } | null
): Promise<AuthStatusResult> {
  if (existingAuth) {
    return { existing_auth: existingAuth };
  }
  const cfg = toolsConfig.auth_status_lookup ?? { simulated_latency_ms: 30 };
  await delay(cfg.simulated_latency_ms);
  const bucket = hashToBucket(tenantId, 2);
  return {
    existing_auth: bucket === 0 ? { status: 'active', expires_at: '2025-12-31' } : null,
  };
}

/**
 * Policy KB lookup delegates to rules engine.
 */
async function policyKbLookup(
  payer: string,
  planType: string,
  cptCode: string,
  placeOfService: string
): Promise<PolicyKbResult> {
  const cfg = toolsConfig.policy_kb_lookup ?? { simulated_latency_ms: 20 };
  await delay(cfg.simulated_latency_ms);
  return evaluateRules(payer, planType, cptCode, placeOfService);
}

export type ToolName =
  | 'eligibility_check_270_271'
  | 'auth_status_lookup'
  | 'policy_kb_lookup';

export interface ToolCallOptions {
  tenant_id: string;
  member_id?: string | null;
  existing_auth?: { status: string; expires_at: string } | null;
  payer: string;
  plan_type: string;
  cpt_code: string;
  place_of_service: string;
}

export async function callTool<T>(
  toolName: ToolName,
  options: ToolCallOptions,
  onToolCompleted?: (toolName: string, durationMs: number) => void
): Promise<T> {
  const start = Date.now();
  let result: unknown;

  switch (toolName) {
    case 'eligibility_check_270_271':
      if (!options.member_id) {
        throw new Error('member_id required for eligibility_check_270_271');
      }
      result = await eligibilityCheck(options.tenant_id, options.member_id);
      break;
    case 'auth_status_lookup':
      result = await authStatusLookup(
        options.tenant_id,
        options.existing_auth ?? null
      );
      break;
    case 'policy_kb_lookup':
      result = await policyKbLookup(
        options.payer,
        options.plan_type,
        options.cpt_code,
        options.place_of_service
      );
      break;
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }

  const durationMs = Date.now() - start;
  onToolCompleted?.(toolName, durationMs);
  return result as T;
}
