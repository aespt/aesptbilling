import { pgTable, serial, text, timestamp, decimal, varchar, integer } from 'drizzle-orm/pg-core';

export const ProductsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  partNo: varchar('part_no', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  mrp: decimal('mrp', { precision: 10, scale: 2 }),
  count: integer('count'),
  brand: varchar('brand', { length: 255 }),
  created_by: varchar('created_by', { length: 100 }),
  updated_by: varchar('updated_by', { length: 100 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
