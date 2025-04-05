import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/drizzle';
import { CustomersTable } from '@/lib/models/customers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const customerId = parseInt((await params).id, 10);

    const customer = await db
      .select()
      .from(CustomersTable)
      .where(eq(CustomersTable.id, customerId))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ customer: customer[0] }, { status: 200 });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const customerId = parseInt((await params).id, 10);

    const deletedCustomer = await db
      .delete(CustomersTable)
      .where(eq(CustomersTable.id, customerId))
      .returning();

    if (deletedCustomer.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Customer deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const customerId = parseInt((await params).id, 10);
    const body = await request.json();

    const updatedCustomer = await db
      .update(CustomersTable)
      .set({
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        address: body.address || null,
      })
      .where(eq(CustomersTable.id, customerId))
      .returning();

    if (updatedCustomer.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ customer: updatedCustomer[0] }, { status: 200 });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}
