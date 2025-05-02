import { pgTable, serial, varchar, timestamp, decimal, integer, pgEnum } from 'drizzle-orm/pg-core';

import { SuppliersTable } from './suppliers';
import { UsersTable } from './users';

// Create an enum for tax types
export const purchaseTaxTypeEnum = pgEnum('purchase_tax_type', ['VAT', 'GST', 'NONE']);

export const purchaseTypeEnum = pgEnum('purchase_type', [
  'TAX',
  'DELIVERY',
  'PROFORMA',
  'QUOTATION',
]);

export const PurchasesTable = pgTable('purchases', {
  id: serial('id').primaryKey(),
  purchase_number: varchar('purchase_number', { length: 50 }).notNull().unique(),
  purchase_date: timestamp('purchase_date').defaultNow().notNull(),
  supplier_id: integer('supplier_id')
    .notNull()
    .references(() => SuppliersTable.id),
  tax_type: purchaseTaxTypeEnum('tax_type').default('NONE'),
  tax_rate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0'),
  discount_rate: decimal('discount_rate', { precision: 5, scale: 2 }).default('0'),
  sub_total: decimal('sub_total', { precision: 10, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0'),
  purchase_type: purchaseTypeEnum('purchase_type').default('TAX'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  ship_from: varchar('ship_from', { length: 255 }),
  created_by: integer('created_by').references(() => UsersTable.id),
  updated_by: integer('updated_by').references(() => UsersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
