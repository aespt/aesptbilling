import { NextResponse } from 'next/server';

import { db } from '@/lib/drizzle';
import { SalesmenTable } from '@/lib/models/salesmen';

export async function GET() {
  try {
    // Fetch all salesmen for dropdown
    const salesmen = await db
      .select({
        id: SalesmenTable.id,
        name: SalesmenTable.name,
        contact_number: SalesmenTable.contact_number,
      })
      .from(SalesmenTable)
      .orderBy(SalesmenTable.name);

    return NextResponse.json({ salesmen }, { status: 200 });
  } catch (error) {
    console.error('Error fetching salesmen:', error);
    return NextResponse.json({ error: 'Failed to fetch salesmen' }, { status: 500 });
  }
}
