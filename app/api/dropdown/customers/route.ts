import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { CustomersTable } from '@/lib/models/customers';

export async function GET() {
  try {
    // Fetch all customers for dropdown
    const customers = await db
      .select({
        id: CustomersTable.id,
        name: CustomersTable.name,
        email: CustomersTable.email,
        phone: CustomersTable.phone,
        address: CustomersTable.address,
      })
      .from(CustomersTable)
      .orderBy(CustomersTable.name);

    return NextResponse.json({ customers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
} 