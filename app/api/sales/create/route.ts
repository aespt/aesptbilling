import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { SalesTable } from '@/lib/models/sales';
import { CreateSalesSchema } from '@/lib/schemas/salesSchema';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the request body against our schema
    const validatedData = CreateSalesSchema.parse({
      ...body,
      date: new Date(body.date),
    });
    
    // Insert the new sales record
    const result = await db.insert(SalesTable).values({
      date: validatedData.date,
      customer_id: validatedData.customer_id,
      product_id: validatedData.product_id,
      qty: validatedData.qty,
      mrp: validatedData.mrp,
      discount_type: validatedData.discount_type || 'NONE',
      discount_value: validatedData.discount_value || 0,
      salesman_id: validatedData.salesman_id,
      ship_to: validatedData.ship_to || null,
      invoice_id: validatedData.invoice_id || null,
      created_by: body.created_by || 'system',
      updated_by: body.updated_by || 'system',
    }).returning();
    
    return NextResponse.json({ 
      message: 'Sales record created successfully',
      sale: result[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating sales record:', error);
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to create sales record' 
    }, { status: 500 });
  }
} 