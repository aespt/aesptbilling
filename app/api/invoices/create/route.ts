import { type NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { InvoiceItemsTable } from '@/lib/models/invoice_items';
import { InvoicesTable } from '@/lib/models/invoices';
import { PaymentDetailsTable } from '@/lib/models/payment_details';
import { type TokenPayload } from '@/lib/schemas/authSchema';
import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/utils/jwt';

interface InvoiceItemInput {
  product_id: number;
  qty: number;
  rate: number;
  total: number;
  price: number;
  mrp: number;
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookies
    const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const payload = verifyToken(authToken) as TokenPayload;
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();

    // Extract payment data from request body
    const { payment, ...invoiceData } = body;

    // Start transaction
    return await db.transaction(async tx => {
      // Create invoice record
      const newInvoice = await tx
        .insert(InvoicesTable)
        .values({
          invoice_number: invoiceData.invoice_number,
          invoice_date: new Date(invoiceData.date),
          customer_id: invoiceData.customer_id,
          salesman_id: invoiceData.salesman_id || null,
          tax_type: invoiceData.tax_type,
          tax_rate: String(
            invoiceData.tax_type === 'VAT'
              ? invoiceData.vat_percentage
              : invoiceData.tax_type === 'GST'
                ? invoiceData.cgst_percentage + invoiceData.sgst_percentage
                : 0
          ),
          sub_total: String(invoiceData.subtotal),
          total: String(invoiceData.total),
          discount: invoiceData.discount,
          ship_to: invoiceData.ship_to,
          ship_from: invoiceData.ship_from,
          profit: invoiceData.profit,
          invoice_stage: invoiceData.invoice_stage,
          created_by: payload.userId,
          updated_by: payload.userId,
        })
        .returning();

      if (!newInvoice || newInvoice.length === 0) {
        throw new Error('Failed to create invoice');
      }

      const invoiceId = newInvoice[0].id;

      // Process invoice items
      if (invoiceData.items && Array.isArray(invoiceData.items) && invoiceData.items.length > 0) {
        // Filter out items without product_id
        const validItems = invoiceData.items.filter((item: InvoiceItemInput) => item.product_id);

        if (validItems.length === 0) {
          throw new Error('At least one valid item is required');
        }

        // Prepare invoice items
        const invoiceItems = validItems.map((item: InvoiceItemInput) => ({
          invoice_id: invoiceId,
          product_id: item.product_id,
          quantity: item.qty,
          unit_price: String(item.rate || 0),
          total_price: String(item.total || 0),
          cost_price: String(item.price || 0),
          created_by: payload.userId,
          updated_by: payload.userId,
        }));

        // Insert all invoice items
        await tx.insert(InvoiceItemsTable).values(invoiceItems);
      }

      // Only create payment details for invoices with stage 'SALE'
      if (invoiceData.invoice_stage === 'SALE' && payment) {
        await tx.insert(PaymentDetailsTable).values({
          invoice_id: invoiceId,
          payment_method: payment.payment_method || 'CASH',
          payment_status: payment.payment_status || 'UNPAID',
          payment_date: payment.payment_date ? new Date(payment.payment_date) : new Date(),
          reference_number: payment.reference_number || '',
          payment_notes: payment.payment_notes || '',
        });
      }

      return NextResponse.json(
        { message: 'Invoice created successfully', data: { id: invoiceId } },
        { status: 201 }
      );
    });
  } catch (error: unknown) {
    console.error('Error creating invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create invoice';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
