import { pgTable, serial, integer, decimal, timestamp } from 'drizzle-orm/pg-core';

import { ProductsTable } from './products';
import { PurchaseEntriesTable } from './purchase_entries'; // Updated reference
import { UsersTable } from './users';

export const PurchaseEntryItemsTable = pgTable('purchase_entry_items', {
  id: serial('id').primaryKey(),
  purchase_entry_id: integer('purchase_entry_id') // Renamed field
    .notNull()
    .references(() => PurchaseEntriesTable.id, { onDelete: 'cascade' }), // Updated reference
  product_id: integer('product_id')
    .notNull()
    .references(() => ProductsTable.id),
  quantity: integer('quantity').notNull(),
  rate: decimal('rate', { precision: 10, scale: 2 }).notNull(),
  total_price: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  created_by: integer('created_by').references(() => UsersTable.id),
  updated_by: integer('updated_by').references(() => UsersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}); 
