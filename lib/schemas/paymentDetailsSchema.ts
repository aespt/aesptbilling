import { z } from 'zod';

import { BaseSchema, BaseCreateSchema } from './baseSchema';

// Enum for payment methods
export const PaymentMethodEnum = z.enum(['CASH', 'CREDIT', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE']);

// Enum for payment statuses
export const PaymentStatusEnum = z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID']);

// Zod schema for payment details validation
export const PaymentDetailsSchema = BaseSchema.extend({
  id: z.number().optional(),
  invoice_id: z.number(),
  payment_method: PaymentMethodEnum.default('CASH'),
  payment_status: PaymentStatusEnum.default('PAID'),
  payment_date: z.date().default(() => new Date()),
  reference_number: z.string().optional(),
  payment_notes: z.string().optional(),
});

// Zod schema for creating new payment details
export const CreatePaymentDetailsSchema = BaseCreateSchema.extend(
  PaymentDetailsSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    created_by: true,
    updated_by: true,
  }).shape
);

// Zod schema for updating payment details
export const UpdatePaymentDetailsSchema = CreatePaymentDetailsSchema.partial();

// Types derived from Zod schema
export type PaymentDetailsInput = z.infer<typeof CreatePaymentDetailsSchema>;
export type PaymentDetailsUpdate = z.infer<typeof UpdatePaymentDetailsSchema>;
