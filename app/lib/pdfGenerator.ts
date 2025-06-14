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

const formatDate = (date: string) => {
  try {
    // Parse the date string (e.g., "May 5, 2024")
    const parsedDate = new Date(date);

    // Check if the date is valid
    if (isNaN(parsedDate.getTime())) {
      return date; // Return original string if parsing fails
    }

    // Format to DD/MM/YYYY
    const day = parsedDate.getDate().toString().padStart(2, '0');
    const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is 0-indexed
    const year = parsedDate.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    // Return original string if any error occurs
    if (error) {
      //
    }
    return date;
  }
};

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
            <div style="font-size: 12px; height:30px;text-transform:uppercase">ADDRESS: <span style="font-weight: bold;padding-left:5px">${invoice.ship_to || ''}</span></div>
          </td>
          <td colspan="25" style="vertical-align: top; padding: 20px; text-align: left;">
            <div style="text-transform:uppercase;margin-bottom:5px">Invoice No: <span style="font-weight:bold;padding-left:5px">${invoice.invoice_number || ''}</span></div>
            <div style="text-transform:uppercase;margin-bottom:5px">Invoice Date: <span style="font-weight:bold;padding-left:5px">${formatDate(formattedDate) || ''}</span></div>
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

  // --- PURCHASE TABLE LAYOUT CONSTANTS ---
  const ITEM_ROW_HEIGHT_PX = 32; // each item row height
  const MAX_ITEM_ROWS_PER_PAGE = 12; // max items for single page

  // Calculate pagination properly for multi-page purchase orders
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
      // Single page - increase rows to push footer to bottom
      maxRowsForThisPage = 17; // Increased from 12 to push footer down
    } else if (isFirstPage) {
      // First page of multi-page - 18 rows total (>12 items)
      maxRowsForThisPage = 18;
    } else {
      // Second page - increase rows to push footer to bottom
      maxRowsForThisPage = 25; // Increased from 21 to push footer down
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
            <div style="font-weight: bold;padding-left:10px;height:50px;text-transform:uppercase">${supplier?.name || ''}</div>
            <div style="font-size: 12px;">TAX REG NO: <span style="font-weight: bold;padding-left:5px">${supplier?.tax_registration_number || ''}</span></div>
            <div style="font-size: 12px; height:30px;">ADDRESS: <span style="font-weight: bold;padding-left:5px">${primaryAddress.transaction_no || ''}</span></div>
          </td>
          <td colspan="25" style="vertical-align: top; padding: 20px; text-align: left;">
            <div style="text-transform:uppercase;margin-bottom:5px">Purchase Order No: <span style="font-weight:bold;padding-left:5px">${purchase.purchase_number || ''}</span></div>
            <div style="text-transform:uppercase;margin-bottom:5px">Purchase Date: <span style="font-weight:bold;padding-left:5px">${formatDate(formattedDate) || ''}</span></div>
            <div style="text-transform:uppercase;margin-bottom:5px">Ship From: <span style="font-weight:bold;padding-left:5px">${purchase.ship_from || ''}</span></div>
          </td>
        </tr>
        <!-- TABLE HEADINGS -->
        <tr style="height: 32px; background: #fff; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc; border-bottom: 1.5px solid #ccc;">
          <th colspan="10" style="border-right: 1.5px solid #ccc; padding: 8px 2px; text-align: center;">NO.</th>
          <th colspan="10" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">PART NO.</th>
          <th colspan="20" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">DESCRIPTION</th>
          <th colspan="10" style="border-right: 1.5px solid #ccc; padding: 8px 2px; text-align: center;">QTY</th>
        </tr>
        </tbody>
        `
            : `
        <!-- CONTINUATION PAGE HEADER -->
        <tbody>
        <tr style="height: 32px; background: #fff; border: 1.5px solid #ccc;">
          <th colspan="10" style="border-right: 1.5px solid #ccc; padding: 8px 2px; text-align: center;">NO.</th>
          <th colspan="10" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">PART NO.</th>
          <th colspan="20" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">DESCRIPTION</th>
          <th colspan="10" style="border-right: 1.5px solid #ccc; padding: 8px 2px; text-align: center;">QTY</th>
        </tr>
        </tbody>
        `
        }
        <!-- ITEM ROWS -->
        <tbody>
        ${pageItems
          .map((productItem, idx) => {
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
                <td colspan="10" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">${itemNumber}</td>
                <td colspan="10" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">${productItem.product?.partNo || ''}</td>
                <td colspan="20" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">${productItem.product?.name || ''}</td>
                <td colspan="10" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">${productItem.item.quantity}</td>
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
            <td colspan="10" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">&nbsp;</td>
            <td colspan="10" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">&nbsp;</td>
            <td colspan="20" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">&nbsp;</td>
            <td colspan="10" style="padding: 8px; text-align: center;">&nbsp;</td>
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
        <tr style="height: 32px; border-left: 1px solid #ccc; border-right: 1px solid #ccc; border-bottom: 1px solid #ccc;border-top: 1px solid #ccc;">
          <td colspan="25" style="text-align: center; font-size: 11px; vertical-align: bottom; border-right: 1px solid #ccc;padding-top:50px;">
            <div style="border-top: 1px dotted #999; width: 90%; margin: 0 auto; padding-top: 5px; padding-bottom: 25px; font-size: 11px; color: #666; text-transform: uppercase;">Received By</div>
          </td>
          <td colspan="25" style="text-align: center; font-size: 11px; vertical-align: bottom;padding-top:50px;">
            <div style="border-top: 1px dotted #999; width: 90%; margin: 0 auto; padding-top: 5px; padding-bottom: 25px; font-size: 11px; color: #666; text-transform: uppercase;">Authorized Signatory</div>
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
