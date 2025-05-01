import { z } from 'zod';

import { BaseCreateSchema, BaseSchema } from './baseSchema';

// Zod schema for product validation
export const ProductSchema = BaseSchema.extend({
  id: z.number().optional(),
  part_no: z
    .string()
    .min(1, { message: 'Part number is required' })
    .refine(val => val.trim().length > 0, { message: 'Part number cannot be empty' }),
  name: z.string().min(2, { message: 'Product name must be at least 2 characters' }),
  description: z.string().optional(),
  price: z.number().positive({ message: 'Price must be positive' }),
  brand: z.string().optional(),
  mrp: z.number().positive({ message: 'MRP must be positive' }),
  count: z.number().optional(),
});

// Zod schema for creating a new product
export const CreateProductSchema = BaseCreateSchema.extend(
  ProductSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    created_by: true,
    updated_by: true,
  }).shape
);

// Zod schema for updating a product
export const UpdateProductSchema = CreateProductSchema.partial();

// Types derived from Zod schema
export type ProductInput = z.infer<typeof CreateProductSchema>;
export type ProductUpdate = z.infer<typeof UpdateProductSchema>;
