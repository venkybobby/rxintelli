import { Router, Request, Response } from 'express';
import { getEvents } from '../services/eventsStore.js';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  const tenantId = (req.query.tenant_id as string) ?? req.tenant_id;

  if (!tenantId) {
    res.status(400).json({
      error: 'missing_tenant_id',
      message: 'tenant_id query parameter or x-tenant-id header is required',
    });
    return;
  }

  const limit = Math.min(
    parseInt(String(req.query.limit ?? 100), 10) || 100,
    1000
  );

  const events = getEvents(tenantId, limit);
  res.json({ tenant_id: tenantId, events, count: events.length });
});

export default router;
