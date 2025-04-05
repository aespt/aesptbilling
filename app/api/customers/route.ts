import { eq, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { db } from '@/lib/drizzle';
import { CustomersTable } from '@/lib/models/customers';
import { type CustomerUpdate, UpdateCustomerSchema } from '@/lib/schemas/customerSchema';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Fetch paginated customers
    const customers = await db
      .select()
      .from(CustomersTable)
      .limit(pageSize)
      .offset(offset)
      .orderBy(CustomersTable.name);

    // Get total count for pagination
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(CustomersTable);

    const total = Number(countResult[0].count);
    const totalPages = Math.ceil(total / pageSize);

    // Create pagination info
    const paginationInfo = {
      total,
      totalPages,
      currentPage: page,
      pageSize,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return NextResponse.json(
      {
        customers,
        pagination: paginationInfo,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newCustomer = await db
      .insert(CustomersTable)
      .values({
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        address: body.address || null,
      })
      .returning();

    return NextResponse.json({ customer: newCustomer[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();

    // Ensure we have an ID for the update
    if (!body.id) {
      return NextResponse.json({ error: 'Customer ID is required for updates' }, { status: 400 });
    }

    // Validate the input using Zod schema for updates
    const validatedData = UpdateCustomerSchema.parse(body);

    // Prepare update data
    const updateData: Partial<CustomerUpdate & { updated_at: Date }> = {};

    // Only include fields that are provided in the request
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }

    if (validatedData.email !== undefined) {
      updateData.email = validatedData.email;
    }

    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone || '';
    }

    if (validatedData.address !== undefined) {
      updateData.address = validatedData.address || '';
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the customer in the database
    const updatedCustomer = await db
      .update(CustomersTable)
      .set(updateData)
      .where(eq(CustomersTable.id, body.id))
      .returning();

    if (updatedCustomer.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: 'Customer updated successfully',
        customer: updatedCustomer[0],
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error updating customer:', error);

    // Check if it's a validation error
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    // Check if it's a unique constraint violation (duplicate email)
    if (
      error instanceof Error &&
      error.message.includes('duplicate key value violates unique constraint')
    ) {
      return NextResponse.json(
        { error: 'A customer with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    await db.delete(CustomersTable).where(eq(CustomersTable.id, parseInt(id, 10)));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
