import { z } from 'zod';

import { BaseCreateSchema, BaseSchema } from './baseSchema';
import { TaxTypeEnum } from './purchaseSchema';

// Enum for purchase types (reuse from purchaseSchema if needed)
export const PurchaseTypeEnum = z.enum(['TAX', 'DELIVERY', 'PROFORMA', 'QUOTATION']);

// Zod schema for purchase entry validation
export const PurchaseEntrySchema = BaseSchema.extend({
  id: z.number().optional(),
  purchaseentry_number: z.string().min(1, { message: 'Purchase entry number is required' }),
  purchaseentry_date: z.date().default(() => new Date()),
  user_id: z.number(),
  supplier_id: z.number(),
  tax_type: TaxTypeEnum.default('NONE'),
  purchase_type: PurchaseTypeEnum.default('TAX'),
  tax_rate: z.number().nonnegative().default(0),
  discount_rate: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  sub_total: z.number().positive(),
  total: z.number().positive(),
  ship_from: z.string().min(1, { message: 'Ship from is required' }),
});

// Zod schema for creating a new purchase entry
export const CreatePurchaseEntrySchema = BaseCreateSchema.extend(
  PurchaseEntrySchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    created_by: true,
    updated_by: true,
  }).shape
);

// Zod schema for updating a purchase entry
export const UpdatePurchaseEntrySchema = CreatePurchaseEntrySchema.partial();

// Types derived from Zod schema
export type PurchaseEntryInput = z.infer<typeof CreatePurchaseEntrySchema>;
