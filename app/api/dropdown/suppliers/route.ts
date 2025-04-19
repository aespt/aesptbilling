import { NextResponse } from 'next/server';

import { db } from '@/lib/drizzle';
import { SuppliersTable } from '@/lib/models/suppliers';

export async function GET() {
  try {
    // Fetch all suppliers for dropdown
    const suppliers = await db
      .select({
        id: SuppliersTable.id,
        name: SuppliersTable.name,
        address: SuppliersTable.address,
        contact_number: SuppliersTable.contact_number,
      })
      .from(SuppliersTable)
      .orderBy(SuppliersTable.name);

    return NextResponse.json({ suppliers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}
