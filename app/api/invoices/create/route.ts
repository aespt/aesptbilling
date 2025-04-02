import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { InvoicesTable } from '@/lib/models/invoices';
import { InvoiceItemsTable } from '@/lib/models/invoice_items';
import { ZodError } from 'zod';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Create the invoice first
      const [newInvoice] = await tx.insert(InvoicesTable).values({
        invoice_number: body.invoice_number,
        invoice_date: new Date(body.date),
        user_id: 1, // Default to user ID 1 - replace with actual user ID from session
        customer_id: body.customer_id,
        salesman_id: body.salesman_id || null,
        tax_type: body.tax_type,
        tax_rate: String(body.tax_type === 'VAT' ? body.vat_percentage : 
              body.tax_type === 'GST' ? body.cgst_percentage + body.sgst_percentage : 0),
        sub_total: String(body.subtotal),
        total: String(body.total),
        discount: body.discount,
        ship_to: body.ship_to,
        ship_from: body.ship_from,
        profit: body.profit,
        created_by: 'system',
        updated_by: 'system'
      }).returning();
        
      if (!newInvoice) {
        throw new Error('Failed to create invoice');
      }
      
      // Process invoice items
      if (body.items && Array.isArray(body.items) && body.items.length > 0) {
        // Filter out items without product_id
        const validItems = body.items.filter((item: any) => item.product_id);
        
        if (validItems.length === 0) {
          throw new Error('No valid items provided');
        }
        
        // Prepare invoice items
        const invoiceItems = validItems.map((item: any) => ({
          invoice_id: newInvoice.id,
          product_id: item.product_id,
          quantity: item.qty,
          unit_price: String(item.rate),
          total_price: String(item.total),
          created_by: 'system',
          updated_by: 'system'
        }));
        
        // Insert all invoice items
        await tx.insert(InvoiceItemsTable).values(invoiceItems);
      } else {
        throw new Error('At least one invoice item is required');
      }
      
      return newInvoice;
    });
    
    return NextResponse.json({
      success: true,
      message: 'Invoice created successfully',
      data: result
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    
    // Handle validation errors specifically
    if (error instanceof ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to create invoice', 
      message: error.message 
    }, { status: 500 });
  }
} 