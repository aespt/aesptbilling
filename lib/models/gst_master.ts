import { pgTable, serial, varchar, timestamp, decimal, text } from 'drizzle-orm/pg-core';

export const GstMasterTable = pgTable(
  'gst_master',
  {
    id: serial('id').primaryKey(),
    country: varchar('country', { length: 100 }).default('India').notNull(),
    gst_percentage: decimal('gst_percentage', { precision: 5, scale: 2 }).notNull(),
    description: text('description'),
    effective_from: timestamp('effective_from').notNull(),
    effective_to: timestamp('effective_to'),
    created_by: varchar('created_by', { length: 100 }),
    updated_by: varchar('updated_by', { length: 100 }),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  }
); 