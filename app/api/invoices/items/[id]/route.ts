import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { db } from '@/lib/drizzle';
import { InvoiceItemsTable } from '@/lib/models/invoice_items';
import { InvoicesTable } from '@/lib/models/invoices';
import { type TokenPayload } from '@/lib/schemas/authSchema';
import { UpdateInvoiceItemSchema } from '@/lib/schemas/invoiceItemSchema';
import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/utils/jwt';

/**
 * GET /api/invoices/items/[id]
 * Retrieves a specific invoice item by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const itemId = parseInt((await params).id);

    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    // Get the item
    const items = await db
      .select()
      .from(InvoiceItemsTable)
      .where(eq(InvoiceItemsTable.id, itemId))
      .limit(1);

    if (items.length === 0) {
      return NextResponse.json({ error: 'Invoice item not found' }, { status: 404 });
    }

    return NextResponse.json({ item: items[0] });
  } catch (error) {
    console.error('Error fetching invoice item:', error);

    return NextResponse.json({ error: 'Failed to fetch invoice item' }, { status: 500 });
  }
}

/**
 * PUT /api/invoices/items/[id]
 * Updates a specific invoice item
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const itemId = parseInt((await params).id);

    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    // Check if item exists and get its invoice_id
    const existingItems = await db
      .select({
        id: InvoiceItemsTable.id,
        invoice_id: InvoiceItemsTable.invoice_id,
      })
      .from(InvoiceItemsTable)
      .where(eq(InvoiceItemsTable.id, itemId))
      .limit(1);

    if (existingItems.length === 0) {
      return NextResponse.json({ error: 'Invoice item not found' }, { status: 404 });
    }

    const invoiceId = existingItems[0].invoice_id;

    // Parse request body
    const body = await request.json();

    // Validate item data
    const validatedData = UpdateInvoiceItemSchema.parse({
      ...body,
      updated_by: payload.userId,
    });

    // Prepare update data
    const updateData: Partial<typeof InvoiceItemsTable.$inferInsert> = {
      updated_by: payload.userId,
      updated_at: new Date(),
    };

    // Add fields that are present in the request
    if (validatedData.product_id !== undefined) {
      updateData.product_id = validatedData.product_id;
    }

    if (validatedData.quantity !== undefined) {
      updateData.quantity = validatedData.quantity;
    }

    if (validatedData.unit_price !== undefined) {
      updateData.unit_price = validatedData.unit_price.toString();
    }

    if (validatedData.total_price !== undefined) {
      updateData.total_price = validatedData.total_price.toString();
    }

    // Update the item
    const [updatedItem] = await db
      .update(InvoiceItemsTable)
      .set(updateData)
      .where(eq(InvoiceItemsTable.id, itemId))
      .returning();

    // Update invoice totals
    await updateInvoiceTotals(invoiceId);

    return NextResponse.json({
      message: 'Invoice item updated successfully',
      item: updatedItem,
    });
  } catch (error) {
    console.error('Error updating invoice item:', error);

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update invoice item' }, { status: 500 });
  }
}

/**
 * DELETE /api/invoices/items/[id]
 * Deletes a specific invoice item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const itemId = parseInt((await params).id);

    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    // Check if item exists and get its invoice_id
    const existingItems = await db
      .select({
        id: InvoiceItemsTable.id,
        invoice_id: InvoiceItemsTable.invoice_id,
      })
      .from(InvoiceItemsTable)
      .where(eq(InvoiceItemsTable.id, itemId))
      .limit(1);

    if (existingItems.length === 0) {
      return NextResponse.json({ error: 'Invoice item not found' }, { status: 404 });
    }

    const invoiceId = existingItems[0].invoice_id;

    // Delete the item
    await db.delete(InvoiceItemsTable).where(eq(InvoiceItemsTable.id, itemId));

    // Update invoice totals
    await updateInvoiceTotals(invoiceId);

    return NextResponse.json({
      message: 'Invoice item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting invoice item:', error);

    return NextResponse.json({ error: 'Failed to delete invoice item' }, { status: 500 });
  }
}

/**
 * Helper function to update invoice totals
 */
async function updateInvoiceTotals(invoiceId: number) {
  try {
    // Get all items for this invoice
    const items = await db
      .select({
        total_price: InvoiceItemsTable.total_price,
      })
      .from(InvoiceItemsTable)
      .where(eq(InvoiceItemsTable.invoice_id, invoiceId));

    // Calculate sub_total
    const subTotal = items.reduce((sum, item) => {
      return sum + parseFloat(item.total_price.toString());
    }, 0);

    // Get the invoice to calculate tax
    const [invoice] = await db
      .select({
        tax_rate: InvoicesTable.tax_rate,
        tax_type: InvoicesTable.tax_type,
      })
      .from(InvoicesTable)
      .where(eq(InvoicesTable.id, invoiceId))
      .limit(1);

    // Calculate total with tax
    const taxRate = invoice?.tax_rate ? parseFloat(invoice.tax_rate.toString()) : 0;
    const taxAmount = invoice?.tax_type !== 'NONE' ? (subTotal * taxRate) / 100 : 0;
    const total = subTotal + taxAmount;

    // Update the invoice
    await db
      .update(InvoicesTable)
      .set({
        sub_total: subTotal.toString(),
        total: total.toString(),
        updated_at: new Date(),
      })
      .where(eq(InvoicesTable.id, invoiceId));

    return { subTotal, total };
  } catch (error) {
    console.error('Error updating invoice totals:', error);
    throw error;
  }
}
