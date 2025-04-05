import { type InferInsertModel } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { db } from '@/lib/drizzle';
import { SalesTable } from '@/lib/models/sales';
import { CreateSalesSchema } from '@/lib/schemas/salesSchema';

type SalesInsert = InferInsertModel<typeof SalesTable>;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the request body against our schema
    const validatedData = CreateSalesSchema.parse({
      ...body,
      date: new Date(body.date),
    });

    // Insert the new sales record
    const result = await db
      .insert(SalesTable)
      .values({
        date: validatedData.date.toISOString().split('T')[0],
        customer_id: validatedData.customer_id,
        product_id: validatedData.product_id,
        qty: validatedData.qty,
        mrp: validatedData.mrp.toString(),
        discount_type: validatedData.discount_type || 'NONE',
        discount_value: (validatedData.discount_value || 0).toString(),
        salesman_id: validatedData.salesman_id,
        ship_to: validatedData.ship_to || null,
        invoice_id: validatedData.invoice_id || null,
        created_by: body.created_by || 'system',
        updated_by: body.updated_by || 'system',
      } as SalesInsert)
      .returning();

    return NextResponse.json(
      {
        message: 'Sales record created successfully',
        sale: result[0],
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating sales record:', error);

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create sales record',
      },
      { status: 500 }
    );
  }
}
