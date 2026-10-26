import { prisma } from '../../db/client.js';
import { OrderRepository } from '../orders/order.repository.js';

export type PaymentStatusType = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface PaymentData {
  id: string;
  tenantId: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: PaymentStatusType;
  transactionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const memoryPayments: PaymentData[] = [];

export class PaymentRepository {
  private isMemoryMode(): boolean {
    return process.env.USE_MEMORY_DB === 'true';
  }

  async findById(id: string, tenantId: string): Promise<PaymentData | null> {
    if (this.isMemoryMode()) {
      return memoryPayments.find((p) => p.id === id && p.tenantId === tenantId) || null;
    }
    try {
      const payment = await prisma.payment.findFirst({
        where: { id, tenantId },
      });
      if (!payment) return null;
      return {
        id: payment.id,
        tenantId: payment.tenantId,
        orderId: payment.orderId,
        amount: Number(payment.amount),
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        status: payment.status as PaymentStatusType,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      };
    } catch {
      return memoryPayments.find((p) => p.id === id && p.tenantId === tenantId) || null;
    }
  }

  async findLatestByOrderId(orderId: string, tenantId: string): Promise<PaymentData | null> {
    if (this.isMemoryMode()) {
      const filtered = memoryPayments.filter((p) => p.orderId === orderId && p.tenantId === tenantId);
      return filtered.length > 0 ? filtered[filtered.length - 1] : null;
    }
    try {
      const payment = await prisma.payment.findFirst({
        where: { orderId, tenantId },
        orderBy: { createdAt: 'desc' },
      });
      if (!payment) return null;
      return {
        id: payment.id,
        tenantId: payment.tenantId,
        orderId: payment.orderId,
        amount: Number(payment.amount),
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        status: payment.status as PaymentStatusType,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      };
    } catch {
      const filtered = memoryPayments.filter((p) => p.orderId === orderId && p.tenantId === tenantId);
      return filtered.length > 0 ? filtered[filtered.length - 1] : null;
    }
  }

  async create(data: {
    tenantId: string;
    orderId: string;
    amount: number;
    currency?: string;
    paymentMethod: string;
  }): Promise<PaymentData> {
    const currency = data.currency || 'INR';
    if (this.isMemoryMode()) {
      const newPayment: PaymentData = {
        id: `pay_${Math.random().toString(36).substring(2, 9)}`,
        tenantId: data.tenantId,
        orderId: data.orderId,
        amount: data.amount,
        currency,
        paymentMethod: data.paymentMethod,
        status: 'PENDING',
        transactionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryPayments.push(newPayment);
      return newPayment;
    }

    try {
      const payment = await prisma.payment.create({
        data: {
          tenantId: data.tenantId,
          orderId: data.orderId,
          amount: data.amount,
          currency,
          paymentMethod: data.paymentMethod,
          status: 'PENDING',
        },
      });
      return {
        id: payment.id,
        tenantId: payment.tenantId,
        orderId: payment.orderId,
        amount: Number(payment.amount),
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        status: payment.status as PaymentStatusType,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      };
    } catch {
      const newPayment: PaymentData = {
        id: `pay_${Math.random().toString(36).substring(2, 9)}`,
        tenantId: data.tenantId,
        orderId: data.orderId,
        amount: data.amount,
        currency,
        paymentMethod: data.paymentMethod,
        status: 'PENDING',
        transactionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryPayments.push(newPayment);
      return newPayment;
    }
  }

  async processPaymentResult(
    paymentId: string,
    tenantId: string,
    result: 'SUCCESS' | 'FAILED' | 'CANCELLED'
  ): Promise<{ payment: PaymentData; orderStatus: string }> {
    const orderRepo = new OrderRepository();

    if (this.isMemoryMode()) {
      const idx = memoryPayments.findIndex((p) => p.id === paymentId && p.tenantId === tenantId);
      if (idx === -1) {
        throw new Error(`Payment ${paymentId} not found`);
      }
      const payment = memoryPayments[idx];
      if (payment.status === 'PAID') {
        throw new Error('Payment has already been processed and is PAID');
      }

      let newPaymentStatus: PaymentStatusType = 'FAILED';
      let newOrderStatus = 'PENDING';
      let transactionId: string | null = null;

      if (result === 'SUCCESS') {
        newPaymentStatus = 'PAID';
        newOrderStatus = 'CONFIRMED';
        transactionId = `MOCK-TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      } else if (result === 'CANCELLED') {
        newPaymentStatus = 'CANCELLED';
        newOrderStatus = 'PENDING';
      } else {
        newPaymentStatus = 'FAILED';
        newOrderStatus = 'PENDING';
      }

      payment.status = newPaymentStatus;
      payment.transactionId = transactionId;
      payment.updatedAt = new Date();

      await orderRepo.updatePaymentStatus(payment.orderId, tenantId, newPaymentStatus, newOrderStatus as any);

      return { payment, orderStatus: newOrderStatus };
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findFirst({
          where: { id: paymentId, tenantId },
        });

        if (!payment) {
          throw new Error(`Payment ${paymentId} not found`);
        }

        if (payment.status === 'PAID') {
          throw new Error('Payment has already been processed and is PAID');
        }

        let newPaymentStatus: PaymentStatusType = 'FAILED';
        let newOrderStatus = 'PENDING';
        let transactionId: string | null = null;

        if (result === 'SUCCESS') {
          newPaymentStatus = 'PAID';
          newOrderStatus = 'CONFIRMED';
          transactionId = `MOCK-TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        } else if (result === 'CANCELLED') {
          newPaymentStatus = 'CANCELLED';
          newOrderStatus = 'PENDING';
        } else {
          newPaymentStatus = 'FAILED';
          newOrderStatus = 'PENDING';
        }

        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: newPaymentStatus,
            transactionId,
          },
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: newPaymentStatus,
            status: newOrderStatus as any,
          },
        });

        return {
          payment: {
            id: updatedPayment.id,
            tenantId: updatedPayment.tenantId,
            orderId: updatedPayment.orderId,
            amount: Number(updatedPayment.amount),
            currency: updatedPayment.currency,
            paymentMethod: updatedPayment.paymentMethod,
            status: updatedPayment.status as PaymentStatusType,
            transactionId: updatedPayment.transactionId,
            createdAt: updatedPayment.createdAt,
            updatedAt: updatedPayment.updatedAt,
          },
          orderStatus: newOrderStatus,
        };
      });
    } catch (err: any) {
      if (err.message?.includes('already been processed')) {
        throw err;
      }
      const idx = memoryPayments.findIndex((p) => p.id === paymentId && p.tenantId === tenantId);
      if (idx === -1) {
        throw new Error(`Payment ${paymentId} not found`);
      }
      const payment = memoryPayments[idx];
      let newPaymentStatus: PaymentStatusType = 'FAILED';
      let newOrderStatus = 'PENDING';
      let transactionId: string | null = null;

      if (result === 'SUCCESS') {
        newPaymentStatus = 'PAID';
        newOrderStatus = 'CONFIRMED';
        transactionId = `MOCK-TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      } else if (result === 'CANCELLED') {
        newPaymentStatus = 'CANCELLED';
        newOrderStatus = 'PENDING';
      } else {
        newPaymentStatus = 'FAILED';
        newOrderStatus = 'PENDING';
      }

      payment.status = newPaymentStatus;
      payment.transactionId = transactionId;
      payment.updatedAt = new Date();

      await orderRepo.updatePaymentStatus(payment.orderId, tenantId, newPaymentStatus, newOrderStatus as any);

      return { payment, orderStatus: newOrderStatus };
    }
  }
}
