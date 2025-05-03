import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';

import { db } from '@/lib/drizzle';
import { ProductsTable } from '@/lib/models/products';
import { PurchaseEntriesTable } from '@/lib/models/purchase_entries';
import { PurchaseEntryItemsTable } from '@/lib/models/purchase_entry_items';
import { SuppliersTable } from '@/lib/models/suppliers';
import { type TokenPayload } from '@/lib/schemas/authSchema';
import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/utils/jwt';

export async function GET(request: NextRequest) {
  try {
    // Get the auth token from cookies
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify token
    const payload = verifyToken<TokenPayload>(token);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Get purchase entry id from query string
    const { searchParams } = new URL(request.url);
    const purchaseEntryId = searchParams.get('id');

    if (!purchaseEntryId) {
      return NextResponse.json({ error: 'Purchase entry ID is required' }, { status: 400 });
    }

    // Get purchase entry details
    const [purchaseEntry] = await db
      .select()
      .from(PurchaseEntriesTable)
      .where(eq(PurchaseEntriesTable.id, parseInt(purchaseEntryId, 10)));

    if (!purchaseEntry) {
      return NextResponse.json({ error: 'Purchase entry not found' }, { status: 404 });
    }

    // Get supplier details
    const [supplier] = await db
      .select()
      .from(SuppliersTable)
      .where(eq(SuppliersTable.id, purchaseEntry.supplier_id));

    // Get purchase entry items
    const purchaseEntryItems = await db
      .select()
      .from(PurchaseEntryItemsTable)
      .where(eq(PurchaseEntryItemsTable.purchase_entry_id, parseInt(purchaseEntryId, 10)));

    // Get product details for each item
    const itemsWithProducts = await Promise.all(
      purchaseEntryItems.map(async item => {
        const [product] = await db
          .select()
          .from(ProductsTable)
          .where(eq(ProductsTable.id, item.product_id));

        return {
          ...item,
          product,
        };
      })
    );

    // Generate PDF
    const pdfBuffer = await generatePDF(purchaseEntry, supplier, itemsWithProducts);

    // Set headers for PDF download
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set(
      'Content-Disposition',
      `attachment; filename="purchase-entry-${purchaseEntry.purchaseentry_number}.pdf"`
    );

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error generating purchase entry PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

async function generatePDF(
  purchaseEntry: typeof PurchaseEntriesTable.$inferSelect,
  supplier: typeof SuppliersTable.$inferSelect,
  items: (typeof PurchaseEntryItemsTable.$inferSelect & {
    product?: typeof ProductsTable.$inferSelect;
  })[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(20).text('PURCHASE ENTRY', { align: 'center' }).moveDown();

      // Purchase Entry Info
      doc
        .fontSize(12)
        .text(`Purchase Entry Number: ${purchaseEntry.purchaseentry_number}`)
        .text(`Date: ${new Date(purchaseEntry.purchaseentry_date).toLocaleDateString()}`)
        .moveDown();

      // Supplier Info
      doc.fontSize(14).text('Supplier', { underline: true }).fontSize(12);

      if (supplier) {
        doc
          .text(`Name: ${supplier.name}`)
          .text(`Address: ${supplier.address || 'N/A'}`)
          .text(`Contact: ${supplier.contact_number || 'N/A'}`);
      } else {
        doc.text('Supplier information not available');
      }

      doc.moveDown();

      // Ship From
      doc
        .fontSize(14)
        .text('Shipping Information', { underline: true })
        .fontSize(12)
        .text(`Ship From: ${purchaseEntry.ship_from || 'N/A'}`)
        .moveDown();

      // Items Table
      doc.fontSize(14).text('Purchase Entry Items', { underline: true }).moveDown();

      // Table header
      const tableTop = doc.y;
      doc
        .fontSize(10)
        .text('Part No', 50, tableTop)
        .text('Description', 150, tableTop)
        .text('Qty', 300, tableTop, { width: 40, align: 'right' })
        .text('Rate', 350, tableTop, { width: 70, align: 'right' })
        .text('Total', 450, tableTop, { width: 70, align: 'right' });

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(520, tableTop + 15)
        .stroke();

      // Table rows
      let y = tableTop + 30;
      items.forEach(item => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        doc
          .fontSize(10)
          .text(item.product?.partNo || '', 50, y)
          .text(item.product?.name || '', 150, y, { width: 140 })
          .text(String(item.quantity), 300, y, { width: 40, align: 'right' })
          .text(`$${parseFloat(item.rate).toFixed(2)}`, 350, y, { width: 70, align: 'right' })
          .text(`$${parseFloat(item.total_price).toFixed(2)}`, 450, y, {
            width: 70,
            align: 'right',
          });

        y += 20;
      });

      doc.moveTo(50, y).lineTo(520, y).stroke();

      // Summary
      y += 20;
      doc
        .fontSize(10)
        .text('Subtotal:', 350, y, { width: 70, align: 'right' })
        .text(`$${parseFloat(purchaseEntry.sub_total).toFixed(2)}`, 450, y, {
          width: 70,
          align: 'right',
        });

      y += 15;
      doc
        .fontSize(10)
        .text('Discount:', 350, y, { width: 70, align: 'right' })
        .text(`$${parseFloat(purchaseEntry.discount?.toString() || '0').toFixed(2)}`, 450, y, {
          width: 70,
          align: 'right',
        });

      if (purchaseEntry.tax_type !== 'NONE') {
        y += 15;
        doc
          .fontSize(10)
          .text(
            `${purchaseEntry.tax_type} (${parseFloat(purchaseEntry.tax_rate?.toString() || '0').toFixed(2)}%):`,
            350,
            y,
            {
              width: 70,
              align: 'right',
            }
          )
          .text(
            `$${(((parseFloat(purchaseEntry.sub_total.toString()) - parseFloat(purchaseEntry.discount?.toString() || '0')) * parseFloat(purchaseEntry.tax_rate?.toString() || '0')) / 100).toFixed(2)}`,
            450,
            y,
            { width: 70, align: 'right' }
          );
      }

      y += 20;
      doc
        .fontSize(12)
        .text('Total:', 350, y, { width: 70, align: 'right' })
        .text(`$${parseFloat(purchaseEntry.total).toFixed(2)}`, 450, y, {
          width: 70,
          align: 'right',
        });

      // Footer
      doc
        .fontSize(10)
        .text(
          'This is a computer-generated document. No signature is required.',
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
