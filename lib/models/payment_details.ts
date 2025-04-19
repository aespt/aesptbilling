import { pgTable, serial, varchar, timestamp, pgEnum, integer, text } from 'drizzle-orm/pg-core';

import { InvoicesTable } from './invoices';

// Create enums for payment details
export const paymentMethodEnum = pgEnum('payment_method', [
  'CASH',
  'CREDIT',
  'BANK_TRANSFER',
  'CHEQUE',
  'ONLINE',
]);
export const paymentStatusEnum = pgEnum('payment_status', ['UNPAID', 'PARTIALLY_PAID', 'PAID']);

export const PaymentDetailsTable = pgTable('payment_details', {
  id: serial('id').primaryKey(),
  invoice_id: integer('invoice_id')
    .notNull()
    .references(() => InvoicesTable.id),
  payment_method: paymentMethodEnum('payment_method').default('CASH'),
  payment_status: paymentStatusEnum('payment_status').default('UNPAID'),
  payment_date: timestamp('payment_date').defaultNow(),
  reference_number: varchar('reference_number', { length: 100 }),
  payment_notes: text('payment_notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
