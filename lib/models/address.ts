import { pgTable, serial, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const AddressTable = pgTable('addresses', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 50 }).notNull(),
  street: varchar('street', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }).notNull(),
  postal_code: varchar('postal_code', { length: 20 }).notNull(),
  is_primary: boolean('is_primary').default(false).notNull(),
  transaction_no: varchar('transaction_no', { length: 100 }),
  phone_no: varchar('phone_no', { length: 50 }),
  fax_no: varchar('fax_no', { length: 50 }),
  created_by: varchar('created_by', { length: 100 }),
  updated_by: varchar('updated_by', { length: 100 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
