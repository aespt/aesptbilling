import { NextResponse } from 'next/server';

import { db } from '@/lib/drizzle';
import { ProductsTable } from '@/lib/models/products';

export async function GET() {
  try {
    // Fetch all products for dropdown
    const products = await db
      .select({
        id: ProductsTable.id,
        name: ProductsTable.name,
        partNo: ProductsTable.partNo,
        mrp: ProductsTable.mrp,
      })
      .from(ProductsTable)
      .orderBy(ProductsTable.name);

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
