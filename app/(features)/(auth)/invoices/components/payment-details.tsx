'use client';

import { Box, FormControl, MenuItem, Paper, Select, Typography } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import type { FC } from 'react';
import { useEffect, useRef } from 'react';

export interface PaymentData {
  payment_method: string;
  payment_status: string;
  payment_date: Date | null;
  reference_number: string;
  payment_notes: string;
}

interface PaymentDetailsProps {
  paymentData: PaymentData;
  setPaymentData: (data: PaymentData) => void;
}

const PaymentDetails: FC<PaymentDetailsProps> = ({ paymentData, setPaymentData }) => {
  // Use ref to track whether defaults have been applied
  const defaultsApplied = useRef(false);

  // Set default values only once when component mounts
  useEffect(() => {
    if (defaultsApplied.current) {
      return;
    }

    const updatedData = { ...paymentData };
    let needsUpdate = false;

    if (!paymentData.payment_method) {
      updatedData.payment_method = 'CASH';
      needsUpdate = true;
    }

    if (!paymentData.payment_status) {
      updatedData.payment_status = 'PAID';
      needsUpdate = true;
    }

    if (!paymentData.payment_date) {
      updatedData.payment_date = new Date();
      needsUpdate = true;
    }

    if (needsUpdate) {
      setPaymentData(updatedData);
    }

    defaultsApplied.current = true;
  }, [paymentData, setPaymentData]);

  const handleChange = (field: string, value: unknown) => {
    setPaymentData({
      ...paymentData,
      [field]: value,
    });
  };

  return (
    <Paper elevation={0} className="mb-6 overflow-hidden border border-gray-200 shadow-lg">
      <Box className="border-b border-gray-200 bg-blue-50 px-6 py-4">
        <Typography variant="subtitle1" className="font-medium text-gray-700">
          Payment Details
        </Typography>
      </Box>

      <Box className="p-6">
        <Box sx={{ display: 'grid', gap: 4 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 3,
            }}
          >
            {/* Payment Method */}
            <div>
              <Typography variant="caption" className="mb-1 block text-gray-500">
                Payment Method
              </Typography>
              <FormControl fullWidth size="small" variant="outlined">
                <Select
                  value={paymentData.payment_method}
                  onChange={e => handleChange('payment_method', e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">Select payment method</MenuItem>
                  <MenuItem value="CASH">Cash</MenuItem>
                  <MenuItem value="CREDIT">Credit</MenuItem>
                </Select>
              </FormControl>
            </div>

            {/* Payment Status */}
            <div>
              <Typography variant="caption" className="mb-1 block text-gray-500">
                Payment Status
              </Typography>
              <FormControl fullWidth size="small" variant="outlined">
                <Select
                  value={paymentData.payment_status}
                  onChange={e => handleChange('payment_status', e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="UNPAID">Unpaid</MenuItem>
                  <MenuItem value="PARTIALLY_PAID">Partially Paid</MenuItem>
                  <MenuItem value="PAID">Paid</MenuItem>
                </Select>
              </FormControl>
            </div>

            {/* Payment Date */}
            <div>
              <Typography variant="caption" className="mb-1 block text-gray-500">
                Payment Date
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  value={paymentData.payment_date}
                  onChange={newValue => handleChange('payment_date', newValue)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      variant: 'outlined',
                    },
                  }}
                />
              </LocalizationProvider>
            </div>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default PaymentDetails;
