import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { PaymentDetailsTable } from '@/lib/models/payment_details';
import { UpdatePaymentDetailsSchema } from '@/lib/schemas/paymentDetailsSchema';

// Get payment by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
    }

    const payment = await db
      .select()
      .from(PaymentDetailsTable)
      .where(eq(PaymentDetailsTable.id, id));

    if (!payment || payment.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ data: payment[0] }, { status: 200 });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    return NextResponse.json({ error: 'Failed to fetch payment details' }, { status: 500 });
  }
}

// Update payment by ID
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
    }

    const body = await request.json();

    // Validate update data
    const validatedData = UpdatePaymentDetailsSchema.parse(body);

    // Update payment in database
    const updatedPayment = await db
      .update(PaymentDetailsTable)
      .set({ ...validatedData, updated_at: new Date() })
      .where(eq(PaymentDetailsTable.id, id))
      .returning();

    if (!updatedPayment || updatedPayment.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updatedPayment[0] }, { status: 200 });
  } catch (error) {
    console.error('Error updating payment details:', error);
    return NextResponse.json({ error: 'Failed to update payment details' }, { status: 500 });
  }
}

// Delete payment by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
    }

    const deletedPayment = await db
      .delete(PaymentDetailsTable)
      .where(eq(PaymentDetailsTable.id, id))
      .returning();

    if (!deletedPayment || deletedPayment.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Payment deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting payment details:', error);
    return NextResponse.json({ error: 'Failed to delete payment details' }, { status: 500 });
  }
}
