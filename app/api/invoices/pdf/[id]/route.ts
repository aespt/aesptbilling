import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';
import { db } from '@/lib/db';
import { InvoicesTable } from '@/lib/models/invoices';
import { InvoiceItemsTable } from '@/lib/models/invoice_items';
import { CustomersTable } from '@/lib/models/customers';
import { ProductsTable } from '@/lib/models/products';
import { eq } from 'drizzle-orm';
import format from 'date-fns/format';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Use any type to avoid TypeScript errors with Puppeteer's Browser type
  let browser: any = null;
  
  try {
    console.log('Starting PDF generation for invoice ID:', params.id);
    
    const invoiceId = parseInt(params.id);

    if (isNaN(invoiceId)) {
      console.error('Invalid invoice ID:', params.id);
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    console.log('Fetching invoice data from database');
    // Get invoice data from database
    const invoices = await db
      .select()
      .from(InvoicesTable)
      .where(eq(InvoicesTable.id, invoiceId));
    
    if (!invoices || invoices.length === 0) {
      console.error('Invoice not found:', invoiceId);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    const invoice = invoices[0];
    console.log('Invoice found:', invoice.invoice_number);

    console.log('Fetching customer data');
    // Get customer data
    const customers = await db
      .select()
      .from(CustomersTable)
      .where(eq(CustomersTable.id, invoice.customer_id));
    
    const customer = customers.length > 0 ? customers[0] : null;
    console.log('Customer data retrieved:', customer ? 'Yes' : 'No');

    console.log('Fetching invoice items');
    // Get invoice items
    const invoiceItems = await db
      .select()
      .from(InvoiceItemsTable)
      .where(eq(InvoiceItemsTable.invoice_id, invoiceId));
    
    console.log(`Found ${invoiceItems.length} invoice items`);

    console.log('Fetching product data');
    // Get products for invoice items
    const productsMap = new Map();
    
    // Fetch products one by one
    for (const item of invoiceItems) {
      const productRows = await db
        .select()
        .from(ProductsTable)
        .where(eq(ProductsTable.id, item.product_id));
        
      if (productRows.length > 0) {
        productsMap.set(item.product_id, productRows[0]);
      }
    }
    console.log(`Found ${productsMap.size} products`);

    console.log('Reading HTML template');
    // Read the HTML template
    const templatePath = path.join(process.cwd(), 'app/templates/invoice-template.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    console.log('Template read successfully');

    // Format invoice date
    const formattedDate = format(new Date(invoice.invoice_date), 'MMMM dd, yyyy');

    console.log('Filling template with invoice data');
    // Fill in the customer details
    htmlTemplate = htmlTemplate.replace('{{customerAddress}}', customer?.address || 'N/A');
    // Use a default value for tax number as it's not defined in the customer model
    const taxRegNo = 'N/A'; // Customize as needed
    htmlTemplate = htmlTemplate.replace('{{taxRegNo}}', taxRegNo);
    htmlTemplate = htmlTemplate.replace('{{shipToCountry}}', 'Emirates');

    // Fill in the invoice details
    htmlTemplate = htmlTemplate.replace('{{invoiceNumber}}', invoice.invoice_number);
    htmlTemplate = htmlTemplate.replace('{{invoiceDate}}', formattedDate);
    htmlTemplate = htmlTemplate.replace('{{orderNo}}', invoice.id.toString());
    htmlTemplate = htmlTemplate.replace('{{salesperson}}', invoice.salesperson_name);
    htmlTemplate = htmlTemplate.replace('{{shipFrom}}', 'Emirates');

    // Generate invoice items HTML
    let itemsHtml = '';
    invoiceItems.forEach((item, index) => {
      const product = productsMap.get(item.product_id);
      const taxRate = invoice.tax_rate ? parseFloat(invoice.tax_rate.toString()) : 0;
      const unitPrice = parseFloat(item.unit_price.toString());
      const quantity = parseFloat(item.quantity.toString());
      const vatAmount = unitPrice * taxRate / 100 * quantity;
      const totalAmount = parseFloat(item.total_price.toString());
      
      itemsHtml += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd">${index + 1}</td>
          <td style="padding: 8px; border: 1px solid #ddd">${product?.partNo || 'N/A'}</td>
          <td style="padding: 8px; border: 1px solid #ddd">${product?.name || 'N/A'}</td>
          <td style="padding: 8px; border: 1px solid #ddd">${item.quantity}</td>
          <td style="padding: 8px; border: 1px solid #ddd">${item.unit_price}</td>
          <td style="padding: 8px; border: 1px solid #ddd">${(unitPrice * quantity).toFixed(2)}</td>
          <td style="padding: 8px; border: 1px solid #ddd">${taxRate}</td>
          <td style="padding: 8px; border: 1px solid #ddd">${vatAmount.toFixed(2)}</td>
          <td style="padding: 8px; border: 1px solid #ddd">${totalAmount.toFixed(2)}</td>
        </tr>
      `;
    });
    htmlTemplate = htmlTemplate.replace('{{invoiceItems}}', itemsHtml);

    // Fill in the totals
    const subtotal = parseFloat(invoice.sub_total.toString()).toFixed(2);
    const discount = invoice.discount ? parseFloat(invoice.discount.toString()).toFixed(2) : '0.00';
    const taxRate = invoice.tax_rate ? parseFloat(invoice.tax_rate.toString()) : 0;
    const taxAmount = (parseFloat(subtotal) * taxRate / 100).toFixed(2);
    const total = parseFloat(invoice.total.toString()).toFixed(2);

    htmlTemplate = htmlTemplate.replace('{{subtotal}}', subtotal);
    const taxType = invoice.tax_type || 'Tax';
    htmlTemplate = htmlTemplate.replace('{{taxType}}', taxType);
    htmlTemplate = htmlTemplate.replace('{{taxAmount}}', taxAmount);
    htmlTemplate = htmlTemplate.replace('{{discount}}', discount);
    htmlTemplate = htmlTemplate.replace('{{total}}', total);
    
    console.log('Template filled successfully');

    console.log('Launching Puppeteer');
    
    // Launch browser with optimized settings for Apple Silicon
    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    };

    try {
      browser = await puppeteer.launch(launchOptions);
      console.log('Puppeteer launched successfully');
      
      const page = await browser.newPage();
      console.log('New page created');
      
      console.log('Setting page content');
      await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });
      console.log('Content set, generating PDF');
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '15mm',
          right: '10mm',
          bottom: '15mm',
          left: '10mm'
        },
        scale: 0.98, // Slightly reduce scale to ensure content fits
      });
      
      console.log('PDF generated successfully');
      
      if (browser) {
        await browser.close();
        browser = null;
        console.log('Browser closed');
      }
      
      console.log('Returning PDF response');
      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="invoice-${invoice.invoice_number}.pdf"`,
        },
      });
    } catch (error) {
      console.error('Puppeteer error:', error);
      
      // Clean up if browser is still open
      if (browser) {
        await browser.close();
        browser = null;
      }
      
      throw error; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Make sure to close browser if an error occurs
    if (browser) {
      await browser.close();
    }
    
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 