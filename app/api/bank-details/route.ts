import { NextRequest, NextResponse } from 'next/server';
import { CreateBankDetailsSchema, UpdateBankDetailsSchema } from '@/lib/schemas/bankDetailsSchema';
import { db } from '@/lib/db';
import { BankDetailsTable } from '@/lib/models';
import { eq, desc, sql } from 'drizzle-orm';

// GET: Retrieve all bank details
export async function GET(request: NextRequest) {
  try {
    // Fetch from database with proper pagination
    const bankDetails = await db.select()
      .from(BankDetailsTable)
      .orderBy(desc(BankDetailsTable.id));
    
    return NextResponse.json({ bankDetails }, { status: 200 });
  } catch (error) {
    console.error('Error fetching bank details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bank details' }, 
      { status: 500 }
    );
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
    
    // Check if this is the first entry or if the new entry should be primary
    let isPrimary = validatedData.is_primary;
    
    // If setting as primary, update all existing entries to not be primary
    if (isPrimary) {
      // Update all existing records to not be primary
      await db.update(BankDetailsTable)
        .set({ is_primary: false })
        .where(sql`1=1`); // Update all records
    } else {
      // If this is the first entry, force it to be primary
      const count = await db.select({ count: sql<number>`count(*)` })
        .from(BankDetailsTable);
      
      if (count[0]?.count === 0) {
        isPrimary = true;
      }
    }
    
    // Create new bank details
    const newBankDetails = {
      name: validatedData.name,
      details: validatedData.details,
      is_primary: isPrimary,
      created_by: validatedData.created_by || 'system',
      updated_by: validatedData.updated_by || 'system'
    };
    
    // Insert into database
    const insertedBankDetails = await db.insert(BankDetailsTable)
      .values(newBankDetails)
      .returning();
    
    return NextResponse.json(
      { 
        message: 'Bank details created successfully',
        bankDetails: insertedBankDetails[0]
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating bank details:', error);
    return NextResponse.json(
      { error: 'Failed to create bank details' }, 
      { status: 500 }
    );
  }
} 