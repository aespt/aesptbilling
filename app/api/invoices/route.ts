import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { InvoicesTable } from '@/lib/models/invoices';
import { InvoiceItemsTable } from '@/lib/models/invoice_items';
import { CreateInvoiceSchema } from '@/lib/schemas/invoiceSchema';
import { CreateInvoiceItemSchema } from '@/lib/schemas/invoiceItemSchema';
import { ZodError } from 'zod';
import { verifyToken } from '@/lib/utils/jwt';
import { AUTH_COOKIE_NAME } from '@/lib/utils/jwt';
import { TokenPayload } from '@/lib/schemas/authSchema';
import { sql, eq, desc, and } from 'drizzle-orm';

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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build query with conditions
    let invoices;
    if (customerId) {
      invoices = await db
        .select()
        .from(InvoicesTable)
        .where(eq(InvoicesTable.customer_id, parseInt(customerId)))
        .orderBy(desc(InvoicesTable.created_at))
        .limit(limit)
        .offset(offset);
    } else {
      invoices = await db
        .select()
        .from(InvoicesTable)
        .orderBy(desc(InvoicesTable.created_at))
        .limit(limit)
        .offset(offset);
    }
    
    return NextResponse.json({ invoices });
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
        order_number: validatedInvoice.order_number,
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
          discount: validatedItem.discount ? validatedItem.discount.toString() : '0',
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