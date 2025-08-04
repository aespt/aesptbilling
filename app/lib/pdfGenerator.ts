/* eslint-disable @typescript-eslint/no-unused-vars */
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
  description?: string;
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
  // Dynamic row height calculation based on description length
  const calculateRowHeight = (description: string): number => {
    const descLength = (description || '').length;
    if (descLength <= 33) {
      return 35; // Base height for short descriptions
    }
    // For every 33 characters beyond the first 33, add 8px
    const additionalBlocks = Math.ceil((descLength - 33) / 33);
    return 35 + additionalBlocks * 8;
  };

  // Available height for items area
  const AVAILABLE_ITEMS_HEIGHT_PX = 600; // For non-last pages

  // Calculate dynamic last page height based on customer address length
  const calculateLastPageHeight = (customerAddress: string): number => {
    const addressLength = (customerAddress || '').length;
    let lastPageHeight = 490; // Base height for last page

    if (addressLength > 33) {
      // For every 33 characters beyond the first 33, reduce by 10px
      const extraLines = Math.ceil((addressLength - 33) / 33);
      lastPageHeight -= extraLines * 10;
    }

    return Math.max(lastPageHeight, 400); // Minimum height of 400px
  };

  const LAST_PAGE_AVAILABLE_ITEMS_HEIGHT_PX = calculateLastPageHeight(invoice.ship_to || '');

  // Page constants for dynamic calculation
  const PAGE_HEIGHT_MM = 297; // A4 height in mm
  const PAGE_MARGIN_MM = 10; // top/bottom margin
  const AVAILABLE_PAGE_HEIGHT_MM = PAGE_HEIGHT_MM - 2 * PAGE_MARGIN_MM; // 277mm
  const MM_TO_PX_RATIO = 3.78; // approximate conversion
  // const AVAILABLE_PAGE_HEIGHT_PX = AVAILABLE_PAGE_HEIGHT_MM * MM_TO_PX_RATIO; // ~1047px

  // Fixed heights in pixels
  const LOGO_ROW_HEIGHT_PX = 80;
  const TITLE_ROW_HEIGHT_PX = 30;
  const TABLE_HEADER_HEIGHT_PX = 32;
  const FOOTER_TERMS_ROW_HEIGHT_PX = 40;
  const FOOTER_SIGNATURE_ROW_HEIGHT_PX = 32;
  const FOOTER_ADDRESS_ROW_HEIGHT_PX = 28;
  const FIXED_FOOTER_HEIGHT_PX =
    FOOTER_TERMS_ROW_HEIGHT_PX + FOOTER_SIGNATURE_ROW_HEIGHT_PX + FOOTER_ADDRESS_ROW_HEIGHT_PX; // 100px

  // Dynamic content height calculation
  const calculateCustomerDetailsHeight = (customer: Customer, invoice: Invoice): number => {
    // Base height for labels and spacing
    let height = 60; // Base height for "Customer Details:" and spacing

    // Customer name (can be multi-line)
    const nameLength = (customer?.name || '').length;
    height += nameLength > 50 ? 60 : 40; // Multi-line name gets more height

    // Tax registration line
    height += 20;

    // Address (dynamic based on length)
    const addressLength = (invoice.ship_to || '').length;
    if (addressLength > 100) {
      height += 60; // 3 lines
    } else if (addressLength > 50) {
      height += 40; // 2 lines
    } else {
      height += 20; // 1 line
    }

    return Math.max(height, 45); // Minimum height to match the right column
  };

  // Reserve fixed space approach - calculate maximum possible header and footer heights
  // const calculateMaxHeaderHeight = (): number => {
  //   // Calculate worst-case header height (first page with long customer details)
  //   const maxCustomerDetailsHeight = 200; // Reserve space for very long addresses
  //   return (
  //     LOGO_ROW_HEIGHT_PX + TITLE_ROW_HEIGHT_PX + maxCustomerDetailsHeight + TABLE_HEADER_HEIGHT_PX
  //   );
  // };

  // const calculateReservedFooterHeight = (): number => {
  //   // Reserve footer space on ALL pages to ensure consistency
  //   return FIXED_FOOTER_HEIGHT_PX + 50; // Extra 50px buffer for safety
  // };

  // Dynamic pagination based on actual row heights with different limits for last page
  const calculateDynamicPagination = (items: typeof productsWithItems) => {
    // Calculate total height needed for all items
    const totalHeight = items.reduce((sum, item) => {
      const itemHeight = calculateRowHeight(item.product?.description || '');
      return sum + itemHeight;
    }, 0);

    const pages: Array<{
      items: typeof productsWithItems;
      isFirstPage: boolean;
      isLastPage: boolean;
      totalHeight: number;
    }> = [];

    let remainingItems = [...items];
    let isFirstPage = true;
    let pageNumber = 1;

    while (remainingItems.length > 0) {
      const currentPageItems: typeof productsWithItems = [];
      let currentPageHeight = 0;

      // Try to fit as many items as possible, checking if we should use 480px limit
      for (let i = 0; i < remainingItems.length; i++) {
        const item = remainingItems[i];
        const itemHeight = calculateRowHeight(item.product?.description || '');

        // Calculate what the total height would be if we add this item
        const newTotalHeight = currentPageHeight + itemHeight;

        // Calculate remaining items height after this item (if we add it)
        const remainingAfterThis = remainingItems.slice(i + 1);
        const remainingItemsHeight = remainingAfterThis.reduce((sum, nextItem) => {
          return sum + calculateRowHeight(nextItem.product?.description || '');
        }, 0);

        // If remaining items would fit in 480px, use that limit for current page
        const useLastPageLimit = remainingItemsHeight <= LAST_PAGE_AVAILABLE_ITEMS_HEIGHT_PX;
        const heightLimit = useLastPageLimit
          ? LAST_PAGE_AVAILABLE_ITEMS_HEIGHT_PX
          : AVAILABLE_ITEMS_HEIGHT_PX;

        // Check if we can fit this item with the appropriate limit
        if (newTotalHeight <= heightLimit) {
          currentPageItems.push(item);
          currentPageHeight = newTotalHeight;
        } else {
          break;
        }
      }

      // Ensure at least one item per page
      if (currentPageItems.length === 0 && remainingItems.length > 0) {
        currentPageItems.push(remainingItems[0]);
        currentPageHeight = calculateRowHeight(remainingItems[0].product?.description || '');
      }

      // Remove processed items from remaining
      remainingItems = remainingItems.slice(currentPageItems.length);

      // Determine if this is the last page
      const isLastPage = remainingItems.length === 0;

      pages.push({
        items: currentPageItems,
        isFirstPage,
        isLastPage,
        totalHeight: currentPageHeight,
      });

      isFirstPage = false;
      pageNumber++;
    }

    return pages;
  };

  // Dynamic pagination calculation
  const totalItems = productsWithItems.length;
  let pages: Array<{
    items: typeof productsWithItems;
    isFirstPage: boolean;
    isLastPage: boolean;
    totalHeight?: number;
  }> = [];

  if (totalItems === 0) {
    // Empty invoice
    pages = [{ items: [], isFirstPage: true, isLastPage: true }];
  } else {
    pages = calculateDynamicPagination(productsWithItems);
  }

  const totalPages = pages.length;
  const pagePromises: Promise<{ imgData: string; imgWidth: number; imgHeight: number }>[] = [];

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const pageData = pages[pageIndex];
    const pageItems = pageData.items;
    const isFirstPage = pageData.isFirstPage;
    const isLastPage = pageData.isLastPage;

    // Calculate remaining height for filler rows (if needed)
    const usedHeight = pageData.totalHeight || 0;
    const targetHeight = isLastPage
      ? LAST_PAGE_AVAILABLE_ITEMS_HEIGHT_PX
      : AVAILABLE_ITEMS_HEIGHT_PX;
    const remainingHeight = Math.max(0, targetHeight - usedHeight);

    // Calculate number of filler rows needed (using base height)
    const baseRowHeight = 35; // Use base height for filler rows
    let fillerRowCount = Math.floor(remainingHeight / baseRowHeight);

    // For last page, reduce filler height by 80px to ensure footer is fully visible
    if (isLastPage) {
      const adjustedRemainingHeight = Math.max(0, remainingHeight - 80);
      fillerRowCount = Math.floor(adjustedRemainingHeight / baseRowHeight);
    }

    // --- TABLE HTML ---
    const htmlContent = `
    <div style="width: 210mm; height: 297mm; box-sizing: border-box; padding: 10mm; background: #fff;">
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed;">
        <!-- HEADER ROWS (ALL PAGES) -->
        <tbody>
        <!-- Logo and Company Name Row -->
        <tr style="height: 80px; border-top: 1.5px solid #ccc; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc;">
          <td colspan="50" style="text-align: center; font-weight: bold; font-size: 18px; padding: 20px; vertical-align: middle;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
              <img src="/logo.png" alt="Logo" style="width: 80px; max-height: 60px; object-fit: contain;" />
              <div>
                <span style="font-size: 20px; font-weight: bold;">ARABIAN AUTO EQUIPMENTS AND PARTS TRADING (FZC)</span><br/>
                <span style="font-size: 16px; font-weight: normal; direction: rtl;">العربية لتجارة معدات وقطع غيار السيارات ش.م.ح</span>
              </div>
            </div>
          </td>
        </tr>
        <!-- Title and TRN Row -->
        <tr style="height: 30px; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc; border-bottom: 1.5px solid #ccc;">
          <td colspan="50" style="text-align: center; padding: 8px; vertical-align: middle;">
            <span style="font-weight: bold; font-size: 13px; text-transform: uppercase;">${documentTitle} ${!isFirstPage ? '(Continued)' : ''}</span><br/>
            <span style="font-size: 12px;">TRN NO: ${primaryAddress.transaction_no || ''}</span>
          </td>
        </tr>
        <!-- Customer and Invoice Details Row (ALL PAGES) -->
        <tr style="height: ${calculateCustomerDetailsHeight(customer, invoice)}px; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc; border-bottom: 1.5px solid #ccc;">
          <td colspan="25" style="vertical-align: top; padding: 20px; text-align: left;border-right: 1px solid #ccc;">
            <div style=" text-transform: uppercase; margin-bottom: 8px;">Customer Details:</div>
            <div style="font-weight: bold; margin-bottom: 8px; word-wrap: break-word; line-height: 1.4;">${customer?.name || ''}</div>
            <div style="font-size: 12px; margin-bottom: 8px;">TAX REG NO: <span style="font-weight: bold;padding-left:5px">${customer?.trn || ''}</span></div>
            <div style="font-size: 12px; text-transform:uppercase; word-wrap: break-word; line-height: 1.4;">ADDRESS: <span style="font-weight: bold;padding-left:5px">${invoice.ship_to || ''}</span></div>
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
            // Add border bottom to last item on first page when continuing to next page
            const isLastItemOnFirstPageWithOverflow =
              isFirstPage && !isLastPage && idx === pageItems.length - 1;
            const borderBottomStyle = isLastItemOnFirstPageWithOverflow
              ? 'border-bottom: 1.5px solid #ccc;'
              : '';
            const itemRowHeight = calculateRowHeight(product?.description || '');
            return `
              <tr style="height: ${itemRowHeight}px; max-height: ${itemRowHeight}px; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc; ${borderBottomStyle};overflow: hidden;">
                <td colspan="2" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">${itemNumber}</td>
                <td colspan="6" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">${product?.partNo || ''}</td>
                <td colspan="13" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: left;font-size: 10px; word-wrap: break-word; line-height: 1.2;">${product?.description || '-'}</td>
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
          <tr style="height: ${baseRowHeight}px; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc; ${borderBottomStyle}">
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
          !isLastPage
            ? `
        <!-- Add bottom border for continuation pages -->
        <tbody>
        <tr style="height: 0px; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc; border-bottom: 1.5px solid #ccc;">
          <td colspan="50" style="padding: 0; line-height: 0; font-size: 0;">&nbsp;</td>
        </tr>
        </tbody>
        `
            : ''
        }
        <!-- FOOTER ROWS (ALWAYS PRESENT TO RESERVE SPACE) -->
        <tbody style="${!isLastPage ? 'visibility: hidden;' : ''}">
        <tr style="height: 40px; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc; border-bottom: 1.5px solid #ccc;">
          <td colspan="30" style="vertical-align: top; padding: 20px; padding-top: 10px; border-right: 1px solid #ccc;${isLastPage ? 'border-top: 1px solid #ccc;' : ''}">
          ${
            documentTitle === 'Proforma Invoice'
              ? `<p style="font-size: 12px;text-transform: uppercase;margin-bottom:0">Bank Details</p>
<p style="font-size: 12px;text-transform: uppercase;margin-bottom:0">${invoiceData.primaryBankDetails?.name || 'N/A'}</p>
<p style="font-size: 12px; white-space: pre-line;margin-top:0">${invoiceData.primaryBankDetails?.details || ''}</p>`
              : `<div style="font-size: 12px;text-transform: uppercase;"><span style="font-weight: bold;">Terms & Conditions</span><br/>
Claims for shortages or defects must be checked and confirmed at the time of receipt of goods.<br/><br/>
Warranty coverage, if applicable, is limited to manufacturing defects and excludes damages caused by incorrect installation, misuse, or normal wear and tear.<br/></div>`
          }
          </td>
          <td colspan="20" style="vertical-align: top; padding: 20px; ${isLastPage ? 'border-top: 1px solid #ccc;' : ''}">
            <div style="font-size: 12px;">
              <div style="display: flex; justify-content: space-between;margin-bottom:5px;text-transform:uppercase;"><span>Subtotal:</span><span>${totals.subtotal} AED</span></div>
              <div style="display: flex; justify-content: space-between;margin-bottom:5px;text-transform:uppercase;"><span>${totals.taxType}:</span><span>${totals.taxAmount} AED</span></div>
              <div style="display: flex; justify-content: space-between;margin-bottom:5px;text-transform:uppercase;"><span>Discount:</span><span>${totals.discount} AED</span></div>
              <div style="display: flex; justify-content: space-between;margin-bottom:5px;text-transform:uppercase; font-weight: bold;"><span>Invoice Total:</span><span>${totals.total} AED</span></div>
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
  // Dynamic row height calculation for purchase items (same logic as invoice)
  const calculatePurchaseRowHeight = (description: string): number => {
    const descLength = (description || '').length;
    if (descLength <= 33) {
      return 35; // Base height for short descriptions
    }
    // For every 33 characters beyond the first 33, add 8px
    const additionalBlocks = Math.ceil((descLength - 33) / 33);
    return 35 + additionalBlocks * 8;
  };

  // Available height for purchase items area
  const PURCHASE_AVAILABLE_ITEMS_HEIGHT_PX = 600; // For non-last pages

  // Calculate dynamic last page height based on supplier address length
  const calculatePurchaseLastPageHeight = (supplierAddress: string): number => {
    const addressLength = (supplierAddress || '').length;
    let lastPageHeight = 650; // Base height for last page (higher for purchase PDFs due to smaller footer)

    if (addressLength > 33) {
      // For every 33 characters beyond the first 33, reduce by 10px
      const extraLines = Math.ceil((addressLength - 33) / 33);
      lastPageHeight -= extraLines * 10;
    }

    return Math.max(lastPageHeight, 500); // Minimum height of 500px
  };

  const PURCHASE_LAST_PAGE_AVAILABLE_ITEMS_HEIGHT_PX = calculatePurchaseLastPageHeight(
    supplier?.address || ''
  );

  // Purchase page constants (same as invoice)
  const PURCHASE_PAGE_HEIGHT_MM = 297;
  const PURCHASE_PAGE_MARGIN_MM = 10;
  const PURCHASE_AVAILABLE_PAGE_HEIGHT_MM = PURCHASE_PAGE_HEIGHT_MM - 2 * PURCHASE_PAGE_MARGIN_MM;
  const PURCHASE_MM_TO_PX_RATIO = 3.78;
  // const PURCHASE_AVAILABLE_PAGE_HEIGHT_PX =
  //   PURCHASE_AVAILABLE_PAGE_HEIGHT_MM * PURCHASE_MM_TO_PX_RATIO;

  const PURCHASE_LOGO_ROW_HEIGHT_PX = 80;
  const PURCHASE_TITLE_ROW_HEIGHT_PX = 30;
  const PURCHASE_TABLE_HEADER_HEIGHT_PX = 32;

  // Purchase-specific dynamic height calculation
  const calculatePurchaseSupplierDetailsHeight = (supplier: Supplier): number => {
    // Base height for labels and spacing
    let height = 60;

    // Supplier name (can be multi-line)
    const nameLength = (supplier?.name || '').length;
    height += nameLength > 50 ? 60 : 40;

    // Tax registration line
    height += 20;

    // Address (dynamic based on length)
    const addressLength = (supplier?.address || '').length;
    if (addressLength > 100) {
      height += 60; // 3 lines
    } else if (addressLength > 50) {
      height += 40; // 2 lines
    } else {
      height += 20; // 1 line
    }

    return Math.max(height, 45);
  };

  // Fixed space reservation for purchase PDFs
  // const calculatePurchaseMaxHeaderHeight = (): number => {
  //   // Reserve space for worst-case header height
  //   const maxSupplierDetailsHeight = 200; // Reserve space for very long supplier addresses
  //   return (
  //     PURCHASE_LOGO_ROW_HEIGHT_PX +
  //     PURCHASE_TITLE_ROW_HEIGHT_PX +
  //     maxSupplierDetailsHeight +
  //     PURCHASE_TABLE_HEADER_HEIGHT_PX
  //   );
  // };

  // const calculatePurchaseReservedFooterHeight = (): number => {
  //   // Reserve footer space on ALL pages
  //   const PURCHASE_FOOTER_HEIGHT_PX = 32 + 28; // signature row + address row
  //   return PURCHASE_FOOTER_HEIGHT_PX + 50; // Extra 50px buffer for safety
  // };

  // Dynamic pagination for purchase items based on actual row heights with different limits for last page
  const calculatePurchaseDynamicPagination = (items: typeof productsWithItems) => {
    // Calculate total height needed for all items
    const totalHeight = items.reduce((sum, item) => {
      const itemHeight = calculatePurchaseRowHeight(item.product?.description || '');
      return sum + itemHeight;
    }, 0);

    const pages: Array<{
      items: typeof productsWithItems;
      isFirstPage: boolean;
      isLastPage: boolean;
      totalHeight: number;
    }> = [];

    let remainingItems = [...items];
    let isFirstPage = true;
    let pageNumber = 1;

    while (remainingItems.length > 0) {
      const currentPageItems: typeof productsWithItems = [];
      let currentPageHeight = 0;

      // Try to fit as many items as possible, checking if we should use 480px limit
      for (let i = 0; i < remainingItems.length; i++) {
        const item = remainingItems[i];
        const itemHeight = calculatePurchaseRowHeight(item.product?.description || '');

        // Calculate what the total height would be if we add this item
        const newTotalHeight = currentPageHeight + itemHeight;

        // Calculate remaining items height after this item (if we add it)
        const remainingAfterThis = remainingItems.slice(i + 1);
        const remainingItemsHeight = remainingAfterThis.reduce((sum, nextItem) => {
          return sum + calculatePurchaseRowHeight(nextItem.product?.description || '');
        }, 0);

        // If remaining items would fit in 480px, use that limit for current page
        const useLastPageLimit =
          remainingItemsHeight <= PURCHASE_LAST_PAGE_AVAILABLE_ITEMS_HEIGHT_PX;
        const heightLimit = useLastPageLimit
          ? PURCHASE_LAST_PAGE_AVAILABLE_ITEMS_HEIGHT_PX
          : PURCHASE_AVAILABLE_ITEMS_HEIGHT_PX;

        // Check if we can fit this item with the appropriate limit
        if (newTotalHeight <= heightLimit) {
          currentPageItems.push(item);
          currentPageHeight = newTotalHeight;
        } else {
          break;
        }
      }

      // Ensure at least one item per page
      if (currentPageItems.length === 0 && remainingItems.length > 0) {
        currentPageItems.push(remainingItems[0]);
        currentPageHeight = calculatePurchaseRowHeight(
          remainingItems[0].product?.description || ''
        );
      }

      // Remove processed items from remaining
      remainingItems = remainingItems.slice(currentPageItems.length);

      // Determine if this is the last page
      const isLastPage = remainingItems.length === 0;

      pages.push({
        items: currentPageItems,
        isFirstPage,
        isLastPage,
        totalHeight: currentPageHeight,
      });

      isFirstPage = false;
      pageNumber++;
    }

    return pages;
  };

  // Dynamic pagination calculation for purchase orders
  const totalItems = productsWithItems.length;
  let pages: Array<{
    items: typeof productsWithItems;
    isFirstPage: boolean;
    isLastPage: boolean;
    totalHeight?: number;
  }> = [];

  if (totalItems === 0) {
    pages = [{ items: [], isFirstPage: true, isLastPage: true }];
  } else {
    pages = calculatePurchaseDynamicPagination(productsWithItems);
  }

  const totalPages = pages.length;
  const pagePromises: Promise<{ imgData: string; imgWidth: number; imgHeight: number }>[] = [];

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const pageData = pages[pageIndex];
    const pageItems = pageData.items;
    const isFirstPage = pageData.isFirstPage;
    const isLastPage = pageData.isLastPage;

    // Calculate remaining height for filler rows (if needed)
    const usedHeight = pageData.totalHeight || 0;
    const targetHeight = isLastPage
      ? PURCHASE_LAST_PAGE_AVAILABLE_ITEMS_HEIGHT_PX
      : PURCHASE_AVAILABLE_ITEMS_HEIGHT_PX;
    const remainingHeight = Math.max(0, targetHeight - usedHeight);

    // Calculate number of filler rows needed (using base height)
    const purchaseBaseRowHeight = 35; // Use base height for filler rows
    let fillerRowCount = Math.floor(remainingHeight / purchaseBaseRowHeight);

    // For last page, reduce filler height by 80px to ensure footer is fully visible
    if (isLastPage) {
      const adjustedRemainingHeight = Math.max(0, remainingHeight - 80);
      fillerRowCount = Math.floor(adjustedRemainingHeight / purchaseBaseRowHeight);
    }

    // --- TABLE HTML ---
    const htmlContent = `
    <div style="width: 210mm; height: 297mm; box-sizing: border-box; padding: 10mm; background: #fff;">
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed;">
        <!-- HEADER ROWS (ALL PAGES) -->
        <tbody>
        <!-- Logo and Company Name Row -->
        <tr style="height: 80px; border-top: 1.5px solid #ccc; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc;">
          <td colspan="50" style="text-align: center; font-weight: bold; font-size: 18px; padding: 20px; vertical-align: middle;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
              <img src="/logo.png" alt="Logo" style="width: 80px; max-height: 60px; object-fit: contain;" />
              <div>
                ARABIAN AUTO EQUIPMENTS AND PARTS TRADING (FZC)<br/>
                <span style="font-size: 16px; font-weight: normal; direction: rtl;">العربية لتجارة معدات وقطع غيار السيارات ش.م.ح</span>
              </div>
            </div>
          </td>
        </tr>
        <!-- Title and TRN Row -->
        <tr style="height: 30px; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc; border-bottom: 1.5px solid #ccc;">
          <td colspan="50" style="text-align: center; padding: 8px; vertical-align: middle;">
            <span style="font-weight: bold; font-size: 13px; text-transform: uppercase;">${documentTitle} ${!isFirstPage ? '(Continued)' : ''}</span><br/>
            <span style="font-size: 12px;">TRN NO: ${primaryAddress.transaction_no || ''}</span>
          </td>
        </tr>
        <!-- Supplier and Purchase Details Row (ALL PAGES) -->
        <tr style="height: ${calculatePurchaseSupplierDetailsHeight(supplier)}px; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc; border-bottom: 1.5px solid #ccc;">
          <td colspan="25" style="vertical-align: top; padding: 20px; padding-top:10px; text-align: left;border-right: 1px solid #ccc;">
            <div style=" text-transform: uppercase; margin-bottom: 8px;">Supplier Details:</div>
            <div style="font-weight: bold; margin-bottom: 8px; text-transform:uppercase; word-wrap: break-word; line-height: 1.4;">${supplier?.name || ''}</div>
            <div style="font-size: 12px; margin-bottom: 8px;">TAX REG NO: <span style="font-weight: bold;padding-left:5px">${supplier?.tax_registration_number || ''}</span></div>
            <div style="font-size: 12px; word-wrap: break-word; line-height: 1.4;">ADDRESS: <span style="font-weight: bold;padding-left:5px">${supplier?.address || ''}</span></div>
          </td>
          <td colspan="25" style="vertical-align: top; padding: 20px; padding-top:10px; text-align: left;">
            <div style="text-transform:uppercase;margin-bottom:5px">Purchase Order No: <span style="font-weight:bold;padding-left:5px">${purchase.purchase_number || ''}</span></div>
            <div style="text-transform:uppercase;margin-bottom:5px">Purchase Date: <span style="font-weight:bold;padding-left:5px">${formatDate(formattedDate) || ''}</span></div>
            <div style="text-transform:uppercase;margin-bottom:5px">Ship From: <span style="font-weight:bold;padding-left:5px">${purchase.ship_from || ''}</span></div>
          </td>
        </tr>
        <!-- TABLE HEADINGS -->
        <tr style="height: 32px; background: #fff; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc; border-bottom: 1.5px solid #ccc;">
          <th colspan="10" style="border-right: 1.5px solid #ccc; padding: 8px 2px; text-align: center;">NO.</th>
          <th colspan="10" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">PART NO.</th>
          <th colspan="20" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: left;">DESCRIPTION</th>
          <th colspan="10" style="border-right: 1.5px solid #ccc; padding: 8px 2px; text-align: center;">QTY</th>
        </tr>
        </tbody>
        <!-- ITEM ROWS -->
        <tbody>
        ${pageItems
          .map((productItem, idx) => {
            // Calculate correct item number across pages
            let itemNumber = idx + 1;
            for (let i = 0; i < pageIndex; i++) {
              itemNumber += pages[i].items.length;
            }
            // Add border bottom to last item on first page when continuing to next page
            const isLastItemOnFirstPageWithOverflow =
              isFirstPage && !isLastPage && idx === pageItems.length - 1;
            const borderBottomStyle = isLastItemOnFirstPageWithOverflow
              ? 'border-bottom: 1.5px solid #ccc;'
              : '';
            const itemRowHeight = calculatePurchaseRowHeight(
              productItem.product?.description || ''
            );
            return `
              <tr style="height: ${itemRowHeight}px; max-height: ${itemRowHeight}px; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc; ${borderBottomStyle}; overflow: hidden;">
                <td colspan="10" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">${itemNumber}</td>
                <td colspan="10" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: center;">${productItem.product?.partNo || ''}</td>
                <td colspan="20" style="border-right: 1.5px solid #ccc; padding: 8px; text-align: left; word-wrap: break-word; line-height: 1.2;">${productItem.product?.description || ''}</td>
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
          <tr style="height: ${purchaseBaseRowHeight}px; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc; ${borderBottomStyle}">
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
          !isLastPage
            ? `
        <!-- Add bottom border for continuation pages -->
        <tbody>
        <tr style="height: 0px; border-left: 1.5px solid #ccc; border-right: 1.5px solid #ccc; border-bottom: 1.5px solid #ccc;">
          <td colspan="50" style="padding: 0; line-height: 0; font-size: 0;">&nbsp;</td>
        </tr>
        </tbody>
        `
            : ''
        }
        <!-- FOOTER ROWS (ALWAYS PRESENT TO RESERVE SPACE) -->
        <tbody style="${!isLastPage ? 'visibility: hidden;' : ''}">
        <tr style="height: 32px; border-left: 1px solid #ccc; border-right: 1px solid #ccc; border-bottom: 1px solid #ccc;${isLastPage ? 'border-top: 1px solid #ccc;' : ''}">
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
