"use client";

import { useState, useEffect, useRef } from "react";
import { 
  TextField, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Select,
  Typography,
  Autocomplete
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import useSnackbar from "@/app/shared/hooks/useSnackbar";
import Sidepanel from "@/app/shared/components/sidepanel";
import AddIcon from "@mui/icons-material/Add";
import EntitySelector from "@/app/shared/components/entity-selector";
import FormField from "@/app/shared/components/form-field";

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

interface InvoiceDetailsSectionProps {
  formData: any;
  setFormData: (formData: any) => void;
  errors: any;
  customers?: Customer[];
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

export default function InvoiceDetailsSection({ 
  formData, 
  setFormData, 
  errors,
  customers = []
}: InvoiceDetailsSectionProps) {
  const { showSnackbar } = useSnackbar();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);
  const isMounted = useRef(true);
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [salespeople, setSalespeople] = useState<{id: number, name: string}[]>([]);
  const [apiCustomers, setApiCustomers] = useState<Customer[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Generate invoice number on component mount
  useEffect(() => {
    if (initialized.current || formData.invoice_number) return;
    
    setFormData((prev: any) => ({
      ...prev,
      invoice_number: generateInvoiceNumber()
    }));
    
    initialized.current = true;
  }, [formData.invoice_number, setFormData]);

  // Fetch customers and salespeople on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customers
        const customersResponse = await fetch('/api/dropdown/customers');
        if (!customersResponse.ok) throw new Error('Failed to fetch customers');
        const customersData = await customersResponse.json();
        if (isMounted.current) {
          setApiCustomers(customersData.customers || []);
        }
        
        try {
          // Fetch salespeople - wrapped in separate try/catch to handle failure gracefully
          const salespeopleResponse = await fetch('/api/dropdown/salesmen');
          if (salespeopleResponse.ok) {
            const salespeopleData = await salespeopleResponse.json();
            if (isMounted.current) {
              setSalespeople(salespeopleData.salespeople || []);
            }
          } else {
            // Fallback with empty array if endpoint fails
            console.error('Failed to fetch salespeople');
            if (isMounted.current) {
              setSalespeople([]);
            }
          }
        } catch (salesError) {
          console.error('Error fetching salespeople:', salesError);
          if (isMounted.current) {
            setSalespeople([]);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        if (isMounted.current) {
          showSnackbar('Failed to load data', 'error');
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    // Intentionally omitting showSnackbar from dependencies to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set initial filtered customers when apiCustomers changes
  useEffect(() => {
    setFilteredCustomers(apiCustomers);
  }, [apiCustomers]);

  // Filter customers based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(apiCustomers);
      return;
    }
    
    const lowercasedSearch = searchTerm.toLowerCase();
    const filtered = apiCustomers.filter(customer => 
      customer.name.toLowerCase().includes(lowercasedSearch) || 
      (customer.phone && customer.phone.toLowerCase().includes(lowercasedSearch))
    );
    
    setFilteredCustomers(filtered);
  }, [searchTerm, apiCustomers]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (!name) return;

    setFormData((prevFormData: any) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  // Handle select change for MUI Select component
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prevFormData: any) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  // Handle date change
  const handleDateChange = (date: Date | null, fieldName: string) => {
    setFormData((prevFormData: any) => ({
      ...prevFormData,
      [fieldName]: date || new Date(),
    }));
  };

  // Handle customer selection
  const handleCustomerChange = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    setFormData((prevFormData: any) => ({
      ...prevFormData,
      customer_id: customer?.id || null,
      billing_address: customer?.address || "",
      shipping_address: customer?.address || "",
    }));
  };

  // Handle tax type change
  const handleTaxTypeChange = (e: any) => {
    const { value } = e.target;
    setFormData((prevFormData: any) => ({
      ...prevFormData,
      tax_type: value,
      tax_rate: value === 'NONE' ? 0 : prevFormData.tax_rate,
    }));
  };

  // Open customer add sidepanel
  const handleOpenAddCustomer = () => {
    setIsSidepanelOpen(true);
  };

  // Close customer add sidepanel
  const handleCloseAddCustomer = () => {
    setIsSidepanelOpen(false);
  };

  // Handle customer form input changes
  const handleCustomerFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (!name) return;
    
    setCustomerFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle new customer addition
  const handleAddCustomer = async () => {
    try {
      // This would typically make an API call to add the customer
      // and then update the customers list
      console.log('Adding customer:', customerFormData);
      
      // Simulate API call success
      showSnackbar('Customer added successfully', 'success');
      
      // Reset form and close panel
      setCustomerFormData({
        name: '',
        phone: '',
        email: '',
        address: ''
      });
      setIsSidepanelOpen(false);
      
      // Refresh customers list
      const response = await fetch('/api/dropdown/customers');
      if (response.ok) {
        const data = await response.json();
        setApiCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      showSnackbar('Failed to add customer', 'error');
    }
  };

  // Handle customer added from sidepanel
  const handleCustomerAdded = async (customerName: string) => {
    setIsSidepanelOpen(false);
    
    try {
      // Refresh customers list
      const response = await fetch('/api/dropdown/customers');
      if (!response.ok) throw new Error('Failed to refresh customers');
      
      const data = await response.json();
      setApiCustomers(data.customers || []);
      
      // Find and select the newly added customer
      const newCustomer = data.customers.find((c: Customer) => c.name === customerName);
      if (newCustomer) {
        handleCustomerChange(newCustomer);
      }
    } catch (error) {
      console.error('Error refreshing customers:', error);
      showSnackbar('Failed to refresh customers', 'error');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100">
      <Typography variant="h6" className="mb-4 text-gray-800 font-medium">Invoice Details</Typography>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <FormField
            label="Invoice Number"
            name="invoice_number"
            value={formData.invoice_number || ''}
            onChange={handleInputChange}
            required
            error={!!errors.invoice_number}
            helperText={errors.invoice_number}
            InputProps={{
              readOnly: true,
            }}
          />
        </div>
        
        <div>
          <FormField
            label="Order Number"
            name="order_number"
            value={formData.order_number || ''}
            onChange={handleInputChange}
          />
        </div>
        
        
        <div>
          <EntitySelector<Customer>
            options={filteredCustomers}
            getOptionLabel={(option) => option.name}
            value={selectedCustomer}
            onChange={handleCustomerChange}
            onAddClick={handleOpenAddCustomer}
            label="Select Customer"
            error={!!errors.customer_id}
            helperText={errors.customer_id}
            disabled={isLoading}
          />
        </div>
        
        <div>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Invoice Date"
              value={formData.invoice_date || formData.date || new Date()}
              onChange={(date) => handleDateChange(date, 'invoice_date')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.invoice_date,
                  helperText: errors.invoice_date
                }
              }}
            />
          </LocalizationProvider>
        </div>
        
        
        <div>
          <FormControl fullWidth>
            <InputLabel>Salesperson</InputLabel>
            <Select
              name="salesperson_name"
              value={formData.salesperson_name || ''}
              onChange={handleSelectChange}
              label="Salesperson"
              error={!!errors.salesperson_name}
              required
            >
              {salespeople.length > 0 ? (
                salespeople.map((person) => (
                  <MenuItem key={person.id} value={person.name}>
                    {person.name}
                  </MenuItem>
                ))
              ) : (
                // Fallback option if no salespeople are available
                <MenuItem value="">
                  <em>No salespeople available</em>
                </MenuItem>
              )}
            </Select>
            {errors.salesperson_name && (
              <Typography color="error" variant="caption">
                {errors.salesperson_name}
              </Typography>
            )}
          </FormControl>
        </div>
        
        <div>
          <FormControl fullWidth>
            <InputLabel>Tax Type</InputLabel>
            <Select
              name="tax_type"
              value={formData.tax_type || 'NONE'}
              onChange={handleTaxTypeChange}
              label="Tax Type"
            >
              <MenuItem value="NONE">None</MenuItem>
              <MenuItem value="VAT">VAT</MenuItem>
              <MenuItem value="GST">GST</MenuItem>
            </Select>
          </FormControl>
        </div>
        
        <div>
          <FormField
            label="Tax Rate (%)"
            name="tax_rate"
            type="number"
            value={formData.tax_rate || 0}
            onChange={handleInputChange}
            disabled={formData.tax_type === 'NONE'}
            min={0}
            max={100}
            step={0.01}
          />
        </div>
        
      </div>

      {/* Customer Add Sidepanel */}
      <Sidepanel 
        isOpen={isSidepanelOpen} 
        onClose={handleCloseAddCustomer}
        size="small"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <Typography variant="h6">Add New Customer</Typography>
            <button 
              onClick={handleCloseAddCustomer}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          {/* Customer Add Form */}
          <div className="space-y-4">
            <FormField
              label="Customer Name"
              name="name"
              value={customerFormData.name}
              onChange={handleCustomerFormChange}
              required
            />
            <FormField
              label="Phone Number"
              name="phone"
              value={customerFormData.phone}
              onChange={handleCustomerFormChange}
              required
            />
            <FormField
              label="Email"
              name="email"
              value={customerFormData.email}
              onChange={handleCustomerFormChange}
              type="email"
            />
            <FormField
              label="Address"
              name="address"
              value={customerFormData.address}
              onChange={handleCustomerFormChange}
              multiline
              rows={3}
            />
            
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleCloseAddCustomer}
                className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomer}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add Customer
              </button>
            </div>
          </div>
        </div>
      </Sidepanel>
    </div>
  );
} 