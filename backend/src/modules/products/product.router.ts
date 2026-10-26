import { Router } from 'express';
import { ProductController } from './product.controller.js';
import { authenticateJwt, requireRole } from '../../shared/middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../../shared/middleware/tenant.middleware.js';

export function createProductRouter(): Router {
  const router = Router();
  const controller = new ProductController();

  router.use(authenticateJwt);
  router.use(enforceTenantIsolation);

  router.post('/', requireRole('ADMIN'), controller.createProduct);
  router.get('/', controller.listProducts);
  router.get('/:id', controller.getProductById);
  router.patch('/:id', requireRole('ADMIN'), controller.updateProduct);
  router.delete('/:id', requireRole('ADMIN'), controller.deactivateProduct);

  return router;
}
