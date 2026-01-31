import { Router, Request, Response } from 'express';
import { register } from '@agent-platform/shared';

const router = Router();

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

export default router;
