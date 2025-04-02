import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { SuppliersTable } from '@/lib/models/suppliers';
import { desc, eq, sql } from 'drizzle-orm';
import { CreateSupplierSchema, UpdateSupplierSchema } from '@/lib/schemas/supplierSchema';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    
    // Calculate offset
    const offset = (page - 1) * pageSize;
    
    // Fetch paginated suppliers
    const suppliers = await db
      .select()
      .from(SuppliersTable)
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(SuppliersTable.created_at));
      
    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(SuppliersTable);
      
    const total = Number(countResult[0].count);
    const totalPages = Math.ceil(total / pageSize);
    
    // Create pagination info
    const paginationInfo = {
      total,
      totalPages,
      currentPage: page,
      pageSize,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    return NextResponse.json({ 
      suppliers, 
      pagination: paginationInfo 
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the input using Zod schema
    const validatedData = CreateSupplierSchema.parse(body);
    
    // Insert the new supplier into the database
    const newSupplier = await db.insert(SuppliersTable).values({
      tax_registration_number: validatedData.tax_registration_number,
      name: validatedData.name,
      address: validatedData.address,
      contact_number: validatedData.contact_number,
      created_at: new Date(),
      updated_at: new Date(),
    }).returning();
    
    return NextResponse.json({ 
      message: 'Supplier created successfully',
      supplier: newSupplier[0]
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating supplier:', error);
    
    // Check if it's a validation error
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create supplier' },
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
        { error: 'Supplier ID is required for updates' },
        { status: 400 }
      );
    }
    
    // Validate the input using Zod schema for updates
    const validatedData = UpdateSupplierSchema.parse(body);
    
    // Prepare update data
    const updateData: any = {};
    
    // Only include fields that are provided in the request
    if (validatedData.tax_registration_number !== undefined) {
      updateData.tax_registration_number = validatedData.tax_registration_number;
    }
    
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    
    if (validatedData.address !== undefined) {
      updateData.address = validatedData.address;
    }
    
    if (validatedData.contact_number !== undefined) {
      updateData.contact_number = validatedData.contact_number;
    }
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();
    
    // Update the supplier in the database
    const updatedSupplier = await db.update(SuppliersTable)
      .set(updateData)
      .where(eq(SuppliersTable.id, body.id))
      .returning();
    
    if (updatedSupplier.length === 0) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Supplier updated successfully',
      supplier: updatedSupplier[0]
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error updating supplier:', error);
    
    // Check if it's a validation error
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    );
  }
} 