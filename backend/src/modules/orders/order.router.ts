import { Router } from 'express';
import { OrderController } from './order.controller.js';
import { authenticateJwt, requireRole } from '../../shared/middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../../shared/middleware/tenant.middleware.js';

export function createOrderRouter(): Router {
  const router = Router();
  const controller = new OrderController();

  router.use(authenticateJwt);
  router.use(enforceTenantIsolation);

  router.post('/', requireRole('USER', 'ADMIN'), controller.createOrder);
  router.get('/', controller.listOrders);
  router.get('/:id', controller.getOrderById);
  router.patch('/:id/status', requireRole('ADMIN'), controller.updateOrderStatus);

  return router;
}
