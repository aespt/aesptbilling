import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { InvoicesTable } from '@/lib/models/invoices';
import { InvoiceItemsTable } from '@/lib/models/invoice_items';
import { CustomersTable } from '@/lib/models/customers';
import { CreateInvoiceSchema } from '@/lib/schemas/invoiceSchema';
import { CreateInvoiceItemSchema } from '@/lib/schemas/invoiceItemSchema';
import { ZodError } from 'zod';
import { verifyToken } from '@/lib/utils/jwt';
import { AUTH_COOKIE_NAME } from '@/lib/utils/jwt';
import { TokenPayload } from '@/lib/schemas/authSchema';
import { sql, eq, desc, and, gte, lt } from 'drizzle-orm';

/**
 * GET /api/invoices
 * Retrieves a list of invoices with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Get the auth token from cookies
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify token
    const payload = verifyToken<TokenPayload>(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
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
      conditions.push(sql`${InvoicesTable.salesperson_name} ILIKE ${`%${salesPerson}%`}`);
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
    let invoices = await db
      .select({
        id: InvoicesTable.id,
        invoice_number: InvoicesTable.invoice_number,
        invoice_date: InvoicesTable.invoice_date,
        salesperson_name: InvoicesTable.salesperson_name,
        customer_id: InvoicesTable.customer_id,
        tax_type: InvoicesTable.tax_type,
        tax_rate: InvoicesTable.tax_rate,
        sub_total: InvoicesTable.sub_total,
        total: InvoicesTable.total,
        created_at: InvoicesTable.created_at,
      })
      .from(InvoicesTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset(offset);
    
    // Get customer information for each invoice
    const invoicesWithCustomers = await Promise.all(
      invoices.map(async (invoice) => {
        try {
          const [customerResult] = await db
            .select({
              id: CustomersTable.id,
              name: CustomersTable.name,
              address: CustomersTable.address,
            })
            .from(CustomersTable)
            .where(eq(CustomersTable.id, invoice.customer_id));
          
          // Return invoice with customer data
          return {
            ...invoice,
            customer: customerResult || { id: 0, name: 'Unknown', address: '' },
          };
        } catch (error) {
          console.error(`Error fetching customer for invoice ${invoice.id}:`, error);
          // Return invoice with placeholder customer data
          return {
            ...invoice,
            customer: { id: 0, name: 'Unknown', address: '' },
          };
        }
      })
    );
    
    // Apply customer name filter if provided - we need to do this post-query since it's a join field
    let results = invoicesWithCustomers;
    if (customer) {
      results = invoicesWithCustomers.filter(invoice => 
        invoice.customer.name.toLowerCase().includes(customer.toLowerCase())
      );
    }
    
    return NextResponse.json({
      invoices: results,
      pagination: {
        total: Number(count),
        page,
        pageSize,
        totalPages: Math.ceil(Number(count) / pageSize)
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify token and get user info
    const payload = verifyToken<TokenPayload>(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate invoice data
    const { items, ...invoiceData } = body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one invoice item is required' },
        { status: 400 }
      );
    }
    
    // Validate invoice using Zod schema
    const validatedInvoice = CreateInvoiceSchema.parse({
      ...invoiceData,
      created_by: payload.username,
      updated_by: payload.username
    });
    
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Insert the invoice
      const [newInvoice] = await tx.insert(InvoicesTable).values({
        invoice_number: validatedInvoice.invoice_number,
        invoice_date: validatedInvoice.invoice_date ? new Date(validatedInvoice.invoice_date) : new Date(),
        user_id: validatedInvoice.user_id,
        customer_id: validatedInvoice.customer_id,
        salesperson_name: validatedInvoice.salesperson_name,
        tax_type: validatedInvoice.tax_type,
        tax_rate: validatedInvoice.tax_rate.toString(),
        sub_total: validatedInvoice.sub_total.toString(),
        total: validatedInvoice.total.toString(),
        created_by: validatedInvoice.created_by,
        updated_by: validatedInvoice.updated_by,
        created_at: new Date(),
        updated_at: new Date(),
      }).returning();
      
      // Validate and insert each invoice item
      const invoiceItems = [];
      
      for (const item of items) {
        const validatedItem = CreateInvoiceItemSchema.parse({
          ...item,
          invoice_id: newInvoice.id,
          created_by: payload.username,
          updated_by: payload.username
        });
        
        const [newItem] = await tx.insert(InvoiceItemsTable).values({
          invoice_id: newInvoice.id,
          product_id: validatedItem.product_id,
          quantity: validatedItem.quantity,
          unit_price: validatedItem.unit_price.toString(),
          total_price: validatedItem.total_price.toString(),
          created_by: validatedItem.created_by,
          updated_by: validatedItem.updated_by,
          created_at: new Date(),
          updated_at: new Date(),
        }).returning();
        
        invoiceItems.push(newItem);
      }
      
      return NextResponse.json({
        message: 'Invoice created successfully',
        invoice: newInvoice,
        items: invoiceItems
      }, { status: 201 });
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
    if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
      return NextResponse.json(
        { error: 'An invoice with this invoice number already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
} 