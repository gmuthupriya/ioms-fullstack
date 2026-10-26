import { Router } from 'express';
import { PaymentController } from './payment.controller.js';
import { authenticateJwt } from '../../shared/middleware/auth.middleware.js';

const router = Router();
const controller = new PaymentController();

router.use(authenticateJwt);

router.post('/', controller.createPayment);
router.get('/order/:orderId', controller.getLatestByOrderId);
router.get('/:paymentId', controller.getPaymentById);
router.post('/:paymentId/process', controller.processPayment);

export { router as paymentRouter };
