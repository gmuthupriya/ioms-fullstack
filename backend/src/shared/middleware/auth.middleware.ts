import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error.js';

export interface AuthUser {
  id: string;
  username: string;
  role: 'ADMIN' | 'USER';
  tenantId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function authenticateJwt(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid Authorization header'));
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = {
      id: decoded.sub || decoded.id,
      username: decoded.username,
      role: decoded.role,
      tenantId: decoded.tenantId,
    };
    next();
  } catch (error) {
    return next(new UnauthorizedError('JWT token signature is invalid or expired'));
  }
}

export function requireRole(...allowedRoles: Array<'ADMIN' | 'USER'>) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('User authentication context is missing'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Action requires one of the following roles: ${allowedRoles.join(', ')}`));
    }

    next();
  };
}
