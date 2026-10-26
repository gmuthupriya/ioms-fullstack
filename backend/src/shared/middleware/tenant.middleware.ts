import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware.js';
import { ForbiddenError, BadRequestError } from '../errors/app-error.js';

export function enforceTenantIsolation(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  if (!req.user || !req.user.tenantId) {
    return next(new ForbiddenError('Tenant context is missing from request identity token'));
  }

  const headerTenantId = req.headers['x-tenant-id'] as string | undefined;
  if (headerTenantId && headerTenantId !== req.user.tenantId) {
    return next(new ForbiddenError(`Cross-tenant violation: Access denied to tenant ${headerTenantId}`));
  }

  next();
}
