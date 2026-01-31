import { Request, Response, NextFunction } from 'express';

/**
 * Extract tenant_id from x-tenant-id header or body. Reject if missing.
 */
export function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const headerTenant = req.headers['x-tenant-id'];
  const bodyTenant =
    typeof (req.body as Record<string, unknown>)?.tenant_id === 'string'
      ? (req.body as Record<string, string>).tenant_id
      : undefined;
  const queryTenant =
    typeof req.query?.tenant_id === 'string' ? req.query.tenant_id : undefined;

  const tenantId = (headerTenant as string) ?? bodyTenant ?? queryTenant;

  if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
    res.status(400).json({
      error: 'missing_tenant_id',
      message: 'x-tenant-id header or body.tenant_id is required',
    });
    return;
  }

  req.tenant_id = tenantId.trim();
  next();
}
