import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connection string with explicit credentials
const connectionString = 'postgres://postgres:postgres@localhost:5432/aespt_db';

// For local development, don't use SSL
const sql = postgres(connectionString, { ssl: false });

export const UsersTable = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: varchar('phone', { length: 20 }),
    image: text('image'),
    forgotPasswordToken: text('forgot_password_token'),
    password_hash: text('password_hash'),
    password_reset_token: text('password_reset_token'),
    token_expiration: timestamp('token_expiration'),
    createdBy: text('created_by'),
    updatedBy: text('updated_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  users => {
    return {
      uniqueIdx: uniqueIndex('unique_idx').on(users.email),
    };
  }
);

// Drizzle-specific types
export type User = InferSelectModel<typeof UsersTable>;
export type NewUser = InferInsertModel<typeof UsersTable>;

// Connect to Postgres
export const db = drizzle(sql);

// Export Zod schemas from the schemas directory
export * from './schemas/baseSchema';
export * from './schemas/userSchema';
export * from './schemas/productSchema';
export * from './schemas/categorySchema';
export * from './schemas/orderSchema';
export * from './schemas/orderItemSchema';
