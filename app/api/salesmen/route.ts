import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { SalesmenTable } from '@/lib/models/salesmen';
import { desc, eq } from 'drizzle-orm';
import { CreateSalesmanSchema, UpdateSalesmanSchema } from '@/lib/schemas/salesmanSchema';
import { ZodError } from 'zod';

export async function GET() {
  try {
    // Fetch all salesmen from the database, ordered by most recent first
    const salesmen = await db
      .select()
      .from(SalesmenTable)
      .orderBy(desc(SalesmenTable.created_at));

    return NextResponse.json({ salesmen }, { status: 200 });
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
      created_at: new Date(),
      updated_at: new Date(),
    }).returning();
    
    return NextResponse.json({ 
      message: 'Salesman created successfully',
      salesman: newSalesman[0]
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating salesman:', error);
    
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