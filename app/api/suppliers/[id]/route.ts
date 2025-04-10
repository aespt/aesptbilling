import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/drizzle';
import { SuppliersTable } from '@/lib/models/suppliers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supplierId = parseInt((await params).id, 10);

    const supplier = await db
      .select()
      .from(SuppliersTable)
      .where(eq(SuppliersTable.id, supplierId))
      .limit(1);

    if (supplier.length === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json({ supplier: supplier[0] }, { status: 200 });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supplierId = parseInt((await params).id, 10);

    const deletedSupplier = await db
      .delete(SuppliersTable)
      .where(eq(SuppliersTable.id, supplierId))
      .returning();

    if (deletedSupplier.length === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Supplier deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supplierId = parseInt((await params).id, 10);
    const body = await request.json();

    const updatedSupplier = await db
      .update(SuppliersTable)
      .set({
        tax_registration_number: body.tax_registration_number,
        name: body.name,
        address: body.address || null,
        contact_number: body.contact_number,
        updated_at: new Date(),
      })
      .where(eq(SuppliersTable.id, supplierId))
      .returning();

    if (updatedSupplier.length === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json({ supplier: updatedSupplier[0] }, { status: 200 });
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}
