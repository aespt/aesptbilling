import { z } from 'zod';

import { BaseCreateSchema, BaseSchema } from './baseSchema';

// Enum for order status
export const OrderStatusEnum = z.enum([
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);

// Zod schema for order validation
export const OrderSchema = BaseSchema.extend({
  id: z.number().optional(),
  userId: z.number(),
  orderNumber: z.string(),
  status: OrderStatusEnum.default('pending'),
  totalAmount: z.number().positive(),
  shippingAddress: z.string(),
  billingAddress: z.string(),
  paymentMethod: z.string(),
  paymentStatus: z.enum(['pending', 'paid', 'failed']).default('pending'),
  notes: z.string().optional(),
});

// Zod schema for creating a new order
export const CreateOrderSchema = BaseCreateSchema.extend(
  OrderSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    created_by: true,
    updated_by: true,
  }).shape
);

// Zod schema for updating an order
export const UpdateOrderSchema = CreateOrderSchema.partial();

// Types derived from Zod schema
export type OrderInput = z.infer<typeof CreateOrderSchema>;
export type OrderUpdate = z.infer<typeof UpdateOrderSchema>;
