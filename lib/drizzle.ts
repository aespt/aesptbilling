import * as dotenv from 'dotenv';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Import all models
import type * as models from './models';

// Load environment variables
dotenv.config();

// Connection string with explicit credentials
const connectionString =
  process.env.POSTGRES_URL || 'postgres://postgres:postgres@localhost:5432/aespt_db';

// Configure connection pool
const sql = postgres(connectionString, {
  ssl: true,
  // Connection pool configuration
  max: 10, // Maximum number of connections in the pool
  idle_timeout: 30, // Close idle connections after 30 seconds
  connect_timeout: 10, // Connection timeout after 10 seconds
  // Advanced configuration for high traffic
  max_lifetime: 60 * 30, // Connection lifetime max 30 minutes
  // Debug mode (remove in production)
  debug: process.env.NODE_ENV === 'development',
});

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

export type Supplier = InferSelectModel<typeof models.SuppliersTable>;
export type NewSupplier = InferInsertModel<typeof models.SuppliersTable>;

export type Salesman = InferSelectModel<typeof models.SalesmenTable>;
export type NewSalesman = InferInsertModel<typeof models.SalesmenTable>;

// Export Zod schemas from the schemas directory
export * from './schemas/baseSchema';
export * from './schemas/userSchema';
export * from './schemas/customerSchema';
export * from './schemas/productSchema';
export * from './schemas/invoiceSchema';
export * from './schemas/invoiceItemSchema';
export * from './schemas/vatMasterSchema';
export * from './schemas/gstMasterSchema';
export * from './schemas/supplierSchema';
export * from './schemas/salesmanSchema';
