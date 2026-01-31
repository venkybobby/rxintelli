import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { hashToBucket } from '@agent-platform/shared';
import type { ExperimentConfig, Variant } from '../types/experiments.js';

let experiments: ExperimentConfig[] = [];

function loadExperiments(): ExperimentConfig[] {
  if (experiments.length > 0) return experiments;
  try {
    const configPath = path.join(__dirname, '..', 'config', 'experiments.yaml');
    const content = fs.readFileSync(configPath, 'utf8');
    const cfg = yaml.load(content) as { experiments?: ExperimentConfig[] };
    experiments = cfg?.experiments ?? [];
  } catch {
    experiments = [];
  }
  return experiments;
}

/**
 * Assign experiment variant using SHA256 sticky bucketing.
 * Bucket 0-control_bucket_end: control
 * control_bucket_end-treatment_bucket_end: treatment
 */
export function assignExperiment(
  caseType: string,
  stickyKey: string
): { experiment_id: string; variant: Variant } | null {
  const exps = loadExperiments();
  const exp = exps.find(
    (e) => e.enabled && e.case_types.includes(caseType)
  );
  if (!exp) return null;

  const bucket = hashToBucket(stickyKey, 100);

  if (bucket < exp.control_bucket_end) {
    return { experiment_id: exp.experiment_id, variant: 'control' };
  }
  if (bucket < exp.treatment_bucket_end) {
    return { experiment_id: exp.experiment_id, variant: 'treatment' };
  }
  return { experiment_id: exp.experiment_id, variant: 'control' };
}
