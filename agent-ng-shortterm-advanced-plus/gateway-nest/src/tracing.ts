import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

export async function initTracing() {
  if (process.env.OTEL_ENABLED !== 'true') return;
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);
  const exporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317'
  });
  const sdk = new NodeSDK({
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
    serviceName: process.env.OTEL_SERVICE_NAME || 'gateway-nest'
  } as any);
  await sdk.start();
  process.on('SIGTERM', async () => { await sdk.shutdown(); process.exit(0); });
}
