'use client';

import { Typography, Box, Paper, TextField } from '@mui/material';

import type { FormErrors } from '@/lib/types';
import type { InvoiceFormData, InvoiceItem } from '@/lib/types/invoice';

interface UsedProductInvoiceDetailsProps {
  formData: InvoiceFormData;
  setFormData: (formData: InvoiceFormData | ((prev: InvoiceFormData) => InvoiceFormData)) => void;
  invoiceItems: InvoiceItem[];
  errors: FormErrors;
  setErrors: (errors: FormErrors) => void;
}

export default function UsedProductInvoiceDetails({
  formData,
  setFormData,
  invoiceItems,
  errors,
  setErrors,
}: UsedProductInvoiceDetailsProps) {
  const subtotal = invoiceItems.reduce(
    (sum: number, item: InvoiceItem) => sum + (item.total || 0),
    0
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return (
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount) + ' AED'
    );
  };

  const handleActualRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Store the raw input string to prevent issues with decimal points during typing
    setFormData((prev: InvoiceFormData) => ({
      ...prev,
      actual_rate: value,
      subtotalInput: value,
      subtotal: value === '' ? '' : isNaN(parseFloat(value)) ? prev.subtotal : parseFloat(value),
    }));

    if (!value) {
      setErrors({ ...errors, subtotal: 'Actual rate is required' });
      return;
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue < 0) {
      setErrors({ ...errors, subtotal: 'Actual rate must be greater than 0' });
      return;
    }

    setErrors({ ...errors, subtotal: '' });
  };

  const handleSubTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Store the raw input string to prevent issues with decimal points during typing
    setFormData((prev: InvoiceFormData) => ({
      ...prev,
      totalInput: value,
      total: value === '' ? '' : isNaN(parseFloat(value)) ? prev.total : parseFloat(value),
    }));

    if (!value) {
      setErrors({ ...errors, total: 'Selling rate is required' });
      return;
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue < 0) {
      setErrors({ ...errors, total: 'Selling rate must be greater than 0' });
      return;
    }

    setErrors({ ...errors, total: '' });
  };

  // Get the display value for actual rate
  const getActualRateDisplayValue = () => {
    // Use the raw input value if available
    if (formData.subtotalInput !== undefined) {
      return formData.subtotalInput;
    }
    if (formData.subtotal === '') {
      return '';
    }
    if (formData.subtotal !== undefined && formData.subtotal !== null) {
      return formData.subtotal.toString();
    }
    return formatCurrency(subtotal).replace(' AED', ''); // Show formatted subtotal without AED
  };

  return (
    <Paper elevation={0} className="mb-6 overflow-hidden border border-gray-200 shadow-lg">
      <Box className="border-b border-gray-200 bg-blue-50 px-6 py-4">
        <Typography variant="subtitle1" className="font-medium text-gray-700">
          Used Product Details
        </Typography>
      </Box>

      <Box className="p-6">
        <Box sx={{ display: 'grid', gap: 4 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 3,
            }}
          >
            <div>
              <Typography variant="caption" className="mb-1 block text-gray-500">
                Subtotal
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {formatCurrency(subtotal)}
              </Typography>
            </div>

            <div>
              <Typography variant="caption" className="mb-1 block text-gray-500">
                Actual Rate (Subtotal)
              </Typography>
              <TextField
                type="number"
                value={getActualRateDisplayValue()}
                onChange={handleActualRateChange}
                size="small"
                error={!!errors.subtotal}
                helperText={errors.subtotal}
                fullWidth
                InputProps={{
                  endAdornment: <Typography variant="body2">AED</Typography>,
                }}
              />
            </div>

            <div>
              <Typography variant="caption" className="mb-1 block text-gray-500">
                Selling Rate (New Subtotal)
              </Typography>
              <TextField
                type="number"
                value={formData.totalInput ?? formData.total ?? ''}
                onChange={handleSubTotalChange}
                size="small"
                error={!!errors.total}
                helperText={errors.total}
                fullWidth
                InputProps={{
                  endAdornment: <Typography variant="body2">AED</Typography>,
                }}
              />
            </div>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
