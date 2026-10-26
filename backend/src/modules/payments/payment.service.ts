import { PaymentRepository, PaymentData } from './payment.repository.js';
import { OrderRepository } from '../orders/order.repository.js';
import { CreatePaymentInput, ProcessPaymentInput } from './payment.schema.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../shared/errors/app-error.js';

export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository = new PaymentRepository(),
    private readonly orderRepository: OrderRepository = new OrderRepository()
  ) {}

  async createPayment(
    userId: string,
    tenantId: string,
    role: string,
    input: CreatePaymentInput
  ): Promise<PaymentData> {
    const order = await this.orderRepository.findById(input.orderId, tenantId);
    if (!order) {
      throw new NotFoundError(`Order ${input.orderId} not found for tenant ${tenantId}`);
    }

    if (role === 'USER' && order.userId !== userId) {
      throw new ForbiddenError(`Order ${input.orderId} does not belong to user ${userId}`);
    }

    if (order.paymentStatus === 'PAID') {
      throw new BadRequestError(`Order ${input.orderId} has already been paid`);
    }

    // Always fetch amount from DB order! Never trust frontend amount.
    const amount = Number(order.totalAmount);

    return this.paymentRepository.create({
      tenantId,
      orderId: input.orderId,
      amount,
      currency: 'INR',
      paymentMethod: input.paymentMethod || 'CARD',
    });
  }

  async getPaymentById(
    paymentId: string,
    tenantId: string,
    userId: string,
    role: string
  ): Promise<PaymentData> {
    const payment = await this.paymentRepository.findById(paymentId, tenantId);
    if (!payment) {
      throw new NotFoundError(`Payment ${paymentId} not found in tenant ${tenantId}`);
    }

    const order = await this.orderRepository.findById(payment.orderId, tenantId);
    if (order && role === 'USER' && order.userId !== userId) {
      throw new ForbiddenError(`Access denied to payment ${paymentId}`);
    }

    return payment;
  }

  async getLatestPaymentByOrderId(
    orderId: string,
    tenantId: string,
    userId: string,
    role: string
  ): Promise<PaymentData> {
    const order = await this.orderRepository.findById(orderId, tenantId);
    if (!order) {
      throw new NotFoundError(`Order ${orderId} not found in tenant ${tenantId}`);
    }

    if (role === 'USER' && order.userId !== userId) {
      throw new ForbiddenError(`Access denied to order ${orderId}`);
    }

    const payment = await this.paymentRepository.findLatestByOrderId(orderId, tenantId);
    if (!payment) {
      // Auto-create a initial pending payment if none exists yet
      return this.paymentRepository.create({
        tenantId,
        orderId,
        amount: Number(order.totalAmount),
        currency: 'INR',
        paymentMethod: 'CARD',
      });
    }

    return payment;
  }

  async processPayment(
    paymentId: string,
    tenantId: string,
    userId: string,
    role: string,
    input: ProcessPaymentInput
  ): Promise<{ payment: PaymentData; orderStatus: string }> {
    const payment = await this.paymentRepository.findById(paymentId, tenantId);
    if (!payment) {
      throw new NotFoundError(`Payment ${paymentId} not found in tenant ${tenantId}`);
    }

    const order = await this.orderRepository.findById(payment.orderId, tenantId);
    if (!order) {
      throw new NotFoundError(`Order ${payment.orderId} not found in tenant ${tenantId}`);
    }

    if (role === 'USER' && order.userId !== userId) {
      throw new ForbiddenError(`Access denied to process payment for order ${payment.orderId}`);
    }

    try {
      return await this.paymentRepository.processPaymentResult(paymentId, tenantId, input.result);
    } catch (err: any) {
      if (err.message?.includes('already been processed')) {
        throw new BadRequestError(err.message);
      }
      throw err;
    }
  }
}
