import { sql, eq, and, gte, lt, like, or } from 'drizzle-orm';
import { type InferInsertModel } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { db, PaymentDetailsTable } from '@/lib/drizzle';
import { CustomersTable } from '@/lib/models/customers';
import { InvoiceItemsTable } from '@/lib/models/invoice_items';
import { InvoicesTable } from '@/lib/models/invoices';
import { SalesmenTable } from '@/lib/models/salesmen';
import { type TokenPayload } from '@/lib/schemas/authSchema';
import { CreateInvoiceItemSchema } from '@/lib/schemas/invoiceItemSchema';
import { CreateInvoiceSchema } from '@/lib/schemas/invoiceSchema';
import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/utils/jwt';

type InvoiceInsert = InferInsertModel<typeof InvoicesTable>;
type InvoiceItemInsert = InferInsertModel<typeof InvoiceItemsTable>;

// Define interface for search results
interface InvoiceSearchResult {
  id: number;
  invoice_number: string;
  date: Date;
  customer_id: number;
  customer_name: string | null;
  total: string;
  invoice_stage: 'SALE' | 'PROFORMA' | 'QUOTATION' | null;
}

// Utility function to handle invoice search
async function searchInvoices(
  params: URLSearchParams,
  _payload: TokenPayload
): Promise<{ success: boolean; data: InvoiceSearchResult[] | null; error?: string }> {
  try {
    const invoiceNumber = params.get('invoice_number');
    const stage = params.get('stage');
    // Status is not used in this function currently but kept for future expansion
    // const status = params.get('status');

    // Build the select query
    const query = db
      .select({
        id: InvoicesTable.id,
        invoice_number: InvoicesTable.invoice_number,
        date: InvoicesTable.invoice_date,
        customer_id: InvoicesTable.customer_id,
        customer_name: CustomersTable.name,
        total: InvoicesTable.total,
        invoice_stage: InvoicesTable.invoice_stage,
      })
      .from(InvoicesTable)
      .leftJoin(CustomersTable, eq(InvoicesTable.customer_id, CustomersTable.id));

    // Create conditions array
    const conditions = [];

    // Add invoice number search if provided
    if (invoiceNumber) {
      conditions.push(
        or(
          like(InvoicesTable.invoice_number, `%${invoiceNumber}%`),
          eq(InvoicesTable.invoice_number, invoiceNumber)
        )
      );
    }

    // Add invoice stage filter if provided
    if (stage && ['SALE', 'PROFORMA', 'QUOTATION'].includes(stage)) {
      // Cast stage to the correct type based on invoiceStageEnum
      conditions.push(eq(InvoicesTable.invoice_stage, stage as 'SALE' | 'PROFORMA' | 'QUOTATION'));
    }

    // Apply conditions if any
    const results = conditions.length
      ? await query.where(and(...conditions)).limit(20)
      : await query.limit(20);

    return { success: true, data: results };
  } catch (error) {
    console.error('Error searching invoices:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to search invoices',
    };
  }
}

/**
 * GET /api/invoices
 * Retrieves a list of invoices with optional filtering
 * Also handles search functionality if invoice_number, stage or status params are provided
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

    // Check if this is a search request
    const isSearchRequest =
      searchParams.has('invoice_number') || searchParams.has('stage') || searchParams.has('status');

    if (isSearchRequest) {
      const searchResult = await searchInvoices(searchParams, payload);
      if (searchResult.success) {
        return NextResponse.json({
          success: true,
          data: searchResult.data,
        });
      } else {
        return NextResponse.json(
          {
            error: searchResult.error || 'Failed to search invoices',
          },
          { status: 500 }
        );
      }
    }

    // Continue with regular listing functionality
    const customerId = searchParams.get('customer_id');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('limit') || '10');
    const sortField = searchParams.get('sortField') || 'invoice_date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const invoiceNumber = searchParams.get('invoiceNumber');
    const salesPerson = searchParams.get('salesPerson');
    const customer = searchParams.get('customer');
    const invoiceStage =
      searchParams.get('invoiceStage') ||
      searchParams.get('invoicestage') ||
      searchParams.get('InvoiceStage') ||
      searchParams.get('INVOICESTAGE');
    const invoiceStageFilter =
      searchParams.get('invoiceStageFilter') ||
      searchParams.get('invoicestagefilter') ||
      searchParams.get('InvoiceStageFilter');

    // Calculate offset based on page and pageSize
    const offset = (page - 1) * pageSize;

    // Build conditions array
    const conditions = [];

    // Add customer filter if provided
    if (customerId) {
      conditions.push(eq(InvoicesTable.customer_id, parseInt(customerId)));
    }

    // Add date range filter if provided
    if (dateFrom) {
      conditions.push(gte(InvoicesTable.invoice_date, new Date(dateFrom)));
    }

    if (dateTo) {
      // Add one day to include the end date fully
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lt(InvoicesTable.invoice_date, endDate));
    }

    // Add invoice number filter if provided
    if (invoiceNumber) {
      conditions.push(sql`${InvoicesTable.invoice_number} ILIKE ${`%${invoiceNumber}%`}`);
    }

    // Add sales person filter if provided
    if (salesPerson) {
      try {
        const salesmanId = parseInt(salesPerson);
        if (!isNaN(salesmanId)) {
          // If it's a valid number, use equality comparison
          conditions.push(eq(InvoicesTable.salesman_id, salesmanId));
        } else {
          // If it's a string (name), we'll handle it later in post-processing like customer filter
        }
      } catch (e) {
        // If parsing fails, ignore this filter
        console.error('Error parsing salesperson ID:', e);
      }
    }

    // Add invoice stage filter - single value (takes precedence over multi-value filter)
    if (invoiceStage && ['SALE', 'PROFORMA', 'QUOTATION'].includes(invoiceStage)) {
      conditions.push(sql`${InvoicesTable.invoice_stage} = ${invoiceStage}`);
    }
    // Add invoice stage filter - multiple values
    else if (invoiceStageFilter) {
      const stages = invoiceStageFilter.split(',');
      // Filter out any invalid stages
      const validStages = stages.filter(s => ['SALE', 'PROFORMA', 'QUOTATION'].includes(s));
      if (validStages.length > 0) {
        if (validStages.length === 1) {
          // Single stage case
          conditions.push(sql`${InvoicesTable.invoice_stage} = ${validStages[0]}`);
        } else {
          // Multiple stages case - use OR condition
          conditions.push(
            sql`${InvoicesTable.invoice_stage} IN (${sql.join(validStages, sql`, `)})`
          );
        }
      }
    }

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(InvoicesTable)
      .where(conditions.length ? and(...conditions) : undefined);

    // Build sort order
    const sortDirection = sortOrder === 'asc' ? sql`asc` : sql`desc`;
    const orderByClause = sql`${InvoicesTable[sortField as keyof typeof InvoicesTable]} ${sortDirection}`;

    // Execute query with all conditions
    const invoices = await db
      .select({
        id: InvoicesTable.id,
        invoice_number: InvoicesTable.invoice_number,
        invoice_date: InvoicesTable.invoice_date,
        salesman_id: InvoicesTable.salesman_id,
        customer_id: InvoicesTable.customer_id,
        discount: InvoicesTable.discount,
        tax_type: InvoicesTable.tax_type,
        tax_rate: InvoicesTable.tax_rate,
        sub_total: InvoicesTable.sub_total,
        total: InvoicesTable.total,
        created_at: InvoicesTable.created_at,
        ship_from: InvoicesTable.ship_from,
        ship_to: InvoicesTable.ship_to,
        invoice_stage: InvoicesTable.invoice_stage,
        parent_invoice_id: InvoicesTable.parent_invoice_id,
      })
      .from(InvoicesTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset(offset);

    // Get customer and salesman information for each invoice
    const invoicesWithDetails = await Promise.all(
      invoices.map(async invoice => {
        try {
          // Fetch customer information
          const [customerResult] = await db
            .select({
              id: CustomersTable.id,
              name: CustomersTable.name,
              address: CustomersTable.address,
            })
            .from(CustomersTable)
            .where(eq(CustomersTable.id, invoice.customer_id));

          // Declare parentInvoice variable at this scope level
          let parentInvoice = null;

          if (invoice.parent_invoice_id) {
            const [parentInvoiceResult] = await db
              .select()
              .from(InvoicesTable)
              .where(eq(InvoicesTable.id, invoice.parent_invoice_id));

            parentInvoice = parentInvoiceResult;
          }

          // Fetch salesman information
          const [salesmanResult] = invoice.salesman_id
            ? await db
                .select({
                  id: SalesmenTable.id,
                  name: SalesmenTable.name,
                  contact_number: SalesmenTable.contact_number,
                })
                .from(SalesmenTable)
                .where(eq(SalesmenTable.id, invoice.salesman_id))
            : [null];

          const [paymentResult] = await db
            .select({
              id: PaymentDetailsTable.id,
              payment_method: PaymentDetailsTable.payment_method,
            })
            .from(PaymentDetailsTable)
            .where(eq(PaymentDetailsTable.invoice_id, invoice.id));

          // Return invoice with customer and salesman data
          return {
            ...invoice,
            customer: customerResult || { id: 0, name: 'Unknown', address: '' },
            salesman: salesmanResult || { id: 0, name: 'Unknown', contact_number: '' },
            payment: paymentResult || null,
            parent_invoice: parentInvoice,
          };
        } catch (error) {
          console.error(`Error fetching details for invoice ${invoice.id}:`, error);
          // Return invoice with placeholder data
          return {
            ...invoice,
            customer: { id: 0, name: 'Unknown', address: '' },
            salesman: { id: 0, name: 'Unknown', contact_number: '' },
          };
        }
      })
    );

    // Apply customer name filter if provided - we need to do this post-query since it's a join field
    let results = invoicesWithDetails;
    if (customer) {
      results = invoicesWithDetails.filter(invoice =>
        invoice.customer.name.toLowerCase().includes(customer.toLowerCase())
      );
    }

    // Apply salesperson name filter if provided and it's a string (not an ID)
    if (salesPerson && isNaN(parseInt(salesPerson))) {
      results = results.filter(
        invoice =>
          invoice.salesman &&
          invoice.salesman.name &&
          invoice.salesman.name.toLowerCase().includes(salesPerson.toLowerCase())
      );
    }

    return NextResponse.json({
      invoices: results,
      pagination: {
        total: Number(count),
        page,
        pageSize,
        totalPages: Math.ceil(Number(count) / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);

    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

/**
 * POST /api/invoices
 * Creates a new invoice with its associated items
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

    // Validate invoice data
    const { items, ...invoiceData } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one invoice item is required' }, { status: 400 });
    }

    // Validate invoice using Zod schema
    const validatedInvoice = CreateInvoiceSchema.parse({
      ...invoiceData,
      created_by: payload.username,
      updated_by: payload.username,
    });

    // Start a transaction
    return await db.transaction(async tx => {
      // Insert the invoice
      const [newInvoice] = await tx
        .insert(InvoicesTable)
        .values({
          invoice_number: validatedInvoice.invoice_number,
          invoice_date: validatedInvoice.invoice_date
            ? new Date(validatedInvoice.invoice_date)
            : new Date(),
          user_id: validatedInvoice.user_id,
          customer_id: validatedInvoice.customer_id,
          salesman_id: validatedInvoice.salesmen_id,
          tax_type: validatedInvoice.tax_type,
          tax_rate: validatedInvoice.tax_rate.toString(),
          sub_total: validatedInvoice.sub_total.toString(),
          total: validatedInvoice.total.toString(),
          created_by: parseInt(validatedInvoice.created_by || '0'),
          updated_by: parseInt(validatedInvoice.updated_by || '0'),
          created_at: new Date(),
          updated_at: new Date(),
        } as InvoiceInsert)
        .returning();

      // Validate and insert each invoice item
      const invoiceItems = [];

      for (const item of items) {
        const validatedItem = CreateInvoiceItemSchema.parse({
          ...item,
          invoice_id: newInvoice.id,
          created_by: payload.username,
          updated_by: payload.username,
        });

        const [newItem] = await tx
          .insert(InvoiceItemsTable)
          .values({
            invoice_id: newInvoice.id,
            product_id: validatedItem.product_id,
            quantity: validatedItem.quantity,
            unit_price: validatedItem.unit_price.toString(),
            total_price: validatedItem.total_price.toString(),
            created_by: parseInt(validatedItem.created_by || '0'),
            updated_by: parseInt(validatedItem.updated_by || '0'),
            created_at: new Date(),
            updated_at: new Date(),
          } as InvoiceItemInsert)
          .returning();

        invoiceItems.push(newItem);
      }

      return NextResponse.json(
        {
          message: 'Invoice created successfully',
          invoice: newInvoice,
          items: invoiceItems,
        },
        { status: 201 }
      );
    });
  } catch (error) {
    console.error('Error creating invoice:', error);

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    // Handle unique constraint violations
    if (
      error instanceof Error &&
      error.message.includes('duplicate key value violates unique constraint')
    ) {
      return NextResponse.json(
        { error: 'An invoice with this invoice number already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
