export interface PaymentData {
  payment_method: string;
  payment_status: string;
  payment_date: Date | null;
  reference_number: string;
  payment_notes: string;
}

interface InvoiceItemData {
  id: string;
  product_id: number;
  part_no: string;
  quantity: number;
  rate: string;
  total: string;
  cost_price?: string;
  mrp?: string | number;
}

/**
 * Fetches an invoice by ID and returns it in a format suitable for the invoice form
 */
export async function fetchInvoiceById(id: string) {
  try {
    // Fetch the invoice details
    const invoiceResponse = await fetch(`/api/invoices/${id}`);

    if (!invoiceResponse.ok) {
      throw new Error('Failed to fetch invoice');
    }

    const invoiceData = await invoiceResponse.json();
    const invoice = invoiceData.data;

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Fetch the invoice items
    const itemsResponse = await fetch(`/api/invoice-items?invoice_id=${id}`);

    if (!itemsResponse.ok) {
      throw new Error('Failed to fetch invoice items');
    }

    const itemsData = await itemsResponse.json();

    // Fetch payment details if invoice stage is SALE
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
        discount_type: 'FIXED', // Default to FIXED for existing invoices
        discount_value: parseFloat(invoice.discount),
        status: 'DRAFT', // Default status for editing
        invoice_stage: invoice.invoice_stage,
      },
      invoiceItems: itemsData.data.map((item: InvoiceItemData) => ({
        id: item.id.toString(),
        product_id: item.product_id,
        part_no: item.part_no || '',
        qty: item.quantity,
        rate: parseFloat(item.rate),
        total: parseFloat(item.total),
        price: parseFloat(item.cost_price || '0'),
        mrp: item.mrp ? parseFloat(item.mrp.toString()) : parseFloat(item.rate),
      })),
      // Include payment data
      paymentData,
    };
  } catch (error) {
    console.error('Error loading invoice:', error);
    throw error;
  }
}
