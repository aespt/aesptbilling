"use client";

import { 
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
} from "@mui/material";

interface InvoiceItem {
  id: string;
  qty: number;
  rate: number;
  total: number;
}

interface SalesInvoiceSummaryProps {
  invoiceItems: InvoiceItem[];
  formData: any;
}

export default function SalesInvoiceSummary({ 
  invoiceItems,
  formData
}: SalesInvoiceSummaryProps) {
  // Calculate subtotal (sum of all item totals)
  const subtotal = invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0);
  
  // Calculate discount
  const discountAmount = calculateDiscount(subtotal, formData.discount_type, formData.discount_value);
  
  // Calculate tax on subtotal after discount
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = calculateTax(taxableAmount, formData.tax_type, formData.vat_percentage, formData.cgst_percentage, formData.sgst_percentage);
  
  // Calculate total
  const total = taxableAmount + taxAmount;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' AED';
  };

  // Calculate discount amount based on type and value
  function calculateDiscount(amount: number, type: string, value: number): number {
    if (!type || type === 'NONE' || !value || value <= 0) {
      return 0;
    }
    
    if (type === 'PERCENTAGE') {
      return (amount * value) / 100;
    }
    
    if (type === 'FIXED') {
      return Math.min(value, amount); // Ensure discount doesn't exceed subtotal
    }
    
    return 0;
  }

  // Calculate tax amount based on type and percentage
  function calculateTax(amount: number, type: string, vatPercentage: number, cgstPercentage: number, sgstPercentage: number): number {
    if (!type || type === 'NONE') {
      return 0;
    }
    
    if (type === 'VAT') {
      return (amount * vatPercentage) / 100;
    }
    
    if (type === 'GST') {
      const cgstAmount = (amount * cgstPercentage) / 100;
      const sgstAmount = (amount * sgstPercentage) / 100;
      return cgstAmount + sgstAmount;
    }
    
    return 0;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100">
      <Typography variant="h6" className="mb-4 text-gray-800 font-medium">Invoice Summary</Typography>
      
      <div className="flex justify-end">
        <TableContainer component={Paper} className="w-full md:w-1/2 lg:w-1/3">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Subtotal</TableCell>
                <TableCell align="right">
                  {formatCurrency(subtotal)}
                </TableCell>
              </TableRow>
              
              {formData.discount_type && formData.discount_type !== 'NONE' && formData.discount_value > 0 && (
                <TableRow>
                  <TableCell className="font-medium">
                    Discount 
                    {formData.discount_type === 'PERCENTAGE' ? ` (${formData.discount_value}%)` : ''}
                  </TableCell>
                  <TableCell align="right" className="text-red-600">
                    -{formatCurrency(discountAmount)}
                  </TableCell>
                </TableRow>
              )}
              
              {(formData.tax_type === 'VAT' || formData.tax_type === 'GST') && (
                <TableRow>
                  <TableCell className="font-medium">
                    {formData.tax_type === 'VAT' 
                      ? `VAT (${formData.vat_percentage}%)` 
                      : `GST (CGST: ${formData.cgst_percentage}%, SGST: ${formData.sgst_percentage}%)`}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(taxAmount)}
                  </TableCell>
                </TableRow>
              )}
              
              <TableRow>
                <TableCell className="font-bold text-lg">Total Amount</TableCell>
                <TableCell align="right" className="font-bold text-lg">
                  {formatCurrency(total)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
} 