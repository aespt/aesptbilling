import { eq, and, gte, lt, like, type SQLWrapper, sql } from 'drizzle-orm';
import { Workbook } from 'exceljs';
import { type NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/drizzle';
import { PurchaseEntriesTable } from '@/lib/models/purchase_entries';
import { SuppliersTable } from '@/lib/models/suppliers';
import { type TokenPayload } from '@/lib/schemas/authSchema';
import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/utils/jwt';

/**
 * GET /api/purchase-entries/export
 * Exports purchase entries as Excel file
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

    // Build conditions array
    const conditions: SQLWrapper[] = [];

    // Add filters from query parameters if provided
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const purchaseEntryNumber = searchParams.get('purchaseEntryNumber');
    const supplier = searchParams.get('supplier');
    const purchaseType = searchParams.get('purchaseType');

    // Add date range filter if provided
    if (dateFrom) {
      conditions.push(gte(PurchaseEntriesTable.purchaseentry_date, new Date(dateFrom)));
    }

    if (dateTo) {
      // Add one day to include the end date fully
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lt(PurchaseEntriesTable.purchaseentry_date, endDate));
    }

    // Add purchase entry number filter if provided
    if (purchaseEntryNumber) {
      conditions.push(like(PurchaseEntriesTable.purchaseentry_number, `%${purchaseEntryNumber}%`));
    }

    // Add supplier filter if provided
    if (supplier) {
      // First get the supplier ID
      const supplierRecord = await db
        .select({ id: SuppliersTable.id })
        .from(SuppliersTable)
        .where(like(SuppliersTable.name, `%${supplier}%`))
        .limit(1);

      if (supplierRecord.length > 0) {
        conditions.push(eq(PurchaseEntriesTable.supplier_id, supplierRecord[0].id));
      }
    }

    // Add purchase type filter if provided
    if (purchaseType) {
      conditions.push(
        eq(
          PurchaseEntriesTable.purchase_type,
          purchaseType as 'TAX' | 'DELIVERY' | 'PROFORMA' | 'QUOTATION'
        )
      );
    }

    // Execute query with conditions to get purchase entries
    const purchaseEntries = await db
      .select({
        id: PurchaseEntriesTable.id,
        purchaseentry_number: PurchaseEntriesTable.purchaseentry_number,
        purchaseentry_date: PurchaseEntriesTable.purchaseentry_date,
        ship_from: PurchaseEntriesTable.ship_from,
        purchase_type: PurchaseEntriesTable.purchase_type,
        sub_total: PurchaseEntriesTable.sub_total,
        discount: PurchaseEntriesTable.discount,
        tax_amount:
          sql<string>`(${PurchaseEntriesTable.total})::numeric - (${PurchaseEntriesTable.sub_total})::numeric + (${PurchaseEntriesTable.discount})::numeric`.as(
            'tax_amount'
          ),
        total: PurchaseEntriesTable.total,
        supplier_id: PurchaseEntriesTable.supplier_id,
        supplier_name: SuppliersTable.name,
      })
      .from(PurchaseEntriesTable)
      .leftJoin(SuppliersTable, eq(PurchaseEntriesTable.supplier_id, SuppliersTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(PurchaseEntriesTable.purchaseentry_date);

    // Create Excel workbook and worksheet
    const workbook = new Workbook();
    workbook.creator = 'AESPT System';
    workbook.lastModifiedBy = payload.email || 'User';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Add purchase entries worksheet
    const worksheet = workbook.addWorksheet('Purchase Entries');

    // Define columns for worksheet
    worksheet.columns = [
      { header: 'Purchase Entry Number', key: 'purchaseentry_number', width: 20 },
      { header: 'Date', key: 'purchaseentry_date', width: 15 },
      { header: 'Supplier', key: 'supplier_name', width: 25 },
      { header: 'Ship From', key: 'ship_from', width: 20 },
      { header: 'Subtotal', key: 'sub_total', width: 15 },
      { header: 'Discount', key: 'discount', width: 15 },
      { header: 'Tax Amount', key: 'tax_amount', width: 15 },
      { header: 'Total', key: 'total', width: 15 },
    ];

    // Add headers styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add data to worksheet
    purchaseEntries.forEach(entry => {
      worksheet.addRow({
        purchaseentry_number: entry.purchaseentry_number,
        purchaseentry_date: entry.purchaseentry_date,
        supplier_name: entry.supplier_name,
        ship_from: entry.ship_from,
        sub_total: parseFloat(entry.sub_total),
        discount: parseFloat(entry.discount),
        tax_amount: parseFloat(entry.tax_amount),
        total: parseFloat(entry.total),
      });
    });

    // Format the date column to show as date
    worksheet.getColumn('purchaseentry_date').numFmt = 'dd/mm/yyyy';

    // Format the currency columns
    worksheet.getColumn('sub_total').numFmt = '#,##0.00';
    worksheet.getColumn('discount').numFmt = '#,##0.00';
    worksheet.getColumn('tax_amount').numFmt = '#,##0.00';
    worksheet.getColumn('total').numFmt = '#,##0.00';

    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Create response with Excel file
    const response = new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="purchase_entries_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });

    return response;
  } catch (error) {
    console.error('Error exporting purchase entries:', error);
    return NextResponse.json({ error: 'Failed to export purchase entries' }, { status: 500 });
  }
}
