import { pgTable, serial, timestamp, uniqueIndex, varchar, integer } from 'drizzle-orm/pg-core';

// Define the table
export const UsersTable = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    password_hash: varchar('password_hash', { length: 255 }).notNull(),
    password_reset_token: varchar('password_reset_token', { length: 255 }),
    token_expiration: timestamp('token_expiration'),
    created_by: integer('created_by'),
    updated_by: integer('updated_by'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  users => {
    return {
      emailIdx: uniqueIndex('users_email_idx').on(users.email),
      usernameIdx: uniqueIndex('users_username_idx').on(users.username),
    };
  }
);

// Add self-references manually after the table is defined
// These need to be defined in a separate file to avoid circular references
// or managed through a migration
