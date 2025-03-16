import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { InvoicesTable } from '@/lib/models/invoices';
import { InvoiceItemsTable } from '@/lib/models/invoice_items';
import { verifyToken } from '@/lib/utils/jwt';
import { AUTH_COOKIE_NAME } from '@/lib/utils/jwt';
import { TokenPayload } from '@/lib/schemas/authSchema';
import { eq } from 'drizzle-orm';
import { UpdateInvoiceSchema } from '@/lib/schemas/invoiceSchema';
import { ZodError } from 'zod';

/**
 * GET /api/invoices/[id]
 * Retrieves a specific invoice by ID with its items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const invoiceId = parseInt(params.id);
    
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }
    
    // Get the invoice
    const invoices = await db
      .select()
      .from(InvoicesTable)
      .where(eq(InvoicesTable.id, invoiceId))
      .limit(1);
    
    if (invoices.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    const invoice = invoices[0];
    
    // Get the invoice items
    const items = await db
      .select()
      .from(InvoiceItemsTable)
      .where(eq(InvoiceItemsTable.invoice_id, invoiceId));
    
    return NextResponse.json({
      invoice,
      items
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/invoices/[id]
 * Updates an existing invoice
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const invoiceId = parseInt(params.id);
    
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }
    
    // Check if invoice exists
    const existingInvoices = await db
      .select({ id: InvoicesTable.id })
      .from(InvoicesTable)
      .where(eq(InvoicesTable.id, invoiceId))
      .limit(1);
    
    if (existingInvoices.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate invoice data
    const validatedData = UpdateInvoiceSchema.parse({
      ...body,
      updated_by: payload.username
    });
    
    // Prepare update data
    const updateData: any = {
      updated_by: payload.username,
      updated_at: new Date()
    };
    
    // Add fields that are present in the request
    if (validatedData.invoice_number !== undefined) {
      updateData.invoice_number = validatedData.invoice_number;
    }
    
    if (validatedData.order_number !== undefined) {
      updateData.order_number = validatedData.order_number;
    }
    
    if (validatedData.invoice_date !== undefined) {
      updateData.invoice_date = new Date(validatedData.invoice_date);
    }
    
    if (validatedData.customer_id !== undefined) {
      updateData.customer_id = validatedData.customer_id;
    }
    
    if (validatedData.salesperson_name !== undefined) {
      updateData.salesperson_name = validatedData.salesperson_name;
    }
    
    if (validatedData.tax_type !== undefined) {
      updateData.tax_type = validatedData.tax_type;
    }
    
    if (validatedData.tax_rate !== undefined) {
      updateData.tax_rate = validatedData.tax_rate.toString();
    }
    
    if (validatedData.sub_total !== undefined) {
      updateData.sub_total = validatedData.sub_total.toString();
    }
    
    if (validatedData.total !== undefined) {
      updateData.total = validatedData.total.toString();
    }
    
    // Update the invoice
    const [updatedInvoice] = await db
      .update(InvoicesTable)
      .set(updateData)
      .where(eq(InvoicesTable.id, invoiceId))
      .returning();
    
    return NextResponse.json({
      message: 'Invoice updated successfully',
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    
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
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invoices/[id]
 * Deletes an invoice and its items
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const invoiceId = parseInt(params.id);
    
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }
    
    // Check if invoice exists
    const existingInvoices = await db
      .select({ id: InvoicesTable.id })
      .from(InvoicesTable)
      .where(eq(InvoicesTable.id, invoiceId))
      .limit(1);
    
    if (existingInvoices.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // Use a transaction to delete the invoice and its items
    return await db.transaction(async (tx) => {
      // Delete invoice items first (due to foreign key constraints)
      await tx
        .delete(InvoiceItemsTable)
        .where(eq(InvoiceItemsTable.invoice_id, invoiceId));
      
      // Delete the invoice
      await tx
        .delete(InvoicesTable)
        .where(eq(InvoicesTable.id, invoiceId));
      
      return NextResponse.json({
        message: 'Invoice deleted successfully'
      });
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
} 