import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Import all models
import * as models from './models';

// Load environment variables
dotenv.config();

// Connection string with explicit credentials
const connectionString = 'postgres://postgres:postgres@localhost:5432/aespt_db';

// For local development, don't use SSL
const sql = postgres(connectionString, { ssl: false });

// Connect to Postgres
export const db = drizzle(sql);

// Export all models
export * from './models';

// Define types for each table
export type User = InferSelectModel<typeof models.UsersTable>;
export type NewUser = InferInsertModel<typeof models.UsersTable>;

export type Customer = InferSelectModel<typeof models.CustomersTable>;
export type NewCustomer = InferInsertModel<typeof models.CustomersTable>;

export type Product = InferSelectModel<typeof models.ProductsTable>;
export type NewProduct = InferInsertModel<typeof models.ProductsTable>;

export type Invoice = InferSelectModel<typeof models.InvoicesTable>;
export type NewInvoice = InferInsertModel<typeof models.InvoicesTable>;

export type InvoiceItem = InferSelectModel<typeof models.InvoiceItemsTable>;
export type NewInvoiceItem = InferInsertModel<typeof models.InvoiceItemsTable>;

export type VatMaster = InferSelectModel<typeof models.VatMasterTable>;
export type NewVatMaster = InferInsertModel<typeof models.VatMasterTable>;

export type GstMaster = InferSelectModel<typeof models.GstMasterTable>;
export type NewGstMaster = InferInsertModel<typeof models.GstMasterTable>;

// Export Zod schemas from the schemas directory
export * from './schemas/baseSchema';
export * from './schemas/userSchema';
export * from './schemas/customerSchema';
export * from './schemas/productSchema';
export * from './schemas/invoiceSchema';
export * from './schemas/invoiceItemSchema';
export * from './schemas/vatMasterSchema';
export * from './schemas/gstMasterSchema';
