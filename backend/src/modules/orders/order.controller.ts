import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
import { OrderService } from './order.service.js';
import { createOrderSchema, updateOrderStatusSchema, orderListQuerySchema } from './order.schema.js';

export class OrderController {
  constructor(private readonly orderService: OrderService = new OrderService()) {}

  createOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const input = createOrderSchema.parse(req.body);
      const order = await this.orderService.createOrder(userId, tenantId, input);

      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  getOrderById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const role = req.user!.role;
      const { id } = req.params;

      const order = await this.orderService.getOrderById(id, tenantId, userId, role);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  updateOrderStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const input = updateOrderStatusSchema.parse(req.body);

      const order = await this.orderService.updateOrderStatus(id, tenantId, input);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  listOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const role = req.user!.role;
      const query = orderListQuerySchema.parse(req.query);

      const result = await this.orderService.listOrders(tenantId, userId, role, query);

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: result.total,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
