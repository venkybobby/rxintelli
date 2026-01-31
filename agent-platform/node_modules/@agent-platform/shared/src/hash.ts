import { createHash } from 'crypto';

/**
 * SHA256 hash of input string. Used for experiment bucketing and cache keys.
 */
export function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Compute bucket index 0-99 from hash for A/B bucketing.
 */
export function hashToBucket(input: string, numBuckets: number = 100): number {
  const hash = sha256(input);
  const hexSlice = hash.slice(0, 8);
  return parseInt(hexSlice, 16) % numBuckets;
}
