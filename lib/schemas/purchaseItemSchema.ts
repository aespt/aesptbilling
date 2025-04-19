import { z } from 'zod';

import { BaseCreateSchema, BaseSchema } from './baseSchema';

// Zod schema for purchase item validation
export const PurchaseItemSchema = BaseSchema.extend({
  id: z.number().optional(),
  purchase_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int().positive(),
  rate: z.number().positive(),
  total_price: z.number().positive(),
});

// Zod schema for creating a new purchase item
export const CreatePurchaseItemSchema = BaseCreateSchema.extend(
  PurchaseItemSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    created_by: true,
    updated_by: true,
  }).shape
);

// Zod schema for updating a purchase item
export const UpdatePurchaseItemSchema = CreatePurchaseItemSchema.partial();

// Types derived from Zod schema
export type PurchaseItemInput = z.infer<typeof CreatePurchaseItemSchema>;
export type PurchaseItemUpdate = z.infer<typeof UpdatePurchaseItemSchema>; 