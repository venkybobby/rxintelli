import { Router, Request, Response } from 'express';
import { isOtelInitialized } from '@agent-platform/shared';
import fs from 'node:fs';
import path from 'node:path';

const router = Router();

router.get('/live', (_req: Request, res: Response): void => {
  res.json({ status: 'ok' });
});

router.get('/ready', (_req: Request, res: Response): void => {
  const configLoaded = (() => {
    try {
      const p = path.join(__dirname, '..', 'config', 'experiments.yaml');
      return fs.existsSync(p);
    } catch {
      return false;
    }
  })();

  const otelReady = isOtelInitialized();

  if (configLoaded && otelReady) {
    res.json({ status: 'ok', config: true, otel: true });
  } else {
    res.status(503).json({
      status: 'degraded',
      config: configLoaded,
      otel: otelReady,
    });
  }
});

export default router;
