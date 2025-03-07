import { z } from 'zod';

// Base schema with common fields for all entities
export const BaseSchema = z.object({
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Base schema for creating new entities (without timestamps)
export const BaseCreateSchema = BaseSchema.omit({ 
  createdAt: true, 
  updatedAt: true 
});

// Base schema for updating entities
export const BaseUpdateSchema = BaseCreateSchema.partial(); 