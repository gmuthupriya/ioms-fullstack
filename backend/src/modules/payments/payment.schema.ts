import { z } from 'zod';

export const createPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  paymentMethod: z.string().default('CARD'),
});

export const processPaymentSchema = z.object({
  result: z.enum(['SUCCESS', 'FAILED', 'CANCELLED']),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
