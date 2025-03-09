import { z } from 'zod';
import { BaseSchema, BaseCreateSchema } from './baseSchema';

// Zod schema for supplier validation
export const SupplierSchema = BaseSchema.extend({
  id: z.number().optional(),
  tax_registration_number: z.string().min(1, { message: "Tax registration number is required" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  address: z.string().min(1, { message: "Address is required" }),
  contact_number: z.string().min(10).max(20, { message: "Contact number must be between 10 and 20 characters" }),
});

// Zod schema for creating a new supplier
export const CreateSupplierSchema = BaseCreateSchema.extend(
  SupplierSchema.omit({ 
    id: true, 
    created_at: true, 
    updated_at: true,
    created_by: true,
    updated_by: true
  }).shape
);

// Zod schema for updating a supplier
export const UpdateSupplierSchema = CreateSupplierSchema.partial();

// Types derived from Zod schema
export type SupplierInput = z.infer<typeof CreateSupplierSchema>;
export type SupplierUpdate = z.infer<typeof UpdateSupplierSchema>; 