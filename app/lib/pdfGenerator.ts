import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Interface for the customer
interface Customer {
  name?: string;
  trn?: string;
}

// Interface for the sales person
interface SalesPerson {
  name?: string;
}

// Interface for the address
interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone_no?: string;
  transaction_no?: string;
}

// Interface for bank details
interface BankDetails {
  name?: string;
  details?: string;
  is_primary?: boolean;
}

// Interface for product
interface Product {
  partNo?: string;
  brand?: string;
  name?: string;
}

// Interface for invoice item
interface InvoiceItem {
  mrp?: number;
  unit_price?: number;
  quantity: number;
  total_price?: number;
}

// Interface for the invoice
interface Invoice {
  invoice_number?: string;
  invoice_stage?: string;
  ship_to?: string;
  ship_from?: string;
  tax_rate?: number;
}

// Interface for the totals section
interface InvoiceTotals {
  subtotal: string;
  discount: string;
  taxRate: number;
  taxAmount: string;
  total: string;
  taxType: string;
}

// Interface for the invoice data needed for PDF generation
interface InvoiceData {
  invoice: Invoice;
  customer: Customer;
  salesPerson: SalesPerson;
  primaryAddress: Address;
  primaryBankDetails: BankDetails;
  productsWithItems: Array<{
    item: InvoiceItem;
    product: Product;
  }>;
  formattedDate: string;
  documentTitle: string;
  totals: InvoiceTotals;
}

// Main function to generate the PDF
export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<string> {
  const {
    invoice,
    customer,
    salesPerson,
    primaryAddress,
    primaryBankDetails,
    productsWithItems,
    formattedDate,
    documentTitle,
    totals,
  } = invoiceData;

  // Determine document title based on invoice stage
  const getDocumentTitle = (stage?: string, defaultTitle?: string): string => {
    switch (stage) {
      case 'QUOTATION':
        return 'Quotation';
      case 'PROFORMA':
        return 'Proforma Invoice';
      case 'SALE':
        return 'Tax Invoice';
      case 'DELIVERY':
        return 'Delivery Note';
      default:
        return defaultTitle || 'Tax Invoice';
    }
  };

  // Determine if this is a delivery note
  const isDelivery = invoice.invoice_stage === 'DELIVERY';
  const documentDisplayTitle = getDocumentTitle(invoice.invoice_stage, documentTitle);

  // Split products into pages to handle pagination
  // Increase items per page for non-last pages to maximize space usage
  const ITEMS_PER_PAGE_FIRST = 10; // Fewer items on first page due to header
  const ITEMS_PER_PAGE_OTHER = 15; // More items on subsequent pages

  // Calculate page distribution
  let pageDistribution: number[] = [];
  let remainingItems = productsWithItems.length;

  if (remainingItems <= ITEMS_PER_PAGE_FIRST) {
    // Only one page needed
    pageDistribution = [remainingItems];
  } else {
    // First page
    pageDistribution.push(ITEMS_PER_PAGE_FIRST);
    remainingItems -= ITEMS_PER_PAGE_FIRST;

    // Additional pages
    while (remainingItems > 0) {
      const itemsForPage = Math.min(ITEMS_PER_PAGE_OTHER, remainingItems);
      pageDistribution.push(itemsForPage);
      remainingItems -= itemsForPage;
    }
  }

  const totalPages = pageDistribution.length;
  const pagePromises: Promise<{ imgData: string; imgWidth: number; imgHeight: number }>[] = [];

  // Keep track of the start index for each page
  let startIndex = 0;

  // Generate each page
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    // Get items for this page
    const itemsOnThisPage = pageDistribution[pageIndex];
    const endIndex = startIndex + itemsOnThisPage;
    const pageItems = productsWithItems.slice(startIndex, endIndex);
    const isLastPage = pageIndex === totalPages - 1;

    // Calculate page height - adjust based on content
    const baseHeight = 297; // A4 height in mm
    const headerHeight = pageIndex === 0 ? 180 : 50; // First page has bigger header
    const rowHeight = 25; // Height per table row in mm
    const footerHeight = isLastPage ? 150 : 0; // Footer only on last page

    // Calculate actual content height (restrict to A4 height)
    const contentHeight = Math.min(
      baseHeight,
      headerHeight + pageItems.length * rowHeight + footerHeight
    );

    // Create temporary container for our HTML
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '0';
    tempDiv.style.left = '0';
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.height = isLastPage ? '297mm' : `${contentHeight}mm`; // A4 height or content height
    tempDiv.style.overflow = 'hidden';
    tempDiv.style.zIndex = '-1000'; // Hide it but still render
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.position = 'relative'; // Position relative for absolute positioning inside

    // Generate the HTML content with exact template structure
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; width: 100%; padding: 20px; color: #333; background-color: white;">
      ${
        pageIndex === 0
          ? `
      <!-- Header Section - Only on first page -->
      <div style="display: flex;gap:20px; justify-content: start; padding: 20px; background-color: #f5f5f5; border-bottom: 1px solid #ccc;">
        <div style="display:flex;justify-content:center;align-items:center;">
          <img src="/logo.png" alt="Logo" style="width: 100px; max-height: 80px; object-fit: contain" />
        </div>
        <div style="width: 85%; background-color: #ffffff; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="margin: 0; font-size: 16px">Arabian Auto Equipments and Parts Trading (FZC)</h3>
            <p style="margin: 5px 0 0; font-size: 12px; font-weight: bold">
              العربية لتجارة معدات وقطع غيار السيارات (ش.م.ح)
            </p>
          </div>
          <div style="text-align: right; font-size: 12px">
            ${
              primaryAddress
                ? `
              ${primaryAddress.street || ''}<br>
              ${primaryAddress.city || ''}${primaryAddress.state ? ', ' + primaryAddress.state : ''}<br>
              ${primaryAddress.country || ''} ${primaryAddress.postal_code || ''}<br>
              ${primaryAddress.phone_no ? `Tel: ${primaryAddress.phone_no}<br>` : ''}
              ${primaryAddress.transaction_no ? `TRN NO: ${primaryAddress.transaction_no}` : ''}
            `
                : ''
            }
          </div>
        </div>
      </div>

      <!-- Invoice Title -->
      <div style="font-weight: bold; font-size: 18px;display:flex;justify-content:center;align-items:center; margin-bottom: 15px;">
        ${documentDisplayTitle} ${totalPages > 1 ? `(Page ${pageIndex + 1} of ${totalPages})` : ''}
      </div>

      <!-- Customer Info Section (only on first page) -->
      <div style="display: flex; justify-content: space-between;margin-top:20px; margin-bottom: 20px; gap: 20px;">
        <!-- Left side - Customer info -->
        <div style="width: 48%; background-color: #f5f5f5; padding: 20px; border: 1px solid #ccc;">
          <p style="margin: 0; font-weight: bold">Invoice To:<span style="margin: 5px 0">${customer?.name || 'N/A'}</span></p>
          <p style="margin: 10px 0">
            <span style="font-weight: bold">TAX Reg No:</span> ${customer?.trn || 'N/A'}
          </p>
          <p style="margin: 5px 0">
            <span style="font-weight: bold">Ship to Country/Emirate:</span>
            ${invoice.ship_to || 'N/A'}
          </p>
        </div>
        
        <!-- Right side - Invoice details -->
        <div style="width: 48%; background-color: #f5f5f5; padding: 20px; border: 1px solid #ccc;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px">
            <tr>
              <td style="font-weight: bold; padding: 3px 0;">Invoice No:</td>
              <td>${invoice.invoice_number || 'N/A'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 3px 0;">Invoice date:</td>
              <td>${formattedDate || 'N/A'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 3px 0;">Salesman:</td>
              <td>${salesPerson?.name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 3px 0;">Ship From:</td>
              <td>${invoice.ship_from || 'N/A'}</td>
            </tr>
          </table>
        </div>
      </div>
      `
          : `
      <!-- Simple page indicator for non-first pages -->
      <div style="font-weight: bold; font-size: 18px;display:flex;justify-content:center;align-items:center; margin-bottom: 15px;">
        ${documentDisplayTitle} ${totalPages > 1 ? `(Page ${pageIndex + 1} of ${totalPages})` : ''}
      </div>
      `
      }

      <!-- Items Table - Compact margin on non-first pages -->
      <div style="padding: ${pageIndex === 0 ? '10px' : '5px'} 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">No.</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Part No.</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Brand</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Description</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">QTY</th>
              ${
                !isDelivery
                  ? `
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Rate</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Amount</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">VAT %</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">VAT</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Total Amount</th>
              `
                  : ''
              }
            </tr>
          </thead>
          <tbody>
            ${pageItems
              .map((productItem, idx) => {
                const { item, product } = productItem;
                const invoiceTaxRate = invoice.tax_rate
                  ? parseFloat(invoice.tax_rate.toString())
                  : 0;
                const unitPrice = item.mrp
                  ? parseFloat(item.mrp.toString())
                  : parseFloat(item.unit_price?.toString() || '0');
                const quantity = parseFloat(item.quantity.toString());
                const amount = unitPrice * quantity;
                const vatAmount = ((unitPrice * invoiceTaxRate) / 100) * quantity;
                const totalAmount = parseFloat(item.total_price?.toString() || '0');

                const bgColor = (startIndex + idx) % 2 === 1 ? '#f9f9f9' : '#ffffff';
                const itemNumber = startIndex + idx + 1;

                return `
              <tr style="background-color: ${bgColor};">
                <td style="border: 1px solid #ddd; padding: ${pageIndex === 0 ? '8px' : '6px'};">${itemNumber}</td>
                <td style="border: 1px solid #ddd; padding: ${pageIndex === 0 ? '8px' : '6px'};">${product?.partNo || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: ${pageIndex === 0 ? '8px' : '6px'};">${product?.brand || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: ${pageIndex === 0 ? '8px' : '6px'};">${product?.name || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: ${pageIndex === 0 ? '8px' : '6px'};">${quantity.toString()}</td>
                ${
                  !isDelivery
                    ? `
                <td style="border: 1px solid #ddd; padding: ${pageIndex === 0 ? '8px' : '6px'};">${unitPrice.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: ${pageIndex === 0 ? '8px' : '6px'};">${amount.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: ${pageIndex === 0 ? '8px' : '6px'};">${invoiceTaxRate.toString()}</td>
                <td style="border: 1px solid #ddd; padding: ${pageIndex === 0 ? '8px' : '6px'};">${vatAmount.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: ${pageIndex === 0 ? '8px' : '6px'};">${totalAmount.toFixed(2)}</td>
                `
                    : ''
                }
              </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
      
      ${
        isLastPage
          ? `
      <div style="position: absolute; bottom: 10px; left: 0; width: 100%;">
        ${
          !isDelivery
            ? `
        <!-- Totals Section - Only for non-delivery notes and last page -->
        <div style="display: flex; justify-content: space-between; padding: 10px 20px; margin-top: 30px; gap: 20px;">
          <div style="width: 50%; background-color: #f5f5f5; padding: 20px; border: 1px solid #ccc;">
            ${
              invoice.invoice_stage === 'PROFORMA'
                ? `
                <h4 style="margin-top: 0">Bank Details</h4>
                <p style="font-weight: bold; margin-bottom: 5px;">${primaryBankDetails?.name || 'N/A'}</p>
                <div style="font-size: 14px; white-space: pre-line;">
                  ${primaryBankDetails?.details || 'N/A'}
                </div>
                `
                : `
                <h4 style="margin-top: 0">Terms & Conditions</h4>
                <p style="font-size: 12px;">
                  By using our services, you confirm that you accept these Terms and Conditions and that you agree to comply with them.
                </p>
                `
            }
          </div>
          <div style="width: 50%; background-color: #f5f5f5; padding: 20px; border: 1px solid #ccc;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="font-weight: bold; padding: 3px 0;">Subtotal:</td>
                <td style="text-align: right">${totals.subtotal} AED</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding: 3px 0;">${totals.taxType}:</td>
                <td style="text-align: right">${totals.taxAmount} AED</td>
              </tr>
              <tr style="padding-bottom: 10px;">
                <td style="font-weight: bold; padding: 3px 0;">Discount:</td>
                <td style="text-align: right">${totals.discount} AED</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding-top: 8px;">Invoice Total:</td>
                <td style="text-align: right; font-weight: bold">${totals.total} AED</td>
              </tr>
            </table>
          </div>
        </div>
        `
            : ''
        }
        
        <!-- Signature section - only on last page -->
        <div style="width: 100%; padding: 0;margin-bottom:20px;">
          <div style="padding: 15px; margin: 10px 20px; background-color: #f5f5f5;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has
              been the industry's standard dummy text ever since the 1500s.
            </p>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding: 0 20px;">
          <div>
            <div style="border-top: 1px dotted #999; width: 200px; text-align: center; padding-top: 5px; font-size: 12px; color: #666;">
              Customer Signature
            </div>
          </div>
          <div>
            <div style="border-top: 1px dotted #999; width: 200px; text-align: center; padding-top: 5px; font-size: 12px; color: #666;">
              For Arabian Auto Equipments and Parts Trading (FZC)
            </div>
          </div>
        </div>
      </div>
      `
          : ''
      }
    </div>
    `;

    // Add the content to the temporary div
    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);

    // Capture this page with html2canvas
    const pagePromise = html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
    }).then(canvas => {
      // Remove the temporary element after capturing
      document.body.removeChild(tempDiv);

      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      // const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Return just the minimum data needed for PDF creation
      return {
        imgData: canvas.toDataURL('image/jpeg', 0.95),
        imgWidth: imgWidth,
        imgHeight: imgHeight,
      };
    });

    pagePromises.push(pagePromise);

    // Update startIndex for next page
    startIndex = endIndex;
  }

  // Wait for all pages to be rendered
  const pageResults = await Promise.all(pagePromises);

  try {
    // Create PDF with all pages
    const pdf = new jsPDF('p', 'mm', 'a4');

    for (let i = 0; i < pageResults.length; i++) {
      // Add a new page for all pages except the first one
      if (i > 0) {
        pdf.addPage();
      }

      // Add image to PDF - pass dimensions correctly
      const { imgData, imgWidth, imgHeight } = pageResults[i];
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    }

    // Generate blob URL for the final PDF
    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    return blobUrl;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

// Function to download the PDF from a blob URL
export function downloadPdf(blobUrl: string, filename: string): void {
  try {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || 'invoice.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    // Error downloading PDF
    alert('Could not download PDF. Please try again.');
  }
}
