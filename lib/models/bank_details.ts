import { pgTable, serial, varchar, boolean, timestamp, text } from 'drizzle-orm/pg-core';

export const BankDetailsTable = pgTable('bank_details', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  details: text('details').notNull(),
  is_primary: boolean('is_primary').default(false).notNull(),
  created_by: varchar('created_by', { length: 100 }),
  updated_by: varchar('updated_by', { length: 100 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
