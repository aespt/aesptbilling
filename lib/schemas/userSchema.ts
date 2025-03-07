import { z } from 'zod';
import { BaseSchema, BaseCreateSchema } from './baseSchema';

// Zod schema for user validation
export const UserSchema = BaseSchema.extend({
  id: z.number().optional(),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(10).max(20).optional(),
  image: z.string().optional(),
  forgotPasswordToken: z.string().optional().nullable(),
  password_hash: z.string().max(255).optional(),
  password_reset_token: z.string().max(255).optional().nullable(),
  token_expiration: z.date().optional().nullable(),
});

// Zod schema for creating a new user
export const CreateUserSchema = BaseCreateSchema.extend(
  UserSchema.omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true,
    createdBy: true,
    updatedBy: true
  }).shape
);

// Zod schema for updating a user
export const UpdateUserSchema = CreateUserSchema.partial();

// Types derived from Zod schema
export type UserInput = z.infer<typeof CreateUserSchema>;
export type UserUpdate = z.infer<typeof UpdateUserSchema>; 