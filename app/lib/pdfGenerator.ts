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

// Add new interfaces for purchases
// Interface for the supplier
interface Supplier {
  name?: string;
  tax_registration_number?: string;
  address?: string;
  contact_number?: string;
}

// Interface for purchase
interface Purchase {
  purchase_number?: string;
  purchase_date?: string;
  ship_from?: string;
}

// Interface for purchase item
interface PurchaseItem {
  quantity: number;
}

// Interface for the purchase data needed for PDF generation
interface PurchaseData {
  purchase: Purchase;
  supplier: Supplier;
  primaryAddress: Address;
  productsWithItems: Array<{
    item: PurchaseItem;
    product: Product;
  }>;
  formattedDate: string;
  documentTitle: string;
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

  // Split products into pages to handle pagination with intelligent footer placement
  // Dynamic pagination based on available space and footer requirements
  const ITEMS_PER_PAGE_FIRST_WITH_FOOTER = 12; // First page with footer (adjusted)
  const ITEMS_PER_PAGE_FIRST_WITHOUT_FOOTER = 18; // First page without footer (adjusted)
  const ITEMS_PER_PAGE_OTHER = 22; // Subsequent pages (more space available)

  // Calculate intelligent page distribution
  let pageDistribution: Array<{ itemCount: number; hasFooter: boolean }> = [];
  let remainingItems = productsWithItems.length;

  if (remainingItems <= ITEMS_PER_PAGE_FIRST_WITH_FOOTER) {
    // All items fit on first page with footer
    pageDistribution = [{ itemCount: remainingItems, hasFooter: true }];
  } else if (remainingItems <= ITEMS_PER_PAGE_FIRST_WITHOUT_FOOTER) {
    // Items fit on first page without footer, footer goes to second page
    pageDistribution = [
      { itemCount: remainingItems, hasFooter: false },
      { itemCount: 0, hasFooter: true }, // Footer-only page
    ];
  } else {
    // Multiple pages needed
    // First page: use maximum items without footer
    pageDistribution.push({ itemCount: ITEMS_PER_PAGE_FIRST_WITHOUT_FOOTER, hasFooter: false });
    remainingItems -= ITEMS_PER_PAGE_FIRST_WITHOUT_FOOTER;

    // Fill subsequent pages
    while (remainingItems > 0) {
      const itemsForPage = Math.min(ITEMS_PER_PAGE_OTHER, remainingItems);
      const isLastBatch = remainingItems <= ITEMS_PER_PAGE_OTHER;

      pageDistribution.push({
        itemCount: itemsForPage,
        hasFooter: isLastBatch, // Footer only on the very last page
      });
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
    const itemsOnThisPage = pageDistribution[pageIndex].itemCount;
    const hasFooterOnThisPage = pageDistribution[pageIndex].hasFooter;
    const endIndex = startIndex + itemsOnThisPage;
    const pageItems = productsWithItems.slice(startIndex, endIndex);
    const isLastPage = hasFooterOnThisPage; // Footer determines if it's the "last" page for styling

    // Create temporary container for our HTML
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '0';
    tempDiv.style.left = '0';
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.height = '297mm'; // Always use full A4 height
    tempDiv.style.overflow = 'hidden';
    tempDiv.style.zIndex = '-1000'; // Hide it but still render
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.position = 'relative'; // Position relative for absolute positioning inside
    tempDiv.style.padding = '10mm'; // Add consistent padding on all sides
    tempDiv.style.boxSizing = 'border-box'; // Include padding in dimensions

    // Generate the HTML content with exact template structure
    const htmlContent = `
    <div style="width: 100%; height: 100%; border: 2px solid #ccc; box-sizing: border-box;">
    <div style="font-family: Helvetica, sans-serif; color: #333; background-color: white; border-bottom:none;width:100%;">
      ${
        pageIndex === 0
          ? `
      <!-- Header Section - Only on first page -->
      <div>
        <div style="display: flex;gap:20px; justify-content: start; padding-left: 20px; padding-right: 20px;">
          <div style="display:flex;justify-content:center;align-items:center;">
            <img src="/logo.png" alt="Logo" style="width: 100px; max-height: 80px; object-fit: contain" />
          </div>
          <div style="width: 100%; background-color: #ffffff; padding-left: 20px; padding-right: 20px; padding-top: 20px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="margin: 0;font-weight:bold; font-size: 18px; text-transform: uppercase;">Arabian Auto Equipments and Parts Trading (FZC)</h3>
              <p style=" font-size: 20px; font-weight: bold; direction: rtl; text-align: right;">
                العربية لتجارة معدات وقطع غيار السيارات &#x28;ش.م.ح&#x29;
              </p>
            </div>
            
          </div>
        </div>
          <!-- Invoice Title -->
          <div style=" padding-left:10px; padding-right:10px;padding-top:15px;margin-bottom:0;">
            <p style="font-weight: bold; font-size: 12px; margin-bottom: 0; text-transform: uppercase;text-align:center;"> ${documentDisplayTitle} </p>
            <p style="font-size: 12px; margin-top: 0; margin-bottom: 0; text-transform: uppercase;text-align:center;">${primaryAddress.transaction_no ? `TRN NO: ${primaryAddress.transaction_no}` : ''}</p>
          </div>
      </div>

      <!-- Invoice Title 
      <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; margin-bottom: 15px;">
       <p style="font-weight: bold; font-size: 12px; margin-bottom: 0; text-transform: uppercase;"> ${documentDisplayTitle} ${totalPages > 1 ? `(Page ${pageIndex + 1} of ${totalPages})` : ''}</p>
        <p style="font-size: 12px; margin-top: 0; margin-bottom: 0; text-transform: uppercase;">${primaryAddress.transaction_no ? `TRN NO: ${primaryAddress.transaction_no}` : ''}</p>
      </div>
      -->

      <!-- Customer Info Section (only on first page) -->
      <div style="display: flex; justify-content: space-between;margin-top:20px;">
        <!-- Left side - Customer info -->
        <div style="width: 50%;  padding: 20px; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; border-right: 1px solid #ccc;">
          <p style="margin: 0; font-size: 12px; text-transform: uppercase;">Customer Details:</p>
          <div style="min-height:60px;padding-left:10px">
          <span style="font-weight:600;font-size:12px; text-transform: uppercase;">${customer?.name || 'N/A'}</span>
          </div>
          <p style="margin: 5px 0; font-size: 12px;">
            <span style="text-transform: uppercase;">TAX Reg No:</span> <span style="font-weight:600;font-size:12px;margin-left:10px; text-transform: uppercase;">${customer?.trn || 'N/A'}</span>
          </p>
          <div style="height:30px">
          <p style="font-size: 12px;">
            <span style="text-transform: uppercase;">Ship to Country/Emirate:</span>
            
            <span style="font-weight:600;font-size:12px;margin-left:10px; text-transform: uppercase;">${invoice.ship_to || 'N/A'}</span>
            
          </p>
          </div>
        </div>
        
        <!-- Right side - Invoice details -->
        <div style="width: 50%;  padding: 20px; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px">
            <tr>
              <td style="text-transform: uppercase;">Invoice No:</td>
              <td style="font-weight: bold; padding: 3px 0; text-transform: uppercase;">${invoice.invoice_number || 'N/A'}</td>
            </tr>
            <tr>
              <td style="text-transform: uppercase;">Invoice date:</td>
              <td style="font-weight: bold; padding: 3px 0; text-transform: uppercase;">${formattedDate || 'N/A'}</td>
            </tr>
            <tr>
              <td style="text-transform: uppercase;">Salesman:</td>
              <td style="font-weight: bold; padding: 3px 0; text-transform: uppercase;">${salesPerson?.name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="text-transform: uppercase;">Ship From:</td>
              <td style="font-weight: bold; padding: 3px 0; text-transform: uppercase;">${invoice.ship_from || 'N/A'}</td>
            </tr>
          </table>
        </div>
      </div>
      `
          : `
      <!-- Simple page indicator for non-first pages -->
      <div style="font-weight: bold; font-size: 12px;display:flex;justify-content:center;align-items:center; margin-bottom: 15px; text-transform: uppercase;">
        ${documentDisplayTitle} ${totalPages > 1 ? `(Page ${pageIndex + 1} of ${totalPages})` : ''}
      </div>
      `
      }

      <!-- Items Table - Unified structure with footer as part of table -->
      <div style="margin-bottom: ${!isLastPage ? '15mm' : '0'}; ${isLastPage ? `height: calc(100vh - ${pageIndex === 0 ? '0px' : '-300px'}); display: flex; flex-direction: column;` : ''}">
        <table style="margin-top:5px;width: 100%; border-collapse: collapse; font-size: 12px; ${isLastPage ? 'height: 100%; display: table;' : 'border-bottom: 1px solid #ccc;'}">
          <thead>
            <tr style="">
              <th style="border-left: none;font-weight:normal; border-right: 1px solid #ccc; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 8px; text-align: left; text-transform: uppercase;">No.</th>
              <th style="border-right: 1px solid #ccc; border-top: 1px solid #ccc;font-weight:normal; border-bottom: 1px solid #ccc; padding: 8px; text-align: left; text-transform: uppercase;">Part No.</th>
              <th style="border-right: 1px solid #ccc; border-top: 1px solid #ccc;font-weight:normal; border-bottom: 1px solid #ccc; padding: 8px; text-align: left; text-transform: uppercase;">Description</th>
              <th style="border-right: 1px solid #ccc; border-top: 1px solid #ccc;font-weight:normal; border-bottom: 1px solid #ccc; padding: 8px; text-align: left; text-transform: uppercase;">QTY</th>
              ${
                !isDelivery
                  ? `
              <th style="border-right: 1px solid #ccc; border-top: 1px solid #ccc;font-weight:normal; border-bottom: 1px solid #ccc; padding: 8px; text-align: left; text-transform: uppercase;">Rate</th>
              <th style="border-right: 1px solid #ccc; border-top: 1px solid #ccc;font-weight:normal; border-bottom: 1px solid #ccc; padding: 8px; text-align: left; text-transform: uppercase;">Amount</th>
              <th style="border-right: 1px solid #ccc; border-top: 1px solid #ccc;font-weight:normal; border-bottom: 1px solid #ccc; padding: 8px; text-align: left; text-transform: uppercase;text-align:center">VAT %</th>
              <th style="border-right: 1px solid #ccc; border-top: 1px solid #ccc;font-weight:normal; border-bottom: 1px solid #ccc; padding: 8px; text-align: left; text-transform: uppercase;">VAT</th>
              <th style="border-right: 1px solid #ccc; border-top: 1px solid #ccc;font-weight:normal; border-bottom: 1px solid #ccc; padding: 8px; text-align: left; text-transform: uppercase;">Total Amount</th>
              <th style="border-right: none; border-top: 1px solid #ccc;font-weight:normal; border-bottom: 1px solid #ccc; padding: 8px; text-align: left; text-transform: uppercase;">Remarks</th>
              `
                  : ''
              }
            </tr>
          </thead>
          <tbody style="${isLastPage ? 'height: 100%; display: table-row-group;' : ''}">
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

                const itemNumber = startIndex + idx + 1;

                return `
              <tr>
                <td style="font-size:10px;border-left: none; border-right: 1px solid #ccc; padding: ${pageIndex === 0 ? '8px' : '6px'}; vertical-align: top; text-transform: uppercase;">${itemNumber}</td>
                <td style="font-size:10px;border-right: 1px solid #ccc; padding: ${pageIndex === 0 ? '8px' : '6px'}; vertical-align: top; text-transform: uppercase;">${product?.partNo || 'N/A'}</td>
                <td style="font-size:10px;border-right: 1px solid #ccc; padding: ${pageIndex === 0 ? '8px' : '6px'}; vertical-align: top; text-transform: uppercase;">${product?.name || 'N/A'}</td>
                <td style="font-size:10px;border-right: 1px solid #ccc; padding: ${pageIndex === 0 ? '8px' : '6px'}; vertical-align: top;">${quantity.toString()}</td>
                ${
                  !isDelivery
                    ? `
                <td style="font-size:10px;border-right: 1px solid #ccc; padding: ${pageIndex === 0 ? '8px' : '6px'}; vertical-align: top;">${unitPrice.toFixed(2)}</td>
                <td style="font-size:10px;border-right: 1px solid #ccc; padding: ${pageIndex === 0 ? '8px' : '6px'}; vertical-align: top;">${amount.toFixed(2)}</td>
                <td style="font-size:10px;border-right: 1px solid #ccc; padding: ${pageIndex === 0 ? '8px' : '6px'}; vertical-align: top;">${invoiceTaxRate.toString()}</td>
                <td style="font-size:10px;border-right: 1px solid #ccc; padding: ${pageIndex === 0 ? '8px' : '6px'}; vertical-align: top;">${vatAmount.toFixed(2)}</td>
                <td style="font-size:10px;border-right: 1px solid #ccc; padding: ${pageIndex === 0 ? '8px' : '6px'}; vertical-align: top;">${totalAmount.toFixed(2)}</td>
                <td style="font-size:10px;border-right: none; padding: ${pageIndex === 0 ? '8px' : '6px'}; vertical-align: top; text-transform: uppercase;">${product?.brand || 'N/A'}</td>
                `
                    : ''
                }
              </tr>
              `;
              })
              .join('')}
              
            ${
              isLastPage
                ? `
            <!-- Spacer row to fill remaining space and push footer to bottom -->
            <tr style="height: 100%;">
              <td style="border-left: none; border-right: 1px solid #ccc; height: 100%; vertical-align: bottom;"></td>
              <td style="border-right: 1px solid #ccc; height: 100%; vertical-align: bottom;"></td>
              <td style="border-right: 1px solid #ccc; height: 100%; vertical-align: bottom;"></td>
              <td style="border-right: 1px solid #ccc; height: 100%; vertical-align: bottom;"></td>
              ${
                !isDelivery
                  ? `
              <td style="border-right: 1px solid #ccc; height: 100%; vertical-align: bottom;"></td>
              <td style="border-right: 1px solid #ccc; height: 100%; vertical-align: bottom;"></td>
              <td style="border-right: 1px solid #ccc; height: 100%; vertical-align: bottom;"></td>
              <td style="border-right: 1px solid #ccc; height: 100%; vertical-align: bottom;"></td>
              <td style="border-right: 1px solid #ccc; height: 100%; vertical-align: bottom;"></td>
              <td style="border-right: none; height: 100%; vertical-align: bottom;"></td>
              `
                  : ''
              }
            </tr>
            
            ${
              !isDelivery
                ? `
            <!-- Footer section: Totals row with fixed height -->
            <tr style="height: 80px;">
              <td colspan="5" style="border-left: none; border-right: 1px solid #ccc; border-top: 1px solid #ccc; padding: 10px; vertical-align: top; height: 80px;">
                ${
                  invoice.invoice_stage === 'PROFORMA'
                    ? `
                  <h4 style="margin-top: 0; margin-bottom: 5px; font-size: 12px; text-transform: uppercase;">Bank Details</h4>
                  <p style="font-weight: bold; margin-bottom: 3px; font-size: 12px; text-transform: uppercase;">${primaryBankDetails?.name || 'N/A'}</p>
                  <div style="font-size: 12px; white-space: pre-line; line-height: 1.2; text-transform: uppercase;">
                    ${primaryBankDetails?.details || ' '}
                  </div>
                  `
                    : `
                  <h4 style="margin-top: 0; margin-bottom: 5px; font-size: 12px; text-transform: uppercase;">Terms & Conditions</h4>
                  <p style="font-size: 12px; margin-bottom: 0; line-height: 1.2;">
                   Claims for shortages or defects must be checked and confirmed at the time of receipt of goods.<br/>
                   <span style="margin-top:10px;display:block;">Goods once sold will not be returned unless prior written approval and must be in unused, resalable condition.</span>
                  </p>
                  `
                }
              </td>
              <td colspan="5" style="border-right: none; border-top: 1px solid #ccc; padding: 10px; vertical-align: top; height: 80px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                  <tr>
                    <td style="padding: 1px 0; text-transform: uppercase;">Subtotal:</td>
                    <td style="text-align: right;">${totals.subtotal} AED</td>
                  </tr>
                  <tr>
                    <td style="padding: 1px 0; text-transform: uppercase;">${totals.taxType}:</td>
                    <td style="text-align: right;">${totals.taxAmount} AED</td>
                  </tr>
                  <tr>
                    <td style="padding: 1px 0; text-transform: uppercase;">Discount:</td>
                    <td style="text-align: right;">${totals.discount} AED</td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold; padding: 4px 0 0 0; text-transform: uppercase;">Invoice Total:</td>
                    <td style="text-align: right; font-weight: bold; padding: 4px 0 0 0;">${totals.total} AED</td>
                  </tr>
                </table>
              </td>
            </tr>
            `
                : ''
            }
            
            <!-- Signature row with fixed height -->
            <tr">
              <td colspan="${!isDelivery ? '10' : '4'}" style="border-left: none; border-right: none; border-top: 1px solid #ccc; padding-top: 15px;">
              <div style="width:100%;display:flex;flex-direction:column;justify-content:end">
                <div style="display: flex; justify-content: space-between; padding: 15px; gap:25px">
                  <div style="width:25%;">
                    <div style="border-top: 1px dotted #999;  text-align: center; padding-top: 5px; font-size: 9px; color: #666; text-transform: uppercase;">
                      Customer Signature
                    </div>
                  </div>
                      
                  <div>
                      <p style="font-size: 9px; color: #666; border:1px solid #ccc;padding-left:5px; padding-right:5px; padding-bottom:10px;width:100%;text-align:center">
                      لا تتحمل الشركة أي مسؤولية عن الأموال المدفوعة مقابل هذه الفاتورة ما لم يتم إثبات ذلك من خلال إيصال رسمي من الشركة.<br/>

                        <span style="text-transform: uppercase;">Company accepts no responsibility  for money paid against this invoice unless evidenced by an official receipt of the company.</span>
                      </p>
                  </div>
                      
                  <div style="width:25%;">
                    <div style="border-top: 1px dotted #999; text-align: center; padding-top: 5px; font-size: 9px; color: #666; text-transform: uppercase;">
                      For Arabian Auto Equipments and Parts Trading (FZC)
                    </div>
                  </div>
                </div>
                </div>
              </td>
            </tr>
            
            
            <!-- Address footer row with fixed height -->
            <tr style="height: 40px; margin-top: 10px;">
              <td colspan="${!isDelivery ? '10' : '4'}" style="border-left: none; border-right: none; border-top: 1px solid #ccc; padding: 0 15px; font-size: 10px; color: #666; text-align: center; height: 30px;">
                <div style="text-align: center; line-height: 1.4;">
                  ${
                    primaryAddress
                      ? `
                    ${primaryAddress.street || ''}, 
                    ${primaryAddress.city || ''}${primaryAddress.state ? ', ' + primaryAddress.state : ''}
                    ${primaryAddress.country || ''} ${primaryAddress.postal_code || ''}<br>
                    ${primaryAddress.phone_no ? `Tel: ${primaryAddress.phone_no}` : ''}
                  `
                      : ''
                  }
                </div>
              </td>
            </tr>
            `
                : ''
            }
          </tbody>
        </table>
      </div>
    </div>
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

// Function to generate Purchase Order PDF
export async function generatePurchasePDF(purchaseData: PurchaseData): Promise<string> {
  const { purchase, supplier, primaryAddress, productsWithItems, formattedDate, documentTitle } =
    purchaseData;

  // Split products into pages to handle pagination with intelligent footer placement
  // Dynamic pagination based on available space and footer requirements
  const ITEMS_PER_PAGE_FIRST_WITH_FOOTER = 10; // First page with footer (purchase has smaller header)
  const ITEMS_PER_PAGE_FIRST_WITHOUT_FOOTER = 13; // First page without footer
  const ITEMS_PER_PAGE_OTHER = 25; // Subsequent pages (more space available)

  // Calculate intelligent page distribution
  let pageDistribution: Array<{ itemCount: number; hasFooter: boolean }> = [];
  let remainingItems = productsWithItems.length;

  if (remainingItems <= ITEMS_PER_PAGE_FIRST_WITH_FOOTER) {
    // All items fit on first page with footer
    pageDistribution = [{ itemCount: remainingItems, hasFooter: true }];
  } else if (remainingItems <= ITEMS_PER_PAGE_FIRST_WITHOUT_FOOTER) {
    // Items fit on first page without footer, footer goes to second page
    pageDistribution = [
      { itemCount: remainingItems, hasFooter: false },
      { itemCount: 0, hasFooter: true }, // Footer-only page
    ];
  } else {
    // Multiple pages needed
    // First page: use maximum items without footer
    pageDistribution.push({ itemCount: ITEMS_PER_PAGE_FIRST_WITHOUT_FOOTER, hasFooter: false });
    remainingItems -= ITEMS_PER_PAGE_FIRST_WITHOUT_FOOTER;

    // Fill subsequent pages
    while (remainingItems > 0) {
      const itemsForPage = Math.min(ITEMS_PER_PAGE_OTHER, remainingItems);
      const isLastBatch = remainingItems <= ITEMS_PER_PAGE_OTHER;

      pageDistribution.push({
        itemCount: itemsForPage,
        hasFooter: isLastBatch, // Footer only on the very last page
      });
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
    const itemsOnThisPage = pageDistribution[pageIndex].itemCount;
    const hasFooterOnThisPage = pageDistribution[pageIndex].hasFooter;
    const endIndex = startIndex + itemsOnThisPage;
    const pageItems = productsWithItems.slice(startIndex, endIndex);
    const isLastPage = hasFooterOnThisPage; // Footer determines if it's the "last" page for styling

    // Calculate page height - adjust based on content
    const baseHeight = 297; // A4 height in mm
    const headerHeight = pageIndex === 0 ? 180 : 50; // First page has bigger header
    const rowHeight = 25; // Height per table row in mm
    const footerHeight = isLastPage ? 100 : 0; // Footer only on last page

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
    tempDiv.style.padding = '5mm'; // Add padding for border space
    tempDiv.style.boxSizing = 'border-box'; // Include padding in dimensions

    // Generate the HTML content with exact template structure
    const htmlContent = `
    <div style="width: 100%; height: 100%; border: 2px solid #ccc; box-sizing: border-box;">
    <div style="font-family: Helvetica, sans-serif; color: #333; background-color: white; border-bottom:none;width:100%;">
      ${
        pageIndex === 0
          ? `
      <!-- Header Section - Only on first page -->
      <div>
        <div style="display: flex;gap:20px; justify-content: start; padding-left: 20px; padding-right: 20px;">
          <div style="display:flex;justify-content:center;align-items:center;">
            <img src="/logo.png" alt="Logo" style="width: 100px; max-height: 80px; object-fit: contain" />
          </div>
          <div style="width: 100%; background-color: #ffffff; padding-left: 20px; padding-right: 20px; padding-top: 20px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="margin: 0;font-weight:bold; font-size: 18px; text-transform: uppercase;">Arabian Auto Equipments and Parts Trading (FZC)</h3>
              <p style=" font-size: 20px; font-weight: bold; direction: rtl; text-align: right;">
                العربية لتجارة معدات وقطع غيار السيارات &#x28;ش.م.ح&#x29;
              </p>
            </div>
            
          </div>
        </div>
          <!-- Invoice Title -->
          <div style=" padding-left:10px; padding-right:10px;padding-top:15px;margin-bottom:0;">
            <p style="font-weight: bold; font-size: 12px; margin-bottom: 0; text-transform: uppercase;text-align:center;"> purchase order </p>
            <p style="font-size: 12px; margin-top: 0; margin-bottom: 0; text-transform: uppercase;text-align:center;">${primaryAddress.transaction_no ? `TRN NO: ${primaryAddress.transaction_no}` : ''}</p>
          </div>
      </div>

      <!-- Purchase Order Title
      <div style="display:flex;justify-content:center;flex-direction:column;align-items:center; margin-bottom: 15px;">
        <p style="font-weight: bold; font-size: 12px; margin-bottom: 0; text-transform: uppercase;">${documentTitle} ${totalPages > 1 ? `(Page ${pageIndex + 1} of ${totalPages})` : ''}</p>
        <p style="font-size: 12px; margin-top: 0; margin-bottom: 0; text-transform: uppercase;">${primaryAddress.transaction_no ? `TRN NO: ${primaryAddress.transaction_no}` : ''}</p>
      </div> -->

      <!-- Supplier Info Section (only on first page) -->
      <div style="display: flex; justify-content: space-between;margin-top:20px;">
        <!-- Left side - Supplier info -->
        <div style="width: 50%; padding: 20px; border-top: 1px solid #ccc; border-right: 1px solid #ccc; border-bottom: 1px solid #ccc;">
          <p style="margin: 0; font-weight: bold; font-size: 12px; text-transform: uppercase;">Order To:<span style="margin: 5px 0; text-transform: uppercase;">${supplier?.name || 'N/A'}</span></p>
          <p style="margin: 10px 0; font-size: 12px;">
            <span style="font-weight: bold; text-transform: uppercase;">TAX Reg No:</span> <span style="text-transform: uppercase;">${supplier?.tax_registration_number || 'N/A'}</span>
          </p>
          <p style="margin: 5px 0; font-size: 12px;">
            <span style="font-weight: bold; text-transform: uppercase;">Address:</span>
            ${supplier?.address || 'N/A'}
          </p>
          <p style="margin: 5px 0; font-size: 12px;">
            <span style="font-weight: bold; text-transform: uppercase;">Contact:</span>
            <span style="text-transform: uppercase;">${supplier?.contact_number || 'N/A'}</span>
          </p>
        </div>
        
        <!-- Right side - Purchase details -->
        <div style="width: 50%;  padding: 20px; border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px">
            <tr>
              <td style="font-weight: bold; padding: 3px 0; text-transform: uppercase;">PO No:</td>
              <td style="text-transform: uppercase;">${purchase.purchase_number || 'N/A'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 3px 0; text-transform: uppercase;">PO date:</td>
              <td style="text-transform: uppercase;">${formattedDate || 'N/A'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 3px 0; text-transform: uppercase;">Ship From:</td>
              <td style="text-transform: uppercase;">${purchase.ship_from || 'N/A'}</td>
            </tr>
          </table>
        </div>
      </div>
      `
          : `
      <!-- Continued Page Header -->
      <div style="font-weight: bold; font-size: 12px; padding: 10px 0; text-transform: uppercase;">
        ${documentTitle} - Continued (Page ${pageIndex + 1} of ${totalPages})
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px;">
        <div style="text-transform: uppercase;">PO No: ${purchase.purchase_number || 'N/A'}</div>
        <div style="text-transform: uppercase;">Date: ${formattedDate || 'N/A'}</div>
      </div>
      `
      }

      <!-- Items Table -->
      <div style="margin-bottom: ${!isLastPage ? '15mm' : '0'}; ${isLastPage ? `height: calc(100vh - ${pageIndex === 0 ? '-80px' : '-325px'}); display: flex; flex-direction: column;` : ''}">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; ${isLastPage ? 'height: 100%; display: table;' : 'border-bottom: 1px solid #ccc;'}">
          <thead>
            <tr style="">
              <th style="padding: 8px; text-align: left; border-left: none; border-right: 1px solid #ccc; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; text-transform: uppercase;">S.No</th>
              <th style="padding: 8px; text-align: left; border-right: 1px solid #ccc; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; text-transform: uppercase;">Part No</th>
              <th style="padding: 8px; text-align: left; border-right: 1px solid #ccc; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; width: 40%; text-transform: uppercase;">Description</th>
              <th style="padding: 8px; text-align: center; border-right: none; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; text-transform: uppercase;">Qty</th>
            </tr>
          </thead>
          <tbody style="${isLastPage ? 'height: 100%; display: table-row-group;' : ''}">
            ${pageItems
              .map((item, index) => {
                const itemNumber = startIndex + index + 1;
                return `
              <tr>
                <td style="padding: 8px; text-align: left; border-left: none; border-right: 1px solid #ccc; vertical-align: top; text-transform: uppercase;">${itemNumber}</td>
                <td style="padding: 8px; text-align: left; border-right: 1px solid #ccc; vertical-align: top; text-transform: uppercase;">${
                  item.product?.partNo || 'N/A'
                }</td>
                <td style="padding: 8px; text-align: left; border-right: 1px solid #ccc; vertical-align: top;">
                  <span style="text-transform: uppercase;">${item.product?.name || 'N/A'}</span>
                  ${item.product?.brand ? `<br><small style="text-transform: uppercase;">Brand: ${item.product.brand}</small>` : ''}
                </td>
                <td style="padding: 8px; text-align: center; border-right: none; vertical-align: top;">
                  ${item.item.quantity || 0}
                </td>
              </tr>
            `;
              })
              .join('')}
              
            ${
              isLastPage
                ? `
            <!-- Spacer row to fill remaining space and push footer to bottom -->
            <tr style="height: 100%;">
              <td style="border-left: none; border-right: 1px solid #ccc; height: 100%; vertical-align: bottom;"></td>
              <td style="border-right: 1px solid #ccc; height: 100%; vertical-align: bottom;"></td>
              <td style="border-right: 1px solid #ccc; height: 100%; vertical-align: bottom;"></td>
              <td style="border-right: none; height: 100%; vertical-align: bottom;"></td>
            </tr>
            
            <!-- Signature row with fixed height -->
            <tr style="height: 50px;">
              <td colspan="4" style="border-left: none; border-right: none; border-top: 1px solid #ccc; padding: 15px; height: 50px;">
                <div style="display: flex; justify-content: space-between;padding-top:30px;">
                  <div>
                    <div style="border-top: 1px dotted #999; width: 180px; text-align: center; padding-top: 5px; font-size: 12px; color: #666; text-transform: uppercase;">
                      Received By
                    </div>
                  </div>
                  <div>
                    <div style="border-top: 1px dotted #999; width: 180px; text-align: center; padding-top: 5px; font-size: 12px; color: #666; text-transform: uppercase;">
                      Authorized Signatory
                    </div>
                  </div>
                </div>
              </td>
            </tr>
            
            <!-- Address footer row with fixed height -->
            <tr style="height: 30px;">
              <td colspan="4" style="border-left: none; border-right: none; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 20px; font-size: 12px; color: #666; text-align: center; height: 30px;">
                <div style="text-align: center; line-height: 1.4;">
                  ${
                    primaryAddress
                      ? `
                    ${primaryAddress.street || ''}, 
                    ${primaryAddress.city || ''}${primaryAddress.state ? ', ' + primaryAddress.state : ''}
                    ${primaryAddress.country || ''} ${primaryAddress.postal_code || ''}<br>
                    ${primaryAddress.phone_no ? `Tel: ${primaryAddress.phone_no}` : ''}
                  `
                      : ''
                  }
                </div>
              </td>
            </tr>
            `
                : ''
            }
          </tbody>
        </table>
      </div>
    </div>
    </div>
    `;

    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);

    // Capture the HTML as image using html2canvas
    const pagePromise = html2canvas(tempDiv, {
      scale: 2, // Higher scale for better quality
      logging: false,
      useCORS: true,
      allowTaint: true,
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

  // Process all pages
  const pagesData = await Promise.all(pagePromises);

  // Create PDF
  const pdf = new jsPDF('p', 'mm', 'a4');

  // Add each page to the PDF
  pagesData.forEach((pageData, index) => {
    if (index > 0) {
      pdf.addPage();
    }

    // Add image to PDF
    pdf.addImage(
      pageData.imgData,
      'PNG',
      0,
      0,
      pageData.imgWidth,
      pageData.imgHeight,
      undefined,
      'FAST'
    );
  });

  // Convert to blob URL
  const blobUrl = URL.createObjectURL(pdf.output('blob'));
  return blobUrl;
}
