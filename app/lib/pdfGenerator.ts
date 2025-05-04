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
  account_number?: string;
  iban?: string;
  swift_code?: string;
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
    productsWithItems,
    formattedDate,
    documentTitle,
    totals,
  } = invoiceData;

  // Starting PDF generation with html2canvas + jsPDF

  // Create temporary container for our HTML
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'fixed';
  tempDiv.style.top = '0';
  tempDiv.style.left = '0';
  tempDiv.style.width = '210mm'; // A4 width
  tempDiv.style.height = '297mm'; // A4 height
  tempDiv.style.overflow = 'hidden';
  tempDiv.style.zIndex = '-1000'; // Hide it but still render
  tempDiv.style.backgroundColor = 'white';
  tempDiv.style.position = 'relative'; // Position relative for absolute positioning inside

  // Determine if this is a delivery note
  const isDelivery = invoice.invoice_stage === 'DELIVERY';

  // Generate the HTML content with exact template structure
  const htmlContent = `
  <div style="font-family: Arial, sans-serif; width: 100%; padding: 20px; color: #333; background-color: white;">
    <!-- Header Section -->
    <div style="display: flex; justify-content: space-between; padding: 20px; background-color: #f5f5f5; margin-bottom: 20px; border-bottom: 1px solid #ccc;">
      <div>
        <img src="/logo.png" alt="Logo" style="width: 150px; max-height: 80px; object-fit: contain" />
      </div>
      <div style="width: 75%; background-color: #ffffff; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="margin: 0; font-size: 16px">Arabian Auto Equipments and</h3>
          <h3 style="margin: 0; font-size: 16px">Parts Trading (FZC)</h3>
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
    <div style="padding: 10px 20px; font-weight: bold; font-size: 18px">
      ${isDelivery ? 'Delivery Note' : documentTitle || 'Tax Invoice'}
    </div>

    <!-- Customer Info Section -->
    <div style="display: flex; justify-content: space-between; padding: 0 20px; margin-bottom: 20px; gap: 20px;">
      <!-- Left side - Customer info -->
      <div style="width: 48%; background-color: #f5f5f5; padding: 20px; border: 1px solid #ccc; border-right: none;">
        <p style="margin: 0; font-weight: bold">Invoice To:</p>
        <p style="margin: 5px 0">${customer?.name || 'N/A'}</p>
        <p style="margin: 10px 0">
          <span style="font-weight: bold">TAX Reg No:</span> ${customer?.trn || 'N/A'}
        </p>
        <p style="margin: 5px 0">
          <span style="font-weight: bold">Ship to Country/Emirate:</span>
          ${invoice.ship_to || 'N/A'}
        </p>
      </div>
      
      <!-- Right side - Invoice details -->
      <div style="width: 48%; background-color: #f5f5f5; padding: 20px; border: 1px solid #ccc; border-left: none;">
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

    <!-- Items Table -->
    <div style="padding: 10px 20px;">
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
          ${productsWithItems
            .map((productItem, index) => {
              const { item, product } = productItem;
              const invoiceTaxRate = invoice.tax_rate ? parseFloat(invoice.tax_rate.toString()) : 0;
              const unitPrice = item.mrp
                ? parseFloat(item.mrp.toString())
                : parseFloat(item.unit_price?.toString() || '0');
              const quantity = parseFloat(item.quantity.toString());
              const amount = unitPrice * quantity;
              const vatAmount = ((unitPrice * invoiceTaxRate) / 100) * quantity;
              const totalAmount = parseFloat(item.total_price?.toString() || '0');

              const bgColor = index % 2 === 1 ? '#f9f9f9' : '#ffffff';

              return `
            <tr style="background-color: ${bgColor};">
              <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${product?.partNo || 'N/A'}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${product?.brand || 'N/A'}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${product?.name || 'N/A'}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${quantity.toString()}</td>
              ${
                !isDelivery
                  ? `
              <td style="border: 1px solid #ddd; padding: 8px;">${unitPrice.toFixed(2)}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${amount.toFixed(2)}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${invoiceTaxRate.toString()}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${vatAmount.toFixed(2)}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${totalAmount.toFixed(2)}</td>
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
    
    <!-- Totals Section - Only for non-delivery notes -->
    ${
      !isDelivery
        ? `
    <div style="display: flex; justify-content: space-between; padding: 20px; margin-top: 30px; gap: 20px;">
      <div style="width: 45%; background-color: #f5f5f5; padding: 20px; border: 1px solid #ccc;">
        <h4 style="margin-top: 0">Terms & Conditions</h4>
        <p style="font-size: 12px;">
          By using our services, you confirm that you accept these Terms and Conditions and that you agree to comply with them.
        </p>
      </div>
      <div style="width: 45%; background-color: #f5f5f5; padding: 20px; border: 1px solid #ccc;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="font-weight: bold; padding: 3px 0;">Subtotal:</td>
            <td style="text-align: right">${totals.subtotal} AED</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 3px 0;">${totals.taxType}:</td>
            <td style="text-align: right">${totals.taxAmount} AED</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 3px 0;">Discount:</td>
            <td style="text-align: right">${totals.discount} AED</td>
          </tr>
          <tr style="border-top: 1px solid #ddd;">
            <td style="font-weight: bold; padding-top: 8px;">Invoice Total:</td>
            <td style="text-align: right; font-weight: bold">${totals.total} AED</td>
          </tr>
        </table>
      </div>
    </div>
    `
        : ''
    }
    
    <!-- Signature section -->
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
    
    <!-- Footer Section (from invoice-footer.html) - Fixed at bottom -->
    <div style="width: 100%; padding: 0; position: absolute; bottom: 0; left: 0;">
      <div style="padding: 15px; margin: 10px 20px; background-color: #f5f5f5;">
        <p style="font-size: 12px; color: #999; margin: 0;">
          Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has
          been the industry's standard dummy text ever since the 1500s.
        </p>
      </div>
    </div>
  </div>
  `;

  // Add the content to the temporary div
  tempDiv.innerHTML = htmlContent;
  document.body.appendChild(tempDiv);

  // HTML content created, now generating PDF...

  // Wait for rendering
  await new Promise(resolve => setTimeout(resolve, 500));

  // Create a blob URL for the PDF
  return new Promise((resolve, reject) => {
    try {
      // Use html2canvas directly for better compatibility
      const captureCanvas = async () => {
        try {
          const canvas = await html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            logging: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
          });

          // Remove the temporary element after capturing
          document.body.removeChild(tempDiv);

          // Calculate sizes based on canvas dimensions
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          const imgWidth = 210; // A4 width in mm
          const pageHeight = 297; // A4 height in mm
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          const pdf = new jsPDF('p', 'mm', 'a4');

          // Add image to PDF
          let heightLeft = imgHeight;
          let position = 0;

          // Add first page
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;

          // Add additional pages if needed
          while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }

          // Generate blob URL
          const pdfBlob = pdf.output('blob');
          const blobUrl = URL.createObjectURL(pdfBlob);

          // PDF generated successfully with html2canvas
          resolve(blobUrl);
        } catch (err) {
          // Error during PDF generation
          if (document.body.contains(tempDiv)) {
            document.body.removeChild(tempDiv);
          }
          reject(err);
        }
      };

      captureCanvas();
    } catch (error) {
      // Make sure to clean up if there's an error
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv);
      }
      reject(error);
    }
  });
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
