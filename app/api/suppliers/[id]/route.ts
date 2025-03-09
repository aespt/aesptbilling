import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { SuppliersTable } from '@/lib/models/suppliers';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid supplier ID' },
        { status: 400 }
      );
    }
    
    // Delete the supplier from the database
    const deletedSupplier = await db.delete(SuppliersTable)
      .where(eq(SuppliersTable.id, id))
      .returning();
    
    if (deletedSupplier.length === 0) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: 'Supplier deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    );
  }
} 