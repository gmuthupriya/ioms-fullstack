import { prisma } from '../../db/client.js';

export interface OrderItemData {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export type OrderStatusType = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatusType = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface OrderItemData {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderData {
  id: string;
  tenantId: string;
  userId: string;
  status: OrderStatusType;
  paymentStatus: PaymentStatusType;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItemData[];
}

const memoryOrders: OrderData[] = [
  {
    id: 'ord_1001',
    tenantId: 'tenant-alpha',
    userId: 'alpha_user',
    status: 'COMPLETED',
    paymentStatus: 'PAID',
    totalAmount: 399.49,
    createdAt: new Date(Date.now() - 5 * 86400000),
    updatedAt: new Date(Date.now() - 4 * 86400000),
    items: [
      { id: 'itm_1', orderId: 'ord_1001', productId: 'prod_101', quantity: 1, unitPrice: 149.99, lineTotal: 149.99 },
      { id: 'itm_2', orderId: 'ord_1001', productId: 'prod_102', quantity: 1, unitPrice: 249.50, lineTotal: 249.50 },
    ],
  },
  {
    id: 'ord_1002',
    tenantId: 'tenant-alpha',
    userId: 'alpha_user',
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    totalAmount: 699.00,
    createdAt: new Date(Date.now() - 3 * 86400000),
    updatedAt: new Date(Date.now() - 2 * 86400000),
    items: [
      { id: 'itm_3', orderId: 'ord_1002', productId: 'prod_103', quantity: 1, unitPrice: 699.00, lineTotal: 699.00 },
    ],
  },
  {
    id: 'ord_1003',
    tenantId: 'tenant-alpha',
    userId: 'alpha_user',
    status: 'PENDING',
    paymentStatus: 'PENDING',
    totalAmount: 299.99,
    createdAt: new Date(Date.now() - 1 * 86400000),
    updatedAt: new Date(Date.now() - 1 * 86400000),
    items: [
      { id: 'itm_4', orderId: 'ord_1003', productId: 'prod_105', quantity: 1, unitPrice: 299.99, lineTotal: 299.99 },
    ],
  },
];

export class OrderRepository {
  private isMemoryMode(): boolean {
    return process.env.USE_MEMORY_DB === 'true';
  }

  async findById(id: string, tenantId: string): Promise<OrderData | null> {
    if (this.isMemoryMode()) {
      return memoryOrders.find((o) => o.id === id && o.tenantId === tenantId) || null;
    }
    try {
      const order = await prisma.order.findFirst({
        where: { id, tenantId },
        include: { items: true },
      });
      if (!order) return null;
      return {
        id: order.id,
        tenantId: order.tenantId,
        userId: order.userId,
        status: order.status as OrderStatusType,
        paymentStatus: (order.paymentStatus || 'PENDING') as PaymentStatusType,
        totalAmount: Number(order.totalAmount),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items.map((i) => ({
          id: i.id,
          orderId: i.orderId,
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          lineTotal: Number(i.lineTotal),
        })),
      };
    } catch {
      return memoryOrders.find((o) => o.id === id && o.tenantId === tenantId) || null;
    }
  }

  async createAtomicOrder(data: {
    tenantId: string;
    userId: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number; lineTotal: number }>;
    totalAmount: number;
  }): Promise<OrderData> {
    if (this.isMemoryMode()) {
      // Validate inventory & deduct stock in memory mode
      const { ProductRepository } = await import('../products/product.repository.js');
      const prodRepo = new ProductRepository();
      
      for (const item of data.items) {
        const prod = await prodRepo.findById(item.productId, data.tenantId);
        if (!prod || (prod.availableQuantity ?? 0) < item.quantity) {
          throw new Error(
            `Insufficient inventory for product ${item.productId}. Requested: ${item.quantity}, Available: ${prod?.availableQuantity ?? 0}`
          );
        }
      }

      // Deduct stock in memory
      for (const item of data.items) {
        const prod = await prodRepo.findById(item.productId, data.tenantId);
        if (prod) {
          prod.availableQuantity = (prod.availableQuantity ?? 0) - item.quantity;
        }
      }

      const orderId = `ord_${Math.random().toString(36).substring(2, 9)}`;
      const orderItems: OrderItemData[] = data.items.map((item) => ({
        id: `item_${Math.random().toString(36).substring(2, 9)}`,
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      }));

      const newOrder: OrderData = {
        id: orderId,
        tenantId: data.tenantId,
        userId: data.userId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        totalAmount: data.totalAmount,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: orderItems,
      };
      memoryOrders.push(newOrder);
      return newOrder;
    }

    try {
      return await prisma.$transaction(async (tx) => {
        // Validate and reduce inventory for all items atomically
        for (const item of data.items) {
          const inv = await tx.inventory.findFirst({
            where: { productId: item.productId, tenantId: data.tenantId },
          });

          if (!inv || inv.availableQuantity < item.quantity) {
            throw new Error(
              `Insufficient inventory for product ${item.productId}. Requested: ${item.quantity}, Available: ${inv?.availableQuantity || 0}`
            );
          }

          await tx.inventory.update({
            where: { id: inv.id },
            data: {
              availableQuantity: inv.availableQuantity - item.quantity,
              updatedBy: data.userId,
            },
          });

          await tx.inventoryTransaction.create({
            data: {
              tenantId: data.tenantId,
              productId: item.productId,
              quantityChange: -item.quantity,
              reason: 'ORDER_DEDUCTION',
              createdBy: data.userId,
            },
          });
        }

        // Create Order and OrderItems
        const order = await tx.order.create({
          data: {
            tenantId: data.tenantId,
            userId: data.userId,
            status: 'PENDING',
            paymentStatus: 'PENDING',
            totalAmount: data.totalAmount,
            items: {
              create: data.items.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                lineTotal: i.lineTotal,
              })),
            },
          },
          include: { items: true },
        });

        return {
          id: order.id,
          tenantId: order.tenantId,
          userId: order.userId,
          status: order.status as OrderStatusType,
          paymentStatus: (order.paymentStatus || 'PENDING') as PaymentStatusType,
          totalAmount: Number(order.totalAmount),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          items: order.items.map((i) => ({
            id: i.id,
            orderId: i.orderId,
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
            lineTotal: Number(i.lineTotal),
          })),
        };
      });
    } catch (err: any) {
      if (err.message.includes('Insufficient inventory')) {
        throw err;
      }
      const orderId = `ord_${Math.random().toString(36).substring(2, 9)}`;
      const orderItems: OrderItemData[] = data.items.map((item) => ({
        id: `item_${Math.random().toString(36).substring(2, 9)}`,
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      }));

      const newOrder: OrderData = {
        id: orderId,
        tenantId: data.tenantId,
        userId: data.userId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        totalAmount: data.totalAmount,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: orderItems,
      };
      memoryOrders.push(newOrder);
      return newOrder;
    }
  }

  async updateStatus(
    id: string,
    tenantId: string,
    status: OrderStatusType
  ): Promise<OrderData | null> {
    if (this.isMemoryMode()) {
      const idx = memoryOrders.findIndex((o) => o.id === id && o.tenantId === tenantId);
      if (idx === -1) return null;
      memoryOrders[idx].status = status;
      memoryOrders[idx].updatedAt = new Date();
      return memoryOrders[idx];
    }

    try {
      const order = await prisma.order.update({
        where: { id },
        data: { status: status as any },
        include: { items: true },
      });
      return {
        id: order.id,
        tenantId: order.tenantId,
        userId: order.userId,
        status: order.status as OrderStatusType,
        paymentStatus: (order.paymentStatus || 'PENDING') as PaymentStatusType,
        totalAmount: Number(order.totalAmount),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items.map((i) => ({
          id: i.id,
          orderId: i.orderId,
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          lineTotal: Number(i.lineTotal),
        })),
      };
    } catch {
      const idx = memoryOrders.findIndex((o) => o.id === id && o.tenantId === tenantId);
      if (idx === -1) return null;
      memoryOrders[idx].status = status;
      memoryOrders[idx].updatedAt = new Date();
      return memoryOrders[idx];
    }
  }

  async updatePaymentStatus(
    id: string,
    tenantId: string,
    paymentStatus: PaymentStatusType,
    orderStatus?: OrderStatusType
  ): Promise<OrderData | null> {
    if (this.isMemoryMode()) {
      const idx = memoryOrders.findIndex((o) => o.id === id && o.tenantId === tenantId);
      if (idx === -1) return null;
      memoryOrders[idx].paymentStatus = paymentStatus;
      if (orderStatus) memoryOrders[idx].status = orderStatus;
      memoryOrders[idx].updatedAt = new Date();
      return memoryOrders[idx];
    }

    try {
      const updateData: any = { paymentStatus: paymentStatus as any };
      if (orderStatus) updateData.status = orderStatus as any;

      const order = await prisma.order.update({
        where: { id },
        data: updateData,
        include: { items: true },
      });
      return {
        id: order.id,
        tenantId: order.tenantId,
        userId: order.userId,
        status: order.status as OrderStatusType,
        paymentStatus: order.paymentStatus as PaymentStatusType,
        totalAmount: Number(order.totalAmount),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items.map((i) => ({
          id: i.id,
          orderId: i.orderId,
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          lineTotal: Number(i.lineTotal),
        })),
      };
    } catch {
      const idx = memoryOrders.findIndex((o) => o.id === id && o.tenantId === tenantId);
      if (idx === -1) return null;
      memoryOrders[idx].paymentStatus = paymentStatus;
      if (orderStatus) memoryOrders[idx].status = orderStatus;
      memoryOrders[idx].updatedAt = new Date();
      return memoryOrders[idx];
    }
  }

  async list(tenantId: string, filter: { userId?: string; status?: string; paymentStatus?: string; page: number; limit: number }) {
    if (this.isMemoryMode()) {
      let filtered = memoryOrders.filter((o) => o.tenantId === tenantId);
      if (filter.userId) filtered = filtered.filter((o) => o.userId === filter.userId);
      if (filter.status) filtered = filtered.filter((o) => o.status === filter.status);
      if (filter.paymentStatus) filtered = filtered.filter((o) => o.paymentStatus === filter.paymentStatus);

      const start = (filter.page - 1) * filter.limit;
      return {
        items: filtered.slice(start, start + filter.limit),
        total: filtered.length,
      };
    }

    try {
      const where: any = { tenantId };
      if (filter.userId) where.userId = filter.userId;
      if (filter.status) where.status = filter.status;
      if (filter.paymentStatus) where.paymentStatus = filter.paymentStatus;

      const [items, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: { items: true },
          skip: (filter.page - 1) * filter.limit,
          take: filter.limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.order.count({ where }),
      ]);

      return {
        items: items.map((o) => ({
          id: o.id,
          tenantId: o.tenantId,
          userId: o.userId,
          status: o.status as OrderStatusType,
          paymentStatus: (o.paymentStatus || 'PENDING') as PaymentStatusType,
          totalAmount: Number(o.totalAmount),
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
          items: o.items.map((i) => ({
            id: i.id,
            orderId: i.orderId,
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
            lineTotal: Number(i.lineTotal),
          })),
        })),
        total,
      };
    } catch {
      let filtered = memoryOrders.filter((o) => o.tenantId === tenantId);
      if (filter.userId) filtered = filtered.filter((o) => o.userId === filter.userId);
      if (filter.status) filtered = filtered.filter((o) => o.status === filter.status);
      if (filter.paymentStatus) filtered = filtered.filter((o) => o.paymentStatus === filter.paymentStatus);

      const start = (filter.page - 1) * filter.limit;
      return {
        items: filtered.slice(start, start + filter.limit),
        total: filtered.length,
      };
    }
  }
}
