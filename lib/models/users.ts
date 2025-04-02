import { pgTable, serial, text, timestamp, uniqueIndex, varchar, integer, type PgTableWithColumns, type IndexBuilder } from 'drizzle-orm/pg-core';

export const UsersTable: PgTableWithColumns<any> = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    password_hash: varchar('password_hash', { length: 255 }).notNull(),
    password_reset_token: varchar('password_reset_token', { length: 255 }),
    token_expiration: timestamp('token_expiration'),
    created_by: integer('created_by').references(() => UsersTable.id),
    updated_by: integer('updated_by').references(() => UsersTable.id),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (users): { emailIdx: IndexBuilder, usernameIdx: IndexBuilder } => {
    return {
      emailIdx: uniqueIndex('users_email_idx').on(users.email),
      usernameIdx: uniqueIndex('users_username_idx').on(users.username),
    };
  }
); 