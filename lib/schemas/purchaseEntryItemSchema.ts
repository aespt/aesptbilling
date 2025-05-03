import { z } from 'zod';

import { BaseCreateSchema, BaseSchema } from './baseSchema';

// Zod schema for purchase entry item validation
export const PurchaseEntryItemSchema = BaseSchema.extend({
  id: z.number().optional(),
  purchase_entry_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int().positive(),
  rate: z.number().positive(),
  total_price: z.number().positive(),
});

// Zod schema for creating a new purchase entry item
export const CreatePurchaseEntryItemSchema = BaseCreateSchema.extend(
  PurchaseEntryItemSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    created_by: true,
    updated_by: true,
  }).shape
);

// Zod schema for updating a purchase entry item
export const UpdatePurchaseEntryItemSchema = CreatePurchaseEntryItemSchema.partial();

// Types derived from Zod schema
export type PurchaseEntryItemInput = z.infer<typeof CreatePurchaseEntryItemSchema>;
