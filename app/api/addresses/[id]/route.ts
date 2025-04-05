import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { db } from '@/lib/drizzle';
import { AddressTable } from '@/lib/models/address';
import { UpdateAddressSchema } from '@/lib/schemas/addressSchema';

// interface Params {
//   params: {
//     id: string;
//   };
// }

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid address ID' }, { status: 400 });
    }

    const address = await db.select().from(AddressTable).where(eq(AddressTable.id, id)).limit(1);

    if (address.length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json(address[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching address:', error);
    return NextResponse.json({ error: 'Failed to fetch address' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid address ID' }, { status: 400 });
    }

    const body = await request.json();

    // Validate the input using Zod schema
    const validatedData = UpdateAddressSchema.parse({
      ...body,
      updated_by: 'system',
      updated_at: new Date(),
    });

    // If marking as primary, update all other addresses
    if (validatedData.is_primary) {
      await db
        .update(AddressTable)
        .set({ is_primary: false })
        .where(eq(AddressTable.is_primary, true));
    }

    // Update the address
    const updatedAddress = await db
      .update(AddressTable)
      .set(validatedData)
      .where(eq(AddressTable.id, id))
      .returning();

    if (updatedAddress.length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: 'Address updated successfully',
        address: updatedAddress[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating address:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid address ID' }, { status: 400 });
    }

    // Check if the address exists and is primary
    const existingAddress = await db
      .select()
      .from(AddressTable)
      .where(eq(AddressTable.id, id))
      .limit(1);

    if (existingAddress.length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // Prevent deleting the primary address
    if (existingAddress[0].is_primary) {
      return NextResponse.json(
        { error: 'Cannot delete primary address. Please set another address as primary first.' },
        { status: 400 }
      );
    }

    // Delete the address
    await db.delete(AddressTable).where(eq(AddressTable.id, id));

    return NextResponse.json(
      {
        message: 'Address deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}
