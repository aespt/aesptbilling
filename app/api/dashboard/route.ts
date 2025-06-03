import { count, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/lib/drizzle';
import { CustomersTable } from '@/lib/models/customers';
import { InvoicesTable } from '@/lib/models/invoices';
import { SalesmenTable } from '@/lib/models/salesmen';
import { SuppliersTable } from '@/lib/models/suppliers';

export async function GET() {
  try {
    // Query counts from all tables in parallel for better performance
    const [saleInvoicesCount, salesmenCount, customersCount, suppliersCount] = await Promise.all([
      db
        .select({ count: count() })
        .from(InvoicesTable)
        .where(sql`${InvoicesTable.invoice_stage} = 'SALE'`),
      db.select({ count: count() }).from(SalesmenTable),
      db.select({ count: count() }).from(CustomersTable),
      db.select({ count: count() }).from(SuppliersTable),
    ]);

    // Default data for all months
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    // Initialize default sales data with 0 values
    const salesData = monthNames.map(name => ({
      name,
      value: 0,
    }));

    // Initialize default margin data with 0 values
    const marginData = monthNames.map(name => ({
      name,
      sales: 0,
      purchase: 0,
      margin: 0,
    }));

    try {
      // Query monthly sales data without year restriction
      const monthlySalesResults = await db
        .select({
          month: sql<string>`to_char(${InvoicesTable.invoice_date}, 'Mon')`,
          total: sql<number>`COALESCE(sum(${InvoicesTable.total}), 0)`,
        })
        .from(InvoicesTable)
        .groupBy(sql`to_char(${InvoicesTable.invoice_date}, 'Mon')`)
        .orderBy(sql`to_char(${InvoicesTable.invoice_date}, 'Mon')`);

      // Update sales data with actual values
      if (monthlySalesResults && monthlySalesResults.length > 0) {
        monthlySalesResults.forEach(result => {
          const monthIndex = monthNames.findIndex(
            name => name.toLowerCase() === result.month.substring(0, 3).toLowerCase()
          );
          if (monthIndex !== -1) {
            salesData[monthIndex].value = parseFloat(String(result.total));
          }
        });
      }

      // Query monthly profit margin data without year restriction
      const monthlyMarginResults = await db
        .select({
          month: sql<string>`to_char(${InvoicesTable.invoice_date}, 'Mon')`,
          sales: sql<number>`COALESCE(sum(${InvoicesTable.total}), 0)`,
          purchase: sql<number>`COALESCE(sum(${InvoicesTable.total} - COALESCE(${InvoicesTable.profit}, 0)), 0)`,
          margin: sql<number>`COALESCE(sum(COALESCE(${InvoicesTable.profit}, 0)), 0)`,
        })
        .from(InvoicesTable)
        .groupBy(sql`to_char(${InvoicesTable.invoice_date}, 'Mon')`)
        .orderBy(sql`to_char(${InvoicesTable.invoice_date}, 'Mon')`);

      // Update margin data with actual values
      if (monthlyMarginResults && monthlyMarginResults.length > 0) {
        monthlyMarginResults.forEach(result => {
          const monthIndex = monthNames.findIndex(
            name => name.toLowerCase() === result.month.substring(0, 3).toLowerCase()
          );
          if (monthIndex !== -1) {
            marginData[monthIndex].sales = parseFloat(String(result.sales));
            marginData[monthIndex].purchase = parseFloat(String(result.purchase));
            marginData[monthIndex].margin = parseFloat(String(result.margin));
          }
        });
      }
    } catch (dbError) {
      console.error('Error querying invoice data:', dbError);
      // Continue with empty data if there's an error
    }

    // Format the metrics response
    const metrics = [
      {
        id: 'invoices',
        title: 'Sale Invoices',
        count: saleInvoicesCount[0].count,
        icon: 'receipt',
      },
      {
        id: 'salesmen',
        title: 'Salesmen',
        count: salesmenCount[0].count,
        icon: 'salesman',
      },
      {
        id: 'customers',
        title: 'Customers',
        count: customersCount[0].count,
        icon: 'business',
      },
      {
        id: 'suppliers',
        title: 'Suppliers',
        count: suppliersCount[0].count,
        icon: 'local_shipping',
      },
    ];

    return NextResponse.json(
      {
        metrics,
        salesData,
        marginData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard metrics' }, { status: 500 });
  }
}
