import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';

import { db } from '@/lib/drizzle';
import { AddressTable } from '@/lib/models/address';
import { BankDetailsTable } from '@/lib/models/bank_details';
import { CustomersTable } from '@/lib/models/customers';
import { InvoiceItemsTable } from '@/lib/models/invoice_items';
import { InvoicesTable } from '@/lib/models/invoices';
import { ProductsTable } from '@/lib/models/products';
import { SalesmenTable } from '@/lib/models/salesmen';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const invoiceId = parseInt((await params).id);

    if (isNaN(invoiceId)) {
      console.error('Invalid invoice ID:', (await params).id);
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    // Get the invoiceStage from query parameter if it exists
    const url = new URL(request.url);

    const invoiceStage =
      url.searchParams.get('invoiceStage') ||
      url.searchParams.get('invoicestage') ||
      url.searchParams.get('InvoiceStage') ||
      url.searchParams.get('INVOICESTAGE');

    // Get invoice data from database
    const invoices = await db.select().from(InvoicesTable).where(eq(InvoicesTable.id, invoiceId));

    if (!invoices || invoices.length === 0) {
      console.error('Invoice not found:', invoiceId);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Create a copy of the invoice to avoid modifying the original data
    const invoice = {
      ...invoices[0],
      // Override invoice_stage with the one from query params if it exists
      invoice_stage: invoiceStage || invoices[0].invoice_stage,
    };

    // Get customer data
    const customers = await db
      .select()
      .from(CustomersTable)
      .where(eq(CustomersTable.id, invoice.customer_id));

    // Get salesperson data only if salesperson_name exists
    const salesPerson = invoice.salesman_id
      ? await db.select().from(SalesmenTable).where(eq(SalesmenTable.id, invoice.salesman_id))
      : null;

    const customer = customers.length > 0 ? customers[0] : null;

    // Get primary address
    const addresses = await db.select().from(AddressTable).where(eq(AddressTable.is_primary, true));

    const primaryAddress = addresses.length > 0 ? addresses[0] : null;

    // Get primary bank details for proforma invoices
    let primaryBankDetails = null;
    if (invoiceStage === 'PROFORMA' || invoice.invoice_stage === 'PROFORMA') {
      const bankDetailsResults = await db
        .select()
        .from(BankDetailsTable)
        .where(eq(BankDetailsTable.is_primary, true));
      if (bankDetailsResults.length > 0) {
        primaryBankDetails = bankDetailsResults[0];
      }
    }

    // Get invoice items
    const invoiceItems = await db
      .select()
      .from(InvoiceItemsTable)
      .where(eq(InvoiceItemsTable.invoice_id, invoiceId));

    // Get products for invoice items
    const productsWithItems = [];

    // Fetch products one by one
    for (const item of invoiceItems) {
      const productRows = await db
        .select()
        .from(ProductsTable)
        .where(eq(ProductsTable.id, item.product_id));

      if (productRows.length > 0) {
        productsWithItems.push({
          item,
          product: productRows[0],
        });
      } else {
        productsWithItems.push({
          item,
          product: null,
        });
      }
    }

    // Format invoice date
    const formattedDate = format(new Date(invoice.invoice_date), 'MMMM dd, yyyy');

    // Determine title based on invoiceStage
    let documentTitle = 'Invoice';
    if (invoiceStage === 'DELIVERY') {
      documentTitle = 'Delivery Note';
    } else if (invoiceStage === 'QUOTATION' || invoice.invoice_stage === 'QUOTATION') {
      documentTitle = 'Quotation';
    } else if (invoiceStage === 'PROFORMA' || invoice.invoice_stage === 'PROFORMA') {
      documentTitle = 'Proforma Invoice';
    } else if (invoiceStage === 'SALE' || invoice.invoice_stage === 'SALE') {
      documentTitle = 'Sale Invoice';
    }

    // Calculate totals
    const subtotal = invoice.sub_total
      ? parseFloat(invoice.sub_total.toString()).toFixed(2)
      : '0.00';
    const discount = invoice.discount ? parseFloat(invoice.discount.toString()).toFixed(2) : '0.00';
    const taxRate = invoice.tax_rate ? parseFloat(invoice.tax_rate.toString()) : 0;
    const discountedSubtotal = (parseFloat(subtotal) - parseFloat(discount)).toFixed(2);
    const taxAmount = ((parseFloat(discountedSubtotal) * taxRate) / 100).toFixed(2);
    const total = parseFloat(invoice.total.toString()).toFixed(2);
    const taxType = invoice.tax_type || 'Tax';

    // Return all necessary data for client-side PDF generation
    return NextResponse.json({
      success: true,
      data: {
        invoice,
        customer,
        salesPerson: salesPerson?.[0] || null,
        primaryAddress,
        primaryBankDetails,
        productsWithItems,
        formattedDate,
        documentTitle,
        totals: {
          subtotal,
          discount,
          taxRate,
          taxAmount,
          total,
          taxType,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching invoice data:', error);

    // Provide detailed error information
    let errorMessage = 'Failed to fetch invoice data';
    let errorDetails = '';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    } else {
      errorDetails = String(error);
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        environment: process.env.NODE_ENV,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const invoiceId = parseInt((await params).id);

    if (isNaN(invoiceId)) {
      console.error('Invalid invoice ID:', (await params).id);
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    // Parse the request body to get invoice_stage
    const requestBody = await request.json();

    const invoiceStage =
      requestBody.invoiceStage ||
      requestBody.invoicestage ||
      requestBody.InvoiceStage ||
      requestBody.INVOICESTAGE ||
      'SALE';

    // Get invoice data from database
    const invoices = await db.select().from(InvoicesTable).where(eq(InvoicesTable.id, invoiceId));

    if (!invoices || invoices.length === 0) {
      console.error('Invoice not found:', invoiceId);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = {
      ...invoices[0],
      // Override invoice_stage with the one from the request
      invoice_stage: invoiceStage,
    };

    // Get customer data
    const customers = await db
      .select()
      .from(CustomersTable)
      .where(eq(CustomersTable.id, invoice.customer_id));

    // Get salesperson data only if salesperson_name exists
    const salesPerson = invoice.salesman_id
      ? await db.select().from(SalesmenTable).where(eq(SalesmenTable.id, invoice.salesman_id))
      : null;

    const customer = customers.length > 0 ? customers[0] : null;

    // Get primary address
    const addresses = await db.select().from(AddressTable).where(eq(AddressTable.is_primary, true));

    const primaryAddress = addresses.length > 0 ? addresses[0] : null;

    // Get primary bank details for proforma invoices
    let primaryBankDetails = null;
    if (invoiceStage === 'PROFORMA') {
      const bankDetailsResults = await db
        .select()
        .from(BankDetailsTable)
        .where(eq(BankDetailsTable.is_primary, true));
      if (bankDetailsResults.length > 0) {
        primaryBankDetails = bankDetailsResults[0];
      }
    }

    // Get invoice items
    const invoiceItems = await db
      .select()
      .from(InvoiceItemsTable)
      .where(eq(InvoiceItemsTable.invoice_id, invoiceId));

    // Get products for invoice items
    const productsWithItems = [];

    // Fetch products one by one
    for (const item of invoiceItems) {
      const productRows = await db
        .select()
        .from(ProductsTable)
        .where(eq(ProductsTable.id, item.product_id));

      if (productRows.length > 0) {
        productsWithItems.push({
          item,
          product: productRows[0],
        });
      } else {
        productsWithItems.push({
          item,
          product: null,
        });
      }
    }

    // Format invoice date
    const formattedDate = format(new Date(invoice.invoice_date), 'MMMM dd, yyyy');

    // Determine title based on invoiceStage
    let documentTitle = 'Invoice';
    if (invoiceStage === 'DELIVERY') {
      documentTitle = 'Delivery Note';
    } else if (invoiceStage === 'QUOTATION') {
      documentTitle = 'Quotation';
    } else if (invoiceStage === 'PROFORMA') {
      documentTitle = 'Proforma Invoice';
    } else if (invoiceStage === 'SALE') {
      documentTitle = 'Sale Invoice';
    }

    // Calculate totals for POST method - using invoice_items
    const subtotal = invoiceItems
      .reduce((sum, item) => sum + parseFloat(item.total_price.toString()), 0)
      .toFixed(2);
    const discount = invoice.discount ? parseFloat(invoice.discount.toString()).toFixed(2) : '0.00';
    const taxRate = invoice.tax_rate ? parseFloat(invoice.tax_rate.toString()) : 0;
    const discountedSubtotal = (parseFloat(subtotal) - parseFloat(discount)).toFixed(2);
    const taxAmount = ((parseFloat(discountedSubtotal) * taxRate) / 100).toFixed(2);
    const total = parseFloat(invoice.total.toString()).toFixed(2);
    const taxType = invoice.tax_type || 'Tax';

    // Return all necessary data for client-side PDF generation
    return NextResponse.json({
      success: true,
      data: {
        invoice,
        customer,
        salesPerson: salesPerson?.[0] || null,
        primaryAddress,
        primaryBankDetails,
        productsWithItems,
        formattedDate,
        documentTitle,
        totals: {
          subtotal,
          discount,
          taxRate,
          taxAmount,
          total,
          taxType,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching invoice data:', error);

    // Provide detailed error information
    let errorMessage = 'Failed to fetch invoice data';
    let errorDetails = '';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    } else {
      errorDetails = String(error);
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        environment: process.env.NODE_ENV,
      },
      { status: 500 }
    );
  }
}
