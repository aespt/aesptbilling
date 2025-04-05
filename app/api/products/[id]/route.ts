import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/lib/drizzle';
import { ProductsTable } from '@/lib/models/products';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Delete the product from the database
    const deletedProduct = await db
      .delete(ProductsTable)
      .where(eq(ProductsTable.id, id))
      .returning();

    if (deletedProduct.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
