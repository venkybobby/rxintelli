import { Request, Response, NextFunction } from 'express';
import { logger } from '@agent-platform/shared';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: 'internal_error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
}
