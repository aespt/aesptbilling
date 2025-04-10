import { z } from 'zod';
import { BaseSchema, BaseCreateSchema } from './baseSchema';

// Zod schema for bank details validation
export const BankDetailsSchema = BaseSchema.extend({
  id: z.number().optional(),
  name: z.string().min(1, "Bank name is required"),
  details: z.string().min(1, "Bank details are required"),
  is_primary: z.boolean().default(false),
});

// Zod schema for creating new bank details
export const CreateBankDetailsSchema = BaseCreateSchema.extend(
  BankDetailsSchema.omit({ 
    id: true, 
    created_at: true, 
    updated_at: true,
    created_by: true,
    updated_by: true
  }).shape
);

// Zod schema for updating bank details
export const UpdateBankDetailsSchema = CreateBankDetailsSchema.partial();

// Types derived from Zod schema
export type BankDetailsInput = z.infer<typeof CreateBankDetailsSchema>;
export type BankDetailsUpdate = z.infer<typeof UpdateBankDetailsSchema>;
export type BankDetails = z.infer<typeof BankDetailsSchema>; 