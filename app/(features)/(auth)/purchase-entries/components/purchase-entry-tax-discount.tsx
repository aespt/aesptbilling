'use client';

import { Box, Paper, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import type { FormErrors } from '@/lib/types';

import type { PurchaseEntryFormData } from './purchase-entry-details';

interface PurchaseEntryTaxDiscountProps {
  formData: PurchaseEntryFormData;
  setFormData: (formData: PurchaseEntryFormData) => void;
  errors: FormErrors;
  setErrors: (errors: FormErrors) => void;
  onTaxDiscountChange: () => void;
}

export default function PurchaseEntryTaxDiscount({
  formData,
  setFormData,
  onTaxDiscountChange,
}: PurchaseEntryTaxDiscountProps) {
  // Track input focus state
  const [isTaxFocused, setIsTaxFocused] = useState(false);
  const [isDiscountFocused, setIsDiscountFocused] = useState(false);

  // Local state to track input values
  const [taxValue, setTaxValue] = useState<string | number>(formData.tax_rate ?? 5);
  const [discountValue, setDiscountValue] = useState<string | number>(formData.discount_rate ?? 0);

  // Sync local state with formData when it changes
  useEffect(() => {
    setTaxValue(formData.tax_rate ?? 0);
    setDiscountValue(formData.discount_rate ?? 0);
  }, [formData.tax_rate, formData.discount_rate]);

  // Initialize tax_rate and discount_rate if they don't exist
  useEffect(() => {
    if (formData.tax_rate === undefined && formData.discount_rate === undefined) {
      setFormData({
        ...formData,
        tax_rate: 0,
        discount_rate: 0,
      });
    }
  }, [formData, setFormData]);

  // Handle numeric input changes for tax and discount
  const handleNumericChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target;

    if (!name) {
      return;
    }

    // Update local state for immediate feedback
    if (name === 'tax_rate') {
      setTaxValue(value === '' ? '' : Number(value));
    } else if (name === 'discount_rate') {
      setDiscountValue(value === '' ? '' : Number(value));
    }

    // Allow empty string or convert to number
    const numericValue = value === '' ? 0 : Number(value);

    // Create a copy of formData to avoid reference issues
    const updatedFormData = { ...formData };

    // Update specific field
    if (name === 'tax_rate') {
      updatedFormData.tax_rate = numericValue;
      updatedFormData.vat_percentage = numericValue;
    } else if (name === 'discount_rate') {
      updatedFormData.discount_rate = numericValue;
      // For discount_rate, also update discount_value to ensure consistency
      updatedFormData.discount_value = numericValue;
      updatedFormData.discount_type = 'FIXED';
    }

    // Update the form data
    setFormData(updatedFormData);

    // Notify parent component of the change
    setTimeout(() => {
      onTaxDiscountChange();
    }, 0);
  };

  // Helper to check if value is empty
  const isEmpty = (value: unknown): boolean => {
    return value === undefined || value === null || value === '';
  };

  return (
    <Paper elevation={0} className="mb-6 overflow-hidden border border-gray-200 shadow-lg">
      <Box className="border-b border-gray-200 bg-blue-50 px-6 py-4">
        <Typography variant="subtitle1" className="font-medium text-gray-700">
          Tax & Discount
        </Typography>
      </Box>

      <Box className="p-4">
        <div className="-mx-2 flex flex-wrap">
          {/* Tax Section */}
          <div className="mb-4 w-full px-2 sm:mb-0 sm:w-1/2">
            <div className="space-y-2">
              <Typography variant="subtitle2" className="font-medium text-gray-700">
                Tax Percentage
              </Typography>
              <div>
                <TextField
                  name="tax_rate"
                  value={isTaxFocused && taxValue === 0 ? '' : taxValue}
                  onChange={handleNumericChange}
                  type="number"
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 },
                    endAdornment: <div className="pr-2">%</div>,
                  }}
                  placeholder="0"
                  variant="outlined"
                  size="small"
                  className="w-full"
                  onFocus={() => setIsTaxFocused(true)}
                  onBlur={() => {
                    setIsTaxFocused(false);
                    // If field was left empty, set to 0
                    if (isEmpty(taxValue)) {
                      setTaxValue(0);
                      setFormData({
                        ...formData,
                        tax_rate: 0,
                      });
                      onTaxDiscountChange();
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Discount Section */}
          <div className="w-full px-2 sm:w-1/2">
            <div className="space-y-2">
              <Typography variant="subtitle2" className="font-medium text-gray-700">
                Discount Amount
              </Typography>
              <div>
                <TextField
                  name="discount_rate"
                  value={isDiscountFocused && discountValue === 0 ? '' : discountValue}
                  onChange={handleNumericChange}
                  type="number"
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 },
                    endAdornment: <div className="pr-2">AED</div>,
                  }}
                  placeholder="0"
                  variant="outlined"
                  size="small"
                  className="w-full"
                  onFocus={() => setIsDiscountFocused(true)}
                  onBlur={() => {
                    setIsDiscountFocused(false);
                    // If field was left empty, set to 0
                    if (isEmpty(discountValue)) {
                      setDiscountValue(0);
                      setFormData({
                        ...formData,
                        discount_rate: 0,
                      });
                      onTaxDiscountChange();
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Box>
    </Paper>
  );
}
