"use client";

import { useState, useEffect, useRef } from "react";
import { 
  TextField, 
  Typography,
  Autocomplete,
  IconButton,
  Paper,
  Divider,
  Grid,
  Box,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import AddIcon from "@mui/icons-material/Add";
import Sidepanel from "@/app/shared/components/sidepanel";
import useSnackbar from "@/app/shared/hooks/useSnackbar";

interface Salesman {
  id: number;
  name: string;
}

interface Customer {
  id: number;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
}

interface SalesInvoiceDetailsProps {
  formData: any;
  setFormData: (formData: any) => void;
  errors: any;
  setErrors: (errors: any) => void;
}

// Utility function to generate invoice number
const generateInvoiceNumber = () => {
  const lastNumber = parseInt(localStorage.getItem('lastInvoiceNumber') || '1000');
  const newNumber = lastNumber + 1;
  localStorage.setItem('lastInvoiceNumber', newNumber.toString());
  return `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${newNumber.toString().padStart(6, '0')}`;
};

export default function SalesInvoiceDetails({ 
  formData, 
  setFormData, 
  errors,
  setErrors
}: SalesInvoiceDetailsProps) {
  const { showSnackbar } = useSnackbar();
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedSalesman, setSelectedSalesman] = useState<Salesman | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCustomerPanelOpen, setIsCustomerPanelOpen] = useState(false);
  const initialized = useRef(false);

  // Fetch customers and salesmen on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Generate invoice number if not already set
        if (!initialized.current && !formData.invoice_number) {
          setFormData((prev: any) => ({
            ...prev,
            invoice_number: generateInvoiceNumber()
          }));
          initialized.current = true;
        }

        // Fetch salesmen
        try {
          const salesmenResponse = await fetch('/api/dropdown/salesmen');
          if (salesmenResponse.ok) {
            const salesmenData = await salesmenResponse.json();
            setSalesmen(salesmenData.salesmen || []);
          }
        } catch (error) {
          console.error('Error fetching salesmen:', error);
          // Fallback to mock data when error occurs
         
        }

        // Fetch customers
        try {
          const customersResponse = await fetch('/api/dropdown/customers');
          if (customersResponse.ok) {
            const customersData = await customersResponse.json();
            setCustomers(customersData.customers || []);
          }
        } catch (error) {
          console.error('Error fetching customers:', error);
         
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [setFormData, formData.invoice_number]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (!name) return;

    setFormData((prevFormData: any) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  // Handle date change
  const handleDateChange = (date: Date | null) => {
    setFormData((prevFormData: any) => ({
      ...prevFormData,
      date: date || new Date(),
    }));
  };

  // Handle salesman selection
  const handleSalesmanChange = (salesman: Salesman | null) => {
    setSelectedSalesman(salesman);
    setFormData((prevFormData: any) => ({
      ...prevFormData,
      salesman_id: salesman?.id || null,
    }));

    // Clear salesman error if it exists
    if (errors.salesman_id) {
      setErrors({
        ...errors,
        salesman_id: "",
      });
    }
  };

  // Handle customer selection
  const handleCustomerChange = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    setFormData((prevFormData: any) => ({
      ...prevFormData,
      customer_id: customer?.id || null,
      ship_to: customer?.address || "",
    }));

    // Clear customer error if it exists
    if (errors.customer_id) {
      setErrors({
        ...errors,
        customer_id: "",
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
      <Paper elevation={0} className="mb-6 overflow-hidden border border-gray-200 shadow-lg">
        <Box className="bg-blue-50 px-6 py-4 border-b border-gray-200">
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
                      <Typography variant="caption" className="text-gray-500 mb-1 block">
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
                        error={!!errors.invoice_number}
                        helperText={errors.invoice_number}
                        size="small"
                      />
                    </div>
                    
                    <div>
                      <Typography variant="caption" className="text-gray-500 mb-1 block">
                        Sales Representative
                      </Typography>
                      <Autocomplete
                        options={salesmen}
                        getOptionLabel={(option) => option.name}
                        value={selectedSalesman}
                        onChange={(_, newValue) => handleSalesmanChange(newValue)}
                        renderInput={(params) => (
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
                      <Typography variant="caption" className="text-gray-500 mb-1 block">
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
                              size: 'small'
                            }
                          }}
                        />
                      </LocalizationProvider>
                    </div>
                    
                    <div>
                      <Typography variant="caption" className="text-gray-500 mb-1 block">
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
                    <Typography variant="caption" className="text-gray-500 mb-1 block">
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
                  <Typography variant="caption" className="text-gray-500 mb-1 block">
                    Customer
                  </Typography>
                  <div className="flex items-center gap-2">
                    <Autocomplete
                      options={customers}
                      getOptionLabel={(option) => option.name}
                      value={selectedCustomer}
                      onChange={(_, newValue) => handleCustomerChange(newValue)}
                      renderInput={(params) => (
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
                      className="flex-grow"
                      disabled={isLoading}
                    />
                    <IconButton 
                      onClick={() => setIsCustomerPanelOpen(true)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200"
                      size="small"
                      title="Add New Customer"
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </div>
                </div>
                
                {/* Customer details placeholder/display area */}
                <Box 
                  className={`border rounded-md p-4 min-h-[180px] ${!selectedCustomer ? 'border-dashed border-gray-300 flex items-center justify-center' : 'border-gray-200'}`}
                >
                  {selectedCustomer ? (
                    <Box className="space-y-3">
                      <Typography variant="subtitle2" className="font-medium text-gray-800 border-b pb-2">
                        {selectedCustomer.name || '-'}
                      </Typography>
                      
                      <Box className="grid grid-cols-1 gap-2">
                        {selectedCustomer.address && (
                          <Box className="flex items-start">
                            <Typography variant="caption" className="text-gray-500 w-20 flex-shrink-0">
                              Address:
                            </Typography>
                            <Typography variant="body2" className="text-gray-700">
                              {selectedCustomer.address || '-'}
                            </Typography>
                          </Box>
                        )}
                        
                        {selectedCustomer.email && (
                          <Box className="flex items-start">
                            <Typography variant="caption" className="text-gray-500 w-20 flex-shrink-0">
                              Email:
                            </Typography>
                            <Typography variant="body2" className="text-gray-700">
                              {selectedCustomer.email || '-'}
                            </Typography>
                          </Box>
                        )}
                        
                        {selectedCustomer.phone && (
                          <Box className="flex items-start">
                            <Typography variant="caption" className="text-gray-500 w-20 flex-shrink-0">
                              Phone:
                            </Typography>
                            <Typography variant="body2" className="text-gray-700">
                              {selectedCustomer.phone || '-'}
                            </Typography>
                          </Box>
                        )}
                        
                        {!selectedCustomer.address && !selectedCustomer.email && !selectedCustomer.phone && (
                          <Typography variant="body2" className="text-gray-500 italic">
                            No additional customer details available
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" className="text-gray-400 text-center">
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
        <div className="h-screen p-4">
          <Typography variant="h6">Add Customer</Typography>
          <Typography>Customer add form would go here</Typography>
        </div>
      </Sidepanel>
    </>
  );
} 