import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/drizzle';
import { CustomersTable } from '@/lib/models/customers';
import { InvoiceItemsTable } from '@/lib/models/invoice_items';
import { InvoicesTable } from '@/lib/models/invoices';
import { PaymentDetailsTable } from '@/lib/models/payment_details';
import { ProductsTable } from '@/lib/models/products';
import { SalesmenTable } from '@/lib/models/salesmen';
import { type TokenPayload } from '@/lib/schemas/authSchema';
import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/utils/jwt';

/**
 * GET /api/invoices/[id]
 * Retrieves a specific invoice by ID with its items
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

    const invoiceId = parseInt((await params).id);

    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    // Get the invoice
    const invoices = await db
      .select()
      .from(InvoicesTable)
      .where(eq(InvoicesTable.id, invoiceId))
      .limit(1);

    if (invoices.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoices[0];

    // Get customer details
    const [customer] = await db
      .select({
        id: CustomersTable.id,
        name: CustomersTable.name,
        address: CustomersTable.address,
        phone: CustomersTable.phone,
        email: CustomersTable.email,
        trn: CustomersTable.trn,
      })
      .from(CustomersTable)
      .where(eq(CustomersTable.id, invoice.customer_id))
      .limit(1);

    // Get salesman details if available
    let salesman = null;
    if (invoice.salesman_id) {
      const [salesmanResult] = await db
        .select({
          id: SalesmenTable.id,
          name: SalesmenTable.name,
          contact_number: SalesmenTable.contact_number,
          email: SalesmenTable.email,
        })
        .from(SalesmenTable)
        .where(eq(SalesmenTable.id, invoice.salesman_id))
        .limit(1);

      salesman = salesmanResult;
    }

    const payment = await db
      .select()
      .from(PaymentDetailsTable)
      .where(eq(PaymentDetailsTable.invoice_id, invoiceId))
      .limit(1);

    // Get the invoice items with product details
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
    const itemsWithProductDetails = await Promise.all(
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

          // Convert unit_price and total_price to numbers
          const unitPrice = Number(item.unit_price);
          const totalPrice = Number(item.total_price);
          const mrpValue = Number(item.mrp);

          return {
            ...item,
            part_no: product?.partNo || '',
            product_name: product?.name || '',
            // Use unit_price from invoice_items instead of price from products
            price: unitPrice,
            mrp: mrpValue,
            rate: unitPrice,
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
            mrp: Number(item.mrp),
            rate: Number(item.unit_price),
            qty: item.quantity,
            total: Number(item.total_price),
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        ...invoice,
        customer: customer || { id: invoice.customer_id, name: 'Unknown Customer' },
        salesman:
          salesman ||
          (invoice.salesman_id ? { id: invoice.salesman_id, name: 'Unknown Salesman' } : null),
        items: itemsWithProductDetails,
        payment: payment || null,
      },
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);

    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

/**
 * PUT /api/invoices/[id]
 * Updates an existing invoice
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get auth token from cookies
    const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const payload = verifyToken(authToken) as TokenPayload;
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Ensure userId is a valid number
    const userId = typeof payload.userId === 'number' ? payload.userId : Number(payload.userId);

    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Invalid user ID in token' }, { status: 400 });
    }

    const { id } = await params;
    const invoiceId = parseInt(id);

    if (isNaN(invoiceId) || invoiceId <= 0) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    const body = await request.json();

    // Start transaction
    return await db.transaction(async tx => {
      // Validate invoice data (except items)
      const existingInvoice = await tx
        .select()
        .from(InvoicesTable)
        .where(eq(InvoicesTable.id, invoiceId))
        .limit(1);

      if (!existingInvoice || existingInvoice.length === 0) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      // Update invoice record
      const updateData = {
        invoice_number: body.invoice_number,
        invoice_date: new Date(body.date),
        customer_id: body.customer_id,
        salesman_id: body.salesman_id || null,
        tax_type: body.tax_type,
        tax_rate: String(
          body.tax_type === 'VAT'
            ? body.vat_percentage
            : body.tax_type === 'GST'
              ? body.cgst_percentage + body.sgst_percentage
              : 0
        ),
        sub_total: String(body.subtotal || 0),
        total: String(body.total || 0),
        discount: body.discount === '' ? 0 : body.discount,
        discount_type: body.discount_type || 'NONE',
        discount_percentage: body.discount_percentage === '' ? 0 : body.discount_percentage,
        ship_to: body.ship_to,
        ship_from: body.ship_from,
        profit: body.profit === '' ? 0 : body.profit,
        invoice_stage: body.invoice_stage,
        parent_invoice_id: body.parent_id || null,
        is_used: body.is_used || false,
        updated_by: userId,
        updated_at: new Date(),
      };

      await tx.update(InvoicesTable).set(updateData).where(eq(InvoicesTable.id, invoiceId));

      // Handle invoice items
      if (body.items && Array.isArray(body.items)) {
        // Delete existing invoice items
        await tx.delete(InvoiceItemsTable).where(eq(InvoiceItemsTable.invoice_id, invoiceId));

        // Insert new invoice items
        const itemsToInsert = [];
        for (const item of body.items) {
          if (!item.product_id) {
            continue; // Skip items without product_id
          }

          itemsToInsert.push({
            invoice_id: invoiceId,
            product_id:
              typeof item.product_id === 'string' ? parseInt(item.product_id) : item.product_id,
            quantity: item.qty || item.quantity || 1,
            unit_price: (item.price || 0).toString(),
            total_price: (item.total || 0).toString(),
            mrp: (item.mrp || 0).toString(),
            created_by: userId,
            updated_by: userId,
            created_at: new Date(),
            updated_at: new Date(),
          });
        }

        if (itemsToInsert.length > 0) {
          await tx.insert(InvoiceItemsTable).values(itemsToInsert);
        }
      }

      // Fetch the updated item data to return
      const updatedItems = await tx
        .select()
        .from(InvoiceItemsTable)
        .where(eq(InvoiceItemsTable.invoice_id, invoiceId));

      return NextResponse.json(
        {
          message: 'Invoice updated successfully',
          data: {
            id: invoiceId,
            items: updatedItems,
          },
        },
        { status: 200 }
      );
    });
  } catch (error: unknown) {
    console.error('Error updating invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update invoice';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

/**
 * DELETE /api/invoices/[id]
 * Deletes an invoice and its items
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

    // Use a transaction to delete the invoice and its items
    return await db.transaction(async tx => {
      // Delete invoice items first (due to foreign key constraints)
      await tx.delete(InvoiceItemsTable).where(eq(InvoiceItemsTable.invoice_id, invoiceId));

      // Delete the invoice
      await tx.delete(InvoicesTable).where(eq(InvoicesTable.id, invoiceId));

      return NextResponse.json({
        message: 'Invoice deleted successfully',
      });
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);

    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
