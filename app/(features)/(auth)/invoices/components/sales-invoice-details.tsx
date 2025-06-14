'use client';

import AddIcon from '@mui/icons-material/Add';
import { Autocomplete, Box, Grid, IconButton, Paper, TextField, Typography } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useEffect, useRef, useState } from 'react';

import AddCustomer from '@/app/(features)/(auth)/customers/components/add-customer';
import Sidepanel from '@/app/shared/components/sidepanel';
import type { Customer, FormErrors, InvoiceFormData, Salesman } from '@/lib/types';

interface SalesInvoiceDetailsProps {
  formData: InvoiceFormData;
  setFormData: (formData: InvoiceFormData) => void;
  errors: FormErrors;
  setErrors: (errors: FormErrors) => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  selectedSalesman: Salesman | null;
  setSelectedSalesman: (salesman: Salesman | null) => void;
  customers?: Customer[];
  salesmen?: Salesman[];
}

export default function SalesInvoiceDetails({
  formData,
  setFormData,
  errors,
  setErrors,
  selectedCustomer,
  setSelectedCustomer,
  selectedSalesman,
  setSelectedSalesman,
  customers = [],
  salesmen = [],
}: SalesInvoiceDetailsProps) {
  const [isLoading] = useState(false);
  const [isCustomerPanelOpen, setIsCustomerPanelOpen] = useState(false);
  const initialized = useRef(false);

  // Initialize invoice number if not already set
  useEffect(() => {
    if (!initialized.current && !formData.invoice_number) {
      setFormData({
        ...formData,
        invoice_number: '',
      });
      initialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target;
    if (!name) {
      return;
    }

    // Handle the form update more directly based on field type
    // For most form fields, we can safely use string values
    setFormData({
      ...formData,
      // Type assertion for the specific field we're updating
      [name]: value as string,
    });
  };

  // Handle date change
  const handleDateChange = (date: Date | null) => {
    setFormData({
      ...formData,
      date: date || new Date(),
    });
  };

  // Handle salesman selection
  const handleSalesmanChange = (salesman: Salesman | null) => {
    setSelectedSalesman(salesman);
    setFormData({
      ...formData,
      salesman_id: salesman?.id || null,
    });

    // Clear salesman error if it exists
    if (errors.salesman_id) {
      setErrors({
        ...errors,
        salesman_id: '',
      });
    }
  };

  // Handle customer selection
  const handleCustomerChange = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    setFormData({
      ...formData,
      customer_id: customer?.id || null,
      ship_to: customer?.address || '',
    });

    // Clear customer error if it exists
    if (errors.customer_id) {
      setErrors({
        ...errors,
        customer_id: '',
      });
    }
  };

  // For completion of component interface, not currently used in this implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCustomerAdded = (customerName: string) => {
    setIsCustomerPanelOpen(false);

    // Refresh customers list - notify parent about new customer
    fetch('/api/dropdown/customers')
      .then(response => response.json())
      .then(data => {
        // Find and select the newly added customer
        const newCustomer = data.customers.find((c: Customer) => c.name === customerName);
        if (newCustomer) {
          handleCustomerChange(newCustomer);
        }
      })
      .catch(error => {
        console.error('Error refreshing customers:', error);
      });
  };

  return (
    <>
      <Paper elevation={0} className="mb-6 overflow-hidden border border-gray-200 shadow-lg">
        <Box className="border-b border-gray-200 bg-blue-50 px-6 py-4">
          <Typography variant="subtitle1" className="font-medium text-gray-700">
            Invoice Details
          </Typography>
        </Box>

        <Box className="p-6">
          <Grid container spacing={4}>
            {/* Left side - Invoice information with 2 columns */}
            <Grid item xs={12} md={6}>
              <Grid container spacing={3}>
                {/* Left column of the left side */}
                <Grid item xs={6}>
                  <div className="space-y-4">
                    <div>
                      <Typography variant="caption" className="mb-1 block text-gray-500">
                        Invoice Number
                      </Typography>
                      <TextField
                        name="invoice_number"
                        value={formData.invoice_number}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        margin="none"
                        placeholder="Invoice Number"
                        size="small"
                        InputProps={{
                          readOnly: true,
                        }}
                        disabled
                      />
                    </div>
                    <div>
                      <Typography variant="caption" className="mb-1 block text-gray-500">
                        Sales Representative
                      </Typography>
                      <Autocomplete
                        options={salesmen}
                        getOptionLabel={option => option.name}
                        value={selectedSalesman}
                        onChange={(_, newValue) => handleSalesmanChange(newValue)}
                        renderInput={params => (
                          <TextField
                            {...params}
                            variant="outlined"
                            placeholder="Sales Representative"
                            error={!!errors.salesman_id}
                            helperText={errors.salesman_id}
                            fullWidth
                            size="small"
                          />
                        )}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </Grid>

                {/* Right column of the left side */}
                <Grid item xs={6}>
                  <div className="space-y-4">
                    <div>
                      <Typography variant="caption" className="mb-1 block text-gray-500">
                        Invoice Date
                      </Typography>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          value={formData.date}
                          onChange={handleDateChange}
                          slotProps={{
                            textField: {
                              placeholder: 'Invoice Date',
                              fullWidth: true,
                              variant: 'outlined',
                              size: 'small',
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </div>

                    <div>
                      <Typography variant="caption" className="mb-1 block text-gray-500">
                        Ship From
                      </Typography>
                      <TextField
                        name="ship_from"
                        placeholder="Ship From"
                        value={formData.ship_from}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                      />
                    </div>
                  </div>
                </Grid>

                {/* Ship To field spans both columns */}
                <Grid item xs={12}>
                  <div>
                    <Typography variant="caption" className="mb-1 block text-gray-500">
                      Ship To
                    </Typography>
                    <TextField
                      name="ship_to"
                      placeholder="Ship To"
                      value={formData.ship_to}
                      onChange={handleInputChange}
                      fullWidth
                      variant="outlined"
                      size="small"
                      multiline
                      rows={2}
                    />
                  </div>
                </Grid>
              </Grid>
            </Grid>

            {/* Right side - Customer information */}
            <Grid item xs={12} md={6}>
              <div className="space-y-4">
                <div>
                  <Typography variant="caption" className="mb-1 block text-gray-500">
                    Customer
                  </Typography>
                  <div className="flex items-center gap-2">
                    <Autocomplete
                      options={customers}
                      getOptionLabel={option => option.name}
                      value={selectedCustomer}
                      onChange={(_, newValue) => handleCustomerChange(newValue)}
                      renderInput={params => (
                        <TextField
                          {...params}
                          placeholder="Customer"
                          variant="outlined"
                          error={!!errors.customer_id}
                          helperText={errors.customer_id}
                          fullWidth
                          size="small"
                        />
                      )}
                      className="grow"
                      disabled={isLoading}
                    />
                    <IconButton
                      onClick={() => setIsCustomerPanelOpen(true)}
                      className="border border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                      size="small"
                      title="Add New Customer"
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </div>
                </div>

                {/* Customer details placeholder/display area */}
                <Box
                  className={`min-h-[180px] rounded-md border p-4 ${!selectedCustomer ? 'flex items-center justify-center border-dashed border-gray-300' : 'border-gray-200'}`}
                >
                  {selectedCustomer ? (
                    <Box className="space-y-3">
                      <Typography
                        variant="subtitle2"
                        className="border-b pb-2 font-medium text-gray-800"
                      >
                        {selectedCustomer.name || '-'}
                      </Typography>

                      <Box className="grid grid-cols-1 gap-2">
                        {selectedCustomer.address && (
                          <Box className="flex items-start">
                            <Typography variant="caption" className="w-20 shrink-0 text-gray-500">
                              Address:
                            </Typography>
                            <Typography variant="body2" className="text-gray-700">
                              {selectedCustomer.address || '-'}
                            </Typography>
                          </Box>
                        )}

                        {selectedCustomer.email && (
                          <Box className="flex items-start">
                            <Typography variant="caption" className="w-20 shrink-0 text-gray-500">
                              Email:
                            </Typography>
                            <Typography variant="body2" className="text-gray-700">
                              {selectedCustomer.email || '-'}
                            </Typography>
                          </Box>
                        )}

                        {selectedCustomer.phone && (
                          <Box className="flex items-start">
                            <Typography variant="caption" className="w-20 shrink-0 text-gray-500">
                              Phone:
                            </Typography>
                            <Typography variant="body2" className="text-gray-700">
                              {selectedCustomer.phone || '-'}
                            </Typography>
                          </Box>
                        )}

                        {!selectedCustomer.address &&
                          !selectedCustomer.email &&
                          !selectedCustomer.phone && (
                            <Typography variant="body2" className="italic text-gray-500">
                              No additional customer details available
                            </Typography>
                          )}
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" className="text-center text-gray-400">
                      Please select a customer to view details
                    </Typography>
                  )}
                </Box>
              </div>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Sidepanel for adding new customer */}
      <Sidepanel
        isOpen={isCustomerPanelOpen}
        onClose={() => setIsCustomerPanelOpen(false)}
        size="small"
      >
        <AddCustomer
          onCustomerAdded={handleCustomerAdded}
          onClose={() => setIsCustomerPanelOpen(false)}
          useFormTag={false}
        />
      </Sidepanel>
    </>
  );
}
