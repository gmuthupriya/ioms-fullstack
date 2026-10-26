import { OrderRepository, OrderData } from './order.repository.js';
import { ProductRepository } from '../products/product.repository.js';
import { CreateOrderInput, UpdateOrderStatusInput, OrderListQueryInput } from './order.schema.js';
import { BadRequestError, NotFoundError, ConflictError } from '../../shared/errors/app-error.js';

export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository = new OrderRepository(),
    private readonly productRepository: ProductRepository = new ProductRepository()
  ) {}

  async createOrder(userId: string, tenantId: string, input: CreateOrderInput): Promise<OrderData> {
    const preparedItems: Array<{ productId: string; quantity: number; unitPrice: number; lineTotal: number }> = [];
    let calculatedTotal = 0;

    // Validate all products active and fetch server-side prices
    for (const item of input.items) {
      const product = await this.productRepository.findById(item.productId, tenantId);
      if (!product) {
        throw new NotFoundError(`Product ${item.productId} not found in tenant ${tenantId}`);
      }

      if (!product.active) {
        throw new BadRequestError(`Product '${product.name}' (SKU: ${product.sku}) is deactivated and cannot be added to new orders`);
      }

      const unitPrice = product.price;
      const lineTotal = unitPrice * item.quantity;
      calculatedTotal += lineTotal;

      preparedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      });
    }

    try {
      return await this.orderRepository.createAtomicOrder({
        tenantId,
        userId,
        items: preparedItems,
        totalAmount: Number(calculatedTotal.toFixed(2)),
      });
    } catch (err: any) {
      if (err.message.includes('Insufficient inventory')) {
        throw new ConflictError(err.message);
      }
      throw err;
    }
  }

  async getOrderById(id: string, tenantId: string, userId: string, role: string): Promise<OrderData> {
    const order = await this.orderRepository.findById(id, tenantId);
    if (!order) {
      throw new NotFoundError(`Order ${id} not found in tenant ${tenantId}`);
    }

    // Role Enforcement: USER can only view their own order; ADMIN can view all tenant orders
    if (role === 'USER' && order.userId !== userId) {
      throw new NotFoundError(`Order ${id} not found for user ${userId}`);
    }

    return order;
  }

  async updateOrderStatus(id: string, tenantId: string, input: UpdateOrderStatusInput): Promise<OrderData> {
    const existing = await this.orderRepository.findById(id, tenantId);
    if (!existing) {
      throw new NotFoundError(`Order ${id} not found in tenant ${tenantId}`);
    }

    const currentStatus = existing.status;
    const newStatus = input.status;

    if (currentStatus === newStatus) {
      return existing;
    }

    // Enforce valid status transition rules
    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    const validNext = allowedTransitions[currentStatus] || [];
    if (!validNext.includes(newStatus)) {
      throw new BadRequestError(
        `Invalid status transition from ${currentStatus} to ${newStatus}. Allowed transitions for ${currentStatus}: ${validNext.join(', ') || 'None'}`
      );
    }

    const updated = await this.orderRepository.updateStatus(id, tenantId, newStatus as any);
    return updated!;
  }

  async listOrders(tenantId: string, userId: string, role: string, query: OrderListQueryInput) {
    const filterUserId = role === 'USER' ? userId : undefined;

    return this.orderRepository.list(tenantId, {
      userId: filterUserId,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });
  }
}
