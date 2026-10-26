import { Router } from 'express';
import { InventoryController } from './inventory.controller.js';
import { authenticateJwt, requireRole } from '../../shared/middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../../shared/middleware/tenant.middleware.js';

export function createInventoryRouter(): Router {
  const router = Router();
  const controller = new InventoryController();

  router.use(authenticateJwt);
  router.use(enforceTenantIsolation);

  router.get('/:id/inventory', controller.getInventory);
  router.get('/:id/inventory/transactions', controller.getTransactions);
  router.post('/:id/inventory/adjust', requireRole('ADMIN'), controller.adjustInventory);

  return router;
}
