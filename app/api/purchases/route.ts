import { sql, eq, and, gte, lt } from 'drizzle-orm';
import { type InferInsertModel } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { db } from '@/lib/drizzle';
import { PurchaseItemsTable } from '@/lib/models/purchase_items';
import { PurchasesTable } from '@/lib/models/purchases';
import { SuppliersTable } from '@/lib/models/suppliers';
import { type TokenPayload } from '@/lib/schemas/authSchema';
import { CreatePurchaseItemSchema } from '@/lib/schemas/purchaseItemSchema';
import { CreatePurchaseSchema } from '@/lib/schemas/purchaseSchema';
import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/utils/jwt';

type PurchaseInsert = InferInsertModel<typeof PurchasesTable>;
type PurchaseItemInsert = InferInsertModel<typeof PurchaseItemsTable>;
/**
 * GET /api/purchases
 * Retrieves a list of purchases with optional filtering
 */
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplier_id');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('limit') || '10');
    const sortField = searchParams.get('sortField') || 'purchase_date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const purchaseNumber = searchParams.get('purchaseNumber');
    const supplier = searchParams.get('supplier');
    const purchaseType = searchParams.get('purchaseType');

    // Calculate offset based on page and pageSize
    const offset = (page - 1) * pageSize;

    // Build conditions array
    const conditions = [];

    // Add supplier filter if provided
    if (supplierId) {
      conditions.push(eq(PurchasesTable.supplier_id, parseInt(supplierId)));
    }

    // Add date range filter if provided
    if (dateFrom) {
      conditions.push(gte(PurchasesTable.purchase_date, new Date(dateFrom)));
    }

    if (dateTo) {
      // Add one day to include the end date fully
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lt(PurchasesTable.purchase_date, endDate));
    }

    // Add purchase number filter if provided
    if (purchaseNumber) {
      conditions.push(sql`${PurchasesTable.purchase_number} ILIKE ${`%${purchaseNumber}%`}`);
    }

    // Add purchase type filter if provided
    if (purchaseType && ['TAX', 'DELIVERY', 'PROFORMA', 'QUOTATION'].includes(purchaseType)) {
      conditions.push(sql`${PurchasesTable.purchase_type} = ${purchaseType}`);
    }

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(PurchasesTable)
      .where(conditions.length ? and(...conditions) : undefined);

    // Build sort order
    const sortDirection = sortOrder === 'asc' ? sql`asc` : sql`desc`;
    const orderByClause = sql`${PurchasesTable[sortField as keyof typeof PurchasesTable]} ${sortDirection}`;

    // Execute query with all conditions
    const purchases = await db
      .select({
        id: PurchasesTable.id,
        purchase_number: PurchasesTable.purchase_number,
        purchase_date: PurchasesTable.purchase_date,
        supplier_id: PurchasesTable.supplier_id,
        tax_type: PurchasesTable.tax_type,
        tax_rate: PurchasesTable.tax_rate,
        sub_total: PurchasesTable.sub_total,
        total: PurchasesTable.total,
        created_at: PurchasesTable.created_at,
        ship_from: PurchasesTable.ship_from,
        purchase_type: PurchasesTable.purchase_type,
      })
      .from(PurchasesTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset(offset);

    // Get supplier information for each purchase
    const purchasesWithDetails = await Promise.all(
      purchases.map(async purchase => {
        try {
          // Fetch supplier information
          const [supplierResult] = await db
            .select({
              id: SuppliersTable.id,
              name: SuppliersTable.name,
              address: SuppliersTable.address,
            })
            .from(SuppliersTable)
            .where(eq(SuppliersTable.id, purchase.supplier_id));

          // Return purchase with supplier data
          return {
            ...purchase,
            supplier: supplierResult || { id: 0, name: 'Unknown', address: '' },
          };
        } catch (error) {
          console.error(`Error fetching details for purchase ${purchase.id}:`, error);
          // Return purchase with placeholder data
          return {
            ...purchase,
            supplier: { id: 0, name: 'Unknown', address: '' },
          };
        }
      })
    );

    // Apply supplier name filter if provided - we need to do this post-query since it's a join field
    let results = purchasesWithDetails;
    if (supplier) {
      results = purchasesWithDetails.filter(purchase =>
        purchase.supplier.name.toLowerCase().includes(supplier.toLowerCase())
      );
    }

    return NextResponse.json({
      purchases: results,
      pagination: {
        total: Number(count),
        page,
        pageSize,
        totalPages: Math.ceil(Number(count) / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);

    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}

/**
 * POST /api/purchases
 * Creates a new purchase with its associated items
 */
export async function POST(request: NextRequest) {
  try {
    // Get the auth token from cookies
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify token and get user info
    const payload = verifyToken<TokenPayload>(token);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Validate purchase data
    const { items, ...purchaseData } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one purchase item is required' },
        { status: 400 }
      );
    }

    // Validate purchase using Zod schema
    const validatedPurchase = CreatePurchaseSchema.parse({
      ...purchaseData,
      created_by: payload.username,
      updated_by: payload.username,
    });

    // Start a transaction
    return await db.transaction(async tx => {
      // Insert the purchase
      const [newPurchase] = await tx
        .insert(PurchasesTable)
        .values({
          purchase_number: validatedPurchase.purchase_number,
          purchase_date: validatedPurchase.purchase_date
            ? new Date(validatedPurchase.purchase_date)
            : new Date(),
          user_id: validatedPurchase.user_id,
          supplier_id: validatedPurchase.supplier_id,
          tax_type: validatedPurchase.tax_type,
          tax_rate: validatedPurchase.tax_rate.toString(),
          discount_rate: validatedPurchase.discount_rate.toString(),
          sub_total: validatedPurchase.sub_total.toString(),
          total: validatedPurchase.total.toString(),
          created_by: parseInt(validatedPurchase.created_by || '0'),
          updated_by: parseInt(validatedPurchase.updated_by || '0'),
          created_at: new Date(),
          updated_at: new Date(),
        } as PurchaseInsert)
        .returning();

      if (!newPurchase) {
        throw new Error('Failed to create purchase record');
      }

      // Process and insert purchase items
      for (const item of items) {
        // Validate purchase item using Zod schema
        const validatedItem = CreatePurchaseItemSchema.parse({
          ...item,
          purchase_id: newPurchase.id,
          created_by: payload.username,
          updated_by: payload.username,
        });

        // Insert purchase item
        await tx.insert(PurchaseItemsTable).values({
          purchase_id: newPurchase.id,
          product_id: validatedItem.product_id,
          quantity: validatedItem.quantity,
          rate: validatedItem.rate.toString(),
          total_price: validatedItem.total_price.toString(),
          created_by: parseInt(validatedItem.created_by || '0'),
          updated_by: parseInt(validatedItem.updated_by || '0'),
          created_at: new Date(),
          updated_at: new Date(),
        } as PurchaseItemInsert);
      }

      return NextResponse.json(
        {
          message: 'Purchase created successfully',
          purchase: newPurchase,
        },
        { status: 201 }
      );
    });
  } catch (error) {
    console.error('Error creating purchase:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.format() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create purchase', message: (error as Error).message },
      { status: 500 }
    );
  }
}
