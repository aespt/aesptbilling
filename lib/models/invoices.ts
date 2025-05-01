import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  varchar,
  timestamp,
  decimal,
  integer,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core';

import { CustomersTable } from './customers';
import { SalesmenTable } from './salesmen';
import { UsersTable } from './users';

// Create an enum for tax types
export const taxTypeEnum = pgEnum('tax_type', ['VAT', 'GST', 'NONE']);

export const invoiceStageEnum = pgEnum('invoice_stage', ['SALE', 'PROFORMA', 'QUOTATION']);

// Create an enum for discount types
export const discountTypeEnum = pgEnum('discount_type', ['PERCENTAGE', 'FIXED', 'NONE']);

export const InvoicesTable = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoice_number: varchar('invoice_number', { length: 50 }).notNull().unique(),
  invoice_date: timestamp('invoice_date').defaultNow().notNull(),
  is_used: boolean('is_used').default(false),
  customer_id: integer('customer_id')
    .notNull()
    .references(() => CustomersTable.id),
  salesman_id: integer('salesman_id').references(() => SalesmenTable.id),
  parent_invoice_id: integer('parent_invoice_id'),
  tax_type: taxTypeEnum('tax_type').default('NONE'),
  tax_rate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0'),
  sub_total: decimal('sub_total', { precision: 10, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0'),
  discount_percentage: decimal('discount_percentage', { precision: 5, scale: 2 }).default('0'),
  discount_type: discountTypeEnum('discount_type').default('NONE'),
  invoice_stage: invoiceStageEnum('invoice_stage').default('SALE'),
  profit: decimal('profit', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  ship_to: varchar('ship_to', { length: 255 }),
  ship_from: varchar('ship_from', { length: 255 }),
  created_by: integer('created_by').references(() => UsersTable.id),
  updated_by: integer('updated_by').references(() => UsersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const invoicesRelations = relations(InvoicesTable, ({ one }) => ({
  parent: one(InvoicesTable, {
    fields: [InvoicesTable.parent_invoice_id],
    references: [InvoicesTable.id],
  }),
}));
