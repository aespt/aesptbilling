import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { AddressTable } from '@/lib/models/address';
import { desc, eq } from 'drizzle-orm';
import { CreateAddressSchema, UpdateAddressSchema } from '@/lib/schemas/addressSchema';
import { ZodError } from 'zod';

export async function GET() {
  try {
    // Fetch all addresses from the database, ordered by most recent first
    const addresses = await db
      .select()
      .from(AddressTable)
      .orderBy(desc(AddressTable.created_at));

    return NextResponse.json({ addresses }, { status: 200 });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the input using Zod schema
    const validatedData = CreateAddressSchema.parse({
      ...body,
      created_by: 'system',
      updated_by: 'system'
    });

    // If this is a primary address, update all other addresses to not be primary
    if (validatedData.is_primary) {
      await db
        .update(AddressTable)
        .set({ is_primary: false })
        .where(eq(AddressTable.is_primary, true));
    }

    // Create the new address
    const newAddress = await db
      .insert(AddressTable)
      .values(validatedData)
      .returning();

    return NextResponse.json({
      message: 'Address added successfully',
      address: newAddress[0]
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating address:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 }
    );
  }
} 