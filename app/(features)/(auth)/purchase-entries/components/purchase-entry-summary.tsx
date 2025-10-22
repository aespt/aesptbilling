'use client';

import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

import type { PurchaseItem } from '@/lib/types';

import type { PurchaseEntryFormData } from './purchase-entry-details';

interface PurchaseEntrySummaryProps {
  purchaseItems: PurchaseItem[];
  formData: PurchaseEntryFormData;
}

export default function PurchaseEntrySummary({
  purchaseItems,
  formData,
}: PurchaseEntrySummaryProps) {
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);

  // Calculate totals when items or tax/discount changes
  useEffect(() => {
    // Calculate subtotal from all items
    const itemsSubtotal = purchaseItems.reduce((sum, item) => sum + (item.total || 0), 0);
    setSubtotal(itemsSubtotal);

    // Calculate discount - directly use the discount_rate as an absolute value
    const discountValue = Number(formData.discount_rate || 0);
    const discountAmount = Math.min(discountValue, itemsSubtotal);
    setDiscount(discountAmount);

    // Calculate tax - use tax_rate as a percentage
    const taxableAmount = itemsSubtotal - discountAmount;
    const taxRate = Number(formData.tax_rate || 0);
    const taxAmount = (taxableAmount * taxRate) / 100;
    setTax(taxAmount);

    // Calculate total
    setTotal(taxableAmount + taxAmount);
  }, [purchaseItems, formData, formData.discount_rate, formData.tax_rate]);

  return (
    <Paper elevation={0} className="mb-6 overflow-hidden border border-gray-200 shadow-lg">
      <Box className="border-b border-gray-200 bg-blue-50 px-6 py-4">
        <Typography variant="subtitle1" className="font-medium text-gray-700">
          Purchase Entry Summary
        </Typography>
      </Box>

      <Box className="p-6">
        <div className="ml-auto w-full md:w-1/2 lg:w-1/3">
          <TableContainer>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="border-b py-2 pl-0">
                    <Typography className="font-medium text-gray-600">Subtotal</Typography>
                  </TableCell>
                  <TableCell align="right" className="border-b py-2 pr-0">
                    <Typography className="font-medium">{subtotal.toFixed(2)} AED</Typography>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="border-b py-2 pl-0">
                    <Typography className="font-medium text-gray-600">Discount</Typography>
                  </TableCell>
                  <TableCell align="right" className="border-b py-2 pr-0">
                    <Typography className="font-medium text-red-500">
                      -{discount.toFixed(2)} AED
                    </Typography>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="border-b py-2 pl-0">
                    <Typography className="font-medium text-gray-600">Tax</Typography>
                  </TableCell>
                  <TableCell align="right" className="border-b py-2 pr-0">
                    <Typography className="font-medium">{tax.toFixed(2)} AED</Typography>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="border-b py-3 pl-0">
                    <Typography className="text-lg font-bold text-gray-800">Total</Typography>
                  </TableCell>
                  <TableCell align="right" className="border-b py-3 pr-0">
                    <Typography className="text-lg font-bold text-blue-600">
                      {total.toFixed(2)} AED
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </Box>
    </Paper>
  );
}
