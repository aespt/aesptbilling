import { z } from 'zod';
import { BaseSchema, BaseCreateSchema } from './baseSchema';

// Enum for tax types
export const TaxTypeEnum = z.enum(['VAT', 'GST', 'NONE']);

// Zod schema for invoice validation
export const InvoiceSchema = BaseSchema.extend({
  id: z.number().optional(),
  invoice_number: z.string().min(1, { message: "Invoice number is required" }),
  invoice_date: z.date().default(() => new Date()),
  user_id: z.number(),
  customer_id: z.number(),
  salesperson_name: z.string().min(1, { message: "Salesperson name is required" }),
  tax_type: TaxTypeEnum.default('NONE'),
  tax_rate: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  sub_total: z.number().positive(),
  total: z.number().positive(),
  ship_to: z.string().min(1, { message: "Ship to is required" }),
  ship_from: z.string().min(1, { message: "Ship from is required" }),
});

// Zod schema for creating a new invoice
export const CreateInvoiceSchema = BaseCreateSchema.extend(
  InvoiceSchema.omit({ 
    id: true, 
    created_at: true, 
    updated_at: true,
    created_by: true,
    updated_by: true
  }).shape
);

// Zod schema for updating an invoice
export const UpdateInvoiceSchema = CreateInvoiceSchema.partial();

// Types derived from Zod schema
export type InvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type InvoiceUpdate = z.infer<typeof UpdateInvoiceSchema>; 