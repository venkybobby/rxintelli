import type { PolicyKbResult } from '../types/tools.js';

interface Rule {
  rule_id: string;
  payer: string;
  plan_type: string;
  cpt: string;
  pos_contains?: string;
  decision: string;
  confidence: number;
}

const RULES: Rule[] = [
  {
    rule_id: 'R1',
    payer: 'Aetna',
    plan_type: 'HMO',
    cpt: '70553',
    pos_contains: 'Outpatient',
    decision: 'auth_required',
    confidence: 0.95,
  },
  {
    rule_id: 'R2',
    payer: 'United',
    plan_type: 'PPO',
    cpt: '93306',
    decision: 'auth_required',
    confidence: 0.95,
  },
  {
    rule_id: 'R3',
    payer: 'Medicare',
    plan_type: '*',
    cpt: '99213',
    decision: 'schedule_ok',
    confidence: 0.95,
  },
];

/**
 * Evaluate rules against payload. Returns first match or null.
 */
export function evaluateRules(
  payer: string,
  planType: string,
  cptCode: string,
  placeOfService: string
): PolicyKbResult {
  const p = payer.trim();
  const pt = planType.trim();
  const cpt = cptCode.trim();
  const pos = placeOfService.trim();

  for (const r of RULES) {
    const payerMatch = r.payer === p;
    const planMatch = r.plan_type === '*' || r.plan_type === pt;
    const cptMatch = r.cpt === cpt;
    const posMatch = !r.pos_contains || pos.includes(r.pos_contains);

    if (payerMatch && planMatch && cptMatch && posMatch) {
      return {
        rule_id: r.rule_id,
        decision: r.decision,
        confidence: r.confidence,
        evidence_refs: [`rule:${r.rule_id}`],
      };
    }
  }

  return {
    rule_id: null,
    decision: 'human_review',
    confidence: 0.4,
    evidence_refs: [],
  };
}
