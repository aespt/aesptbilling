import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { PaymentDetailsTable } from '@/lib/models/payment_details';
import { CreatePaymentDetailsSchema } from '@/lib/schemas/paymentDetailsSchema';

// Get all payments or filter by invoice_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoice_id');

    let payments;

    if (invoiceId) {
      payments = await db
        .select()
        .from(PaymentDetailsTable)
        .where(eq(PaymentDetailsTable.invoice_id, parseInt(invoiceId)));
    } else {
      payments = await db.select().from(PaymentDetailsTable);
    }

    return NextResponse.json({ data: payments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    return NextResponse.json({ error: 'Failed to fetch payment details' }, { status: 500 });
  }
}

// Create a new payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate payment data
    const validatedData = CreatePaymentDetailsSchema.parse(body);

    // Insert payment into database
    const newPayment = await db.insert(PaymentDetailsTable).values(validatedData).returning();

    return NextResponse.json({ data: newPayment[0] }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating payment details:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create payment details';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

// Update route will be handled by dynamic route
