import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { ProductsTable } from '@/lib/models/products';
import { SalesmenTable } from '@/lib/models/salesmen';
import { CustomersTable } from '@/lib/models/customers';
import { SuppliersTable } from '@/lib/models/suppliers';
import { count } from 'drizzle-orm';

export async function GET() {
  try {
    // Query counts from all tables in parallel for better performance
    const [
      productsCount,
      salesmenCount,
      customersCount,
      suppliersCount
    ] = await Promise.all([
      db.select({ count: count() }).from(ProductsTable),
      db.select({ count: count() }).from(SalesmenTable),
      db.select({ count: count() }).from(CustomersTable),
      db.select({ count: count() }).from(SuppliersTable)
    ]);

    // Format the response as an array of objects
    const metrics = [
      {
        id: 'products',
        title: 'Products',
        count: productsCount[0].count,
        icon: 'inventory'
      },
      {
        id: 'salesmen',
        title: 'Salesmen',
        count: salesmenCount[0].count,
        icon: 'salesman'
      },
      {
        id: 'customers',
        title: 'Customers',
        count: customersCount[0].count,
        icon: 'business'
      },
      {
        id: 'suppliers',
        title: 'Suppliers',
        count: suppliersCount[0].count,
        icon: 'local_shipping'
      }
    ];

    return NextResponse.json({ metrics }, { status: 200 });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}
