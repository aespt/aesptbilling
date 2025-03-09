import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { SalesmenTable } from '@/lib/models/salesmen';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid salesman ID' },
        { status: 400 }
      );
    }
    
    // Delete the salesman from the database
    const deletedSalesman = await db.delete(SalesmenTable)
      .where(eq(SalesmenTable.id, id))
      .returning();
    
    if (deletedSalesman.length === 0) {
      return NextResponse.json(
        { error: 'Salesman not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: 'Salesman deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting salesman:', error);
    return NextResponse.json(
      { error: 'Failed to delete salesman' },
      { status: 500 }
    );
  }
} 