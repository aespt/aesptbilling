"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoicePdf = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const puppeteer = __importStar(require("puppeteer"));
const cheerio = __importStar(require("cheerio"));
const date_fns_1 = require("date-fns");
const pdf_lib_1 = require("pdf-lib");
// Initialize Firebase Admin
admin.initializeApp();
// Helper function to get browser instance
async function getBrowser() {
    return puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--font-render-hinting=none',
        ],
        headless: 'new',
    });
}
exports.generateInvoicePdf = functions
    .runWith({
    timeoutSeconds: 300,
    memory: '1GB', // More memory for PDF generation
})
    .https.onCall(async (data, context) => {
    // For security: check authentication if needed
    // if (!context.auth) {
    //   throw new functions.https.HttpsError(
    //     'unauthenticated',
    //     'You must be logged in to generate a PDF'
    //   );
    // }
    var _a;
    let browser = null;
    try {
        const { invoiceId, invoiceStage = null, htmlTemplate, invoice, customer, primaryAddress, salesPerson, primaryBankDetails, invoiceItems, productsMap, } = data;
        if (!invoiceId || !htmlTemplate || !invoice) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
        }
        // Format invoice date
        const formattedDate = (0, date_fns_1.format)(new Date(invoice.invoice_date), 'MMMM dd, yyyy');
        // Load HTML template into cheerio
        const $ = cheerio.load(htmlTemplate);
        // Determine title based on invoiceStage
        let documentTitle = 'Invoice';
        if (invoiceStage === 'DELIVERY') {
            documentTitle = 'Delivery Note';
        }
        else if (invoiceStage === 'QUOTATION' || invoice.invoice_stage === 'QUOTATION') {
            documentTitle = 'Quotation';
        }
        else if (invoiceStage === 'PROFORMA' || invoice.invoice_stage === 'PROFORMA') {
            documentTitle = 'Proforma Invoice';
        }
        else if (invoiceStage === 'SALE' || invoice.invoice_stage === 'SALE') {
            documentTitle = 'Sale Invoice';
        }
        // Check if it's a delivery invoice and modify the table
        if (invoiceStage === 'DELIVERY') {
            // Remove pricing columns from the invoice table header
            $('table.invoice-items-table th:nth-child(6)').remove(); // Rate
            $('table.invoice-items-table th:nth-child(6)').remove(); // Amount
            $('table.invoice-items-table th:nth-child(6)').remove(); // VAT %
            $('table.invoice-items-table th:nth-child(6)').remove(); // VAT
            $('table.invoice-items-table th:nth-child(6)').remove(); // Total Amount
            // Hide the totals container entirely, including Terms & Conditions
            $('.invoice-footer').css('display', 'none');
            // Add some spacing after the table for a cleaner look
            $('.table-container').css('margin-bottom', '30px');
        }
        // Update document title for all document types
        $('title').text(documentTitle);
        $('#invoice-title').text(documentTitle);
        // Fill in the customer details
        $('#customer-address').text((customer === null || customer === void 0 ? void 0 : customer.name) || 'N/A');
        // Use a default value for tax number
        const taxRegNo = 'N/A';
        // For delivery notes, we don't show tax registration
        if (invoiceStage !== 'DELIVERY') {
            $('#tax-reg-no').html(`<span style="font-weight: bold">TAX Reg No:</span> ${taxRegNo}`);
        }
        else {
            // Hide the tax registration number row
            $('#tax-reg-no').css('display', 'none');
        }
        $('#ship-to-country').html(`<span style="font-weight: bold">Ship to Country/Emirate:</span> Emirates`);
        // Fill in the invoice details
        $('#invoice-number').text(invoice.invoice_number);
        $('#invoice-date').text(formattedDate);
        $('#salesperson').text(((_a = salesPerson === null || salesPerson === void 0 ? void 0 : salesPerson[0]) === null || _a === void 0 ? void 0 : _a.name) || 'N/A');
        $('#ship-from').text(invoice.ship_from || 'N/A');
        $('#ship-to').text(invoice.ship_to || 'N/A');
        // Update the company address section
        if (primaryAddress) {
            let addressHtml = `
          <p style="margin: 0">${primaryAddress.street || ''}</p>
          <p style="margin: 0">${primaryAddress.city || ''}${primaryAddress.state ? ', ' + primaryAddress.state : ''}</p>
          <p style="margin: 0">${primaryAddress.country || ''} ${primaryAddress.postal_code || ''}</p>
        `;
            // Only add phone number if it exists
            if (primaryAddress.phone_no) {
                addressHtml += `<p style="margin: 0">Tel: ${primaryAddress.phone_no}</p>`;
            }
            // Only add fax number if it exists
            if (primaryAddress.fax_no) {
                addressHtml += `<p style="margin: 0">Fax: ${primaryAddress.fax_no}</p>`;
            }
            // Only add transaction number if it exists
            if (primaryAddress.transaction_no) {
                addressHtml += `<p style="margin: 0">TRN NO: ${primaryAddress.transaction_no}</p>`;
            }
            $('#address').html(addressHtml);
        }
        // Clear existing invoice items placeholder
        $('#invoice-items-body').empty();
        // Generate invoice items and append them to the table
        invoiceItems.forEach((item, index) => {
            const product = productsMap[item.product_id];
            const invoiceTaxRate = invoice.tax_rate ? parseFloat(invoice.tax_rate.toString()) : 0;
            const unitPrice = parseFloat(item.mrp.toString());
            const quantity = parseFloat(item.quantity.toString());
            const vatAmount = ((unitPrice * invoiceTaxRate) / 100) * quantity;
            const totalAmount = parseFloat(item.total_price.toString());
            // Create a new row with an ID for easier identification
            const rowEl = $('<tr>');
            rowEl.attr('id', `invoice-item-${item.id}`);
            rowEl.addClass('invoice-item-row');
            // Append cells with data
            rowEl.append($('<td>')
                .attr('style', 'padding: 8px; border: 1px solid #ddd')
                .text((index + 1).toString()));
            rowEl.append($('<td>')
                .attr('style', 'padding: 8px; border: 1px solid #ddd')
                .text((product === null || product === void 0 ? void 0 : product.partNo) || 'N/A'));
            rowEl.append($('<td>')
                .attr('style', 'padding: 8px; border: 1px solid #ddd')
                .text((product === null || product === void 0 ? void 0 : product.brand) || 'N/A'));
            rowEl.append($('<td>')
                .attr('style', 'padding: 8px; border: 1px solid #ddd')
                .text((product === null || product === void 0 ? void 0 : product.name) || 'N/A'));
            rowEl.append($('<td>')
                .attr('style', 'padding: 8px; border: 1px solid #ddd')
                .text(item.quantity.toString()));
            // Only add pricing columns if not a delivery invoice
            if (invoiceStage !== 'DELIVERY') {
                rowEl.append($('<td>')
                    .attr('style', 'padding: 8px; border: 1px solid #ddd')
                    .text(item.mrp.toString()));
                rowEl.append($('<td>')
                    .attr('style', 'padding: 8px; border: 1px solid #ddd')
                    .text((unitPrice * quantity).toFixed(2)));
                rowEl.append($('<td>')
                    .attr('style', 'padding: 8px; border: 1px solid #ddd')
                    .text(invoiceTaxRate.toString()));
                rowEl.append($('<td>')
                    .attr('style', 'padding: 8px; border: 1px solid #ddd')
                    .text(vatAmount.toFixed(2)));
                rowEl.append($('<td>')
                    .attr('style', 'padding: 8px; border: 1px solid #ddd')
                    .text(totalAmount.toFixed(2)));
            }
            // Append the row to the table body
            $('#invoice-items-body').append(rowEl);
        });
        // Add a class to the table headers to ensure they repeat on new pages
        $('thead tr').addClass('table-header-row');
        // Fill in the totals
        const subtotal = invoice.sub_total
            ? parseFloat(invoice.sub_total.toString()).toFixed(2)
            : '0.00';
        const discount = invoice.discount
            ? parseFloat(invoice.discount.toString()).toFixed(2)
            : '0.00';
        const taxRate = invoice.tax_rate ? parseFloat(invoice.tax_rate.toString()) : 0;
        const discountedSubtotal = (parseFloat(subtotal) - parseFloat(discount)).toFixed(2);
        const taxAmount = ((parseFloat(discountedSubtotal) * taxRate) / 100).toFixed(2);
        const total = parseFloat(invoice.total.toString()).toFixed(2);
        $('#subtotal').text(`${subtotal} AED`);
        const taxType = invoice.tax_type || 'Tax';
        $('#tax-type').text(taxType);
        $('#tax-amount').text(`${taxAmount} AED`);
        $('#discount').text(`${discount} AED`);
        $('#invoice-total').text(`${total} AED`);
        // Replace terms and conditions with bank details for PROFORMA invoices
        if (invoiceStage === 'PROFORMA' || invoice.invoice_stage === 'PROFORMA') {
            if (primaryBankDetails) {
                $('.terms-conditions').html(`
            <h4 style="margin: 0 0 10px 0">Bank Details</h4>
            <p style="font-size: 12px; margin: 0; font-weight: bold">${primaryBankDetails.name}</p>
            <p style="font-size: 12px; margin: 5px 0; white-space: pre-line">${primaryBankDetails.details}</p>
          `);
            }
            else {
                $('.terms-conditions').html(`
            <h4 style="margin: 0 0 10px 0">Bank Details</h4>
            <p style="font-size: 12px; margin: 0">No bank details found</p>
          `);
            }
        }
        // Add a spacer at the end to ensure adequate space for the footer
        $('body').append('<div class="footer-spacer"></div>');
        // Get browser instance
        browser = await getBrowser();
        // Generate main document PDF without footer
        const mainPage = await browser.newPage();
        await mainPage.setContent($.html(), { waitUntil: 'networkidle0' });
        // Set page size to match A4 dimensions
        await mainPage.setViewport({
            width: 794,
            height: 1123,
            deviceScaleFactor: 1,
        });
        // Manipulate the DOM to hide the footer completely for the main document
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
          .invoice-footer {
            width: 100%;
          }

          .totals-container {
            display: flex;
            justify-content: space-between;
            padding: 0 20px;
            margin-top: 10px;
            gap: 10px;
          }
          .signature-section {
             page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <div class="footer">
        <!-- Footer Section -->
      <div class="invoice-footer signature-section">
        ${invoiceStage === 'DELIVERY' || invoice.invoice_stage === 'DELIVERY'
            ? ''
            : `<div class="totals-container">
          <div
            style="width: 50%; padding: 15px; background-color: #f5f5f5"
            class="terms-conditions"
          >
            ${invoiceStage === 'PROFORMA' || invoice.invoice_stage === 'PROFORMA'
                ? primaryBankDetails
                    ? `<h4 style="margin: 0 0 10px 0">Bank Details</h4>
                     <p style="font-size: 12px; margin: 0; font-weight: bold">${primaryBankDetails.name}</p>
                     <p style="font-size: 12px; margin: 5px 0; white-space: pre-line">${primaryBankDetails.details}</p>`
                    : `<h4 style="margin: 0 0 10px 0">Bank Details</h4>
                     <p style="font-size: 12px; margin: 0">No bank details found</p>`
                : invoiceStage === 'QUOTATION' || invoice.invoice_stage === 'QUOTATION'
                    ? `<h4 style="margin: 0 0 10px 0">Terms & Conditions</h4>
                   <p style="font-size: 12px; margin: 0">
                     By using our services, you confirm that you accept these Terms and Conditions and that
                     you agree to comply with them.
                   </p>`
                    : `<h4 style="margin: 0 0 10px 0">Terms & Conditions</h4>
                   <p style="font-size: 12px; margin: 0">
                     By using our services, you confirm that you accept these Terms and Conditions and that
                     you agree to comply with them.
                   </p>`}
          </div>
          <div style="width: 50%; padding: 15px; background-color: #f5f5f5">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px">
              <tr>
                <td style="padding: 5px 0; font-weight: bold">Subtotal</td>
                <td id="subtotal" style="padding: 5px 0; text-align: right">{{subtotal}} AED</td>
              </tr>
              <tr>
                <td id="tax-type" style="padding: 5px 0; font-weight: bold">{{taxType}}</td>
                <td id="tax-amount" style="padding: 5px 0; text-align: right">{{taxAmount}} AED</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: bold">Discount</td>
                <td id="discount" style="padding: 5px 0; text-align: right">{{discount}} AED</td>
              </tr>
              <tr style="border-top: 1px solid #ddd">
                <td style="padding: 10px 0; font-weight: bold">Invoice Total</td>
                <td
                  id="invoice-total"
                  style="padding: 10px 0; text-align: right; font-weight: bold"
                >
                  {{total}} AED
                </td>
              </tr>
            </table>
          </div>
        </div>`}
      </div>
          ${invoiceStage === 'DELIVERY' || invoice.invoice_stage === 'DELIVERY'
            ? ''
            : `<div class="text-container">
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
              </div>`}
        </div>
      </body>
      </html>
      `;
        // Replace placeholders with actual values
        const processedFooterHtml = footerHtml
            .replace('{{subtotal}}', subtotal)
            .replace('{{taxType}}', taxType)
            .replace('{{taxAmount}}', taxAmount)
            .replace('{{discount}}', discount)
            .replace('{{total}}', total);
        await footerPage.setContent(processedFooterHtml, { waitUntil: 'networkidle0' });
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
        // Close the browser
        await browser.close();
        browser = null;
        try {
            // Use pdf-lib to create a PDF with footer on the last page
            const mainPdfDoc = await pdf_lib_1.PDFDocument.load(mainPdfBuffer);
            const footerPdfDoc = await pdf_lib_1.PDFDocument.load(footerPdfBuffer);
            // Get the number of pages in the main document
            const pageCount = mainPdfDoc.getPageCount();
            let finalPdfBytes;
            if (pageCount === 1) {
                // For a single page document, embed the footer content directly
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
                finalPdfBytes = await mainPdfDoc.save();
            }
            else {
                // For multi-page documents, create a completely new PDF
                const finalPdfDoc = await pdf_lib_1.PDFDocument.create();
                // Copy all pages except the last one as-is
                for (let i = 0; i < pageCount - 1; i++) {
                    const [copiedPage] = await finalPdfDoc.copyPages(mainPdfDoc, [i]);
                    finalPdfDoc.addPage(copiedPage);
                }
                // For the last page, copy it, then overlay the footer
                const [lastMainPage] = await finalPdfDoc.copyPages(mainPdfDoc, [pageCount - 1]);
                const lastPageAdded = finalPdfDoc.addPage(lastMainPage);
                // Get the footer content
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
                // Get the multi-page PDF with footer on the last page
                finalPdfBytes = await finalPdfDoc.save();
            }
            // Convert to base64 for easier transport
            const base64PDF = Buffer.from(finalPdfBytes).toString('base64');
            // Determine filename based on document type
            let filename = '';
            if (invoiceStage === 'DELIVERY') {
                filename = `delivery-note-${invoice.invoice_number}.pdf`;
            }
            else if (invoiceStage === 'QUOTATION') {
                filename = `quotation-${invoice.invoice_number}.pdf`;
            }
            else if (invoiceStage === 'PROFORMA') {
                filename = `proforma-invoice-${invoice.invoice_number}.pdf`;
            }
            else {
                filename = `invoice-${invoice.invoice_number}.pdf`;
            }
            return {
                success: true,
                filename,
                pdfBase64: base64PDF,
            };
        }
        catch (pdfLibError) {
            console.error('Error in PDF-lib processing:', pdfLibError);
            // If pdf-lib fails, return the main PDF without footer as fallback
            const base64MainPDF = Buffer.from(mainPdfBuffer).toString('base64');
            return {
                success: true,
                filename: `invoice-${invoice.invoice_number}.pdf`,
                pdfBase64: base64MainPDF,
                warning: 'PDF was generated without footer due to processing error',
            };
        }
    }
    catch (error) {
        console.error('Error generating PDF:', error);
        // Make sure to close browser if an error occurs
        if (browser) {
            try {
                await browser.close();
            }
            catch (e) {
                console.error('Error closing browser:', e);
            }
        }
        throw new functions.https.HttpsError('internal', 'Failed to generate PDF', error instanceof Error ? error.message : String(error));
    }
});
//# sourceMappingURL=index.js.map