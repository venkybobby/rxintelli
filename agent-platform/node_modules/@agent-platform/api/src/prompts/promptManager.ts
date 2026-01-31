import fs from 'node:fs';
import path from 'node:path';

interface PromptRegistry {
  [caseType: string]: {
    templates: Record<string, string>;
    fallback: string;
  };
}

let registry: PromptRegistry | null = null;

function loadRegistry(): PromptRegistry {
  if (registry) return registry;
  const registryPath = path.join(__dirname, 'promptRegistry.json');
  try {
    const content = fs.readFileSync(registryPath, 'utf8');
    registry = JSON.parse(content) as PromptRegistry;
  } catch {
    registry = {
      scheduling_auth: {
        templates: {},
        fallback: 'Contact support.',
      },
    };
  }
  return registry;
}

/**
 * Get template message for case type and decision. Supports {missing_fields} placeholder.
 */
export function getSchedulerMessage(
  caseType: string,
  decision: string,
  placeholders?: { missing_fields?: string }
): string {
  const reg = loadRegistry();
  const entry = reg[caseType];
  if (!entry) return reg.scheduling_auth?.fallback ?? 'Contact support.';

  const template =
    entry.templates[decision] ?? entry.templates.human_review ?? entry.fallback;
  if (placeholders?.missing_fields)
    return template.replace('{missing_fields}', placeholders.missing_fields);
  return template.replace(/\{missing_fields\}/g, '');
}
