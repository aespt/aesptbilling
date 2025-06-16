import { desc } from 'drizzle-orm';
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
  is_used?: boolean;
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

    // Ensure userId is a valid number
    const userId = typeof payload.userId === 'number' ? payload.userId : Number(payload.userId);

    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Invalid user ID in token' }, { status: 400 });
    }

    const body = await request.json();

    // Extract payment data from request body
    const { payment, ...invoiceData } = body;

    // Ensure numeric fields aren't empty strings
    const safeDiscount = invoiceData.discount === '' ? 0 : invoiceData.discount;
    const safeDiscountPercentage =
      invoiceData.discount_percentage === '' ? 0 : invoiceData.discount_percentage;
    const safeProfit = invoiceData.profit === '' ? 0 : invoiceData.profit;

    // Start transaction
    return await db.transaction(async tx => {
      // Generate next invoice number starting from 180, incremental without padding
      // Get the highest existing invoice_number (as integer)
      const lastInvoice = await tx
        .select({ invoice_number: InvoicesTable.invoice_number })
        .from(InvoicesTable)
        .orderBy(desc(InvoicesTable.id))
        .limit(1);

      let nextInvoiceNumber = process.env.NEXT_PUBLIC_INVOICE_NUMBER_START || '180';
      if (lastInvoice && lastInvoice.length > 0) {
        // Extract numeric part, handle possible non-numeric values
        const lastNum = parseInt(lastInvoice[0].invoice_number, 10);
        if (!isNaN(lastNum)) {
          // Ensure the next number is at least 180
          const nextNum = Math.max(lastNum + 1, 180);
          nextInvoiceNumber = String(nextNum);
        }
      }

      // Create invoice record
      const newInvoice = await tx
        .insert(InvoicesTable)
        .values({
          invoice_number: nextInvoiceNumber,
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
          sub_total: String(invoiceData.subtotal || 0),
          total: String(invoiceData.total || 0),
          discount: safeDiscount,
          discount_type: invoiceData.discount_type || 'NONE',
          discount_percentage: safeDiscountPercentage,
          ship_to: invoiceData.ship_to,
          ship_from: invoiceData.ship_from,
          profit: safeProfit,
          invoice_stage: invoiceData.invoice_stage,
          parent_invoice_id: invoiceData.parent_id || null,
          is_used: invoiceData.is_used || false,
          created_by: userId,
          updated_by: userId,
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
          unit_price: String(item.price || 0),
          total_price: String(item.total || 0),
          mrp: String(item.mrp || 0),
          created_by: userId,
          updated_by: userId,
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
          reference_number: payment.reference_number || null,
          payment_notes: payment.payment_notes || null,
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
