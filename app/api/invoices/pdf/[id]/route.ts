import * as fs from 'fs';
import * as path from 'path';

import * as cheerio from 'cheerio';
import { format } from 'date-fns';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { launch, type Browser } from 'puppeteer';

import { db } from '@/lib/drizzle';
import { AddressTable } from '@/lib/models/address';
import { CustomersTable } from '@/lib/models/customers';
import { InvoiceItemsTable } from '@/lib/models/invoice_items';
import { InvoicesTable } from '@/lib/models/invoices';
import { ProductsTable } from '@/lib/models/products';
import { SalesmenTable } from '@/lib/models/salesmen';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Use proper type for Puppeteer's Browser
  let browser: Browser | null = null;

  try {
    const invoiceId = parseInt((await params).id);

    if (isNaN(invoiceId)) {
      console.error('Invalid invoice ID:', (await params).id);
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    // Get the invoiceStage from query parameter if it exists
    const url = new URL(request.url);
    console.log('Request URL:', request.url);
    console.log('All URL search params:', Object.fromEntries(url.searchParams.entries()));

    const invoiceStage =
      url.searchParams.get('invoiceStage') ||
      url.searchParams.get('invoicestage') ||
      url.searchParams.get('InvoiceStage') ||
      url.searchParams.get('INVOICESTAGE');
    console.log('invoiceStage from URL params:', invoiceStage);

    // Get invoice data from database
    const invoices = await db.select().from(InvoicesTable).where(eq(InvoicesTable.id, invoiceId));

    if (!invoices || invoices.length === 0) {
      console.error('Invoice not found:', invoiceId);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Create a copy of the invoice to avoid modifying the original data
    const invoice = {
      ...invoices[0],
      // Override invoice_stage with the one from query params if it exists
      invoice_stage: invoiceStage || invoices[0].invoice_stage,
    };

    // Get customer data
    const customers = await db
      .select()
      .from(CustomersTable)
      .where(eq(CustomersTable.id, invoice.customer_id));

    // Get salesperson data only if salesperson_name exists
    const salesPerson = invoice.salesman_id
      ? await db.select().from(SalesmenTable).where(eq(SalesmenTable.id, invoice.salesman_id))
      : null;

    const customer = customers.length > 0 ? customers[0] : null;

    // Get primary address
    const addresses = await db.select().from(AddressTable).where(eq(AddressTable.is_primary, true));

    const primaryAddress = addresses.length > 0 ? addresses[0] : null;

    if (!primaryAddress) {
      console.warn('No primary address found, using default address');
      // You could either use a default address or return an error
      // return NextResponse.json({ error: 'No primary address configured' }, { status: 500 });
    }

    // Get invoice items
    const invoiceItems = await db
      .select()
      .from(InvoiceItemsTable)
      .where(eq(InvoiceItemsTable.invoice_id, invoiceId));

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

    // Read the HTML template
    const templatePath = path.join(process.cwd(), 'app/templates/invoice-template.html');
    const htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Format invoice date
    const formattedDate = format(new Date(invoice.invoice_date), 'MMMM dd, yyyy');

    // Load HTML template into cheerio
    const $ = cheerio.load(htmlTemplate);

    // Determine title based on invoiceStage
    let documentTitle = 'Invoice';
    if (invoiceStage === 'DELIVERY') {
      documentTitle = 'Delivery Note';
    } else if (invoiceStage === 'QUOTATION' || invoice.invoice_stage === 'QUOTATION') {
      documentTitle = 'Quotation';
    } else if (invoiceStage === 'PROFORMA' || invoice.invoice_stage === 'PROFORMA') {
      documentTitle = 'Proforma Invoice';
    } else if (invoiceStage === 'SALE' || invoice.invoice_stage === 'SALE') {
      documentTitle = 'Sale Invoice';
    }

    // Check if it's a delivery invoice and modify the table
    if (invoiceStage === 'DELIVERY') {
      // Remove pricing columns from the invoice table header
      $('table.invoice-items-table th:nth-child(5)').remove(); // Rate
      $('table.invoice-items-table th:nth-child(5)').remove(); // Amount
      $('table.invoice-items-table th:nth-child(5)').remove(); // VAT %
      $('table.invoice-items-table th:nth-child(5)').remove(); // VAT
      $('table.invoice-items-table th:nth-child(5)').remove(); // Total Amount

      // Hide the totals container entirely, including Terms & Conditions
      $('.invoice-footer').css('display', 'none');

      // Add some spacing after the table for a cleaner look
      $('.table-container').css('margin-bottom', '30px');
    }

    // Update document title for all document types
    $('title').text(documentTitle);
    $('#invoice-title').text(documentTitle);

    // Replace the logo path with data URL to ensure it works in Puppeteer
    const logoPath = path.join(process.cwd(), 'public/logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString('base64');
      $('img[src="logo.png"]').attr('src', `data:image/png;base64,${logoBase64}`);
    } else {
      console.warn('Logo file not found at:', logoPath);
    }

    // Fill in the customer details
    $('#customer-address').text(customer?.name || 'N/A');

    // Use a default value for tax number as it's not defined in the customer model
    const taxRegNo = 'N/A'; // Customize as needed

    // For delivery notes, we don't show tax registration
    if (invoiceStage !== 'DELIVERY') {
      $('#tax-reg-no').html(`<span style="font-weight: bold">TAX Reg No:</span> ${taxRegNo}`);
    } else {
      // Hide the tax registration number row
      $('#tax-reg-no').css('display', 'none');
    }

    $('#ship-to-country').html(
      `<span style="font-weight: bold">Ship to Country/Emirate:</span> Emirates`
    );

    // Fill in the invoice details
    $('#invoice-number').text(invoice.invoice_number);
    $('#invoice-date').text(formattedDate);
    // $('#order-no').text(invoice.id.toString());
    $('#salesperson').text(salesPerson?.[0]?.name || 'N/A');
    $('#ship-from').text(invoice.ship_from || 'N/A');
    $('#ship-to').text(invoice.ship_to || 'N/A');

    // Update the company address section in the template
    if (primaryAddress) {
      let addressHtml = `
        <p style="margin: 0">${primaryAddress.street || ''}</p>
        <p style="margin: 0">${primaryAddress.city || ''}${primaryAddress.state ? ', ' + primaryAddress.state : ''}</p>
        <p style="margin: 0">${primaryAddress.country || ''} ${primaryAddress.postal_code || ''}</p>
      `;

      // Access properties safely since they might not exist in the type
      const addressObj = primaryAddress as unknown as {
        phone_no?: string;
        fax_no?: string;
        transaction_no?: string;
      };

      // Only add phone number if it exists
      if (addressObj.phone_no) {
        addressHtml += `<p style="margin: 0">Tel: ${addressObj.phone_no}</p>`;
      }

      // Only add fax number if it exists
      if (addressObj.fax_no) {
        addressHtml += `<p style="margin: 0">Fax: ${addressObj.fax_no}</p>`;
      }

      // Only add transaction number if it exists
      if (addressObj.transaction_no) {
        addressHtml += `<p style="margin: 0">TRN NO: ${addressObj.transaction_no}</p>`;
      }

      $('#address').html(addressHtml);
    }

    // Clear existing invoice items placeholder
    $('#invoice-items-body').empty();

    // Generate invoice items and append them to the table
    invoiceItems.forEach((item, index) => {
      const product = productsMap.get(item.product_id);
      const invoiceTaxRate = invoice.tax_rate ? parseFloat(invoice.tax_rate.toString()) : 0;
      const unitPrice = parseFloat(item.unit_price.toString());
      const quantity = parseFloat(item.quantity.toString());
      const vatAmount = ((unitPrice * invoiceTaxRate) / 100) * quantity;
      const totalAmount = parseFloat(item.total_price.toString());

      // Create a new row with an ID for easier identification
      const rowEl = $('<tr>');
      rowEl.attr('id', `invoice-item-${item.id}`);
      rowEl.addClass('invoice-item-row');

      // Append cells with data
      rowEl.append(
        $('<td>')
          .attr('style', 'padding: 8px; border: 1px solid #ddd')
          .text((index + 1).toString())
      );
      rowEl.append(
        $('<td>')
          .attr('style', 'padding: 8px; border: 1px solid #ddd')
          .text(product?.partNo || 'N/A')
      );
      rowEl.append(
        $('<td>')
          .attr('style', 'padding: 8px; border: 1px solid #ddd')
          .text(product?.name || 'N/A')
      );
      rowEl.append(
        $('<td>')
          .attr('style', 'padding: 8px; border: 1px solid #ddd')
          .text(item.quantity.toString())
      );

      // Only add pricing columns if not a delivery invoice
      if (invoiceStage !== 'DELIVERY') {
        rowEl.append(
          $('<td>')
            .attr('style', 'padding: 8px; border: 1px solid #ddd')
            .text(item.unit_price.toString())
        );
        rowEl.append(
          $('<td>')
            .attr('style', 'padding: 8px; border: 1px solid #ddd')
            .text((unitPrice * quantity).toFixed(2))
        );
        rowEl.append(
          $('<td>')
            .attr('style', 'padding: 8px; border: 1px solid #ddd')
            .text(invoiceTaxRate.toString())
        );
        rowEl.append(
          $('<td>').attr('style', 'padding: 8px; border: 1px solid #ddd').text(vatAmount.toFixed(2))
        );
        rowEl.append(
          $('<td>')
            .attr('style', 'padding: 8px; border: 1px solid #ddd')
            .text(totalAmount.toFixed(2))
        );
      }

      // Append the row to the table body
      $('#invoice-items-body').append(rowEl);
    });

    // Add a class to the table headers to ensure they repeat on new pages
    $('thead tr').addClass('table-header-row');

    // Fill in the totals
    const subtotal = parseFloat(invoice.sub_total.toString()).toFixed(2);
    const discount = invoice.discount ? parseFloat(invoice.discount.toString()).toFixed(2) : '0.00';
    const taxRate = invoice.tax_rate ? parseFloat(invoice.tax_rate.toString()) : 0;
    const taxAmount = ((parseFloat(subtotal) * taxRate) / 100).toFixed(2);
    const total = parseFloat(invoice.total.toString()).toFixed(2);

    $('#subtotal').text(`${subtotal} AED`);
    const taxType = invoice.tax_type || 'Tax';
    $('#tax-type').text(taxType);
    $('#tax-amount').text(`${taxAmount} AED`);
    $('#discount').text(`${discount} AED`);
    $('#invoice-total').text(`${total} AED`);

    // Add a spacer at the end to ensure adequate space for the footer
    $('body').append('<div class="footer-spacer"></div>');

    // Launch browser with optimized settings for Apple Silicon
    const launchOptions = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    };

    try {
      browser = await launch(launchOptions);

      // Generate main document PDF without footer
      const mainPage = await browser.newPage();

      await mainPage.setContent($.html(), { waitUntil: 'networkidle0' });

      // Set page size to match A4 dimensions
      await mainPage.setViewport({
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
        deviceScaleFactor: 1,
      });

      // First, manipulate the DOM to hide the footer completely for the main document
      await mainPage.evaluate(() => {
        // Find any footer elements and completely remove them from the DOM
        const footerElements = document.querySelectorAll('.page-footer');
        footerElements.forEach(element => {
          element.remove();
        });

        // Minimize the footer spacer to avoid extra blank pages
        const footerSpacer = document.querySelector('.footer-spacer');
        if (footerSpacer && footerSpacer instanceof HTMLElement) {
          footerSpacer.style.height = '0';
          footerSpacer.style.display = 'none';
        }
      });

      // Generate the main PDF without any footer
      const mainPdfBuffer = await mainPage.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '10mm',
          right: '0mm',
          bottom: '20mm',
          left: '0mm',
        },
      });

      // Now create a new page with only the footer
      const footerPage = await browser.newPage();

      // Create a clean HTML document with only the footer
      const footerHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
          .footer {
            position: absolute;
            bottom: 20mm;
            left: 0;
            right: 0;
            width: 100%;
          }
          .text-container {
            padding: 15px;
            margin: 10px 20px;
            background-color: #f5f5f5;
          }
          .signature-container {
            margin: 30px 20px;
            display: flex;
            justify-content: space-between;
          }
          .signature-line {
            font-size: 12px;
            color: #999;
            border-top: 1px dotted #999;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="footer">
          <div class="text-container">
            <p style="font-size: 12px; color: #999; margin: 0;">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum
              has been the industry's standard dummy text ever since the 1500s.
            </p>
          </div>
          <div class="signature-container">
            <div>
              <p class="signature-line">
                Customer Signature
              </p>
            </div>
            <div>
              <p class="signature-line">
                For Arabian Auto Equipments and Parts Trading (FZC)
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
      `;

      await footerPage.setContent(footerHtml, { waitUntil: 'networkidle0' });

      // Generate just the footer PDF
      const footerPdfBuffer = await footerPage.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: false,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm',
        },
      });

      // Close the browser as we're done with generation
      await browser.close();
      browser = null;

      try {
        // Now use pdf-lib to create a PDF with footer on the last page

        // Load both PDFs
        const mainPdfDoc = await PDFDocument.load(mainPdfBuffer);
        const footerPdfDoc = await PDFDocument.load(footerPdfBuffer);

        // Get the number of pages in the main document
        const pageCount = mainPdfDoc.getPageCount();

        // The approach depends on whether we have a single or multiple pages
        if (pageCount === 1) {
          // For a single page document, we can embed the footer content directly
          const [footerPage] = await footerPdfDoc.getPages();
          const embedFooter = await mainPdfDoc.embedPage(footerPage);

          // Get the dimensions
          const mainPage = mainPdfDoc.getPage(0);
          const { width, height } = mainPage.getSize();

          // Draw the footer on the main page (at the bottom)
          mainPage.drawPage(embedFooter, {
            x: 0,
            y: 0,
            width: width,
            height: height,
            opacity: 1,
          });

          // Return the single page with embedded footer
          const finalPdfBytes = await mainPdfDoc.save();

          // Determine filename based on document type
          let filename = '';
          if (invoiceStage === 'DELIVERY') {
            filename = `delivery-note-${invoice.invoice_number}.pdf`;
          } else if (invoiceStage === 'QUOTATION') {
            filename = `quotation-${invoice.invoice_number}.pdf`;
          } else if (invoiceStage === 'PROFORMA') {
            filename = `proforma-invoice-${invoice.invoice_number}.pdf`;
          } else {
            filename = `invoice-${invoice.invoice_number}.pdf`;
          }

          return new NextResponse(Buffer.from(finalPdfBytes), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="${filename}"`,
            },
          });
        } else {
          // For multi-page documents, we'll create a completely new PDF
          // Create the new document
          const finalPdfDoc = await PDFDocument.create();

          // Copy all pages except the last one as-is
          for (let i = 0; i < pageCount - 1; i++) {
            const [copiedPage] = await finalPdfDoc.copyPages(mainPdfDoc, [i]);
            finalPdfDoc.addPage(copiedPage);
          }

          // For the last page, we need to copy it, then overlay the footer
          const [lastMainPage] = await finalPdfDoc.copyPages(mainPdfDoc, [pageCount - 1]);
          const lastPageAdded = finalPdfDoc.addPage(lastMainPage);

          // Now get the footer content
          const [footerPage] = await footerPdfDoc.getPages();
          const embedFooter = await finalPdfDoc.embedPage(footerPage);

          // Get the dimensions
          const { width, height } = lastPageAdded.getSize();

          // Draw the footer on the last page (at the bottom)
          lastPageAdded.drawPage(embedFooter, {
            x: 0,
            y: 0,
            width: width,
            height: height,
            opacity: 1,
          });

          // Return the multi-page PDF with footer on the last page
          const finalPdfBytes = await finalPdfDoc.save();

          // Determine filename based on document type
          let filename = '';
          if (invoiceStage === 'DELIVERY') {
            filename = `delivery-note-${invoice.invoice_number}.pdf`;
          } else if (invoiceStage === 'QUOTATION') {
            filename = `quotation-${invoice.invoice_number}.pdf`;
          } else if (invoiceStage === 'PROFORMA') {
            filename = `proforma-invoice-${invoice.invoice_number}.pdf`;
          } else {
            filename = `invoice-${invoice.invoice_number}.pdf`;
          }

          return new NextResponse(Buffer.from(finalPdfBytes), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="${filename}"`,
            },
          });
        }
      } catch (pdfLibError) {
        console.error('Error in PDF-lib processing:', pdfLibError);

        // If pdf-lib fails, return the main PDF without footer as fallback
        // Determine filename based on document type
        let filename = '';
        if (invoiceStage === 'DELIVERY') {
          filename = `delivery-note-${invoice.invoice_number}.pdf`;
        } else if (invoiceStage === 'QUOTATION') {
          filename = `quotation-${invoice.invoice_number}.pdf`;
        } else if (invoiceStage === 'PROFORMA') {
          filename = `proforma-invoice-${invoice.invoice_number}.pdf`;
        } else {
          filename = `invoice-${invoice.invoice_number}.pdf`;
        }

        return new NextResponse(mainPdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${filename}"`,
          },
        });
      }
    } catch (error) {
      console.error('Puppeteer or PDF-lib error:', error);

      // Clean up if browser is still open
      if (browser) {
        try {
          await (browser as Browser).close();
        } catch (e) {
          console.error('Error closing browser:', e);
        }
      }

      throw error; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error('Error generating PDF:', error);

    // Make sure to close browser if an error occurs
    if (browser) {
      try {
        await (browser as Browser).close();
      } catch (e) {
        console.error('Error closing browser:', e);
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // This POST method allows setting the invoice_stage dynamically for delivery notes
  // Use proper type for Puppeteer's Browser
  let browser: Browser | null = null;

  try {
    const invoiceId = parseInt((await params).id);

    if (isNaN(invoiceId)) {
      console.error('Invalid invoice ID:', (await params).id);
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    // Parse the request body to get invoice_stage
    const requestBody = await request.json();
    console.log('Request body:', JSON.stringify(requestBody));

    const invoiceStage =
      requestBody.invoiceStage ||
      requestBody.invoicestage ||
      requestBody.InvoiceStage ||
      requestBody.INVOICESTAGE ||
      'SALE';

    console.log('invoiceStage from request body:', invoiceStage);

    // Get invoice data from database
    const invoices = await db.select().from(InvoicesTable).where(eq(InvoicesTable.id, invoiceId));

    if (!invoices || invoices.length === 0) {
      console.error('Invoice not found:', invoiceId);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = {
      ...invoices[0],
      // Override invoice_stage with the one from the request
      invoice_stage: invoiceStage,
    };

    // Get customer data
    const customers = await db
      .select()
      .from(CustomersTable)
      .where(eq(CustomersTable.id, invoice.customer_id));

    // Get salesperson data only if salesperson_name exists
    const salesPerson = invoice.salesman_id
      ? await db.select().from(SalesmenTable).where(eq(SalesmenTable.id, invoice.salesman_id))
      : null;

    const customer = customers.length > 0 ? customers[0] : null;

    // Get primary address
    const addresses = await db.select().from(AddressTable).where(eq(AddressTable.is_primary, true));

    const primaryAddress = addresses.length > 0 ? addresses[0] : null;

    if (!primaryAddress) {
      console.warn('No primary address found, using default address');
      // You could either use a default address or return an error
      // return NextResponse.json({ error: 'No primary address configured' }, { status: 500 });
    }

    // Get invoice items
    const invoiceItems = await db
      .select()
      .from(InvoiceItemsTable)
      .where(eq(InvoiceItemsTable.invoice_id, invoiceId));

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

    // Read the HTML template
    const templatePath = path.join(process.cwd(), 'app/templates/invoice-template.html');
    const htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Format invoice date
    const formattedDate = format(new Date(invoice.invoice_date), 'MMMM dd, yyyy');

    // Load HTML template into cheerio
    const $ = cheerio.load(htmlTemplate);

    // Determine title based on invoiceStage
    let documentTitle = 'Invoice';
    if (invoiceStage === 'DELIVERY') {
      documentTitle = 'Delivery Note';
    } else if (invoiceStage === 'QUOTATION') {
      documentTitle = 'Quotation';
    } else if (invoiceStage === 'PROFORMA') {
      documentTitle = 'Proforma Invoice';
    } else if (invoiceStage === 'SALE') {
      documentTitle = 'Sale Invoice';
    }

    // Check if it's a delivery invoice and modify the table
    if (invoiceStage === 'DELIVERY') {
      // Remove pricing columns from the invoice table header
      $('table.invoice-items-table th:nth-child(5)').remove(); // Rate
      $('table.invoice-items-table th:nth-child(5)').remove(); // Amount
      $('table.invoice-items-table th:nth-child(5)').remove(); // VAT %
      $('table.invoice-items-table th:nth-child(5)').remove(); // VAT
      $('table.invoice-items-table th:nth-child(5)').remove(); // Total Amount

      // Hide the totals container entirely, including Terms & Conditions
      $('.invoice-footer').css('display', 'none');

      // Add some spacing after the table for a cleaner look
      $('.table-container').css('margin-bottom', '30px');
    }

    // Update document title for all document types
    $('title').text(documentTitle);
    $('#invoice-title').text(documentTitle);

    // Replace the logo path with data URL to ensure it works in Puppeteer
    const logoPath = path.join(process.cwd(), 'public/logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString('base64');
      $('img[src="logo.png"]').attr('src', `data:image/png;base64,${logoBase64}`);
    } else {
      console.warn('Logo file not found at:', logoPath);
    }

    // Fill in the customer details
    $('#customer-address').text(customer?.name || 'N/A');

    // Use a default value for tax number as it's not defined in the customer model
    const taxRegNo = 'N/A'; // Customize as needed

    // For delivery notes, we don't show tax registration
    if (invoiceStage !== 'DELIVERY') {
      $('#tax-reg-no').html(`<span style="font-weight: bold">TAX Reg No:</span> ${taxRegNo}`);
    } else {
      // Hide the tax registration number row
      $('#tax-reg-no').css('display', 'none');
    }

    $('#ship-to-country').html(
      `<span style="font-weight: bold">Ship to Country/Emirate:</span> Emirates`
    );

    // Fill in the invoice details
    $('#invoice-number').text(invoice.invoice_number);
    $('#invoice-date').text(formattedDate);
    // $('#order-no').text(invoice.id.toString());
    $('#salesperson').text(salesPerson?.[0]?.name || 'N/A');
    $('#ship-from').text(invoice.ship_from || 'N/A');
    $('#ship-to').text(invoice.ship_to || 'N/A');

    // Update the company address section in the template
    if (primaryAddress) {
      let addressHtml = `
        <p style="margin: 0">${primaryAddress.street || ''}</p>
        <p style="margin: 0">${primaryAddress.city || ''}${primaryAddress.state ? ', ' + primaryAddress.state : ''}</p>
        <p style="margin: 0">${primaryAddress.country || ''} ${primaryAddress.postal_code || ''}</p>
      `;

      // Access properties safely since they might not exist in the type
      const addressObj = primaryAddress as unknown as {
        phone_no?: string;
        fax_no?: string;
        transaction_no?: string;
      };

      // Only add phone number if it exists
      if (addressObj.phone_no) {
        addressHtml += `<p style="margin: 0">Tel: ${addressObj.phone_no}</p>`;
      }

      // Only add fax number if it exists
      if (addressObj.fax_no) {
        addressHtml += `<p style="margin: 0">Fax: ${addressObj.fax_no}</p>`;
      }

      // Only add transaction number if it exists
      if (addressObj.transaction_no) {
        addressHtml += `<p style="margin: 0">TRN NO: ${addressObj.transaction_no}</p>`;
      }

      $('#address').html(addressHtml);
    }

    // Clear existing invoice items placeholder
    $('#invoice-items-body').empty();

    // Generate invoice items and append them to the table
    invoiceItems.forEach((item, index) => {
      const product = productsMap.get(item.product_id);
      const invoiceTaxRate = invoice.tax_rate ? parseFloat(invoice.tax_rate.toString()) : 0;
      const unitPrice = parseFloat(item.unit_price.toString());
      const quantity = parseFloat(item.quantity.toString());
      const vatAmount = ((unitPrice * invoiceTaxRate) / 100) * quantity;
      const totalAmount = parseFloat(item.total_price.toString());

      // Create a new row with an ID for easier identification
      const rowEl = $('<tr>');
      rowEl.attr('id', `invoice-item-${item.id}`);
      rowEl.addClass('invoice-item-row');

      // Append cells with data
      rowEl.append(
        $('<td>')
          .attr('style', 'padding: 8px; border: 1px solid #ddd')
          .text((index + 1).toString())
      );
      rowEl.append(
        $('<td>')
          .attr('style', 'padding: 8px; border: 1px solid #ddd')
          .text(product?.partNo || 'N/A')
      );
      rowEl.append(
        $('<td>')
          .attr('style', 'padding: 8px; border: 1px solid #ddd')
          .text(product?.name || 'N/A')
      );
      rowEl.append(
        $('<td>')
          .attr('style', 'padding: 8px; border: 1px solid #ddd')
          .text(item.quantity.toString())
      );

      // Only add pricing columns if not a delivery invoice
      if (invoiceStage !== 'DELIVERY') {
        rowEl.append(
          $('<td>')
            .attr('style', 'padding: 8px; border: 1px solid #ddd')
            .text(item.unit_price.toString())
        );
        rowEl.append(
          $('<td>')
            .attr('style', 'padding: 8px; border: 1px solid #ddd')
            .text((unitPrice * quantity).toFixed(2))
        );
        rowEl.append(
          $('<td>')
            .attr('style', 'padding: 8px; border: 1px solid #ddd')
            .text(invoiceTaxRate.toString())
        );
        rowEl.append(
          $('<td>').attr('style', 'padding: 8px; border: 1px solid #ddd').text(vatAmount.toFixed(2))
        );
        rowEl.append(
          $('<td>')
            .attr('style', 'padding: 8px; border: 1px solid #ddd')
            .text(totalAmount.toFixed(2))
        );
      }

      // Append the row to the table body
      $('#invoice-items-body').append(rowEl);
    });

    // Add a class to the table headers to ensure they repeat on new pages
    $('thead tr').addClass('table-header-row');

    // Fill in the totals
    const subtotal = parseFloat(invoice.sub_total.toString()).toFixed(2);
    const discount = invoice.discount ? parseFloat(invoice.discount.toString()).toFixed(2) : '0.00';
    const taxRate = invoice.tax_rate ? parseFloat(invoice.tax_rate.toString()) : 0;
    const taxAmount = ((parseFloat(subtotal) * taxRate) / 100).toFixed(2);
    const total = parseFloat(invoice.total.toString()).toFixed(2);

    $('#subtotal').text(`${subtotal} AED`);
    const taxType = invoice.tax_type || 'Tax';
    $('#tax-type').text(taxType);
    $('#tax-amount').text(`${taxAmount} AED`);
    $('#discount').text(`${discount} AED`);
    $('#invoice-total').text(`${total} AED`);

    // Add a spacer at the end to ensure adequate space for the footer
    $('body').append('<div class="footer-spacer"></div>');

    // Launch browser with optimized settings for Apple Silicon
    const launchOptions = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    };

    try {
      browser = await launch(launchOptions);

      // Generate main document PDF without footer
      const mainPage = await browser.newPage();

      await mainPage.setContent($.html(), { waitUntil: 'networkidle0' });

      // Set page size to match A4 dimensions
      await mainPage.setViewport({
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
        deviceScaleFactor: 1,
      });

      // First, manipulate the DOM to hide the footer completely for the main document
      await mainPage.evaluate(() => {
        // Find any footer elements and completely remove them from the DOM
        const footerElements = document.querySelectorAll('.page-footer');
        footerElements.forEach(element => {
          element.remove();
        });

        // Minimize the footer spacer to avoid extra blank pages
        const footerSpacer = document.querySelector('.footer-spacer');
        if (footerSpacer && footerSpacer instanceof HTMLElement) {
          footerSpacer.style.height = '0';
          footerSpacer.style.display = 'none';
        }
      });

      // Generate the main PDF without any footer
      const mainPdfBuffer = await mainPage.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '10mm',
          right: '0mm',
          bottom: '20mm',
          left: '0mm',
        },
      });

      // Now create a new page with only the footer
      const footerPage = await browser.newPage();

      // Create a clean HTML document with only the footer
      const footerHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
          .footer {
            position: absolute;
            bottom: 20mm;
            left: 0;
            right: 0;
            width: 100%;
          }
          .text-container {
            padding: 15px;
            margin: 10px 20px;
            background-color: #f5f5f5;
          }
          .signature-container {
            margin: 30px 20px;
            display: flex;
            justify-content: space-between;
          }
          .signature-line {
            font-size: 12px;
            color: #999;
            border-top: 1px dotted #999;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="footer">
          <div class="text-container">
            <p style="font-size: 12px; color: #999; margin: 0;">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum
              has been the industry's standard dummy text ever since the 1500s.
            </p>
          </div>
          <div class="signature-container">
            <div>
              <p class="signature-line">
                Customer Signature
              </p>
            </div>
            <div>
              <p class="signature-line">
                For Arabian Auto Equipments and Parts Trading (FZC)
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
      `;

      await footerPage.setContent(footerHtml, { waitUntil: 'networkidle0' });

      // Generate just the footer PDF
      const footerPdfBuffer = await footerPage.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: false,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm',
        },
      });

      // Close the browser as we're done with generation
      await browser.close();
      browser = null;

      try {
        // Now use pdf-lib to create a PDF with footer on the last page

        // Load both PDFs
        const mainPdfDoc = await PDFDocument.load(mainPdfBuffer);
        const footerPdfDoc = await PDFDocument.load(footerPdfBuffer);

        // Get the number of pages in the main document
        const pageCount = mainPdfDoc.getPageCount();

        // The approach depends on whether we have a single or multiple pages
        if (pageCount === 1) {
          // For a single page document, we can embed the footer content directly
          const [footerPage] = await footerPdfDoc.getPages();
          const embedFooter = await mainPdfDoc.embedPage(footerPage);

          // Get the dimensions
          const mainPage = mainPdfDoc.getPage(0);
          const { width, height } = mainPage.getSize();

          // Draw the footer on the main page (at the bottom)
          mainPage.drawPage(embedFooter, {
            x: 0,
            y: 0,
            width: width,
            height: height,
            opacity: 1,
          });

          // Return the single page with embedded footer
          const finalPdfBytes = await mainPdfDoc.save();

          // Determine filename based on document type
          let filename = '';
          if (invoiceStage === 'DELIVERY') {
            filename = `delivery-note-${invoice.invoice_number}.pdf`;
          } else if (invoiceStage === 'QUOTATION') {
            filename = `quotation-${invoice.invoice_number}.pdf`;
          } else if (invoiceStage === 'PROFORMA') {
            filename = `proforma-invoice-${invoice.invoice_number}.pdf`;
          } else {
            filename = `invoice-${invoice.invoice_number}.pdf`;
          }

          return new NextResponse(Buffer.from(finalPdfBytes), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="${filename}"`,
            },
          });
        } else {
          // For multi-page documents, we'll create a completely new PDF
          // Create the new document
          const finalPdfDoc = await PDFDocument.create();

          // Copy all pages except the last one as-is
          for (let i = 0; i < pageCount - 1; i++) {
            const [copiedPage] = await finalPdfDoc.copyPages(mainPdfDoc, [i]);
            finalPdfDoc.addPage(copiedPage);
          }

          // For the last page, we need to copy it, then overlay the footer
          const [lastMainPage] = await finalPdfDoc.copyPages(mainPdfDoc, [pageCount - 1]);
          const lastPageAdded = finalPdfDoc.addPage(lastMainPage);

          // Now get the footer content
          const [footerPage] = await footerPdfDoc.getPages();
          const embedFooter = await finalPdfDoc.embedPage(footerPage);

          // Get the dimensions
          const { width, height } = lastPageAdded.getSize();

          // Draw the footer on the last page (at the bottom)
          lastPageAdded.drawPage(embedFooter, {
            x: 0,
            y: 0,
            width: width,
            height: height,
            opacity: 1,
          });

          // Return the multi-page PDF with footer on the last page
          const finalPdfBytes = await finalPdfDoc.save();

          // Determine filename based on document type
          let filename = '';
          if (invoiceStage === 'DELIVERY') {
            filename = `delivery-note-${invoice.invoice_number}.pdf`;
          } else if (invoiceStage === 'QUOTATION') {
            filename = `quotation-${invoice.invoice_number}.pdf`;
          } else if (invoiceStage === 'PROFORMA') {
            filename = `proforma-invoice-${invoice.invoice_number}.pdf`;
          } else {
            filename = `invoice-${invoice.invoice_number}.pdf`;
          }

          return new NextResponse(Buffer.from(finalPdfBytes), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="${filename}"`,
            },
          });
        }
      } catch (pdfLibError) {
        console.error('Error in PDF-lib processing:', pdfLibError);

        // If pdf-lib fails, return the main PDF without footer as fallback
        // Determine filename based on document type
        let filename = '';
        if (invoiceStage === 'DELIVERY') {
          filename = `delivery-note-${invoice.invoice_number}.pdf`;
        } else if (invoiceStage === 'QUOTATION') {
          filename = `quotation-${invoice.invoice_number}.pdf`;
        } else if (invoiceStage === 'PROFORMA') {
          filename = `proforma-invoice-${invoice.invoice_number}.pdf`;
        } else {
          filename = `invoice-${invoice.invoice_number}.pdf`;
        }

        return new NextResponse(mainPdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${filename}"`,
          },
        });
      }
    } catch (error) {
      console.error('Puppeteer or PDF-lib error:', error);

      // Clean up if browser is still open
      if (browser) {
        try {
          await (browser as Browser).close();
        } catch (e) {
          console.error('Error closing browser:', e);
        }
      }

      throw error; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error('Error generating PDF:', error);

    // Make sure to close browser if an error occurs
    if (browser) {
      try {
        await (browser as Browser).close();
      } catch (e) {
        console.error('Error closing browser:', e);
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
