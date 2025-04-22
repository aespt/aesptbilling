// Purchase form data interface
export interface PurchaseFormData {
  purchase_number: string;
  date: Date;
  supplier_id: number | null;
  ship_from: string;
  status: string;
  tax_type: 'VAT' | 'GST' | 'NONE';
  vat_percentage: number;
  cgst_percentage: number;
  sgst_percentage: number;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number | string;
  tax_rate: number;
  discount_rate: number;
}

// Purchase item interface
export interface PurchaseItem {
  id: string;
  product_id: number | null;
  part_no: string;
  qty: number;
  rate: number;
  total: number;
}

// Form errors interface
export interface FormErrors {
  [key: string]: string;
}

// Invoice form data interface
export interface InvoiceFormData {
  invoice_number: string;
  date: Date;
  salesman_id: number | null;
  ship_from: string;
  customer_id: number | null;
  ship_to: string;
  status: string;
  tax_type: 'VAT' | 'GST' | 'NONE';
  vat_percentage: number;
  cgst_percentage: number;
  sgst_percentage: number;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number | string;
}

// Invoice item interface
export interface InvoiceItem {
  id: string;
  product_id: number | null;
  part_no: string;
  qty: number;
  rate: number;
  total: number;
  price: number;
  mrp: number;
}

// Customer interface
export interface Customer {
  id: number;
  name: string;
  address: string;
  contact_person: string;
  email: string;
  phone: string;
}

// Salesman interface
export interface Salesman {
  id: number;
  name: string;
  email: string;
  phone: string;
}
