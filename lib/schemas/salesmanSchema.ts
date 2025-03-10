import { z } from 'zod';
import { BaseSchema, BaseCreateSchema } from './baseSchema';

// Zod schema for salesman validation
export const SalesmanSchema = BaseSchema.extend({
  id: z.number().optional(),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  contact_number: z.string().min(10).max(20, { message: "Contact number must be between 10 and 20 characters" }),
});

// Zod schema for creating a new salesman
export const CreateSalesmanSchema = BaseCreateSchema.extend(
  SalesmanSchema.omit({ 
    id: true, 
    created_at: true, 
    updated_at: true,
    created_by: true,
    updated_by: true
  }).shape
);

// Zod schema for updating a salesman
export const UpdateSalesmanSchema = CreateSalesmanSchema.partial();

// Types derived from Zod schema
export type SalesmanInput = z.infer<typeof CreateSalesmanSchema>;
export type SalesmanUpdate = z.infer<typeof UpdateSalesmanSchema>; 