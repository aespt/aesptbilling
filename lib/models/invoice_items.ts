import { pgTable, serial, integer, decimal, timestamp, varchar } from 'drizzle-orm/pg-core';
import { InvoicesTable } from './invoices';
import { ProductsTable } from './products';

export const InvoiceItemsTable = pgTable(
  'invoice_items',
  {
    id: serial('id').primaryKey(),
    invoice_id: integer('invoice_id')
      .notNull()
      .references(() => InvoicesTable.id, { onDelete: 'cascade' }),
    product_id: integer('product_id')
      .notNull()
      .references(() => ProductsTable.id),
    quantity: integer('quantity').notNull(),
    unit_price: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    discount: decimal('discount', { precision: 10, scale: 2 }).default('0'),
    total_price: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
    created_by: varchar('created_by', { length: 100 }),
    updated_by: varchar('updated_by', { length: 100 }),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  }
); 