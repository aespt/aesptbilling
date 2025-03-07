import { z } from 'zod';
import { BaseSchema, BaseCreateSchema } from './baseSchema';

// Zod schema for product validation
export const ProductSchema = BaseSchema.extend({
  id: z.number().optional(),
  name: z.string().min(2, { message: "Product name must be at least 2 characters" }),
  description: z.string().optional(),
  price: z.number().positive({ message: "Price must be positive" }),
  sku: z.string().optional(),
  inventory: z.number().int().nonnegative().optional(),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Zod schema for creating a new product
export const CreateProductSchema = BaseCreateSchema.extend(
  ProductSchema.omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true,
    createdBy: true,
    updatedBy: true
  }).shape
);

// Zod schema for updating a product
export const UpdateProductSchema = CreateProductSchema.partial();

// Types derived from Zod schema
export type ProductInput = z.infer<typeof CreateProductSchema>;
export type ProductUpdate = z.infer<typeof UpdateProductSchema>; 