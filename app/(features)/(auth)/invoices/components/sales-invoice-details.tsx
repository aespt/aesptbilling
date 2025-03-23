"use client";

import { useState, useEffect, useRef } from "react";
import { 
  TextField, 
  Typography,
  Autocomplete,
  IconButton,
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
          setSalesmen([
            { id: 1, name: 'John Doe' },
            { id: 2, name: 'Jane Smith' },
            { id: 3, name: 'Mike Johnson' }
          ]);
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
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100">
        <Typography variant="h6" className="mb-4 text-gray-800 font-medium">Invoice Details</Typography>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-1">
            <TextField
              label="Invoice Number"
              name="invoice_number"
              value={formData.invoice_number}
              onChange={handleInputChange}
              fullWidth
              error={!!errors.invoice_number}
              helperText={errors.invoice_number}
              className="mb-4"
              size="small"
            />
          </div>
          
          <div className="col-span-1">
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Invoice Date"
                value={formData.date}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                    className: 'mb-4',
                    size: 'small'
                  }
                }}
              />
            </LocalizationProvider>
          </div>

          <div className="col-span-1">
            <div className="flex items-center">
              <Autocomplete
                options={salesmen}
                getOptionLabel={(option) => option.name}
                value={selectedSalesman}
                onChange={(_, newValue) => handleSalesmanChange(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Sales Person"
                    error={!!errors.salesman_id}
                    helperText={errors.salesman_id}
                    fullWidth
                    size="small"
                  />
                )}
                className="flex-grow"
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="col-span-1">
            <TextField
              label="Ship From"
              name="ship_from"
              value={formData.ship_from}
              onChange={handleInputChange}
              fullWidth
              size="small"
              className="mb-4"
            />
          </div>
          
          <div className="col-span-1">
            <div className="flex items-center">
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => option.name}
                value={selectedCustomer}
                onChange={(_, newValue) => handleCustomerChange(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer"
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
                className="ml-2 text-gray-600 hover:text-gray-800"
              >
                <AddIcon />
              </IconButton>
            </div>
          </div>
          
          <div className="col-span-1">
            <TextField
              label="Ship To"
              name="ship_to"
              value={formData.ship_to}
              onChange={handleInputChange}
              fullWidth
              size="small"
              className="mb-4"
            />
          </div>
        </div>
      </div>

      {/* Sidepanel for adding new customer - This would need to be replaced with your actual AddCustomer component */}
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