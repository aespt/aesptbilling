'use client';

import AddIcon from '@mui/icons-material/Add';
import { Autocomplete, Box, IconButton, Paper, TextField, Typography } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useEffect, useRef, useState } from 'react';

import Sidepanel from '@/app/shared/components/sidepanel';
import type { FormErrors } from '@/lib/types';

import AddSupplier from '../../suppliers/components/add-supplier';

interface Supplier {
  id: number;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
}

// Define a dedicated interface for PurchaseEntryFormData
export interface PurchaseEntryFormData {
  purchaseentry_number: string;
  date: Date;
  supplier_id: number | null;
  ship_from: string;
  status: string;
  tax_type: 'VAT' | 'GST' | 'NONE';
  vat_percentage: number;
  cgst_percentage: number;
  sgst_percentage: number;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number | string;
  tax_rate: number;
  discount_rate: number;
}

interface PurchaseEntryDetailsProps {
  formData: PurchaseEntryFormData;
  setFormData: (formData: PurchaseEntryFormData) => void;
  errors: FormErrors;
  setErrors: (errors: FormErrors) => void;
}

// Utility function to generate purchase entry number
const generatePurchaseEntryNumber = () => {
  const lastNumber = parseInt(localStorage.getItem('lastPurchaseEntryNumber') || '1000');
  const newNumber = lastNumber + 1;
  localStorage.setItem('lastPurchaseEntryNumber', newNumber.toString());
  return `PE-${new Date().getFullYear()}${(new Date().getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${newNumber.toString().padStart(6, '0')}`;
};

export default function PurchaseEntryDetails({
  formData,
  setFormData,
  errors,
  setErrors,
}: PurchaseEntryDetailsProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupplierPanelOpen, setIsSupplierPanelOpen] = useState(false);
  const initialized = useRef(false);

  // Fetch suppliers on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Generate purchase entry number if not already set
        // if (!initialized.current && !formData.purchaseentry_number) {
        //   setFormData({
        //     ...formData,
        //     purchaseentry_number: generatePurchaseEntryNumber(),
        //   });
        //   initialized.current = true;
        // }

        // Fetch suppliers
        try {
          const suppliersResponse = await fetch('/api/dropdown/suppliers');
          if (suppliersResponse.ok) {
            const suppliersData = await suppliersResponse.json();
            setSuppliers(suppliersData.suppliers || []);
          }
        } catch (error) {
          console.error('Error fetching suppliers:', error);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [formData, setFormData]);

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

  // Handle supplier selection
  const handleSupplierChange = (supplier: Supplier | null) => {
    setSelectedSupplier(supplier);
    setFormData({
      ...formData,
      supplier_id: supplier?.id || null,
      ship_from: supplier?.address || '',
    });

    // Clear supplier error if it exists
    if (errors.supplier_id) {
      setErrors({
        ...errors,
        supplier_id: '',
      });
    }
  };

  // For completion of component interface, not currently used in this implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSupplierAdded = (supplierName: string) => {
    setIsSupplierPanelOpen(false);

    // Refresh suppliers list
    fetch('/api/dropdown/suppliers')
      .then(response => response.json())
      .then(data => {
        setSuppliers(data.suppliers);

        // Find and select the newly added supplier
        const newSupplier = data.suppliers.find((c: Supplier) => c.name === supplierName);
        if (newSupplier) {
          handleSupplierChange(newSupplier);
        }
      })
      .catch(error => {
        console.error('Error refreshing suppliers:', error);
      });
  };

  return (
    <>
      <Paper elevation={0} className="mb-6 overflow-hidden border border-gray-200 shadow-lg">
        <Box className="border-b border-gray-200 bg-blue-50 px-6 py-4">
          <Typography variant="subtitle1" className="font-medium text-gray-700">
            Purchase Entry Details
          </Typography>
        </Box>

        <Box className="p-6">
          <div className="flex flex-col gap-4 md:flex-row">
            {/* Left side - Purchase Entry information */}
            <div className="w-full md:w-1/2">
              <div className="flex flex-col gap-3 md:flex-row">
                {/* Left column of the left side */}
                <div className="w-full md:w-1/2">
                  <div className="space-y-4">
                    <div>
                      <Typography variant="caption" className="mb-1 block text-gray-500">
                        Purchase Entry Number
                      </Typography>
                      <TextField
                        name="purchaseentry_number"
                        value={formData.purchaseentry_number}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        margin="none"
                        placeholder="Purchase Entry Number"
                        error={!!errors.purchaseentry_number}
                        helperText={errors.purchaseentry_number}
                        size="small"
                      />
                    </div>
                  </div>
                </div>

                {/* Right column of the left side */}
                <div className="w-full md:w-1/2">
                  <div className="space-y-4">
                    <div>
                      <Typography variant="caption" className="mb-1 block text-gray-500">
                        Purchase Entry Date
                      </Typography>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          value={formData.date}
                          onChange={handleDateChange}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              variant: 'outlined',
                              size: 'small',
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ship From field - spans both columns */}
              <div className="mt-3">
                <Typography variant="caption" className="mb-1 block text-gray-500">
                  Ship From
                </Typography>
                <TextField
                  name="ship_from"
                  value={formData.ship_from}
                  onChange={handleInputChange}
                  fullWidth
                  variant="outlined"
                  margin="none"
                  placeholder="Shipping address"
                  multiline
                  rows={6}
                  size="small"
                  className="h-full"
                  InputProps={{
                    className: 'h-full',
                    style: { height: '160px' },
                  }}
                />
              </div>
            </div>

            {/* Right side - Supplier information */}
            <div className="w-full md:w-1/2">
              <div className="space-y-4">
                <div>
                  <Typography variant="caption" className="mb-1 block text-gray-500">
                    Supplier
                  </Typography>
                  <div className="flex items-center gap-2">
                    <Autocomplete
                      options={suppliers}
                      getOptionLabel={option => option.name}
                      value={selectedSupplier}
                      onChange={(_, newValue) => handleSupplierChange(newValue)}
                      renderInput={params => (
                        <TextField
                          {...params}
                          placeholder="Supplier"
                          variant="outlined"
                          error={!!errors.supplier_id}
                          helperText={errors.supplier_id}
                          fullWidth
                          size="small"
                        />
                      )}
                      className="grow"
                      disabled={isLoading}
                    />
                    <IconButton
                      onClick={() => setIsSupplierPanelOpen(true)}
                      className="border border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                      size="small"
                      title="Add New Supplier"
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </div>
                </div>

                {/* Supplier details display area */}
                <Box
                  className={`min-h-[180px] rounded-md border p-4 ${!selectedSupplier ? 'flex items-center justify-center border-dashed border-gray-300' : 'border-gray-200'}`}
                >
                  {selectedSupplier ? (
                    <Box className="space-y-3">
                      <Typography
                        variant="subtitle2"
                        className="border-b pb-2 font-medium text-gray-800"
                      >
                        {selectedSupplier.name || '-'}
                      </Typography>

                      <Box className="grid grid-cols-1 gap-2">
                        {selectedSupplier.address && (
                          <Box className="flex items-start">
                            <Typography variant="caption" className="w-20 shrink-0 text-gray-500">
                              Address:
                            </Typography>
                            <Typography variant="body2" className="text-gray-700">
                              {selectedSupplier.address || '-'}
                            </Typography>
                          </Box>
                        )}

                        {selectedSupplier.email && (
                          <Box className="flex items-start">
                            <Typography variant="caption" className="w-20 shrink-0 text-gray-500">
                              Email:
                            </Typography>
                            <Typography variant="body2" className="text-gray-700">
                              {selectedSupplier.email || '-'}
                            </Typography>
                          </Box>
                        )}

                        {selectedSupplier.phone && (
                          <Box className="flex items-start">
                            <Typography variant="caption" className="w-20 shrink-0 text-gray-500">
                              Phone:
                            </Typography>
                            <Typography variant="body2" className="text-gray-700">
                              {selectedSupplier.phone || '-'}
                            </Typography>
                          </Box>
                        )}

                        {!selectedSupplier.address &&
                          !selectedSupplier.email &&
                          !selectedSupplier.phone && (
                            <Typography variant="body2" className="italic text-gray-500">
                              No additional supplier details available
                            </Typography>
                          )}
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" className="text-center text-gray-400">
                      Please select a supplier to view details
                    </Typography>
                  )}
                </Box>
              </div>
            </div>
          </div>
        </Box>
      </Paper>

      <Sidepanel isOpen={isSupplierPanelOpen} onClose={() => setIsSupplierPanelOpen(false)}>
        <AddSupplier onClose={() => setIsSupplierPanelOpen(false)} />
      </Sidepanel>
    </>
  );
}
