// Common interface for database models
export interface BaseModel {
  id: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// Product interface
export interface Product extends BaseModel {
  partNo: string;
  name: string;
  description: string | null;
  price: number | string; // Allow both number and string for flexibility
  mrp: number | string;
  count: number | null;
  brand: string | null;
}

// Customer interface
export interface Customer extends BaseModel {
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  trn: string | null;
}

// Supplier interface
export interface Supplier extends BaseModel {
  tax_registration_number: string;
  name: string;
  address: string;
  contact_number: string;
}

// Salesman interface
export interface Salesman extends BaseModel {
  name: string;
  contact_number: string;
  email: string;
}

// User interface
export interface User extends BaseModel {
  username: string;
  email: string;
  password_hash: string;
  password_reset_token: string | null;
  token_expiration: string | null;
}

// Export invoice types
export * from './invoice';
