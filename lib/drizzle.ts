import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export const UsersTable = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: varchar('phone', { length: 20 }),
    image: text('image'),
    forgotPasswordToken: text('forgot_password_token'),
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
