import { Router, Request, Response } from 'express';
import { storeEvent } from '../services/eventsStore.js';
import type { UserFeedbackSubmittedEvent } from '../types/events.js';

const router = Router();

router.post('/', (req: Request, res: Response): void => {
  const tenantId = req.tenant_id;
  if (!tenantId) {
    res.status(400).json({ error: 'missing_tenant_id', message: 'x-tenant-id required' });
    return;
  }
  const body = req.body as { case_id?: string; feedback_type?: string };

  const caseId = body?.case_id ?? 'unknown';
  const feedbackType = body?.feedback_type ?? 'unknown';

  const event: UserFeedbackSubmittedEvent = {
    event_type: 'UserFeedbackSubmitted',
    tenant_id: tenantId,
    timestamp: new Date().toISOString(),
    case_id: caseId,
    feedback_type: feedbackType,
  };
  storeEvent(event);

  res.status(202).json({
    status: 'accepted',
    message: 'Feedback recorded',
  });
});

export default router;
