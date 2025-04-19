import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { db } from '@/lib/drizzle';
import { CustomersTable } from '@/lib/models/customers';
import { InvoiceItemsTable } from '@/lib/models/invoice_items';
import { InvoicesTable } from '@/lib/models/invoices';
import { ProductsTable } from '@/lib/models/products';
import { SalesmenTable } from '@/lib/models/salesmen';
import { type TokenPayload } from '@/lib/schemas/authSchema';
import { UpdateInvoiceSchema } from '@/lib/schemas/invoiceSchema';
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

    // Get the invoice items with product details
    const items = await db
      .select({
        id: InvoiceItemsTable.id,
        invoice_id: InvoiceItemsTable.invoice_id,
        product_id: InvoiceItemsTable.product_id,
        quantity: InvoiceItemsTable.quantity,
        unit_price: InvoiceItemsTable.unit_price,
        total_price: InvoiceItemsTable.total_price,
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

          return {
            ...item,
            part_no: product?.partNo || '',
            product_name: product?.name || '',
            // Use unit_price from invoice_items instead of price from products
            price: unitPrice,
            mrp: unitPrice, // Use unit_price as MRP as well if needed
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
      data: {
        ...invoice,
        customer: customer || { id: invoice.customer_id, name: 'Unknown Customer' },
        salesman:
          salesman ||
          (invoice.salesman_id ? { id: invoice.salesman_id, name: 'Unknown Salesman' } : null),
        items: itemsWithProductDetails,
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

    // Parse request body
    const body = await request.json();

    return await db.transaction(async tx => {
      // Validate invoice data (except items)
      const validatedData = UpdateInvoiceSchema.parse({
        ...body,
        updated_by: payload.username,
      });

      // Prepare update data
      const updateData = {
        updated_by: payload.userId,
        updated_at: new Date(),
      } as Partial<typeof InvoicesTable.$inferInsert> & {
        // Additional fields that might not be in the base type
        status?: string;
        invoice_stage?: string;
        vat_percentage?: number;
        cgst_percentage?: number;
        sgst_percentage?: number;
        discount_type?: string;
        discount_value?: number | string;
        tax?: string;
        profit?: string;
      };

      // Add fields that are present in the request
      if (validatedData.invoice_date !== undefined) {
        updateData.invoice_date = new Date(validatedData.invoice_date);
      }

      if (validatedData.customer_id !== undefined) {
        updateData.customer_id = validatedData.customer_id;
      }

      // Handle salesmen_id which might be passed as salesman_id in the frontend
      if (validatedData.salesmen_id !== undefined) {
        updateData.salesman_id = validatedData.salesmen_id;
      }

      // Handle additional fields that might not be in the schema but are in the database
      // These are checked with undefined checks to ensure safety
      if (body.ship_from !== undefined) {
        updateData.ship_from = body.ship_from;
      }

      if (body.ship_to !== undefined) {
        updateData.ship_to = body.ship_to;
      }

      if (body.status !== undefined) {
        updateData.status = body.status;
      }

      if (body.invoice_stage !== undefined) {
        updateData.invoice_stage = body.invoice_stage;
      }

      if (validatedData.tax_type !== undefined) {
        updateData.tax_type = validatedData.tax_type;
      }

      if (validatedData.tax_rate !== undefined) {
        updateData.tax_rate = validatedData.tax_rate.toString();
      }

      // These fields may not be in the schema but could be sent from frontend
      if (body.vat_percentage !== undefined) {
        updateData.vat_percentage = body.vat_percentage;
      }

      if (body.cgst_percentage !== undefined) {
        updateData.cgst_percentage = body.cgst_percentage;
      }

      if (body.sgst_percentage !== undefined) {
        updateData.sgst_percentage = body.sgst_percentage;
      }

      // Handle discount fields
      if (body.discount_type !== undefined) {
        updateData.discount_type = body.discount_type;
      }

      if (body.discount_value !== undefined) {
        updateData.discount_value = body.discount_value;
      }

      // Handle totals
      if (body.subtotal !== undefined) {
        updateData.sub_total = body.subtotal.toString();
      } else if (validatedData.sub_total !== undefined) {
        updateData.sub_total = validatedData.sub_total.toString();
      }

      if (body.discount !== undefined) {
        updateData.discount = body.discount.toString();
      }

      if (body.tax !== undefined) {
        updateData.tax = body.tax.toString();
      }

      if (validatedData.total !== undefined) {
        updateData.total = validatedData.total.toString();
      }

      if (body.profit !== undefined) {
        updateData.profit = body.profit.toString();
      }

      // Update the invoice
      const [updatedInvoice] = await tx
        .update(InvoicesTable)
        .set(updateData)
        .where(eq(InvoicesTable.id, invoiceId))
        .returning();

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
            unit_price: (item.price || item.rate || 0).toString(),
            total_price: (item.total || 0).toString(),
            created_by: payload.userId,
            updated_by: payload.userId,
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

      return NextResponse.json({
        message: 'Invoice updated successfully',
        data: {
          id: updatedInvoice.id,
          invoice_number: updatedInvoice.invoice_number,
        },
        items: updatedItems.length,
      });
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
    if (
      error instanceof Error &&
      error.message.includes('duplicate key value violates unique constraint')
    ) {
      return NextResponse.json(
        { error: 'An invoice with this invoice number already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
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
