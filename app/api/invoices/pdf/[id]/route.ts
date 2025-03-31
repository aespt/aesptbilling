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
import { AddressTable } from '@/lib/models/address';
import * as cheerio from 'cheerio';

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

    // Get primary address
    const addresses = await db
      .select()
      .from(AddressTable)
      .where(eq(AddressTable.is_primary, true));
    
    const primaryAddress = addresses.length > 0 ? addresses[0] : null;
    console.log('Primary address retrieved:', primaryAddress ? 'Yes' : 'No');

    if (!primaryAddress) {
      console.warn('No primary address found, using default address');
      // You could either use a default address or return an error
      // return NextResponse.json({ error: 'No primary address configured' }, { status: 500 });
    }

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

    console.log('Loading template into cheerio');
    // Load HTML template into cheerio
    const $ = cheerio.load(htmlTemplate);

    // Fill in the customer details
    $('#customer-address').text(customer?.address || 'N/A');
    // Use a default value for tax number as it's not defined in the customer model
    const taxRegNo = 'N/A'; // Customize as needed
    $('#tax-reg-no').html(`<span style="font-weight: bold">TAX Reg No:</span> ${taxRegNo}`);
    $('#ship-to-country').html(`<span style="font-weight: bold">Ship to Country/Emirate:</span> Emirates`);

    // Fill in the invoice details
    $('#invoice-number').text(invoice.invoice_number);
    $('#invoice-date').text(formattedDate);
    $('#order-no').text(invoice.id.toString());
    $('#salesperson').text(invoice.salesperson_name);
    $('#ship-from').text('Emirates');

    console.log('Fetching company address', primaryAddress);

    // Update the company address section in the template
    if (primaryAddress) {
      let addressHtml = `
        <p style="margin: 0">${primaryAddress.street}</p>
        <p style="margin: 0">${primaryAddress.city}${primaryAddress.state ? ', ' + primaryAddress.state : ''}</p>
        <p style="margin: 0">${primaryAddress.country} ${primaryAddress.postal_code}</p>
      `;
      
      // Use type assertion with optional chaining to avoid TypeScript errors
      const addressWithExtras = primaryAddress as any;
      
      // Only add phone number if it exists
      if (addressWithExtras.phone_no) {
        addressHtml += `<p style="margin: 0">Tel: ${addressWithExtras.phone_no}</p>`;
      }
      
      // Only add fax number if it exists
      if (addressWithExtras.fax_no) {
        addressHtml += `<p style="margin: 0">Fax: ${addressWithExtras.fax_no}</p>`;
      }
      
      // Only add transaction number if it exists
      if (addressWithExtras.transaction_no) {
        addressHtml += `<p style="margin: 0">TRN NO: ${addressWithExtras.transaction_no}</p>`;
      }
      
      $('#address').html(addressHtml);
    }

    // Clear existing invoice items placeholder
    $('#invoice-items-body').empty();
    
    // Generate invoice items and append them to the table
    invoiceItems.forEach((item, index) => {
      const product = productsMap.get(item.product_id);
      const taxRate = invoice.tax_rate ? parseFloat(invoice.tax_rate.toString()) : 0;
      const unitPrice = parseFloat(item.unit_price.toString());
      const quantity = parseFloat(item.quantity.toString());
      const vatAmount = unitPrice * taxRate / 100 * quantity;
      const totalAmount = parseFloat(item.total_price.toString());
      
      // Create a new row with an ID for easier identification
      const $row = $('<tr>').attr('id', `invoice-item-${item.id}`);
      
      // Append cells with data
      $row.append($('<td>').attr('style', 'padding: 8px; border: 1px solid #ddd').text((index + 1).toString()));
      $row.append($('<td>').attr('style', 'padding: 8px; border: 1px solid #ddd').text(product?.partNo || 'N/A'));
      $row.append($('<td>').attr('style', 'padding: 8px; border: 1px solid #ddd').text(product?.name || 'N/A'));
      $row.append($('<td>').attr('style', 'padding: 8px; border: 1px solid #ddd').text(item.quantity.toString()));
      $row.append($('<td>').attr('style', 'padding: 8px; border: 1px solid #ddd').text(item.unit_price.toString()));
      $row.append($('<td>').attr('style', 'padding: 8px; border: 1px solid #ddd').text((unitPrice * quantity).toFixed(2)));
      $row.append($('<td>').attr('style', 'padding: 8px; border: 1px solid #ddd').text(taxRate.toString()));
      $row.append($('<td>').attr('style', 'padding: 8px; border: 1px solid #ddd').text(vatAmount.toFixed(2)));
      $row.append($('<td>').attr('style', 'padding: 8px; border: 1px solid #ddd').text(totalAmount.toFixed(2)));
      
      // Append the row to the table body
      $('#invoice-items-body').append($row);
    });

    // Fill in the totals
    const subtotal = parseFloat(invoice.sub_total.toString()).toFixed(2);
    const discount = invoice.discount ? parseFloat(invoice.discount.toString()).toFixed(2) : '0.00';
    const taxRate = invoice.tax_rate ? parseFloat(invoice.tax_rate.toString()) : 0;
    const taxAmount = (parseFloat(subtotal) * taxRate / 100).toFixed(2);
    const total = parseFloat(invoice.total.toString()).toFixed(2);

    $('#subtotal').text(`${subtotal} AED`);
    const taxType = invoice.tax_type || 'Tax';
    $('#tax-type').text(taxType);
    $('#tax-amount').text(`${taxAmount} AED`);
    $('#discount').text(`${discount} AED`);
    $('#invoice-total').text(`${total} AED`);
    
    console.log('Template filled successfully with cheerio');

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
      await page.setContent($.html(), { waitUntil: 'networkidle0' });
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