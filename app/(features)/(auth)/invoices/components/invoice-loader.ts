import type { InvoiceFormData, InvoiceItem } from '@/lib/types';

/**
 * Fetches an invoice by ID and returns it in a format suitable for the invoice form
 */
export async function fetchInvoiceById(invoiceId: string): Promise<{
  formData: Partial<InvoiceFormData>;
  invoiceItems: InvoiceItem[];
} | null> {
  try {
    const response = await fetch(`/api/invoices/${invoiceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch invoice');
    }

    const result = await response.json();

    // Handle new API response format
    const invoice = result.invoice || result.data;

    if (!invoice) {
      return null;
    }

    // Transform the invoice data to match the form structure
    const formData: Partial<InvoiceFormData> = {
      invoice_number: invoice.invoice_number,
      date: new Date(invoice.date || invoice.invoice_date),
      salesman_id: invoice.salesman_id,
      ship_from: invoice.ship_from || '',
      customer_id: invoice.customer_id,
      ship_to: invoice.ship_to || '',
      status: 'DRAFT', // Always create as draft
      tax_type: invoice.tax_type || 'VAT',
      vat_percentage: invoice.vat_percentage || 5,
      cgst_percentage: invoice.cgst_percentage || 0,
      sgst_percentage: invoice.sgst_percentage || 0,
      discount_type: invoice.discount_type || 'PERCENTAGE',
      discount_value: invoice.discount_value || 0,
    };

    // Define the interface for the API invoice item
    interface ApiInvoiceItem {
      id?: number;
      product_id: string | number | null;
      part_no?: string;
      quantity?: number;
      qty?: number;
      unit_price?: string | number;
      rate?: number;
      total_price?: string | number;
      total?: number;
      price?: number;
      mrp?: number;
    }

    // Get invoice items from the response
    const items = result.items || invoice.items || [];

    // Transform invoice items
    const invoiceItems: InvoiceItem[] = items.map((item: ApiInvoiceItem) => {
      // Use unit_price as the primary price source
      const unitPrice =
        typeof item.unit_price !== 'undefined'
          ? Number(item.unit_price)
          : typeof item.rate !== 'undefined'
            ? Number(item.rate)
            : 0;

      return {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // Generate new ID for each item
        product_id:
          typeof item.product_id === 'string' ? parseInt(item.product_id) : item.product_id,
        part_no: item.part_no || '',
        // Handle different API formats for quantity
        qty: item.qty || item.quantity || 1,
        // Use unit_price or rate as the rate value
        rate: unitPrice,
        // Handle different API formats for total
        total:
          typeof item.total !== 'undefined'
            ? Number(item.total)
            : typeof item.total_price !== 'undefined'
              ? Number(item.total_price)
              : unitPrice * (item.qty || item.quantity || 1), // Calculate if not provided
        // Use unit_price for price too
        price: unitPrice,
        // MRP can be the same as unit_price if not provided
        mrp: typeof item.mrp !== 'undefined' ? Number(item.mrp) : unitPrice,
      };
    });

    return { formData, invoiceItems };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return null;
  }
}
