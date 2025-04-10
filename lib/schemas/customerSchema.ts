import { z } from 'zod';

import { BaseSchema, BaseCreateSchema } from './baseSchema';

// Zod schema for customer validation
export const CustomerSchema = BaseSchema.extend({
  id: z.number().optional(),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  trn: z.string().min(3, { message: "TRN must be at least 3 characters" }),
  phone: z.string().min(10).max(20, { message: "Phone must be between 10 and 20 characters" }),
  address: z.string().optional(),

});

// Zod schema for creating a new customer
export const CreateCustomerSchema = BaseCreateSchema.extend(
  CustomerSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    created_by: true,
    updated_by: true,
  }).shape
);

// Zod schema for updating a customer
export const UpdateCustomerSchema = CreateCustomerSchema.partial();

// Types derived from Zod schema
export type CustomerInput = z.infer<typeof CreateCustomerSchema>;
export type CustomerUpdate = z.infer<typeof UpdateCustomerSchema>;
