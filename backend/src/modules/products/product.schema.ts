import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be greater than zero'),
  active: z.boolean().optional().default(true),
  initialQuantity: z.coerce.number().min(0, 'Initial quantity cannot be negative').optional().default(0),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive().optional(),
  active: z.boolean().optional(),
});

export const productListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  activeOnly: z.enum(['true', 'false']).optional().default('true'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductListQueryInput = z.infer<typeof productListQuerySchema>;
