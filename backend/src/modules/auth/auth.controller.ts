import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

export class AuthController {
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, tenantId, role } = req.body;
      const userRole = role === 'ADMIN' ? 'ADMIN' : 'USER';
      const targetTenant = tenantId || 'tenant-alpha';
      const userIdent = username || (userRole === 'ADMIN' ? 'admin_user' : 'normal_user');

      const payload = {
        sub: `usr_${Math.random().toString(36).substring(2, 9)}`,
        username: userIdent,
        role: userRole,
        tenantId: targetTenant,
      };

      const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' });

      res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            username: userIdent,
            role: userRole,
            tenantId: targetTenant,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getDemoAccounts = async (_req: Request, res: Response): Promise<void> => {
    const generateToken = (username: string, role: string, tenantId: string) => {
      return jwt.sign(
        { sub: `usr_${username}`, username, role, tenantId },
        env.JWT_SECRET,
        { expiresIn: '7d' }
      );
    };

    res.status(200).json({
      success: true,
      data: {
        tenantAlphaAdmin: {
          username: 'alpha_admin',
          role: 'ADMIN',
          tenantId: 'tenant-alpha',
          token: generateToken('alpha_admin', 'ADMIN', 'tenant-alpha'),
        },
        tenantAlphaUser: {
          username: 'alpha_user',
          role: 'USER',
          tenantId: 'tenant-alpha',
          token: generateToken('alpha_user', 'USER', 'tenant-alpha'),
        },
        tenantBetaAdmin: {
          username: 'beta_admin',
          role: 'ADMIN',
          tenantId: 'tenant-beta',
          token: generateToken('beta_admin', 'ADMIN', 'tenant-beta'),
        },
      },
    });
  };
}
