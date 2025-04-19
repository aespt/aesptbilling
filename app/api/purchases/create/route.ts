import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { db } from '@/lib/drizzle';
import { PurchaseItemsTable } from '@/lib/models/purchase_items';
import { PurchasesTable } from '@/lib/models/purchases';
import { type TokenPayload } from '@/lib/schemas/authSchema';
import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/utils/jwt';

interface PurchaseItemInput {
  product_id: number;
  qty: number;
  rate: number;
  total: number;
}

export async function POST(request: NextRequest) {
  try {
    // Get the auth token from cookies
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify token
    const payload = verifyToken<TokenPayload>(token);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const body = await request.json();

    // Start transaction
    const result = await db.transaction(async tx => {
      // Create the purchase first
      const [newPurchase] = await tx
        .insert(PurchasesTable)
        .values({
          purchase_number: body.purchase_number,
          purchase_date: new Date(body.date),
          supplier_id: body.supplier_id,
          tax_type: body.tax_type,
          tax_rate: String(body.tax_rate),
          discount_rate: String(body.discount_rate),
          sub_total: String(body.subtotal),
          total: String(body.total),
          discount: body.discount,
          ship_from: body.ship_from,
          purchase_type: body.type,
          created_by: payload.userId,
          updated_by: payload.userId,
        })
        .returning();

      if (!newPurchase) {
        throw new Error('Failed to create purchase');
      }

      // Process purchase items
      if (body.items && Array.isArray(body.items) && body.items.length > 0) {
        // Filter out items without product_id
        const validItems = body.items.filter((item: PurchaseItemInput) => item.product_id);

        if (validItems.length === 0) {
          throw new Error('No valid items provided');
        }

        // Prepare purchase items
        const purchaseItems = validItems.map((item: PurchaseItemInput) => ({
          purchase_id: newPurchase.id,
          product_id: item.product_id,
          quantity: item.qty,
          rate: String(item.rate),
          total_price: String(item.total),
          created_by: payload.userId,
          updated_by: payload.userId,
        }));

        // Insert all purchase items
        await tx.insert(PurchaseItemsTable).values(purchaseItems);
      } else {
        throw new Error('At least one purchase item is required');
      }

      return newPurchase;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Purchase created successfully',
        data: result,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating purchase:', error);

    // Handle validation errors specifically
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create purchase',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
} 