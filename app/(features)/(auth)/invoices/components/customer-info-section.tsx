'use client';

import AddIcon from '@mui/icons-material/Add';
import { Autocomplete, Grid, IconButton, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import Sidepanel from '@/app/shared/components/sidepanel';
import useSnackbar from '@/app/shared/hooks/useSnackbar';

import AddCustomer from '../../customers/components/add-customer';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface FormData {
  customer_id: number | null;
  billing_address: string;
  shipping_address: string;
  [key: string]: string | number | null; // For dynamic property access
}

interface FormErrors {
  customer_id?: string;
  [key: string]: string | undefined; // For dynamic property access
}

interface CustomerInfoSectionProps {
  formData: FormData;
  setFormData: (formData: FormData) => void;
  errors: FormErrors;
  setErrors: (errors: FormErrors) => void;
}

export default function CustomerInfoSection({
  formData,
  setFormData,
  errors,
  setErrors,
}: CustomerInfoSectionProps) {
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerPanelOpen, setIsCustomerPanelOpen] = useState(false);

  // Fetch customers on component mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/dropdown/customers');
        if (!response.ok) {
          throw new Error('Failed to fetch customers');
        }
        const data = await response.json();
        setCustomers(data.customers);
      } catch (error) {
        console.error('Error fetching customers:', error);
        showSnackbar('Failed to load customers', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, [showSnackbar]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: string | number }>
  ) => {
    const { name, value } = e.target;
    if (!name) {
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle customer selection
  const handleCustomerChange = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    setFormData({
      ...formData,
      customer_id: customer?.id || null,
      billing_address: customer?.address || '',
      shipping_address: customer?.address || '',
    });

    // Clear customer error if it exists
    if (errors.customer_id) {
      setErrors({
        ...errors,
        customer_id: '',
      });
    }
  };

  // Handle customer added from sidepanel
  const handleCustomerAdded = (customerName: string) => {
    setIsCustomerPanelOpen(false);

    // Refresh customers list
    fetch('/api/dropdown/customers')
      .then(response => response.json())
      .then(data => {
        setCustomers(data.customers);

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
      <div className="mb-6 rounded-lg border border-gray-100 bg-white p-6">
        <Typography variant="h6" className="mb-4 font-medium text-gray-800">
          Customer Information
        </Typography>

        <div className="mb-4 flex items-center">
          <Autocomplete
            options={customers}
            getOptionLabel={option => option.name}
            value={selectedCustomer}
            onChange={(_, newValue) => handleCustomerChange(newValue)}
            renderInput={params => (
              <TextField
                {...params}
                label="Select Customer"
                error={!!errors.customer_id}
                helperText={errors.customer_id}
                fullWidth
              />
            )}
            className="grow"
            disabled={isLoading}
          />
          <IconButton
            onClick={() => setIsCustomerPanelOpen(true)}
            className="ml-2 text-gray-600 hover:text-gray-800"
          >
            <AddIcon />
          </IconButton>
        </div>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Billing Address"
              name="billing_address"
              value={formData.billing_address}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={4}
              className="mb-4"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Shipping Address"
              name="shipping_address"
              value={formData.shipping_address}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={4}
              className="mb-4"
            />
          </Grid>
        </Grid>
      </div>

      {/* Sidepanel for adding new customer */}
      <Sidepanel
        isOpen={isCustomerPanelOpen}
        onClose={() => setIsCustomerPanelOpen(false)}
        size="small"
      >
        <div className="h-screen">
          <AddCustomer
            onCustomerAdded={handleCustomerAdded}
            onClose={() => setIsCustomerPanelOpen(false)}
          />
        </div>
      </Sidepanel>
    </>
  );
}
