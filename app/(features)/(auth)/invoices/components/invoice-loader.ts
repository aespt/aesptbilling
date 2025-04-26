export interface PaymentData {
  payment_method: string;
  payment_status: string;
  payment_date: Date | null;
  reference_number: string;
  payment_notes: string;
}

interface InvoiceItemData {
  id: number;
  product_id: number;
  invoice_id: number;
  quantity: number;
  unit_price: string;
  total_price: string;
  part_no: string;
  product_name: string;
  price: number;
  rate: number;
  mrp: number;
  qty: number;
  total: number;
}

/**
 * Fetches an invoice by ID and returns it in a format suitable for the invoice form
 */
export async function fetchInvoiceById(id: string) {
  try {
    // Fetch all data in parallel - invoice details, items and payment data
    const [invoiceResponse, itemsResponse] = await Promise.all([
      fetch(`/api/invoices/${id}`),
      fetch(`/api/invoices/${id}/items`),
    ]);

    if (!invoiceResponse.ok) {
      throw new Error('Failed to fetch invoice');
    }

    if (!itemsResponse.ok) {
      throw new Error('Failed to fetch invoice items');
    }

    const [invoiceData, itemsData] = await Promise.all([
      invoiceResponse.json(),
      itemsResponse.json(),
    ]);

    const invoice = invoiceData.data;

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Fetch payment details only if invoice stage is SALE (this can't be parallelized until we know the invoice stage)
    let paymentData: PaymentData | null = null;
    if (invoice.invoice_stage === 'SALE') {
      try {
        const paymentResponse = await fetch(`/api/payments?invoice_id=${id}`);
        if (paymentResponse.ok) {
          const paymentResult = await paymentResponse.json();
          if (paymentResult.data && paymentResult.data.length > 0) {
            const payment = paymentResult.data[0];
            paymentData = {
              payment_method: payment.payment_method,
              payment_status: payment.payment_status,
              payment_date: payment.payment_date ? new Date(payment.payment_date) : null,
              reference_number: payment.reference_number || '',
              payment_notes: payment.payment_notes || '',
            };
          }
        }
      } catch (error) {
        console.error('Error fetching payment details:', error);
        // Continue loading invoice even if payment fetch fails
      }
    }

    // Transform the data into the format expected by the form
    return {
      formData: {
        invoice_number: invoice.invoice_number,
        date: new Date(invoice.invoice_date),
        customer_id: invoice.customer_id,
        salesman_id: invoice.salesman_id,
        ship_to: invoice.ship_to,
        ship_from: invoice.ship_from,
        // Extract tax information
        tax_type: invoice.tax_type,
        vat_percentage: invoice.tax_type === 'VAT' ? parseFloat(invoice.tax_rate) : 0,
        cgst_percentage: invoice.tax_type === 'GST' ? parseFloat(invoice.tax_rate) / 2 : 0,
        sgst_percentage: invoice.tax_type === 'GST' ? parseFloat(invoice.tax_rate) / 2 : 0,
        // Discount information
        discount_type: invoice.discount_type || 'FIXED', // Use the stored discount_type
        discount_value:
          invoice.discount_type === 'PERCENTAGE'
            ? parseFloat(invoice.discount_percentage || '0')
            : parseFloat(invoice.discount),
        discount_percentage:
          invoice.discount_type === 'PERCENTAGE'
            ? parseFloat(invoice.discount_percentage || '0')
            : 0,
        status: 'DRAFT', // Default status for editing
        invoice_stage: invoice.invoice_stage,
      },
      invoiceItems: itemsData.items.map((item: InvoiceItemData) => ({
        id: item.id.toString(),
        product_id: item.product_id,
        part_no: item.part_no || '',
        qty: item.qty,
        rate: item.rate,
        total: item.total,
        price: item.price,
        mrp: item.mrp,
      })),
      // Include payment data
      paymentData,
    };
  } catch (error) {
    console.error('Error loading invoice:', error);
    throw error;
  }
}
