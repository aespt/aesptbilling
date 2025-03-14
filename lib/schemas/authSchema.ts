import { z } from 'zod';

// Login schema for validating login requests
export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" })
});

export type LoginInput = z.infer<typeof LoginSchema>;

// JWT Token payload schema
export const TokenPayloadSchema = z.object({
  userId: z.number(),
  email: z.string().email(),
  username: z.string(),
});

export type TokenPayload = z.infer<typeof TokenPayloadSchema>; 