export interface EligibilityResult {
  coverage_active: boolean;
}

export interface AuthStatusResult {
  existing_auth: { status: string; expires_at: string } | null;
}

export interface PolicyKbResult {
  rule_id: string | null;
  decision: string;
  confidence: number;
  evidence_refs: string[];
}
