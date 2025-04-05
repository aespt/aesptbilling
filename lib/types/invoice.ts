import type { z } from 'zod';

import type { TaxTypeEnum } from '../schemas/invoiceSchema';

// Define the type from the Zod enum
export type TaxType = z.infer<typeof TaxTypeEnum>;

// Define discount type enum
export type DiscountType = 'PERCENTAGE' | 'FIXED' | 'NONE';

// Base invoice item interface
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

// Form errors interface
export interface FormErrors {
  invoice_number?: string;
  salesman_id?: string;
  customer_id?: string;
  items?: string;
  [key: string]: string | undefined;
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
  // Tax and discount fields
  tax_type: TaxType;
  vat_percentage: number;
  cgst_percentage: number;
  sgst_percentage: number;
  discount_type: DiscountType;
  discount_value: number | string;
  [key: string]: string | number | Date | null | undefined;
}
