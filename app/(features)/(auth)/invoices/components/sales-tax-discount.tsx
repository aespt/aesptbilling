'use client';

import {
  Box,
  FormControl,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

interface VatRate {
  id: number;
  vat_percentage: number;
  description: string;
}

interface FormData {
  tax_type: 'VAT' | 'GST' | 'NONE';
  vat_percentage: number;
  cgst_percentage: number;
  sgst_percentage: number;
  discount_type: 'PERCENTAGE' | 'FIXED' | 'NONE';
  discount_value: number | string;
  [key: string]: string | number;
}

interface SalesTaxDiscountProps {
  formData: FormData;
  setFormData: (formData: FormData) => void;
  onTaxDiscountChange: () => void;
}

export default function SalesTaxDiscount({
  formData,
  setFormData,
  onTaxDiscountChange,
}: SalesTaxDiscountProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [vatRates, setVatRates] = useState<VatRate[]>([]);
  const [defaultVatRate, setDefaultVatRate] = useState<VatRate | null>(null);

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
        setVatRates(data.vatRates || []);

        if (data.vatRates && data.vatRates.length > 0) {
          const defaultVat = data.vatRates[0];
          setDefaultVatRate(defaultVat);

          // Set initial VAT data if not already set
          if (!formData.tax_type) {
            setFormData({
              ...formData,
              tax_type: 'VAT',
              vat_percentage: defaultVat.vat_percentage,
              cgst_percentage: 0,
              sgst_percentage: 0,
              discount_type: 'PERCENTAGE',
              discount_value: 0,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching VAT rates:', error);
        // Mock data
        const mockVatRates = [
          { id: 1, vat_percentage: 5, description: 'Standard VAT' },
          { id: 2, vat_percentage: 0, description: 'Zero VAT' },
        ];
        setVatRates(mockVatRates);
        setDefaultVatRate(mockVatRates[0]);

        // Set initial VAT data with mock data
        if (!formData.tax_type) {
          setFormData({
            ...formData,
            tax_type: 'VAT',
            vat_percentage: mockVatRates[0].vat_percentage,
            cgst_percentage: 0,
            sgst_percentage: 0,
            discount_type: 'PERCENTAGE',
            discount_value: 0,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchVatRates();
  }, [formData, setFormData]);

  // Handle tax type change
  const handleTaxTypeChange = (event: SelectChangeEvent) => {
    const value = event.target.value as FormData['tax_type'];

    setFormData({
      ...formData,
      tax_type: value,
      vat_percentage: value === 'VAT' ? defaultVatRate?.vat_percentage || 0 : 0,
      cgst_percentage: value === 'GST' ? 9 : 0, // Default values, would come from API
      sgst_percentage: value === 'GST' ? 9 : 0, // Default values, would come from API
    });

    onTaxDiscountChange();
  };

  const handleVatRateChange = (event: SelectChangeEvent) => {
    const vatId = Number(event.target.value);
    const selectedVat = vatRates.find(vat => vat.id === vatId);

    if (selectedVat) {
      setFormData({
        ...formData,
        vat_percentage: selectedVat.vat_percentage,
      });

      onTaxDiscountChange();
    }
  };

  // Handle discount type change
  const handleDiscountTypeChange = (event: SelectChangeEvent) => {
    const value = event.target.value as FormData['discount_type'];

    setFormData({
      ...formData,
      discount_type: value,
      discount_value: value === 'NONE' ? 0 : formData.discount_value,
    });

    onTaxDiscountChange();
  };

  // Handle discount value change
  const handleDiscountValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    setFormData({
      ...formData,
      discount_value: value,
    });

    onTaxDiscountChange();
  };

  // Render tax and discount form
  return (
    <Paper elevation={0} className="mb-6 rounded-lg border p-4">
      <Typography variant="h6" className="mb-4">
        Tax and Discount
      </Typography>
      <Box className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormControl fullWidth>
          <Typography className="mb-2">Tax Type</Typography>
          <Select
            value={formData.tax_type || 'NONE'}
            onChange={handleTaxTypeChange}
            className="mb-4"
            size="small"
          >
            <MenuItem value="NONE">No Tax</MenuItem>
            <MenuItem value="VAT">VAT</MenuItem>
            <MenuItem value="GST">GST</MenuItem>
          </Select>
        </FormControl>

        {formData.tax_type === 'VAT' && (
          <FormControl fullWidth>
            <Typography className="mb-2">VAT Rate</Typography>
            <Select
              value={
                vatRates.find(v => v.vat_percentage === formData.vat_percentage)?.id.toString() ||
                ''
              }
              onChange={handleVatRateChange}
              className="mb-4"
              size="small"
              disabled={isLoading}
            >
              {vatRates.map(rate => (
                <MenuItem key={rate.id} value={rate.id.toString()}>
                  {rate.description} ({rate.vat_percentage}%)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {formData.tax_type === 'GST' && (
          <>
            <FormControl fullWidth>
              <Typography className="mb-2">CGST (%)</Typography>
              <TextField
                value={formData.cgst_percentage || 0}
                onChange={e => {
                  setFormData({
                    ...formData,
                    cgst_percentage: Number(e.target.value),
                  });
                  onTaxDiscountChange();
                }}
                className="mb-4"
                size="small"
                type="number"
              />
            </FormControl>
            <FormControl fullWidth>
              <Typography className="mb-2">SGST (%)</Typography>
              <TextField
                value={formData.sgst_percentage || 0}
                onChange={e => {
                  setFormData({
                    ...formData,
                    sgst_percentage: Number(e.target.value),
                  });
                  onTaxDiscountChange();
                }}
                className="mb-4"
                size="small"
                type="number"
              />
            </FormControl>
          </>
        )}

        <FormControl fullWidth>
          <Typography className="mb-2">Discount Type</Typography>
          <Select
            value={formData.discount_type || 'NONE'}
            onChange={handleDiscountTypeChange}
            className="mb-4"
            size="small"
          >
            <MenuItem value="NONE">No Discount</MenuItem>
            <MenuItem value="PERCENTAGE">Percentage</MenuItem>
            <MenuItem value="FIXED">Fixed Amount</MenuItem>
          </Select>
        </FormControl>

        {formData.discount_type !== 'NONE' && (
          <FormControl fullWidth>
            <Typography className="mb-2">
              {formData.discount_type === 'PERCENTAGE' ? 'Discount (%)' : 'Discount Amount'}
            </Typography>
            <TextField
              value={formData.discount_value}
              onChange={handleDiscountValueChange}
              className="mb-4"
              size="small"
              type="number"
              InputProps={{
                endAdornment:
                  formData.discount_type === 'PERCENTAGE' ? (
                    <InputAdornment position="end">%</InputAdornment>
                  ) : null,
              }}
            />
          </FormControl>
        )}
      </Box>
    </Paper>
  );
}
