/* eslint-disable import/order */
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/drizzle';
import { PurchaseItemsTable } from '@/lib/models/purchase_items';
import { PurchasesTable } from '@/lib/models/purchases';
import { ProductsTable } from '@/lib/models/products';
import { SuppliersTable } from '@/lib/models/suppliers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const purchaseId = parseInt((await params).id);

    if (isNaN(purchaseId)) {
      return NextResponse.json({ error: 'Invalid purchase ID' }, { status: 400 });
    }

    // Get the purchase
    const purchases = await db
      .select()
      .from(PurchasesTable)
      .where(eq(PurchasesTable.id, purchaseId));

    if (!purchases || purchases.length === 0) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    const purchase = purchases[0];

    // Get supplier info
    const suppliers = await db
      .select()
      .from(SuppliersTable)
      .where(eq(SuppliersTable.id, purchase.supplier_id));

    const supplier = suppliers.length > 0 ? suppliers[0] : null;

    // Get purchase items
    const purchaseItems = await db
      .select()
      .from(PurchaseItemsTable)
      .where(eq(PurchaseItemsTable.purchase_id, purchaseId));

    // Get products for each item
    const itemsWithProducts = [];
    for (const item of purchaseItems) {
      const products = await db
        .select()
        .from(ProductsTable)
        .where(eq(ProductsTable.id, item.product_id));

      itemsWithProducts.push({
        ...item,
        product: products.length > 0 ? products[0] : null,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...purchase,
        supplier,
        items: itemsWithProducts,
      },
    });
  } catch (error) {
    console.error('Error fetching purchase:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch purchase',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
