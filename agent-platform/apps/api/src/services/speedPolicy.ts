import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface SpeedConfig {
  cache?: {
    rules_decision_ttl?: number;
    eligibility_ttl?: number;
    auth_status_ttl?: number;
  };
}

let config: SpeedConfig = {};

try {
  const configPath = path.join(__dirname, '..', 'config', 'speed.yaml');
  const content = fs.readFileSync(configPath, 'utf8');
  config = (yaml.load(content) as SpeedConfig) ?? {};
} catch {
  config = {
    cache: {
      rules_decision_ttl: 300,
      eligibility_ttl: 600,
      auth_status_ttl: 300,
    },
  };
}

export const rulesDecisionTtl = config.cache?.rules_decision_ttl ?? 300;
export const eligibilityTtl = config.cache?.eligibility_ttl ?? 600;
export const authStatusTtl = config.cache?.auth_status_ttl ?? 300;
