import { and, desc, gte, isNull, lte, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { db } from '@/lib/drizzle';
import { VatMasterTable } from '@/lib/models/vat_master';
import { CreateVatMasterSchema } from '@/lib/schemas/vatMasterSchema';

export async function GET() {
  try {
    const currentDate = new Date();

    // Fetch VAT rates that are currently effective
    // (effective_from <= current date and effective_to is null or >= current date)
    const vatRates = await db
      .select()
      .from(VatMasterTable)
      .where(
        and(
          lte(VatMasterTable.effective_from, currentDate),
          or(isNull(VatMasterTable.effective_to), gte(VatMasterTable.effective_to, currentDate))
        )
      )
      .orderBy(desc(VatMasterTable.effective_from));

    // If no current VAT rates found, get the most recent ones
    if (vatRates.length === 0) {
      const allVatRates = await db
        .select()
        .from(VatMasterTable)
        .orderBy(desc(VatMasterTable.effective_from))
        .limit(5);

      return NextResponse.json({ vatRates: allVatRates }, { status: 200 });
    }

    return NextResponse.json({ vatRates }, { status: 200 });
  } catch (error) {
    console.error('Error fetching VAT rates:', error);
    return NextResponse.json({ error: 'Failed to fetch VAT rates' }, { status: 500 });
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
    const validatedData = CreateVatMasterSchema.parse({
      country: 'UAE',
      vat_percentage: body.vat_percentage,
      description: 'VAT settings updated via admin panel',
      effective_from: effectiveFrom,
      effective_to: effectiveTo,
      created_by: 'system',
      updated_by: 'system',
    });

    // Check if a VAT record already exists
    const existingVat = await db
      .select()
      .from(VatMasterTable)
      .orderBy(desc(VatMasterTable.created_at))
      .limit(1);

    if (existingVat.length > 0) {
      // Update existing record
      const updated = await db
        .update(VatMasterTable)
        .set({
          vat_percentage: String(validatedData.vat_percentage),
          description: validatedData.description,
          effective_from: validatedData.effective_from,
          effective_to: validatedData.effective_to,
          updated_at: new Date(),
          updated_by: 'system',
        })
        .where(
          and(or(isNull(VatMasterTable.effective_to), gte(VatMasterTable.effective_to, new Date())))
        )
        .returning();

      return NextResponse.json(
        {
          message: 'VAT rate updated successfully',
          data: updated,
        },
        { status: 200 }
      );
    } else {
      // Create new record
      const inserted = await db
        .insert(VatMasterTable)
        .values({
          country: validatedData.country,
          vat_percentage: String(validatedData.vat_percentage),
          description: validatedData.description,
          effective_from: validatedData.effective_from,
          effective_to: validatedData.effective_to,
          created_by: validatedData.created_by || 'system',
          updated_by: validatedData.updated_by || 'system',
        })
        .returning();

      return NextResponse.json(
        {
          message: 'VAT rate created successfully',
          data: inserted,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Error updating VAT rate:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update VAT rate' }, { status: 500 });
  }
}
