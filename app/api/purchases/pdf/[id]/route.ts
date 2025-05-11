import { format } from 'date-fns';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/drizzle';
import { AddressTable } from '@/lib/models/address';
import { ProductsTable } from '@/lib/models/products';
import { PurchaseItemsTable } from '@/lib/models/purchase_items';
import { PurchasesTable } from '@/lib/models/purchases';
import { SuppliersTable } from '@/lib/models/suppliers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const purchaseId = parseInt(id);

    if (isNaN(purchaseId)) {
      console.error('Invalid purchase ID:', id);
      return NextResponse.json({ error: 'Invalid purchase ID' }, { status: 400 });
    }

    // Get purchase data from database
    const purchases = await db
      .select()
      .from(PurchasesTable)
      .where(eq(PurchasesTable.id, purchaseId));

    if (!purchases || purchases.length === 0) {
      console.error('Purchase not found:', purchaseId);
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    const purchase = purchases[0];

    // Get supplier data
    const suppliers = await db
      .select()
      .from(SuppliersTable)
      .where(eq(SuppliersTable.id, purchase.supplier_id));

    const supplier = suppliers.length > 0 ? suppliers[0] : null;

    // Get company primary address
    const addresses = await db.select().from(AddressTable).where(eq(AddressTable.is_primary, true));
    const primaryAddress = addresses.length > 0 ? addresses[0] : null;

    // Get purchase items
    const purchaseItems = await db
      .select()
      .from(PurchaseItemsTable)
      .where(eq(PurchaseItemsTable.purchase_id, purchaseId));

    // Get products for purchase items
    const productsWithItems = [];

    // Fetch products one by one
    for (const item of purchaseItems) {
      const productRows = await db
        .select()
        .from(ProductsTable)
        .where(eq(ProductsTable.id, item.product_id));

      if (productRows.length > 0) {
        productsWithItems.push({
          item,
          product: productRows[0],
        });
      } else {
        productsWithItems.push({
          item,
          product: null,
        });
      }
    }

    // Format purchase date
    const formattedDate = format(new Date(purchase.purchase_date), 'MMMM dd, yyyy');

    // Set document title
    const documentTitle = 'Purchase Order';

    // Return all necessary data for client-side PDF generation
    return NextResponse.json({
      success: true,
      data: {
        purchase,
        supplier,
        primaryAddress,
        productsWithItems,
        formattedDate,
        documentTitle,
      },
    });
  } catch (error) {
    console.error('Error fetching purchase data:', error);

    // Provide detailed error information
    let errorMessage = 'Failed to fetch purchase data';
    let errorDetails = '';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    } else {
      errorDetails = String(error);
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        environment: process.env.NODE_ENV,
      },
      { status: 500 }
    );
  }
}
