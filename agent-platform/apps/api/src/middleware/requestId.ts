import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      request_id?: string;
    }
  }
}

/**
 * Attach a unique request ID to each request.
 */
export function requestIdMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const existing = req.headers['x-request-id'];
  req.request_id =
    (Array.isArray(existing) ? existing[0] : existing) ?? uuidv4();
  next();
}
