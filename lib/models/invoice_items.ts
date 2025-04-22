import { pgTable, serial, integer, decimal, timestamp } from 'drizzle-orm/pg-core';

import { InvoicesTable } from './invoices';
import { ProductsTable } from './products';
import { UsersTable } from './users';

export const InvoiceItemsTable = pgTable('invoice_items', {
  id: serial('id').primaryKey(),
  invoice_id: integer('invoice_id')
    .notNull()
    .references(() => InvoicesTable.id, { onDelete: 'cascade' }),
  product_id: integer('product_id')
    .notNull()
    .references(() => ProductsTable.id),
  quantity: integer('quantity').notNull(),
  unit_price: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  total_price: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  mrp: decimal('mrp', { precision: 10, scale: 2 }).notNull(),
  created_by: integer('created_by').references(() => UsersTable.id),
  updated_by: integer('updated_by').references(() => UsersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
