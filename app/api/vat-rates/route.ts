import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { VatMasterTable } from '@/lib/models/vat_master';
import { desc, lte, gte, and, or, isNull } from 'drizzle-orm';

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
          or(
            isNull(VatMasterTable.effective_to),
            gte(VatMasterTable.effective_to, currentDate)
          )
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
    return NextResponse.json(
      { error: 'Failed to fetch VAT rates' },
      { status: 500 }
    );
  }
} 