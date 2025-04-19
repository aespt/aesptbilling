import { eq, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { BankDetailsTable } from '@/lib/models';
import { UpdateBankDetailsSchema } from '@/lib/schemas/bankDetailsSchema';

interface Params {
  params: {
    id: string;
  };
}

// GET: Retrieve a single bank details entry
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);

    // Find the bank details with the given ID
    const bankDetails = await db.select().from(BankDetailsTable).where(eq(BankDetailsTable.id, id));

    if (!bankDetails.length) {
      return NextResponse.json({ error: 'Bank details not found' }, { status: 404 });
    }

    return NextResponse.json({ bankDetails: bankDetails[0] }, { status: 200 });
  } catch (error) {
    console.error('Error fetching bank details:', error);
    return NextResponse.json({ error: 'Failed to fetch bank details' }, { status: 500 });
  }
}

// PUT: Update a bank details entry
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();

    // Validate the request body
    const result = UpdateBankDetailsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    const validatedData = result.data;

    // Check if the bank details exist
    const existingBankDetails = await db
      .select()
      .from(BankDetailsTable)
      .where(eq(BankDetailsTable.id, id));

    if (!existingBankDetails.length) {
      return NextResponse.json({ error: 'Bank details not found' }, { status: 404 });
    }

    // Handle primary status if it's being changed
    if (validatedData.is_primary !== undefined && validatedData.is_primary) {
      // If setting this as primary, update all others to not be primary
      await db
        .update(BankDetailsTable)
        .set({ is_primary: false })
        .where(sql`id != ${id}`);
    }

    // Prepare update data
    const updateData: {
      updated_at: Date;
      updated_by: string;
      name?: string;
      details?: string;
      is_primary?: boolean;
    } = {
      updated_at: new Date(),
      updated_by: validatedData.updated_by || existingBankDetails[0].updated_by || 'system',
    };

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.details !== undefined) {
      updateData.details = validatedData.details;
    }
    if (validatedData.is_primary !== undefined) {
      updateData.is_primary = validatedData.is_primary;
    }

    // Update bank details
    const updatedBankDetails = await db
      .update(BankDetailsTable)
      .set(updateData)
      .where(eq(BankDetailsTable.id, id))
      .returning();

    return NextResponse.json(
      {
        message: 'Bank details updated successfully',
        bankDetails: updatedBankDetails[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating bank details:', error);
    return NextResponse.json({ error: 'Failed to update bank details' }, { status: 500 });
  }
}

// DELETE: Remove a bank details entry
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);

    // Check if the bank details exist and if they are primary
    const existingBankDetails = await db
      .select()
      .from(BankDetailsTable)
      .where(eq(BankDetailsTable.id, id));

    if (!existingBankDetails.length) {
      return NextResponse.json({ error: 'Bank details not found' }, { status: 404 });
    }

    // Don't allow deletion of primary bank details
    if (existingBankDetails[0].is_primary) {
      return NextResponse.json(
        { error: 'Cannot delete primary bank details. Set another as primary first.' },
        { status: 400 }
      );
    }

    // Delete bank details
    const deletedBankDetails = await db
      .delete(BankDetailsTable)
      .where(eq(BankDetailsTable.id, id))
      .returning();

    return NextResponse.json(
      {
        message: 'Bank details deleted successfully',
        bankDetails: deletedBankDetails[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting bank details:', error);
    return NextResponse.json({ error: 'Failed to delete bank details' }, { status: 500 });
  }
}
