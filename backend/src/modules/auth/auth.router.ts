import { Router } from 'express';
import { AuthController } from './auth.controller.js';

export function createAuthRouter(): Router {
  const router = Router();
  const controller = new AuthController();

  router.post('/login', controller.login);
  router.get('/demo-accounts', controller.getDemoAccounts);

  return router;
}
