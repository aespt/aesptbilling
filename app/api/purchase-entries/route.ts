import { sql, eq, and, gte, lt } from 'drizzle-orm';
import { type InferInsertModel } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { db } from '@/lib/drizzle';
import { PurchaseEntriesTable } from '@/lib/models/purchase_entries';
import { PurchaseEntryItemsTable } from '@/lib/models/purchase_entry_items';
import { SuppliersTable } from '@/lib/models/suppliers';
import { type TokenPayload } from '@/lib/schemas/authSchema';
import { insertPurchaseEntrySchema } from '@/lib/schemas/purchase_entries.schema';
import { insertPurchaseEntryItemSchema } from '@/lib/schemas/purchase_entry_items.schema';
import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/utils/jwt';

type PurchaseEntryInsert = InferInsertModel<typeof PurchaseEntriesTable>;
type PurchaseEntryItemInsert = InferInsertModel<typeof PurchaseEntryItemsTable>;

/**
 * GET /api/purchase-entries
 * Retrieves a list of purchase entries with optional filtering
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
    const sortField = searchParams.get('sortField') || 'purchaseentry_date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const purchaseEntryNumber = searchParams.get('purchaseEntryNumber');
    const supplier = searchParams.get('supplier');
    const purchaseType = searchParams.get('purchaseType');

    // Calculate offset based on page and pageSize
    const offset = (page - 1) * pageSize;

    // Build conditions array
    const conditions = [];

    // Add supplier filter if provided
    if (supplierId) {
      conditions.push(eq(PurchaseEntriesTable.supplier_id, parseInt(supplierId)));
    }

    // Add date range filter if provided
    if (dateFrom) {
      conditions.push(gte(PurchaseEntriesTable.purchaseentry_date, new Date(dateFrom)));
    }

    if (dateTo) {
      // Add one day to include the end date fully
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lt(PurchaseEntriesTable.purchaseentry_date, endDate));
    }

    // Add purchase entry number filter if provided
    if (purchaseEntryNumber) {
      conditions.push(
        sql`${PurchaseEntriesTable.purchaseentry_number} ILIKE ${`%${purchaseEntryNumber}%`}`
      );
    }

    // Add purchase type filter if provided
    if (purchaseType && ['TAX', 'DELIVERY', 'PROFORMA', 'QUOTATION'].includes(purchaseType)) {
      conditions.push(sql`${PurchaseEntriesTable.purchase_type} = ${purchaseType}`);
    }

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(PurchaseEntriesTable)
      .where(conditions.length ? and(...conditions) : undefined);

    // Build sort order
    const sortDirection = sortOrder === 'asc' ? sql`asc` : sql`desc`;
    const orderByClause = sql`${PurchaseEntriesTable[sortField as keyof typeof PurchaseEntriesTable]} ${sortDirection}`;

    // Execute query with all conditions
    const purchaseEntries = await db
      .select({
        id: PurchaseEntriesTable.id,
        purchaseentry_number: PurchaseEntriesTable.purchaseentry_number,
        purchaseentry_date: PurchaseEntriesTable.purchaseentry_date,
        supplier_id: PurchaseEntriesTable.supplier_id,
        tax_type: PurchaseEntriesTable.tax_type,
        tax_rate: PurchaseEntriesTable.tax_rate,
        sub_total: PurchaseEntriesTable.sub_total,
        discount: PurchaseEntriesTable.discount,
        total: PurchaseEntriesTable.total,
        tax_amount:
          sql<string>`(${PurchaseEntriesTable.total})::numeric - (${PurchaseEntriesTable.sub_total})::numeric + (${PurchaseEntriesTable.discount})::numeric`.as(
            'tax_amount'
          ),
        created_at: PurchaseEntriesTable.created_at,
        ship_from: PurchaseEntriesTable.ship_from,
        purchase_type: PurchaseEntriesTable.purchase_type,
      })
      .from(PurchaseEntriesTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset(offset);

    // Get supplier information for each purchase entry
    const purchaseEntriesWithDetails = await Promise.all(
      purchaseEntries.map(async purchaseEntry => {
        try {
          // Fetch supplier information
          const [supplierResult] = await db
            .select({
              id: SuppliersTable.id,
              name: SuppliersTable.name,
              address: SuppliersTable.address,
            })
            .from(SuppliersTable)
            .where(eq(SuppliersTable.id, purchaseEntry.supplier_id));

          // Return purchase entry with supplier data
          return {
            ...purchaseEntry,
            supplier: supplierResult || { id: 0, name: 'Unknown', address: '' },
          };
        } catch (error) {
          console.error(`Error fetching details for purchase entry ${purchaseEntry.id}:`, error);
          // Return purchase entry with placeholder data
          return {
            ...purchaseEntry,
            supplier: { id: 0, name: 'Unknown', address: '' },
          };
        }
      })
    );

    // Apply supplier name filter if provided - we need to do this post-query since it's a join field
    let results = purchaseEntriesWithDetails;
    if (supplier) {
      results = purchaseEntriesWithDetails.filter(purchaseEntry =>
        purchaseEntry.supplier.name.toLowerCase().includes(supplier.toLowerCase())
      );
    }

    return NextResponse.json({
      purchaseEntries: results,
      pagination: {
        total: Number(count),
        page,
        pageSize,
        totalPages: Math.ceil(Number(count) / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching purchase entries:', error);

    return NextResponse.json({ error: 'Failed to fetch purchase entries' }, { status: 500 });
  }
}

/**
 * POST /api/purchase-entries
 * Creates a new purchase entry with its associated items
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

    // Validate purchase entry data
    const { items, ...purchaseEntryData } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one purchase entry item is required' },
        { status: 400 }
      );
    }

    // Validate purchase entry using Zod schema
    const validatedPurchaseEntry = insertPurchaseEntrySchema.parse({
      ...purchaseEntryData,
      created_by: payload.userId,
      updated_by: payload.userId,
    });

    // Start a transaction
    return await db.transaction(async tx => {
      // Insert the purchase entry
      const [newPurchaseEntry] = await tx
        .insert(PurchaseEntriesTable)
        .values({
          purchaseentry_number: validatedPurchaseEntry.purchaseentry_number,
          purchaseentry_date: validatedPurchaseEntry.purchaseentry_date
            ? new Date(validatedPurchaseEntry.purchaseentry_date)
            : new Date(),
          supplier_id: validatedPurchaseEntry.supplier_id,
          tax_type: validatedPurchaseEntry.tax_type,
          tax_rate: validatedPurchaseEntry.tax_rate.toString(),
          discount_rate: validatedPurchaseEntry.discount_rate.toString(),
          sub_total: validatedPurchaseEntry.sub_total.toString(),
          total: validatedPurchaseEntry.total.toString(),
          created_by: validatedPurchaseEntry.created_by,
          updated_by: validatedPurchaseEntry.updated_by,
          created_at: new Date(),
          updated_at: new Date(),
          ship_from: validatedPurchaseEntry.ship_from,
          purchase_type: validatedPurchaseEntry.purchase_type,
          discount: validatedPurchaseEntry.discount?.toString() || '0',
        } as PurchaseEntryInsert)
        .returning();

      if (!newPurchaseEntry) {
        throw new Error('Failed to create purchase entry record');
      }

      // Process and insert purchase entry items
      for (const item of items) {
        // Validate purchase entry item using Zod schema
        const validatedItem = insertPurchaseEntryItemSchema.parse({
          ...item,
          purchase_entry_id: newPurchaseEntry.id,
          created_by: payload.userId,
          updated_by: payload.userId,
        });

        // Insert purchase entry item
        await tx.insert(PurchaseEntryItemsTable).values({
          purchase_entry_id: newPurchaseEntry.id,
          product_id: validatedItem.product_id,
          quantity: validatedItem.quantity,
          rate: validatedItem.rate.toString(),
          total_price: validatedItem.total_price.toString(),
          created_by: validatedItem.created_by,
          updated_by: validatedItem.updated_by,
          created_at: new Date(),
          updated_at: new Date(),
        } as PurchaseEntryItemInsert);
      }

      return NextResponse.json(
        { success: true, message: 'Purchase entry created successfully', data: newPurchaseEntry },
        { status: 201 }
      );
    });
  } catch (error) {
    console.error('Error creating purchase entry:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
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
