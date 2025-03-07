import { z } from 'zod';
import { BaseSchema, BaseCreateSchema } from './baseSchema';

// Zod schema for order item validation
export const OrderItemSchema = BaseSchema.extend({
  id: z.number().optional(),
  orderId: z.number(),
  productId: z.number(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive(),
  discount: z.number().nonnegative().default(0),
});

// Zod schema for creating a new order item
export const CreateOrderItemSchema = BaseCreateSchema.extend(
  OrderItemSchema.omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true,
    createdBy: true,
    updatedBy: true
  }).shape
);

// Zod schema for updating an order item
export const UpdateOrderItemSchema = CreateOrderItemSchema.partial();

// Types derived from Zod schema
export type OrderItemInput = z.infer<typeof CreateOrderItemSchema>;
export type OrderItemUpdate = z.infer<typeof UpdateOrderItemSchema>; 