import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';

const baseEndpoint =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318';
const otlpEndpoint = baseEndpoint.endsWith('/v1/traces')
  ? baseEndpoint
  : `${baseEndpoint.replace(/\/$/, '')}/v1/traces`;

let sdk: NodeSDK | null = null;
let initialized = false;

/**
 * Initialize OpenTelemetry SDK. Call once at app startup.
 */
export function initOtel(serviceName: string = 'agent-platform-api'): void {
  if (initialized) return;

  const exporter = new OTLPTraceExporter({
    url: otlpEndpoint,
  });

  sdk = new NodeSDK({
    resource: new Resource({
      'service.name': serviceName,
    }),
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  initialized = true;
}

/**
 * Shutdown OTel SDK gracefully.
 */
export async function shutdownOtel(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
    initialized = false;
  }
}

/**
 * Check if OTel is initialized.
 */
export function isOtelInitialized(): boolean {
  return initialized;
}
