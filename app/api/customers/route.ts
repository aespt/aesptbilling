import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { CustomersTable } from '@/lib/models/customers';
import { desc, eq } from 'drizzle-orm';
import { CreateCustomerSchema, UpdateCustomerSchema } from '@/lib/schemas/customerSchema';
import { ZodError } from 'zod';

export async function GET() {
  try {
    // Fetch all customers from the database, ordered by most recent first
    const customers = await db
      .select()
      .from(CustomersTable)
      .orderBy(desc(CustomersTable.created_at));

    return NextResponse.json({ customers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the input using Zod schema
    const validatedData = CreateCustomerSchema.parse(body);
    
    // Insert the new customer into the database
    const newCustomer = await db.insert(CustomersTable).values({
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone || '',
      address: validatedData.address || '',
      created_at: new Date(),
      updated_at: new Date(),
    }).returning();
    
    return NextResponse.json({ 
      message: 'Customer created successfully',
      customer: newCustomer[0]
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating customer:', error);
    
    // Check if it's a validation error
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    // Check if it's a unique constraint violation (duplicate email)
    if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
      return NextResponse.json(
        { error: 'A customer with this email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Ensure we have an ID for the update
    if (!body.id) {
      return NextResponse.json(
        { error: 'Customer ID is required for updates' },
        { status: 400 }
      );
    }
    
    // Validate the input using Zod schema for updates
    const validatedData = UpdateCustomerSchema.parse(body);
    
    // Prepare update data
    const updateData: any = {};
    
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
    const updatedCustomer = await db.update(CustomersTable)
      .set(updateData)
      .where(eq(CustomersTable.id, body.id))
      .returning();
    
    if (updatedCustomer.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Customer updated successfully',
      customer: updatedCustomer[0]
    }, { status: 200 });
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
    if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
      return NextResponse.json(
        { error: 'A customer with this email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
} 