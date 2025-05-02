import { z } from 'zod';

import { BaseSchema, BaseCreateSchema } from './baseSchema';

// Enum for tax types
export const TaxTypeEnum = z.enum(['VAT', 'GST', 'NONE']);

// Enum for purchase types
export const PurchaseTypeEnum = z.enum(['TAX', 'DELIVERY', 'PROFORMA', 'QUOTATION']);

// Zod schema for purchase validation
export const PurchaseSchema = BaseSchema.extend({
  id: z.number().optional(),
  purchase_number: z.string().min(1, { message: 'Purchase number is required' }),
  purchase_date: z.date().default(() => new Date()),
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

// Zod schema for creating a new purchase
export const CreatePurchaseSchema = BaseCreateSchema.extend(
  PurchaseSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    created_by: true,
    updated_by: true,
  }).shape
);

// Zod schema for updating a purchase
export const UpdatePurchaseSchema = CreatePurchaseSchema.partial();

// Types derived from Zod schema
export type PurchaseInput = z.infer<typeof CreatePurchaseSchema>;
export type PurchaseUpdate = z.infer<typeof UpdatePurchaseSchema>;
