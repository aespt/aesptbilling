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
    productsWithItems,
    formattedDate,
    documentTitle,
    totals,
  } = invoiceData;

  // --- TABLE LAYOUT CONSTANTS ---
  // const PAGE_HEIGHT_PX = 1122; // A4 at 96dpi
  // const MARGIN_PX = 38; // 10mm top/bottom margin in px
  // Header/footer row heights (px) - Updated to match actual HTML
  // const HEADER_ROW_HEIGHTS = [80, 30, 45, 32]; // logo/title, doc title, info, headings
  // const FOOTER_ROW_HEIGHTS = [40, 32, 28]; // terms/totals, signature/disclaimer, address
  // const HEADER_HEIGHT_PX = HEADER_ROW_HEIGHTS.reduce((a, b) => a + b, 0);
  // const FOOTER_HEIGHT_PX = FOOTER_ROW_HEIGHTS.reduce((a, b) => a + b, 0);
  // const FOOTER_HEIGHT_PX = 162;
  const ITEM_ROW_HEIGHT_PX = 32; // each item row (enough for 2 lines)
  // Add safety margin to prevent footer cutoff
  // const SAFETY_MARGIN_PX = 20;
  // const FIXED_HEIGHTS_PX = HEADER_HEIGHT_PX + FOOTER_HEIGHT_PX + 2 * MARGIN_PX + SAFETY_MARGIN_PX;
  // const AVAILABLE_BODY_HEIGHT = PAGE_HEIGHT_PX - FIXED_HEIGHTS_PX;
  // const MAX_ITEM_ROWS_PER_PAGE = Math.floor(AVAILABLE_BODY_HEIGHT / ITEM_ROW_HEIGHT_PX);
  const MAX_ITEM_ROWS_PER_PAGE = 12;

  // Calculate pagination properly for multi-page invoices
  const totalItems = productsWithItems.length;
  let pages: Array<{ items: typeof productsWithItems; isFirstPage: boolean; isLastPage: boolean }> =
    [];

  if (totalItems <= MAX_ITEM_ROWS_PER_PAGE) {
    // Single page - show header, items, and footer (≤12 items)
    pages = [{ items: productsWithItems, isFirstPage: true, isLastPage: true }];
  } else {
    // Multi-page logic (>12 items)
    // First page: Show up to 18 items without footer
    const FIRST_PAGE_MAX_ITEMS = 18;
    const firstPageItems = Math.min(FIRST_PAGE_MAX_ITEMS, totalItems);

    pages.push({
      items: productsWithItems.slice(0, firstPageItems),
      isFirstPage: true,
      isLastPage: false, // First page never has footer in multi-page
    });

    // Second page: Always create second page for footer (even if no remaining items)
    const remainingItems =
      totalItems > FIRST_PAGE_MAX_ITEMS ? productsWithItems.slice(FIRST_PAGE_MAX_ITEMS) : [];

    pages.push({
      items: remainingItems,
      isFirstPage: false,
      isLastPage: true,
    });
  }

  const totalPages = pages.length;
  const pagePromises: Promise<{ imgData: string; imgWidth: number; imgHeight: number }>[] = [];

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const pageData = pages[pageIndex];
    const pageItems = pageData.items;
    const isFirstPage = pageData.isFirstPage;
    const isLastPage = pageData.isLastPage;

    // Calculate filler rows based on page type
    let maxRowsForThisPage: number;
    if (isFirstPage && isLastPage) {
      // Single page - 12 rows total (≤12 items)
      maxRowsForThisPage = MAX_ITEM_ROWS_PER_PAGE; // 12
    } else if (isFirstPage) {
      // First page of multi-page - 19 rows total (>12 items)
      maxRowsForThisPage = 18;
    } else {
      // Second page - 21 rows total for footer alignment
      maxRowsForThisPage = 21;
    }

    const fillerRowCount = Math.max(0, maxRowsForThisPage - pageItems.length);

    // --- TABLE HTML ---
    const htmlContent = `
    <div style="width: 210mm; height: 297mm; box-sizing: border-box; padding: 10mm; background: #fff;">
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed;">
        ${
          isFirstPage
            ? `
        <!-- HEADER ROWS -->
        <tbody>
        <!-- Logo and Company Name Row -->
        <tr style="height: 80px; border-top: 1.5px solid #ccc; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc;">
          <td colspan="50" style="text-align: center; font-weight: bold; font-size: 18px; padding: 20px; vertical-align: middle;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
              <img src="/logo.png" alt="Logo" style="width: 80px; max-height: 60px; object-fit: contain;" />
              <div>
                ARABIAN AUTO EQUIPMENTS AND PARTS TRADING (FZC)<br/>
                <span style="font-size: 16px; font-weight: normal; direction: rtl;">العربية لتجارة معدات وقطع غيار السيارات (ش.م.ح)</span>
              </div>
            </div>
          </td>
        </tr>
        <!-- Title and TRN Row -->
        <tr style="height: 30px; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc; border-bottom: 1.5px solid #ccc;">
          <td colspan="50" style="text-align: center; padding: 8px; vertical-align: middle;">
            <span style="font-weight: bold; font-size: 13px; text-transform: uppercase;">${documentTitle}</span><br/>
            <span style="font-size: 12px;">TRN NO: ${primaryAddress.transaction_no || ''}</span>
          </td>
        </tr>
        <!-- Customer and Invoice Details Row -->
        <tr style="height: 45px; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc; border-bottom: 1.5px solid #ccc;">
          <td colspan="25" style="vertical-align: top; padding: 20px; text-align: left;border-right: 1px solid #ccc;">
            <div style=" text-transform: uppercase;">Customer Details:</div>
            <div style="font-weight: bold;padding-left:10px;height:50px;">${customer?.name || ''}</div>
            <div style="font-size: 12px;">TAX REG NO: <span style="font-weight: bold;padding-left:5px">${customer?.trn || ''}</span></div>
            <div style="font-size: 12px; height:30px;">ADDRESS: <span style="font-weight: bold;padding-left:5px">${invoice.ship_to || ''}</span></div>
          </td>
          <td colspan="25" style="vertical-align: top; padding: 20px; text-align: left;">
            <div style="text-transform:uppercase;margin-bottom:5px">Invoice No: <span style="font-weight:bold;padding-left:5px">${invoice.invoice_number || ''}</span></div>
            <div style="text-transform:uppercase;margin-bottom:5px">Invoice Date: <span style="font-weight:bold;padding-left:5px">${formattedDate || ''}</span></div>
            <div style="text-transform:uppercase;margin-bottom:5px">Salesman: <span style="font-weight:bold;padding-left:5px">${salesPerson?.name || ''}</span></div>
            <div style="text-transform:uppercase;margin-bottom:5px">Ship From: <span style="font-weight:bold;padding-left:5px">${invoice.ship_from || ''}</span></div>
          </td>
        </tr>
        <!-- TABLE HEADINGS -->
        <tr style="height: 32px; background: #fff; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc; border-bottom: 1.5px solid #ccc;">
          <th colspan="2" style="border-right: 1.5px solid #ccc; padding: 8px 2px; text-align: center;">NO.</th>
          <th colspan="6" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">PART NO.</th>
          <th colspan="13" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">DESCRIPTION</th>
          <th colspan="2" style="border-right: 1.5px solid #ccc; padding: 8px 2px; text-align: center;">QTY</th>
          <th colspan="4" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">RATE</th>
          <th colspan="5" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">AMOUNT</th>
          <th colspan="3" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">VAT %</th>
          <th colspan="4" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">VAT</th>
          <th colspan="5" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">TOTAL AMOUNT</th>
          <th colspan="6" style="padding: 8px; text-align: center;">REMARKS</th>
        </tr>
        </tbody>
        `
            : `
        <!-- CONTINUATION PAGE HEADER -->
        <tbody>
        <tr style="height: 32px; background: #fff; border: 1.5px solid #ccc;">
          <th colspan="2" style="border-right: 1.5px solid #ccc; padding: 8px 2px; text-align: center;">NO.</th>
          <th colspan="6" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">PART NO.</th>
          <th colspan="13" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">DESCRIPTION</th>
          <th colspan="2" style="border-right: 1.5px solid #ccc; padding: 8px 2px; text-align: center;">QTY</th>
          <th colspan="4" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">RATE</th>
          <th colspan="5" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">AMOUNT</th>
          <th colspan="3" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">VAT %</th>
          <th colspan="4" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">VAT</th>
          <th colspan="5" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">TOTAL AMOUNT</th>
          <th colspan="6" style="padding: 8px; text-align: center;">REMARKS</th>
        </tr>
        </tbody>
        `
        }
        <!-- ITEM ROWS -->
        <tbody>
        ${pageItems
          .map((productItem, idx) => {
            const { item, product } = productItem;
            const invoiceTaxRate = invoice.tax_rate ? parseFloat(invoice.tax_rate.toString()) : 0;
            const unitPrice = item.mrp
              ? parseFloat(item.mrp.toString())
              : parseFloat(item.unit_price?.toString() || '0');
            const quantity = parseFloat(item.quantity.toString());
            const amount = unitPrice * quantity;
            const vatAmount = ((unitPrice * invoiceTaxRate) / 100) * quantity;
            const totalAmount = parseFloat(item.total_price?.toString() || '0');
            // Calculate correct item number across pages
            let itemNumber = idx + 1;
            for (let i = 0; i < pageIndex; i++) {
              itemNumber += pages[i].items.length;
            }
            // Add border bottom to last item on first page when items > 18
            const isLastItemOnFirstPageWithOverflow =
              isFirstPage && !isLastPage && idx === pageItems.length - 1 && pageItems.length === 18;
            const borderBottomStyle = isLastItemOnFirstPageWithOverflow
              ? 'border-bottom: 1.5px solid #ccc;'
              : '';
            return `
              <tr style="height: ${ITEM_ROW_HEIGHT_PX}px; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc; ${borderBottomStyle}">
                <td colspan="2" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">${itemNumber}</td>
                <td colspan="6" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">${product?.partNo || ''}</td>
                <td colspan="13" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">${product?.name || ''}</td>
                <td colspan="2" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">${quantity}</td>
                <td colspan="4" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">${unitPrice.toFixed(2)}</td>
                <td colspan="5" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">${amount.toFixed(2)}</td>
                <td colspan="3" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">${invoiceTaxRate}</td>
                <td colspan="4" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">${vatAmount.toFixed(2)}</td>
                <td colspan="5" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">${totalAmount.toFixed(2)}</td>
                <td colspan="6" style="padding: 8px; text-align: center;">${product?.brand || ''}</td>
              </tr>
            `;
          })
          .join('')}
        <!-- FILLER ROWS -->
        ${Array.from({ length: fillerRowCount })
          .map((_, idx) => {
            // Add border bottom only to the very last filler row on first page in multi-page PDF
            const isLastFillerOnFirstPage =
              isFirstPage && !isLastPage && idx === fillerRowCount - 1 && fillerRowCount > 0;
            const borderBottomStyle = isLastFillerOnFirstPage
              ? 'border-bottom: 1.5px solid #ccc;'
              : '';
            return `
          <tr style="height: ${ITEM_ROW_HEIGHT_PX}px; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc; ${borderBottomStyle}">
            <td colspan="2" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">&nbsp;</td>
            <td colspan="6" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">&nbsp;</td>
            <td colspan="13" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">&nbsp;</td>
            <td colspan="2" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">&nbsp;</td>
            <td colspan="4" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">&nbsp;</td>
            <td colspan="5" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">&nbsp;</td>
            <td colspan="3" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">&nbsp;</td>
            <td colspan="4" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">&nbsp;</td>
            <td colspan="5" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">&nbsp;</td>
            <td colspan="6" style="padding: 8px; text-align: center;">&nbsp;</td>
          </tr>
        `;
          })
          .join('')}
        </tbody>
        ${
          isLastPage
            ? `
        <!-- FOOTER ROWS -->
        <tbody>
        <tr style="height: 40px; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc; border-bottom: 1.5px solid #ccc;">
          <td colspan="30" style="vertical-align: top; padding: 20px; border-right: 1px solid #ccc;border-top: 1px solid #ccc;">
            <div style="font-size: 12px;text-transform: uppercase;"><span style="font-weight: bold;">Terms & Conditions</span><br/>
            Claims for shortages or defects must be checked and confirmed at the time of receipt of goods.<br/><br/>
            Goods once sold will not be returned unless prior written approval and must be in unused, resalable condition.<br/></div>
          </td>
          <td colspan="20" style="vertical-align: top; padding: 20px; border-top: 1px solid #ccc;">
            <div style="font-size: 12px;">
              <div style="display: flex; justify-content: space-between;margin-bottom:5px"><span>Subtotal:</span><span>${totals.subtotal} AED</span></div>
              <div style="display: flex; justify-content: space-between;margin-bottom:5px"><span>${totals.taxType}:</span><span>${totals.taxAmount} AED</span></div>
              <div style="display: flex; justify-content: space-between;margin-bottom:5px"><span>Discount:</span><span>${totals.discount} AED</span></div>
              <div style="display: flex; justify-content: space-between;margin-bottom:5px font-weight: bold;"><span>Invoice Total:</span><span>${totals.total} AED</span></div>
            </div>
          </td>
        </tr>
        <tr style="height: 32px; border-left: 1px solid #ccc; border-right: 1px solid #ccc; border-bottom: 1px solid #ccc;">
          <td colspan="15" style="text-align: center; font-size: 11px; vertical-align: bottom; border-right: 1px solid #ccc;">
            <div style="border-top: 1px dotted #999; width: 90%; margin: 0 auto; padding-top: 5px; padding-bottom: 25px; font-size: 11px; color: #666; text-transform: uppercase;">Customer Signature</div>
          </td>
          <td colspan="20" style="text-align: center; font-size: 10px; vertical-align: bottom; border-right: 1px solid #ccc;">
            <div style=" padding: 10px; font-size: 10px; color: #666;">
              لا تتحمل الشركة أي مسؤولية عن الأموال المدفوعة مقابل هذه الفاتورة ما لم يتم إثبات ذلك من خلال إيصال رسمي من الشركة.<br/>
              <span style="text-transform: uppercase;">Company accepts no responsibility for money paid against this invoice unless evidenced by an official receipt of the company.</span>
            </div>
          </td>
          <td colspan="15" style="text-align: center; font-size: 11px; vertical-align: bottom;">
            <div style="border-top: 1px dotted #999; width: 90%; margin: 0 auto; padding-top: 5px; padding-bottom: 10px; font-size: 11px; color: #666; text-transform: uppercase;">For Arabian Auto Equipments and Parts Trading (FZC)</div>
          </td>
        </tr>
        <tr style="height: 28px; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc; border-bottom: 1.5px solid #ccc;">
          <td colspan="50" style="text-align: center; font-size: 10px; padding: 8px;">
            ${primaryAddress.street || ''}, ${primaryAddress.city || ''}${primaryAddress.state ? ', ' + primaryAddress.state : ''} ${primaryAddress.country || ''} ${primaryAddress.postal_code || ''} ${primaryAddress.phone_no ? 'Tel: ' + primaryAddress.phone_no : ''}
          </td>
        </tr>
        </tbody>
        `
            : ''
        }
      </table>
    </div>
    `;

    // --- RENDER TO CANVAS ---
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '0';
    tempDiv.style.left = '0';
    tempDiv.style.width = '210mm';
    tempDiv.style.height = '297mm';
    tempDiv.style.overflow = 'hidden';
    tempDiv.style.zIndex = '-1000';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.boxSizing = 'border-box';
    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);

    const pagePromise = html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
    }).then(canvas => {
      document.body.removeChild(tempDiv);
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      return {
        imgData: canvas.toDataURL('image/jpeg', 0.95),
        imgWidth: imgWidth,
        imgHeight: imgHeight,
      };
    });
    pagePromises.push(pagePromise);
  }

  // Wait for all pages
  const pageResults = await Promise.all(pagePromises);
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    for (let i = 0; i < pageResults.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      const { imgData, imgWidth, imgHeight } = pageResults[i];
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    }
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

    // Calculate page height - adjust based on content
    const baseHeight = 297; // A4 height in mm
    const headerHeight = pageIndex === 0 ? 180 : 50; // First page has bigger header
    const rowHeight = 25; // Height per table row in mm
    const footerHeight = hasFooterOnThisPage ? 100 : 0; // Footer only on last page

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
    tempDiv.style.height = hasFooterOnThisPage ? '297mm' : `${contentHeight}mm`; // A4 height or content height
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
      <div style="margin-bottom: ${!hasFooterOnThisPage ? '15mm' : '0'}; ${hasFooterOnThisPage ? `height: calc(100vh - ${pageIndex === 0 ? '-80px' : '-325px'}); display: flex; flex-direction: column;` : ''}">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; ${hasFooterOnThisPage ? 'height: 100%; display: table;' : 'border-bottom: 1px solid #ccc;'}">
          <thead>
            <tr style="">
              <th style="padding: 8px; text-align: left; border-left: none; border-right: 1px solid #ccc; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; text-transform: uppercase;">S.No</th>
              <th style="padding: 8px; text-align: left; border-right: 1px solid #ccc; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; text-transform: uppercase;">Part No</th>
              <th style="padding: 8px; text-align: left; border-right: 1px solid #ccc; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; width: 40%; text-transform: uppercase;">Description</th>
              <th style="padding: 8px; text-align: center; border-right: none; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; text-transform: uppercase;">Qty</th>
            </tr>
          </thead>
          <tbody style="${hasFooterOnThisPage ? 'height: 100%; display: table-row-group;' : ''}">
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
              hasFooterOnThisPage
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
