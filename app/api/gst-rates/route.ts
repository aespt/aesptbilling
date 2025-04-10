import { and, desc, gte, isNull, lte, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { db } from '@/lib/drizzle';
import { GstMasterTable } from '@/lib/models/gst_master';
import { CreateGstMasterSchema } from '@/lib/schemas/gstMasterSchema';

export async function GET() {
  try {
    const currentDate = new Date();

    // Fetch GST rates that are currently effective
    // (effective_from <= current date and effective_to is null or >= current date)
    const gstRates = await db
      .select()
      .from(GstMasterTable)
      .where(
        and(
          lte(GstMasterTable.effective_from, currentDate),
          or(isNull(GstMasterTable.effective_to), gte(GstMasterTable.effective_to, currentDate))
        )
      )
      .orderBy(desc(GstMasterTable.effective_from));

    // If no current GST rates found, get the most recent ones
    if (gstRates.length === 0) {
      const allGstRates = await db
        .select()
        .from(GstMasterTable)
        .orderBy(desc(GstMasterTable.effective_from))
        .limit(5);

      return NextResponse.json({ gstRates: allGstRates }, { status: 200 });
    }

    return NextResponse.json({ gstRates }, { status: 200 });
  } catch (error) {
    console.error('Error fetching GST rates:', error);
    return NextResponse.json({ error: 'Failed to fetch GST rates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Set effective date as today and effective_to as 1 year later
    const effectiveFrom = new Date();
    const effectiveTo = new Date();
    effectiveTo.setFullYear(effectiveTo.getFullYear() + 1);

    // Validate the input using Zod schema
    const validatedData = CreateGstMasterSchema.parse({
      country: 'India',
      cgst_percentage: body.cgst_percentage,
      sgst_percentage: body.sgst_percentage,
      description: 'GST settings updated via admin panel',
      effective_from: effectiveFrom,
      effective_to: effectiveTo,
      created_by: 'system',
      updated_by: 'system',
    });

    // Check if a GST record already exists
    const existingGst = await db
      .select()
      .from(GstMasterTable)
      .orderBy(desc(GstMasterTable.created_at))
      .limit(1);

    if (existingGst.length > 0) {
      // Update existing record
      const updated = await db
        .update(GstMasterTable)
        .set({
          cgst_percentage: String(validatedData.cgst_percentage),
          sgst_percentage: String(validatedData.sgst_percentage),
          description: validatedData.description,
          effective_from: validatedData.effective_from,
          effective_to: validatedData.effective_to,
          updated_at: new Date(),
          updated_by: 'system',
        })
        .where(
          and(or(isNull(GstMasterTable.effective_to), gte(GstMasterTable.effective_to, new Date())))
        )
        .returning();

      return NextResponse.json(
        {
          message: 'GST rates updated successfully',
          data: updated,
        },
        { status: 200 }
      );
    } else {
      // Create new record
      const inserted = await db
        .insert(GstMasterTable)
        .values({
          country: validatedData.country,
          cgst_percentage: String(validatedData.cgst_percentage),
          sgst_percentage: String(validatedData.sgst_percentage),
          description: validatedData.description,
          effective_from: validatedData.effective_from,
          effective_to: validatedData.effective_to,
          created_by: validatedData.created_by || 'system',
          updated_by: validatedData.updated_by || 'system',
        })
        .returning();

      return NextResponse.json(
        {
          message: 'GST rates created successfully',
          data: inserted,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Error updating GST rates:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update GST rates' }, { status: 500 });
  }
}
