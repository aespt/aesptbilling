import { desc, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { db } from '@/lib/db';
import { BankDetailsTable } from '@/lib/models';
import { CreateBankDetailsSchema } from '@/lib/schemas/bankDetailsSchema';

// GET: Retrieve all bank details
export async function GET(_request: NextRequest) {
  try {
    // Fetch from database with proper pagination
    const bankDetails = await db.select().from(BankDetailsTable).orderBy(desc(BankDetailsTable.id));

    return NextResponse.json({ bankDetails }, { status: 200 });
  } catch (error) {
    console.error('Error fetching bank details:', error);
    return NextResponse.json({ error: 'Failed to fetch bank details' }, { status: 500 });
  }
}

// POST: Create a new bank details entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate using the schema
    const result = CreateBankDetailsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    const validatedData = result.data;

    // Check if there are any existing records
    const count = await db.select({ count: sql<number>`count(*)` }).from(BankDetailsTable);
    // The count is coming as a BigInt or string, make sure we convert it properly to a number
    const recordCount = Number(count[0]?.count || 0);
    const isFirstEntry = recordCount === 0;

    // For first entry, ALWAYS force isPrimary to true
    const isPrimary = isFirstEntry ? true : validatedData.is_primary;

    // If explicitly setting as primary (and not the first entry), update all existing entries
    if (!isFirstEntry && isPrimary) {
      await db
        .update(BankDetailsTable)
        .set({ is_primary: false })
        .where(sql`1=1`); // Update all records
    }

    // Create new bank details
    const newBankDetails = {
      name: validatedData.name,
      details: validatedData.details,
      is_primary: isFirstEntry ? true : isPrimary, // Double-check to ensure first entry is primary
      created_by: validatedData.created_by || 'system',
      updated_by: validatedData.updated_by || 'system',
    };

    console.log('Bank details being inserted:', newBankDetails);

    // Insert into database
    const insertedBankDetails = await db
      .insert(BankDetailsTable)
      .values(newBankDetails)
      .returning();

    return NextResponse.json(
      {
        message: 'Bank details created successfully',
        bankDetails: insertedBankDetails[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating bank details:', error);
    return NextResponse.json({ error: 'Failed to create bank details' }, { status: 500 });
  }
}
