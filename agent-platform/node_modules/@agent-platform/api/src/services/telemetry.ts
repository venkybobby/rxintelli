import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('agent-platform', '1.0.0');

/**
 * Create a span for tracing. Use with tracer.startActiveSpan or tracer.startSpan.
 */
export function getTracer() {
  return tracer;
}
