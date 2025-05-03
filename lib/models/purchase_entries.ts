import { pgTable, serial, varchar, timestamp, decimal, integer } from 'drizzle-orm/pg-core';

import { purchaseTaxTypeEnum, purchaseTypeEnum } from './purchases'; // Adjust path if needed
import { SuppliersTable } from './suppliers';
import { UsersTable } from './users';

// Re-use existing enums if applicable, or define new ones if needed.
// Assuming re-use for now.

export const PurchaseEntriesTable = pgTable('purchase_entries', {
  id: serial('id').primaryKey(),
  purchaseentry_number: varchar('purchaseentry_number', { length: 50 }).notNull().unique(),
  purchaseentry_date: timestamp('purchaseentry_date').defaultNow().notNull(),
  supplier_id: integer('supplier_id')
    .notNull()
    .references(() => SuppliersTable.id),
  tax_type: purchaseTaxTypeEnum('tax_type').default('NONE'),
  tax_rate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0'),
  discount_rate: decimal('discount_rate', { precision: 5, scale: 2 }).default('0'),
  sub_total: decimal('sub_total', { precision: 10, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0'),
  purchase_type: purchaseTypeEnum('purchase_type').default('TAX'), // Assuming this enum is still relevant
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  ship_from: varchar('ship_from', { length: 255 }),
  created_by: integer('created_by').references(() => UsersTable.id),
  updated_by: integer('updated_by').references(() => UsersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
