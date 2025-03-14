import { pgTable, serial, timestamp, decimal, integer, varchar, pgEnum, date } from 'drizzle-orm/pg-core';
import { CustomersTable } from './customers';
import { ProductsTable } from './products';
import { SalesmenTable } from './salesmen';
import { InvoicesTable } from './invoices';

// Create an enum for discount types
export const discountTypeEnum = pgEnum('discount_type', ['PERCENTAGE', 'FIXED', 'NONE']);

export const SalesTable = pgTable(
  'sales',
  {
    id: serial('id').primaryKey(),
    date: date('date').notNull(),
    customer_id: integer('customer_id').notNull().references(() => CustomersTable.id),
    product_id: integer('product_id').notNull().references(() => ProductsTable.id),
    qty: integer('qty').notNull(),
    mrp: decimal('mrp', { precision: 10, scale: 2 }).notNull(),
    discount_type: discountTypeEnum('discount_type').default('NONE'),
    discount_value: decimal('discount_value', { precision: 10, scale: 2 }).default('0'),
    salesman_id: integer('salesman_id').notNull().references(() => SalesmenTable.id),
    ship_to: varchar('ship_to', { length: 255 }),
    invoice_id: integer('invoice_id').references(() => InvoicesTable.id),
    created_by: varchar('created_by', { length: 100 }),
    updated_by: varchar('updated_by', { length: 100 }),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  }
); 