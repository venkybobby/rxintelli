/**
 * Redaction patterns for PHI and PII. Apply to free text before logging/events.
 */
const PHI_PATTERNS: Array<[RegExp, string]> = [
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]'],
  [/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]'],
  [/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g, '[DOB_REDACTED]'],
  [/\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g, '[DATE_REDACTED]'],
];

/**
 * Redact email, phone, and DOB from text. Returns redacted string.
 */
export function redact(text: string): string {
  if (!text || typeof text !== 'string') return text;
  let result = text;
  for (const [pattern, replacement] of PHI_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}
