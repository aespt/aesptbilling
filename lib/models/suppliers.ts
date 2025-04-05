import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const SuppliersTable = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  tax_registration_number: varchar('tax_registration_number', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address').notNull(),
  contact_number: varchar('contact_number', { length: 20 }).notNull(),
  created_by: varchar('created_by', { length: 100 }),
  updated_by: varchar('updated_by', { length: 100 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
