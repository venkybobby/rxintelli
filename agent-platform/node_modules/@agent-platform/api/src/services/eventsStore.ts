import type { TelemetryEvent } from '../types/events.js';

const MAX_EVENTS_PER_TENANT = 10_000;

const tenantBuffers = new Map<string, TelemetryEvent[]>();

function getOrCreateBuffer(tenantId: string): TelemetryEvent[] {
  let buf = tenantBuffers.get(tenantId);
  if (!buf) {
    buf = [];
    tenantBuffers.set(tenantId, buf);
  }
  return buf;
}

/**
 * Store event in tenant-scoped ring buffer.
 */
export function storeEvent(event: TelemetryEvent): void {
  const buf = getOrCreateBuffer(event.tenant_id);
  buf.push(event);
  if (buf.length > MAX_EVENTS_PER_TENANT) {
    buf.shift();
  }
}

/**
 * Get last N events for tenant. No PHI.
 */
export function getEvents(tenantId: string, limit: number = 100): TelemetryEvent[] {
  const buf = tenantBuffers.get(tenantId) ?? [];
  return buf.slice(-limit);
}
