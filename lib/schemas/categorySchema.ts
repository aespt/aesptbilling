import { z } from 'zod';

import { BaseCreateSchema, BaseSchema } from './baseSchema';

// Zod schema for category validation
export const CategorySchema = BaseSchema.extend({
  id: z.number().optional(),
  name: z.string().min(2, { message: 'Category name must be at least 2 characters' }),
  description: z.string().optional(),
  parentId: z.number().optional().nullable(),
  slug: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Zod schema for creating a new category
export const CreateCategorySchema = BaseCreateSchema.extend(
  CategorySchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    created_by: true,
    updated_by: true,
  }).shape
);

// Zod schema for updating a category
export const UpdateCategorySchema = CreateCategorySchema.partial();

// Types derived from Zod schema
export type CategoryInput = z.infer<typeof CreateCategorySchema>;
export type CategoryUpdate = z.infer<typeof UpdateCategorySchema>;
