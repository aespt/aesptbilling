'use client';

import {
  TextField,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputAdornment,
  Paper,
  Box,
  type SelectChangeEvent,
} from '@mui/material';
import { useState, useEffect } from 'react';

import type { FormErrors } from '@/lib/types';
import type { InvoiceFormData } from '@/lib/types/invoice';

interface VatRate {
  id: number;
  vat_percentage: number;
  description: string;
}

interface SalesTaxDiscountProps {
  formData: InvoiceFormData;
  setFormData: (formData: InvoiceFormData | ((prev: InvoiceFormData) => InvoiceFormData)) => void;
  errors: FormErrors;
  setErrors: (errors: FormErrors) => void;
  onTaxDiscountChange: () => void;
  invoiceSubtotal?: number;
}

export default function SalesTaxDiscount({
  formData,
  setFormData,
  onTaxDiscountChange,
  invoiceSubtotal = 0,
}: SalesTaxDiscountProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [defaultVatRate, setDefaultVatRate] = useState<VatRate | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Fetch VAT rates on component mount
  useEffect(() => {
    const fetchVatRates = async () => {
      try {
        // This would be replaced with your actual API
        const response = await fetch('/api/vat-rates');
        if (!response.ok) {
          throw new Error('Failed to fetch VAT rates');
        }

        const data = await response.json();
        if (data.vatRates && data.vatRates.length > 0) {
          const defaultVat = data.vatRates[0];
          setDefaultVatRate(defaultVat);

          // Set initial VAT data if not already set
          if (!formData.tax_type) {
            setFormData((prev: InvoiceFormData) => ({
              ...prev,
              tax_type: 'VAT' as const,
              vat_percentage: defaultVat.vat_percentage,
              cgst_percentage: 0,
              sgst_percentage: 0,
              discount_type: 'PERCENTAGE' as const,
              discount_value: '',
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching VAT rates:', error);
        // Mock data
        const mockVatRates = [{ id: 1, vat_percentage: 5, description: 'Standard VAT' }];
        setDefaultVatRate(mockVatRates[0]);

        // Set initial VAT data with mock data
        if (!formData.tax_type) {
          setFormData((prev: InvoiceFormData) => ({
            ...prev,
            tax_type: 'VAT' as const,
            vat_percentage: mockVatRates[0].vat_percentage,
            cgst_percentage: 0,
            sgst_percentage: 0,
            discount_type: 'PERCENTAGE' as const,
            discount_value: '',
          }));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchVatRates();
  }, [setFormData, formData.tax_type]);

  // Handle tax type change
  const handleTaxTypeChange = (event: SelectChangeEvent) => {
    const value = event.target.value as 'VAT' | 'GST' | 'NONE';

    setFormData((prev: InvoiceFormData) => ({
      ...prev,
      tax_type: value,
      vat_percentage: value === 'VAT' ? defaultVatRate?.vat_percentage || 0 : 0,
      cgst_percentage: value === 'GST' ? 9 : 0, // Default values, would come from API
      sgst_percentage: value === 'GST' ? 9 : 0, // Default values, would come from API
    }));

    onTaxDiscountChange();
  };

  // Handle discount type change
  const handleDiscountTypeChange = (event: SelectChangeEvent) => {
    const value = event.target.value as 'PERCENTAGE' | 'FIXED' | 'NONE';

    setFormData((prev: InvoiceFormData) => ({
      ...prev,
      discount_type: value,
      // Reset discount value when changing type to avoid confusion
      discount_value: '',
    }));

    // Reset discount amount when type changes
    setDiscountAmount(0);
    onTaxDiscountChange();
  };

  // Handle discount value change
  const handleDiscountValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow empty input
    if (inputValue === '') {
      setFormData((prev: InvoiceFormData) => ({
        ...prev,
        discount_value: '', // Store empty string to allow clearing the field
      }));
      setDiscountAmount(0);
      onTaxDiscountChange();
      return;
    }

    const value = parseFloat(inputValue);

    // Validate percentage cannot be > 100
    if (formData.discount_type === 'PERCENTAGE' && value > 100) {
      return;
    }

    // Calculate the actual discount amount for percentage discount
    if (formData.discount_type === 'PERCENTAGE') {
      const calculatedAmount = (invoiceSubtotal * value) / 100;
      setDiscountAmount(calculatedAmount);

      // Store the percentage value separately for future reference
      setFormData((prev: InvoiceFormData) => ({
        ...prev,
        discount_value: isNaN(value) ? 0 : value,
        discount_percentage: isNaN(value) ? 0 : value, // Store the percentage value
      }));
    } else if (formData.discount_type === 'FIXED') {
      setDiscountAmount(value);

      // When using fixed discount, set discount_percentage to 0
      setFormData((prev: InvoiceFormData) => ({
        ...prev,
        discount_value: isNaN(value) ? 0 : value,
        discount_percentage: 0,
      }));
    }

    onTaxDiscountChange();
  };

  return (
    <Paper elevation={0} className="mb-6 overflow-hidden border border-gray-200 shadow-lg">
      <Box className="border-b border-gray-200 bg-blue-50 px-6 py-4">
        <Typography variant="subtitle1" className="font-medium text-gray-700">
          Tax and Discount
        </Typography>
      </Box>

      <Box className="p-6">
        <Box sx={{ display: 'grid', gap: 4 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 3,
            }}
          >
            <div>
              <Typography variant="caption" className="mb-1 block text-gray-500">
                Tax Type
              </Typography>
              <FormControl fullWidth size="small" variant="outlined">
                <Select
                  value={formData.tax_type || 'VAT'}
                  onChange={handleTaxTypeChange}
                  disabled={isLoading}
                  displayEmpty
                >
                  <MenuItem value="VAT">VAT</MenuItem>
                  <MenuItem value="GST" disabled>
                    GST (Not Implemented)
                  </MenuItem>
                  <MenuItem value="NONE">None</MenuItem>
                </Select>
              </FormControl>
            </div>

            {formData.tax_type === 'VAT' && (
              <div>
                <Typography variant="caption" className="mb-1 block text-gray-500">
                  VAT Rate
                </Typography>
                <TextField
                  value={`${formData.vat_percentage}%`}
                  fullWidth
                  size="small"
                  variant="outlined"
                  placeholder="VAT Rate"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </div>
            )}

            {formData.tax_type === 'GST' && (
              <>
                <div>
                  <Typography variant="caption" className="mb-1 block text-gray-500">
                    CGST (%)
                  </Typography>
                  <TextField
                    type="number"
                    value={formData.cgst_percentage}
                    disabled={true}
                    fullWidth
                    size="small"
                    variant="outlined"
                    placeholder="CGST Rate"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </div>
                <div>
                  <Typography variant="caption" className="mb-1 block text-gray-500">
                    SGST (%)
                  </Typography>
                  <TextField
                    type="number"
                    value={formData.sgst_percentage}
                    disabled={true}
                    fullWidth
                    size="small"
                    variant="outlined"
                    placeholder="SGST Rate"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </div>
              </>
            )}

            <div>
              <Typography variant="caption" className="mb-1 block text-gray-500">
                Discount Type
              </Typography>
              <FormControl fullWidth size="small" variant="outlined">
                <Select
                  value={formData.discount_type || 'PERCENTAGE'}
                  onChange={handleDiscountTypeChange}
                  displayEmpty
                >
                  <MenuItem value="PERCENTAGE">Percentage (%)</MenuItem>
                  <MenuItem value="FIXED">Fixed Amount</MenuItem>
                  <MenuItem value="NONE">No Discount</MenuItem>
                </Select>
              </FormControl>
            </div>

            {formData.discount_type !== 'NONE' && (
              <div>
                <Typography variant="caption" className="mb-1 block text-gray-500">
                  {formData.discount_type === 'PERCENTAGE' ? 'Discount (%)' : 'Discount Amount'}
                </Typography>
                <TextField
                  type="number"
                  value={formData.discount_value === '' ? '' : formData.discount_value}
                  onChange={handleDiscountValueChange}
                  fullWidth
                  size="small"
                  variant="outlined"
                  placeholder={
                    formData.discount_type === 'PERCENTAGE' ? 'Discount (%)' : 'Discount Amount'
                  }
                  InputProps={{
                    endAdornment:
                      formData.discount_type === 'PERCENTAGE' ? (
                        <InputAdornment position="end">%</InputAdornment>
                      ) : (
                        <InputAdornment position="end">AED</InputAdornment>
                      ),
                    inputProps: {
                      min: 0,
                      max: formData.discount_type === 'PERCENTAGE' ? 100 : undefined,
                    },
                  }}
                />
                {formData.discount_type === 'PERCENTAGE' && formData.discount_value !== '' && (
                  <Typography variant="caption" className="mt-1 block text-gray-500">
                    Discount Amount:{' '}
                    {new Intl.NumberFormat('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(discountAmount)}{' '}
                    AED
                  </Typography>
                )}
              </div>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
