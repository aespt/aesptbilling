import { z } from 'zod';
import { BaseSchema, BaseCreateSchema } from './baseSchema';

// Zod schema for invoice item validation
export const InvoiceItemSchema = BaseSchema.extend({
  id: z.number().optional(),
  invoice_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  total_price: z.number().positive(),
});

// Zod schema for creating a new invoice item
export const CreateInvoiceItemSchema = BaseCreateSchema.extend(
  InvoiceItemSchema.omit({ 
    id: true, 
    created_at: true, 
    updated_at: true,
    created_by: true,
    updated_by: true
  }).shape
);

// Zod schema for updating an invoice item
export const UpdateInvoiceItemSchema = CreateInvoiceItemSchema.partial();

// Types derived from Zod schema
export type InvoiceItemInput = z.infer<typeof CreateInvoiceItemSchema>;
export type InvoiceItemUpdate = z.infer<typeof UpdateInvoiceItemSchema>; 