import { initOtel } from '@agent-platform/shared';

initOtel(process.env.OTEL_SERVICE_NAME ?? 'agent-api');

import express from 'express';
import { tenantMiddleware } from './middleware/tenant.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import agentRoutes from './routes/agent.js';
import feedbackRoutes from './routes/feedback.js';
import metricsRoutes from './routes/metrics.js';
import healthRoutes from './routes/health.js';
import eventsRoutes from './routes/events.js';

const app = express();
app.use(express.json());
app.use(requestIdMiddleware);

app.use('/metrics', metricsRoutes);
app.use('/health', healthRoutes);

app.use(tenantMiddleware);

app.use('/agent', agentRoutes);
app.use('/feedback', feedbackRoutes);
app.use('/events', eventsRoutes);

app.use(errorHandler);

const PORT = parseInt(process.env.PORT ?? '3000', 10);
app.listen(PORT, () => {
  console.log(`Agent platform API listening on port ${PORT}`);
});
