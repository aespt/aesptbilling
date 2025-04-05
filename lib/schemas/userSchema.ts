import { z } from 'zod';

import { BaseCreateSchema, BaseSchema } from './baseSchema';

// Zod schema for user validation
export const UserSchema = BaseSchema.extend({
  id: z.number().optional(),
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password_hash: z.string().max(255),
  password_reset_token: z.string().max(255).optional().nullable(),
  token_expiration: z.date().optional().nullable(),
});

// Zod schema for creating a new user
export const CreateUserSchema = BaseCreateSchema.extend(
  UserSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    created_by: true,
    updated_by: true,
  }).shape
);

// Zod schema for updating a user
export const UpdateUserSchema = CreateUserSchema.partial();

// Types derived from Zod schema
export type UserInput = z.infer<typeof CreateUserSchema>;
export type UserUpdate = z.infer<typeof UpdateUserSchema>;
