'use client';

import { Typography, Box, Paper, Divider } from '@mui/material';
import { useEffect } from 'react';

import type { InvoiceFormData, InvoiceItem } from '@/lib/types/invoice';

interface SalesInvoiceSummaryProps {
  invoiceItems: InvoiceItem[];
  formData: InvoiceFormData;
  onCalculationsChange?: (calculations: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  }) => void;
}

export default function SalesInvoiceSummary({
  invoiceItems,
  formData,
  onCalculationsChange,
}: SalesInvoiceSummaryProps) {
  // Calculate subtotal (sum of all item totals)
  const subtotal = invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0);

  // For used products, use the selling rate as the new subtotal
  const effectiveSubtotal = formData.is_used ? Number(formData.total) || 0 : subtotal;

  // Calculate discount
  const discountAmount = calculateDiscount(
    effectiveSubtotal,
    formData.discount_type,
    formData.discount_value,
    formData.discount_percentage
  );

  // Calculate tax on subtotal after discount
  const taxableAmount = effectiveSubtotal - discountAmount;
  const taxAmount = calculateTax(
    taxableAmount,
    formData.tax_type,
    formData.vat_percentage,
    formData.cgst_percentage,
    formData.sgst_percentage
  );

  // Calculate total
  const total = taxableAmount + taxAmount;

  // Send calculated values to parent component
  useEffect(() => {
    if (onCalculationsChange) {
      onCalculationsChange({
        subtotal: effectiveSubtotal,
        discount: discountAmount,
        tax: taxAmount,
        total: total,
      });
    }
  }, [effectiveSubtotal, discountAmount, taxAmount, total, onCalculationsChange]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return (
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount) + ' AED'
    );
  };

  // Calculate discount amount based on type and value
  function calculateDiscount(
    amount: number,
    type: string,
    value: number | string,
    percentageValue?: number
  ): number {
    if (
      !type ||
      type === 'NONE' ||
      (!value && !percentageValue) ||
      (Number(value) <= 0 && !percentageValue)
    ) {
      return 0;
    }

    if (type === 'PERCENTAGE') {
      // Use percentageValue if provided (for edit mode), otherwise use the value
      const discountPercentage = percentageValue !== undefined ? percentageValue : Number(value);
      return (amount * discountPercentage) / 100;
    }

    if (type === 'FIXED') {
      return Math.min(Number(value), amount); // Ensure discount doesn't exceed subtotal
    }

    return 0;
  }

  // Calculate tax amount based on type and percentage
  function calculateTax(
    amount: number,
    type: string,
    vatPercentage: number,
    cgstPercentage: number,
    sgstPercentage: number
  ): number {
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
    <Paper elevation={0} className="mb-6 overflow-hidden border border-gray-200 shadow-lg">
      <Box className="border-b border-gray-200 bg-blue-50 px-6 py-4">
        <Typography variant="subtitle1" className="font-medium text-gray-700">
          Invoice Summary
        </Typography>
      </Box>

      <Box className="px-6 py-4">
        <Box className="flex justify-end">
          <Box className="w-full md:w-1/2 lg:w-1/3">
            {/* Summary Items */}
            <Box className="space-y-3">
              {/* Subtotal Row */}
              <Box className="flex items-center justify-between py-2">
                <Typography variant="body2" className="text-gray-600">
                  {formData.is_used ? 'Selling Rate' : 'Subtotal'}
                </Typography>
                <Typography variant="body1">{formatCurrency(effectiveSubtotal)}</Typography>
              </Box>

              {/* Discount Row - Only shown if discount exists */}
              {formData.discount_type &&
                formData.discount_type !== 'NONE' &&
                ((formData.discount_value !== '' && Number(formData.discount_value) > 0) ||
                  (formData.discount_percentage && formData.discount_percentage > 0)) && (
                  <Box className="flex items-center justify-between py-2">
                    <Typography variant="body2" className="text-gray-600">
                      Discount
                      {formData.discount_type === 'PERCENTAGE'
                        ? ` (${formData.discount_percentage ?? formData.discount_value}%)`
                        : ''}
                    </Typography>
                    <Typography variant="body1" className="text-red-600">
                      -{formatCurrency(discountAmount)}
                    </Typography>
                  </Box>
                )}

              {/* Tax Row - Only shown if tax exists */}
              {(formData.tax_type === 'VAT' || formData.tax_type === 'GST') && (
                <Box className="flex items-center justify-between py-2">
                  <Typography variant="body2" className="text-gray-600">
                    {formData.tax_type === 'VAT'
                      ? `VAT (${formData.vat_percentage}%)`
                      : `GST (CGST: ${formData.cgst_percentage}%, SGST: ${formData.sgst_percentage}%)`}
                  </Typography>
                  <Typography variant="body1">{formatCurrency(taxAmount)}</Typography>
                </Box>
              )}

              {/* Divider before total */}
              <Divider className="my-2" />

              {/* Total Row */}
              <Box className="flex items-center justify-between py-2">
                <Typography variant="subtitle2" className="font-medium">
                  Total Amount
                </Typography>
                <Typography variant="subtitle1" className="font-bold">
                  {formatCurrency(total)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
