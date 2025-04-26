import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { db } from '@/lib/drizzle';
import { InvoiceItemsTable } from '@/lib/models/invoice_items';
import { InvoicesTable } from '@/lib/models/invoices';
import { ProductsTable } from '@/lib/models/products';
import { type TokenPayload } from '@/lib/schemas/authSchema';
import { CreateInvoiceItemSchema } from '@/lib/schemas/invoiceItemSchema';
import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/utils/jwt';

/**
 * GET /api/invoices/[id]/items
 * Retrieves all items for a specific invoice
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

    // Ensure userId is a valid number
    const userId = typeof payload.userId === 'number' ? payload.userId : Number(payload.userId);

    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Invalid user ID in token' }, { status: 400 });
    }

    const invoiceId = parseInt((await params).id);

    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    // Check if invoice exists
    const existingInvoices = await db
      .select({ id: InvoicesTable.id })
      .from(InvoicesTable)
      .where(eq(InvoicesTable.id, invoiceId))
      .limit(1);

    if (existingInvoices.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Get all items for this invoice with basic information
    const items = await db
      .select({
        id: InvoiceItemsTable.id,
        invoice_id: InvoiceItemsTable.invoice_id,
        product_id: InvoiceItemsTable.product_id,
        quantity: InvoiceItemsTable.quantity,
        unit_price: InvoiceItemsTable.unit_price,
        total_price: InvoiceItemsTable.total_price,
        mrp: InvoiceItemsTable.mrp,
      })
      .from(InvoiceItemsTable)
      .where(eq(InvoiceItemsTable.invoice_id, invoiceId));

    // Get product details for each item
    const itemsWithDetails = await Promise.all(
      items.map(async item => {
        try {
          // Get product details from the products table
          const [product] = await db
            .select({
              id: ProductsTable.id,
              partNo: ProductsTable.partNo,
              name: ProductsTable.name,
            })
            .from(ProductsTable)
            .where(eq(ProductsTable.id, item.product_id))
            .limit(1);

          // Use unit_price from invoice_items
          const unitPrice = Number(item.unit_price);
          const totalPrice = Number(item.total_price);

          return {
            ...item,
            part_no: product?.partNo || '',
            product_name: product?.name || '',
            price: unitPrice,
            mrp: Number(item.mrp),
            rate: Number(item.mrp),
            qty: item.quantity,
            total: totalPrice,
          };
        } catch (error) {
          console.error(`Error fetching product details for item ${item.id}:`, error);
          return {
            ...item,
            part_no: '',
            product_name: 'Unknown Product',
            price: Number(item.unit_price),
            mrp: Number(item.unit_price),
            rate: Number(item.unit_price),
            qty: item.quantity,
            total: Number(item.total_price),
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      items: itemsWithDetails,
    });
  } catch (error) {
    console.error('Error fetching invoice items:', error);

    return NextResponse.json({ error: 'Failed to fetch invoice items' }, { status: 500 });
  }
}

/**
 * POST /api/invoices/[id]/items
 * Adds a new item to an existing invoice
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Ensure userId is a valid number
    const userId = typeof payload.userId === 'number' ? payload.userId : Number(payload.userId);

    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Invalid user ID in token' }, { status: 400 });
    }

    const invoiceId = parseInt((await params).id);

    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    // Check if invoice exists
    const existingInvoices = await db
      .select({ id: InvoicesTable.id })
      .from(InvoicesTable)
      .where(eq(InvoicesTable.id, invoiceId))
      .limit(1);

    if (existingInvoices.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();

    // Make sure body includes mrp, default to unit_price if not provided
    if (!body.mrp && body.unit_price) {
      body.mrp = body.unit_price;
    }

    // Validate item data
    const validatedItem = CreateInvoiceItemSchema.parse({
      ...body,
      invoice_id: invoiceId,
      created_by: payload.username,
      updated_by: payload.username,
    });

    // Insert the new item
    const [newItem] = await db
      .insert(InvoiceItemsTable)
      .values({
        invoice_id: invoiceId,
        product_id: validatedItem.product_id,
        quantity: validatedItem.quantity,
        unit_price: validatedItem.unit_price.toString(),
        total_price: validatedItem.total_price.toString(),
        mrp: validatedItem.mrp.toString(),
        created_by: userId,
        updated_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    // Update invoice totals
    await updateInvoiceTotals(invoiceId);

    return NextResponse.json(
      {
        message: 'Invoice item added successfully',
        item: newItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding invoice item:', error);

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to add invoice item' }, { status: 500 });
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
