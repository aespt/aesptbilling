import { eq, and, gte, lt, like } from 'drizzle-orm';
import { Workbook } from 'exceljs';
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
 * GET /api/invoices/export
 * Exports invoices with SALE stage as Excel file
 * Supports filtering based on query parameters
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

    // Build conditions array - always include SALE stage
    const conditions = [eq(InvoicesTable.invoice_stage, 'SALE')];

    // Add filters from query parameters if provided
    const customerId = searchParams.get('customer_id');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const invoiceNumber = searchParams.get('invoiceNumber');
    const salesPerson = searchParams.get('salesPerson');

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
      conditions.push(like(InvoicesTable.invoice_number, `%${invoiceNumber}%`));
    }

    // Add sales person filter if provided
    if (salesPerson) {
      conditions.push(eq(InvoicesTable.salesman_id, parseInt(salesPerson)));
    }

    // Execute query with all conditions to get invoices
    const invoices = await db
      .select({
        id: InvoicesTable.id,
        invoice_number: InvoicesTable.invoice_number,
        invoice_date: InvoicesTable.invoice_date,
        salesman_id: InvoicesTable.salesman_id,
        customer_id: InvoicesTable.customer_id,
        tax_type: InvoicesTable.tax_type,
        tax_rate: InvoicesTable.tax_rate,
        sub_total: InvoicesTable.sub_total,
        discount: InvoicesTable.discount,
        total: InvoicesTable.total,
        created_at: InvoicesTable.created_at,
        ship_from: InvoicesTable.ship_from,
        ship_to: InvoicesTable.ship_to,
        customer_name: CustomersTable.name,
        salesman_name: SalesmenTable.name,
        payment_method: PaymentDetailsTable.payment_method,
      })
      .from(InvoicesTable)
      .leftJoin(CustomersTable, eq(InvoicesTable.customer_id, CustomersTable.id))
      .leftJoin(SalesmenTable, eq(InvoicesTable.salesman_id, SalesmenTable.id))
      .leftJoin(PaymentDetailsTable, eq(InvoicesTable.id, PaymentDetailsTable.invoice_id))
      .where(and(...conditions))
      .orderBy(InvoicesTable.invoice_date);

    // Get invoice items and product details for each invoice
    const invoicesWithItems = await Promise.all(
      invoices.map(async invoice => {
        const items = await db
          .select({
            id: InvoiceItemsTable.id,
            product_id: InvoiceItemsTable.product_id,
            quantity: InvoiceItemsTable.quantity,
            unit_price: InvoiceItemsTable.unit_price,
            total_price: InvoiceItemsTable.total_price,
            product_name: ProductsTable.name,
            product_part_no: ProductsTable.partNo,
          })
          .from(InvoiceItemsTable)
          .leftJoin(ProductsTable, eq(InvoiceItemsTable.product_id, ProductsTable.id))
          .where(eq(InvoiceItemsTable.invoice_id, invoice.id));

        return {
          ...invoice,
          items,
        };
      })
    );

    // Create Excel workbook and worksheet
    const workbook = new Workbook();
    workbook.creator = 'AESPT System';
    workbook.lastModifiedBy = payload.email || 'User';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Add invoices worksheet
    const invoicesSheet = workbook.addWorksheet('Invoices');

    // Define columns for invoices sheet
    invoicesSheet.columns = [
      { header: 'Date', key: 'invoice_date', width: 12 },
      { header: 'Invoice Number', key: 'invoice_number', width: 15 },
      { header: 'Salesperson', key: 'salesman_name', width: 20 },
      { header: 'Customer', key: 'customer_name', width: 20 },
      { header: 'Ship From', key: 'ship_from', width: 20 },
      { header: 'Ship To', key: 'ship_to', width: 20 },
      { header: 'MOP', key: 'payment_method', width: 10 },
      { header: 'Gross Amount', key: 'sub_total', width: 12 },
      { header: 'Discount', key: 'discount', width: 12 },
      { header: 'Taxable Amount', key: 'taxable_amount', width: 12 },
      { header: 'Tax', key: 'invoice_tax', width: 12 },
      { header: 'Bill Amount', key: 'total', width: 12 },
    ];

    // Add headers styling
    invoicesSheet.getRow(1).font = { bold: true };
    invoicesSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const calculateTaxAndTotals = (invoice: any) => {
      const taxRate = parseFloat(invoice.tax_rate) / 100;
      const subTotal = parseFloat(invoice.sub_total);
      const discount = parseFloat(invoice.discount);
      let taxableAmount = parseFloat(invoice.sub_total);
      if (parseFloat(invoice.discount) > 0) {
        taxableAmount = subTotal - discount;
      }
      const invoiceTax = (taxableAmount * taxRate).toFixed(2);

      return {
        invoiceTax,
        taxableAmount,
      };
    };
    // Add data to invoices sheet
    invoicesWithItems.forEach(invoice => {
      const { invoiceTax, taxableAmount } = calculateTaxAndTotals(invoice);
      invoicesSheet.addRow({
        invoice_date: invoice.invoice_date,
        invoice_number: invoice.invoice_number,
        salesman_name: invoice.salesman_name,
        customer_name: invoice.customer_name,
        ship_from: invoice.ship_from,
        ship_to: invoice.ship_to,
        payment_method: invoice.payment_method,
        sub_total: invoice.sub_total,
        discount: invoice.discount,
        taxable_amount: taxableAmount,
        invoice_tax: invoiceTax,
        total: invoice.total,
      });
    });

    // Format number columns
    invoicesSheet.getColumn('sub_total').numFmt = '#,##0.00';
    invoicesSheet.getColumn('taxable_amount').numFmt = '#,##0.00';
    invoicesSheet.getColumn('invoice_tax').numFmt = '#,##0.00';
    invoicesSheet.getColumn('discount').numFmt = '#,##0.00';
    invoicesSheet.getColumn('total').numFmt = '#,##0.00';

    // Add items worksheet
    const itemsSheet = workbook.addWorksheet('Invoice Items');

    // Define columns for items sheet
    itemsSheet.columns = [
      { header: 'Invoice Number', key: 'invoice_number', width: 15 },
      { header: 'Product Part No', key: 'product_part_no', width: 15 },
      { header: 'Product Name', key: 'product_name', width: 25 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Unit Price', key: 'unit_price', width: 12 },
      { header: 'Total Price', key: 'total_price', width: 12 },
    ];

    // Add headers styling
    itemsSheet.getRow(1).font = { bold: true };
    itemsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add data to items sheet
    invoicesWithItems.forEach(invoice => {
      invoice.items.forEach(item => {
        itemsSheet.addRow({
          invoice_number: invoice.invoice_number,
          product_part_no: item.product_part_no,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        });
      });
    });

    // Format number columns
    itemsSheet.getColumn('quantity').numFmt = '#,##0';
    itemsSheet.getColumn('unit_price').numFmt = '#,##0.00';
    itemsSheet.getColumn('total_price').numFmt = '#,##0.00';

    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Create response with Excel file
    const response = new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="invoices_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });

    return response;
  } catch (error) {
    console.error('Error exporting invoices:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to export invoices',
      },
      { status: 500 }
    );
  }
}
