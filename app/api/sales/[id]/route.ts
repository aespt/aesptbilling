import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { SalesTable } from '@/lib/models/sales';
import { CustomersTable } from '@/lib/models/customers';
import { ProductsTable } from '@/lib/models/products';
import { SalesmenTable } from '@/lib/models/salesmen';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    // Fetch sale with joined data from related tables
    const salesData = await db
      .select({
        id: SalesTable.id,
        date: SalesTable.date,
        customer_id: SalesTable.customer_id,
        customer_name: CustomersTable.name,
        product_id: SalesTable.product_id,
        product_name: ProductsTable.name,
        qty: SalesTable.qty,
        mrp: SalesTable.mrp,
        discount_type: SalesTable.discount_type,
        discount_value: SalesTable.discount_value,
        salesman_id: SalesTable.salesman_id,
        salesman_name: SalesmenTable.name,
        ship_to: SalesTable.ship_to,
        invoice_id: SalesTable.invoice_id,
        created_at: SalesTable.created_at,
        updated_at: SalesTable.updated_at,
      })
      .from(SalesTable)
      .leftJoin(CustomersTable, eq(SalesTable.customer_id, CustomersTable.id))
      .leftJoin(ProductsTable, eq(SalesTable.product_id, ProductsTable.id))
      .leftJoin(SalesmenTable, eq(SalesTable.salesman_id, SalesmenTable.id))
      .where(eq(SalesTable.id, id));

    if (salesData.length === 0) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ sale: salesData[0] }, { status: 200 });
  } catch (error) {
    console.error('Error fetching sale data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sale data' },
      { status: 500 }
    );
  }
} 