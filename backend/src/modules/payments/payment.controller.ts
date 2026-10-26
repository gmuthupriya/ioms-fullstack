import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
import { PaymentService } from './payment.service.js';
import { createPaymentSchema, processPaymentSchema } from './payment.schema.js';

export class PaymentController {
  constructor(private readonly paymentService: PaymentService = new PaymentService()) {}

  createPayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const role = req.user!.role;

      const input = createPaymentSchema.parse(req.body);
      const payment = await this.paymentService.createPayment(userId, tenantId, role, input);

      res.status(201).json({
        success: true,
        data: payment,
      });
    } catch (err) {
      next(err);
    }
  };

  getPaymentById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const role = req.user!.role;
      const { paymentId } = req.params;

      const payment = await this.paymentService.getPaymentById(paymentId, tenantId, userId, role);

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (err) {
      next(err);
    }
  };

  getLatestByOrderId = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const role = req.user!.role;
      const { orderId } = req.params;

      const payment = await this.paymentService.getLatestPaymentByOrderId(orderId, tenantId, userId, role);

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (err) {
      next(err);
    }
  };

  processPayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const role = req.user!.role;
      const { paymentId } = req.params;

      const input = processPaymentSchema.parse(req.body);
      const result = await this.paymentService.processPayment(paymentId, tenantId, userId, role, input);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}
