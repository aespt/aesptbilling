import { z } from 'zod';
import { BaseSchema, BaseCreateSchema } from './baseSchema';

// Zod schema for VAT master validation
export const VatMasterSchema = BaseSchema.extend({
  id: z.number().optional(),
  country: z.string().default('UAE'),
  vat_percentage: z.number().nonnegative(),
  description: z.string().optional(),
  effective_from: z.date(),
  effective_to: z.date().optional(),
});

// Zod schema for creating a new VAT master entry
export const CreateVatMasterSchema = BaseCreateSchema.extend(
  VatMasterSchema.omit({ 
    id: true, 
    created_at: true, 
    updated_at: true,
    created_by: true,
    updated_by: true
  }).shape
);

// Zod schema for updating a VAT master entry
export const UpdateVatMasterSchema = CreateVatMasterSchema.partial();

// Types derived from Zod schema
export type VatMasterInput = z.infer<typeof CreateVatMasterSchema>;
export type VatMasterUpdate = z.infer<typeof UpdateVatMasterSchema>; 