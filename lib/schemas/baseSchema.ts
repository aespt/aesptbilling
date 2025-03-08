import { z } from 'zod';

// Base schema with common fields for all entities
export const BaseSchema = z.object({
  created_by: z.string().optional(),
  updated_by: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

// Base schema for creating new entities (without timestamps)
export const BaseCreateSchema = BaseSchema.omit({ 
  created_at: true, 
  updated_at: true 
});

// Base schema for updating entities
export const BaseUpdateSchema = BaseCreateSchema.partial(); 