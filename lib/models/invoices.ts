import { pgTable, serial, varchar, timestamp, decimal, integer, pgEnum } from 'drizzle-orm/pg-core';
import { UsersTable } from './users';
import { CustomersTable } from './customers';
import { SalesmenTable } from './salesmen';

// Create an enum for tax types
export const taxTypeEnum = pgEnum('tax_type', ['VAT', 'GST', 'NONE']);

export const InvoicesTable = pgTable(
  'invoices',
  {
    id: serial('id').primaryKey(),
    invoice_number: varchar('invoice_number', { length: 50 }).notNull().unique(),
    invoice_date: timestamp('invoice_date').defaultNow().notNull(),
    user_id: integer('user_id').notNull().references(() => UsersTable.id),
    customer_id: integer('customer_id').notNull().references(() => CustomersTable.id),
    salesman_id: integer('salesman_id').references(() => SalesmenTable.id),
    tax_type: taxTypeEnum('tax_type').default('NONE'),
    tax_rate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0'),
    sub_total: decimal('sub_total', { precision: 10, scale: 2 }).notNull(),
    discount: decimal('discount', { precision: 10, scale: 2 }).default('0'),
    profit: decimal('profit', { precision: 10, scale: 2 }).default('0'),
    total: decimal('total', { precision: 10, scale: 2 }).notNull(),
    ship_to: varchar('ship_to', { length: 255 }),
    ship_from: varchar('ship_from', { length: 255 }),
    created_by: varchar('created_by', { length: 100 }),
    updated_by: varchar('updated_by', { length: 100 }),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  }
); 