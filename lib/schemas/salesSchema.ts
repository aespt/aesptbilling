import { z } from 'zod';
import { BaseSchema, BaseCreateSchema } from './baseSchema';

// Enum for discount types
export const DiscountTypeEnum = z.enum(['PERCENTAGE', 'FIXED', 'NONE']);

// Zod schema for sales validation
export const SalesSchema = BaseSchema.extend({
  id: z.number().optional(),
  date: z.date(),
  customer_id: z.number(),
  product_id: z.number(),
  qty: z.number().positive(),
  mrp: z.number().nonnegative(),
  discount_type: DiscountTypeEnum.default('NONE'),
  discount_value: z.number().nonnegative().default(0),
  salesman_id: z.number(),
  ship_to: z.string().optional(),
  invoice_id: z.number().optional(),
});

// Zod schema for creating a new sales record
export const CreateSalesSchema = BaseCreateSchema.extend(
  SalesSchema.omit({ 
    id: true, 
    created_at: true, 
    updated_at: true,
    created_by: true,
    updated_by: true
  }).shape
);

// Zod schema for updating a sales record
export const UpdateSalesSchema = CreateSalesSchema.partial();

// Types derived from Zod schema
export type SalesInput = z.infer<typeof CreateSalesSchema>;
export type SalesUpdate = z.infer<typeof UpdateSalesSchema>; 