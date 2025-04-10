import { z } from 'zod';

import { BaseCreateSchema, BaseSchema } from './baseSchema';

// Zod schema for GST master validation
export const GstMasterSchema = BaseSchema.extend({
  id: z.number().optional(),
  country: z.string().default('India'),
  cgst_percentage: z.number().nonnegative(),
  sgst_percentage: z.number().nonnegative(),
  description: z.string().optional(),
  effective_from: z.date().optional(),
  effective_to: z.date().optional(),
});

// Zod schema for creating a new GST master entry
export const CreateGstMasterSchema = BaseCreateSchema.extend(
  GstMasterSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    created_by: true,
    updated_by: true,
  }).shape
);

// Zod schema for updating a GST master entry
export const UpdateGstMasterSchema = CreateGstMasterSchema.partial();

// Types derived from Zod schema
export type GstMasterInput = z.infer<typeof CreateGstMasterSchema>;
export type GstMasterUpdate = z.infer<typeof UpdateGstMasterSchema>;
