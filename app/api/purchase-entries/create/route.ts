import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { db } from '@/lib/drizzle';
import { PurchaseEntriesTable } from '@/lib/models/purchase_entries';
import { PurchaseEntryItemsTable } from '@/lib/models/purchase_entry_items';
import { type TokenPayload } from '@/lib/schemas/authSchema';
import { CreatePurchaseEntryItemSchema } from '@/lib/schemas/purchaseEntryItemSchema';
import { CreatePurchaseEntrySchema } from '@/lib/schemas/purchaseEntrySchema';
import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/utils/jwt';

interface PurchaseEntryItemInput {
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

    // Validate the request body against our schema
    try {
      // Basic validation of primary fields - we're doing partial validation
      // since form fields don't exactly match schema fields
      CreatePurchaseEntrySchema.partial().parse({
        purchaseentry_number: body.purchaseentry_number,
        supplier_id: body.supplier_id,
        ship_from: body.ship_from,
      });

      // Validate at least one item exists if items array is provided
      if (body.items && body.items.length > 0) {
        for (const item of body.items) {
          if (item.product_id) {
            CreatePurchaseEntryItemSchema.partial().parse({
              product_id: item.product_id,
              quantity: item.qty,
              rate: item.rate,
              total_price: item.total,
            });
          }
        }
      }
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Validation error',
            details: validationError.errors,
          },
          { status: 400 }
        );
      }
    }

    // Start transaction
    const result = await db.transaction(async tx => {
      // Create the purchase entry first
      const [newPurchaseEntry] = await tx
        .insert(PurchaseEntriesTable)
        .values({
          purchaseentry_number: body.purchaseentry_number,
          purchaseentry_date: new Date(body.purchaseentry_date || body.date),
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

      if (!newPurchaseEntry) {
        throw new Error('Failed to create purchase entry');
      }

      // Process purchase entry items
      if (body.items && Array.isArray(body.items) && body.items.length > 0) {
        // Filter out items without product_id
        const validItems = body.items.filter((item: PurchaseEntryItemInput) => item.product_id);

        if (validItems.length === 0) {
          throw new Error('No valid items provided');
        }

        // Prepare purchase entry items
        const purchaseEntryItems = validItems.map((item: PurchaseEntryItemInput) => ({
          purchase_entry_id: newPurchaseEntry.id,
          product_id: item.product_id,
          quantity: item.qty,
          rate: String(item.rate),
          total_price: String(item.total),
          created_by: payload.userId,
          updated_by: payload.userId,
        }));

        // Insert all purchase entry items
        await tx.insert(PurchaseEntryItemsTable).values(purchaseEntryItems);
      } else {
        throw new Error('At least one purchase entry item is required');
      }

      return newPurchaseEntry;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Purchase entry created successfully',
        data: result,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating purchase entry:', error);

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
        error: 'Failed to create purchase entry',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
