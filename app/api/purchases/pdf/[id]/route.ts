import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';

import { db } from '@/lib/drizzle';
import { ProductsTable } from '@/lib/models/products';
import { PurchaseItemsTable } from '@/lib/models/purchase_items';
import { PurchasesTable } from '@/lib/models/purchases';
import { SuppliersTable } from '@/lib/models/suppliers';
import { AUTH_COOKIE_NAME } from '@/lib/utils/jwt';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get the auth token from cookies
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const purchaseId = parseInt((await params).id);
    if (isNaN(purchaseId)) {
      return NextResponse.json({ error: 'Invalid purchase ID' }, { status: 400 });
    }

    // Fetch purchase details
    const [purchase] = await db
      .select()
      .from(PurchasesTable)
      .where(eq(PurchasesTable.id, purchaseId));

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // Fetch supplier details
    const [supplier] = await db
      .select()
      .from(SuppliersTable)
      .where(eq(SuppliersTable.id, purchase.supplier_id));

    // Fetch purchase items
    const purchaseItems = await db
      .select()
      .from(PurchaseItemsTable)
      .where(eq(PurchaseItemsTable.purchase_id, purchaseId));

    // Fetch product details for each purchase item
    const itemsWithProducts = await Promise.all(
      purchaseItems.map(async item => {
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
    const pdfBuffer = await generatePDF(purchase, supplier, itemsWithProducts);

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="purchase-${purchase.purchase_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating purchase PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

async function generatePDF(
  purchase: typeof PurchasesTable.$inferSelect,
  supplier: typeof SuppliersTable.$inferSelect,
  items: (typeof PurchaseItemsTable.$inferSelect & {
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
      doc.fontSize(20).text('PURCHASE ORDER', { align: 'center' }).moveDown();

      // Purchase Info
      doc
        .fontSize(12)
        .text(`Purchase Number: ${purchase.purchase_number}`)
        .text(`Date: ${new Date(purchase.purchase_date).toLocaleDateString()}`)
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
        .text(`Ship From: ${purchase.ship_from || 'N/A'}`)
        .moveDown();

      // Items Table
      doc.fontSize(14).text('Purchase Items', { underline: true }).moveDown();

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
          .text(item.product?.description || '', 150, y, { width: 140 })
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
        .text(`$${parseFloat(purchase.sub_total).toFixed(2)}`, 450, y, {
          width: 70,
          align: 'right',
        });

      y += 15;
      doc
        .fontSize(10)
        .text('Discount:', 350, y, { width: 70, align: 'right' })
        .text(`$${parseFloat(purchase.discount?.toString() || '0').toFixed(2)}`, 450, y, {
          width: 70,
          align: 'right',
        });

      if (purchase.tax_type !== 'NONE') {
        y += 15;
        doc
          .fontSize(10)
          .text(
            `${purchase.tax_type} (${parseFloat(purchase.tax_rate?.toString() || '0').toFixed(2)}%):`,
            350,
            y,
            {
              width: 70,
              align: 'right',
            }
          )
          .text(
            `$${(((parseFloat(purchase.sub_total.toString()) - parseFloat(purchase.discount?.toString() || '0')) * parseFloat(purchase.tax_rate?.toString() || '0')) / 100).toFixed(2)}`,
            450,
            y,
            { width: 70, align: 'right' }
          );
      }

      y += 20;
      doc
        .fontSize(12)
        .text('Total:', 350, y, { width: 70, align: 'right' })
        .text(`$${parseFloat(purchase.total).toFixed(2)}`, 450, y, { width: 70, align: 'right' });

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
