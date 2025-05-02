import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/drizzle';
import { SalesmenTable } from '@/lib/models/salesmen';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const salesmanId = parseInt((await params).id, 10);

    const salesman = await db
      .select()
      .from(SalesmenTable)
      .where(eq(SalesmenTable.id, salesmanId))
      .limit(1);

    if (salesman.length === 0) {
      return NextResponse.json({ error: 'Salesman not found' }, { status: 404 });
    }

    return NextResponse.json({ salesman: salesman[0] }, { status: 200 });
  } catch (error) {
    console.error('Error fetching salesman:', error);
    return NextResponse.json({ error: 'Failed to fetch salesman' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const salesmanId = parseInt((await params).id, 10);

    const deletedSalesman = await db
      .delete(SalesmenTable)
      .where(eq(SalesmenTable.id, salesmanId))
      .returning();

    if (deletedSalesman.length === 0) {
      return NextResponse.json({ error: 'Salesman not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Salesman deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting salesman:', error);
    return NextResponse.json({ error: 'Failed to delete salesman' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const salesmanId = parseInt((await params).id, 10);
    const body = await request.json();

    const updatedSalesman = await db
      .update(SalesmenTable)
      .set({
        name: body.name,
        contact_number: body.contact_number,
        email: body.email,
        updated_at: new Date(),
      })
      .where(eq(SalesmenTable.id, salesmanId))
      .returning();

    if (updatedSalesman.length === 0) {
      return NextResponse.json({ error: 'Salesman not found' }, { status: 404 });
    }

    return NextResponse.json({ salesman: updatedSalesman[0] }, { status: 200 });
  } catch (error) {
    console.error('Error updating salesman:', error);
    return NextResponse.json({ error: 'Failed to update salesman' }, { status: 500 });
  }
}
