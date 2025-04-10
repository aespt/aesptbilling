import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { SalesmenTable } from '@/lib/models/salesmen';
import { desc, eq, sql } from 'drizzle-orm';
import { CreateSalesmanSchema, UpdateSalesmanSchema } from '@/lib/schemas/salesmanSchema';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    
    // Calculate offset
    const offset = (page - 1) * pageSize;
    
    // Fetch paginated salesmen
    const salesmen = await db
      .select()
      .from(SalesmenTable)
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(SalesmenTable.created_at));
      
    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(SalesmenTable);
      
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
      salesmen, 
      pagination: paginationInfo 
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching salesmen:', error);
    return NextResponse.json(
      { error: 'Failed to fetch salesmen' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the input using Zod schema
    const validatedData = CreateSalesmanSchema.parse(body);
    
    // Insert the new salesman into the database
    const newSalesman = await db.insert(SalesmenTable).values({
      name: validatedData.name,
      contact_number: validatedData.contact_number,
      email: validatedData.email,
      created_at: new Date(),
      updated_at: new Date(),
    }).returning();
    
    return NextResponse.json({ 
      message: 'Salesman created successfully',
      salesman: newSalesman[0]
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating salesman:', error);
    
    // Check if it's a validation error
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create salesman' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Ensure ID is provided
    if (!body.id) {
      return NextResponse.json(
        { error: 'Salesman ID is required' },
        { status: 400 }
      );
    }
    
    // Validate the input using Zod schema
    const validatedData = UpdateSalesmanSchema.parse(body);
    
    // Prepare update data (only include fields that are provided)
    const updateData: any = {
      updated_at: new Date()
    };
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.contact_number !== undefined) updateData.contact_number = validatedData.contact_number;
    if (validatedData.email !== undefined) updateData.email = validatedData.email;
    
    // Update the salesman in the database
    const updatedSalesman = await db.update(SalesmenTable)
      .set(updateData)
      .where(eq(SalesmenTable.id, body.id))
      .returning();
    
    if (updatedSalesman.length === 0) {
      return NextResponse.json(
        { error: 'Salesman not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Salesman updated successfully',
      salesman: updatedSalesman[0]
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error updating salesman:', error);
    
    // Handle validation errors
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: formattedErrors 
      }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: 'Failed to update salesman' },
      { status: 500 }
    );
  }
} 