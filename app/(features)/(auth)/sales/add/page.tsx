"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/app/shared/components/page-header";
import Sidepanel from "@/app/shared/components/sidepanel";
import Snackbar from "@/app/shared/components/snackbar";
import useSnackbar from "@/app/shared/hooks/useSnackbar";
import { TextField, Button, MenuItem, FormControl, InputLabel, Select, FormHelperText, Autocomplete, IconButton } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCustomer from "../../customers/components/add-customer";
import AddProduct from "../../products/components/add-product";
import AddSalesman from "../../salesmen/components/add-salesman";


// Define types for dropdown data
interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface Product {
  id: number;
  name: string;
  partNo: string;
  mrp: number;
}

interface Salesman {
  id: number;
  name: string;
  contact_number: string;
}

export default function AddSalesPage() {
  const router = useRouter();
  const { isOpen, message, type, showSnackbar, hideSnackbar } = useSnackbar();

  // Form state
  const [formData, setFormData] = useState({
    date: new Date(),
    customer_id: null as number | null,
    product_id: null as number | null,
    qty: 1,
    mrp: 0,
    discount_type: "NONE",
    discount_value: 0,
    salesman_id: null as number | null,
    ship_to: "",
  });

  // Dropdown data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);

  // Selected items for autocomplete
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSalesman, setSelectedSalesman] = useState<Salesman | null>(null);

  // Sidepanel states
  const [isCustomerPanelOpen, setIsCustomerPanelOpen] = useState(false);
  const [isProductPanelOpen, setIsProductPanelOpen] = useState(false);
  const [isSalesmanPanelOpen, setIsSalesmanPanelOpen] = useState(false);

  // Form validation
  const [errors, setErrors] = useState({
    customer_id: "",
    product_id: "",
    qty: "",
    mrp: "",
    discount_value: "",
    salesman_id: "",
  });

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      setIsLoading(true);
      try {
        // Fetch customers
        const customersResponse = await fetch('/api/dropdown/customers');
        if (!customersResponse.ok) throw new Error('Failed to fetch customers');
        const customersData = await customersResponse.json();
        setCustomers(customersData.customers);

        // Fetch products
        const productsResponse = await fetch('/api/dropdown/products');
        if (!productsResponse.ok) throw new Error('Failed to fetch products');
        const productsData = await productsResponse.json();
        setProducts(productsData.products);

        // Fetch salesmen
        const salesmenResponse = await fetch('/api/dropdown/salesmen');
        if (!salesmenResponse.ok) throw new Error('Failed to fetch salesmen');
        const salesmenData = await salesmenResponse.json();
        setSalesmen(salesmenData.salesmen);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
        showSnackbar('Failed to load dropdown data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDropdownData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (!name) return;

    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error for the field
    if (name in errors) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  // Handle select change for MUI Select component
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle date change
  const handleDateChange = (date: Date | null) => {
    setFormData({
      ...formData,
      date: date || new Date(),
    });
  };

  // Handle product selection
  const handleProductChange = (product: Product | null) => {
    setSelectedProduct(product);
    setFormData({
      ...formData,
      product_id: product?.id || null,
      mrp: product?.mrp || 0,
    });
    setErrors({
      ...errors,
      product_id: "",
    });
  };

  // Handle customer selection
  const handleCustomerChange = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    setFormData({
      ...formData,
      customer_id: customer?.id || null,
    });
    setErrors({
      ...errors,
      customer_id: "",
    });
  };

  // Handle salesman selection
  const handleSalesmanChange = (salesman: Salesman | null) => {
    setSelectedSalesman(salesman);
    setFormData({
      ...formData,
      salesman_id: salesman?.id || null,
    });
    setErrors({
      ...errors,
      salesman_id: "",
    });
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {
      customer_id: !formData.customer_id ? "Customer is required" : "",
      product_id: !formData.product_id ? "Product is required" : "",
      qty: formData.qty <= 0 ? "Quantity must be greater than 0" : "",
      mrp: formData.mrp <= 0 ? "MRP must be greater than 0" : "",
      discount_value: formData.discount_type !== "NONE" && formData.discount_value < 0 
        ? "Discount value cannot be negative" 
        : formData.discount_type === "PERCENTAGE" && formData.discount_value > 100
          ? "Percentage discount cannot exceed 100%"
          : "",
      salesman_id: !formData.salesman_id ? "Salesman is required" : "",
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showSnackbar('Please fix the errors in the form', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/sales/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create sales record');
      }

      showSnackbar('Sales record created successfully', 'success');
      router.push('/sales');
    } catch (error) {
      console.error('Error creating sales record:', error);
      showSnackbar('Failed to create sales record', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate final price
  const calculateFinalPrice = () => {
    if (formData.discount_type === "PERCENTAGE") {
      return formData.mrp - (formData.mrp * (formData.discount_value / 100));
    } else if (formData.discount_type === "FIXED") {
      return formData.mrp - formData.discount_value;
    }
    return formData.mrp;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Handle customer added
  const handleCustomerAdded = (customerName: string) => {
    // Refresh customers list
    fetch('/api/dropdown/customers')
      .then(response => response.json())
      .then(data => {
        setCustomers(data.customers);
        // Find and select the newly added customer
        const newCustomer = data.customers.find((c: Customer) => c.name === customerName);
        if (newCustomer) {
          setSelectedCustomer(newCustomer);
          setFormData({
            ...formData,
            customer_id: newCustomer.id,
          });
        }
      })
      .catch(error => console.error('Error refreshing customers:', error));
    
    setIsCustomerPanelOpen(false);
    showSnackbar(`Customer "${customerName}" added successfully`, 'success');
  };

  // Handle product added
  const handleProductAdded = (productName: string) => {
    // Refresh products list
    fetch('/api/dropdown/products')
      .then(response => response.json())
      .then(data => {
        setProducts(data.products);
        // Find and select the newly added product
        const newProduct = data.products.find((p: Product) => p.name === productName);
        if (newProduct) {
          setSelectedProduct(newProduct);
          setFormData({
            ...formData,
            product_id: newProduct.id,
            mrp: newProduct.mrp,
          });
        }
      })
      .catch(error => console.error('Error refreshing products:', error));
    
    setIsProductPanelOpen(false);
    showSnackbar(`Product "${productName}" added successfully`, 'success');
  };

  // Handle salesman added
  const handleSalesmanAdded = (salesmanName: string) => {
    // Refresh salesmen list
    fetch('/api/dropdown/salesmen')
      .then(response => response.json())
      .then(data => {
        setSalesmen(data.salesmen);
        // Find and select the newly added salesman
        const newSalesman = data.salesmen.find((s: Salesman) => s.name === salesmanName);
        if (newSalesman) {
          setSelectedSalesman(newSalesman);
          setFormData({
            ...formData,
            salesman_id: newSalesman.id,
          });
        }
      })
      .catch(error => console.error('Error refreshing salesmen:', error));
    
    setIsSalesmanPanelOpen(false);
    showSnackbar(`Salesman "${salesmanName}" added successfully`, 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50 md:ml-[280px] pt-16 px-4 md:px-6 py-8">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center mb-6">
          <IconButton
             color="primary"
             onClick={() => router.push('/sales')}
             className="mr-2"
             aria-label="back to sales"
           >
             <ArrowBackIcon />
           </IconButton>
          <h1 className="text-2xl font-bold text-gray-800">Add New Sale</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-b-red-500 border-l-blue-300 border-r-red-300 animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100 mt-6">
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Date Picker */}
                  <div>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Date of Sale"
                        value={formData.date}
                        onChange={handleDateChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: "outlined",
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </div>

                  {/* Customer Dropdown with Add Button */}
                  <div className="flex items-center gap-2">
                    <Autocomplete
                      id="customer-select"
                      options={customers}
                      getOptionLabel={(option) => option.name}
                      value={selectedCustomer}
                      onChange={(_, newValue) => handleCustomerChange(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Customer"
                          variant="outlined"
                          fullWidth
                          error={!!errors.customer_id}
                          helperText={errors.customer_id}
                        />
                      )}
                      className="flex-1"
                    />
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => setIsCustomerPanelOpen(true)}
                      className="min-w-[40px] h-[56px]"
                    >
                      <AddIcon />
                    </Button>
                  </div>

                  {/* Product Dropdown with Add Button */}
                  <div className="flex items-center gap-2">
                    <Autocomplete
                      id="product-select"
                      options={products}
                      getOptionLabel={(option) => `${option.name} (${option.partNo})`}
                      value={selectedProduct}
                      onChange={(_, newValue) => handleProductChange(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Product"
                          variant="outlined"
                          fullWidth
                          error={!!errors.product_id}
                          helperText={errors.product_id}
                        />
                      )}
                      className="flex-1"
                    />
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => setIsProductPanelOpen(true)}
                      className="min-w-[40px] h-[56px]"
                    >
                      <AddIcon />
                    </Button>
                  </div>

                  {/* Quantity */}
                  <TextField
                    name="qty"
                    label="Quantity"
                    type="number"
                    value={formData.qty}
                    onChange={handleInputChange}
                    variant="outlined"
                    fullWidth
                    error={!!errors.qty}
                    helperText={errors.qty}
                    InputProps={{ inputProps: { min: 1 } }}
                  />

                  {/* MRP */}
                  <TextField
                    name="mrp"
                    label="MRP"
                    type="number"
                    value={formData.mrp}
                    onChange={handleInputChange}
                    variant="outlined"
                    fullWidth
                    error={!!errors.mrp}
                    helperText={errors.mrp}
                    InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                  />

                  {/* Discount Type */}
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="discount-type-label">Discount Type</InputLabel>
                    <Select
                      labelId="discount-type-label"
                      name="discount_type"
                      value={formData.discount_type}
                      onChange={handleSelectChange}
                      label="Discount Type"
                    >
                      <MenuItem value="NONE">None</MenuItem>
                      <MenuItem value="PERCENTAGE">Percentage</MenuItem>
                      <MenuItem value="FIXED">Fixed Amount</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Discount Value */}
                  <TextField
                    name="discount_value"
                    label={formData.discount_type === "PERCENTAGE" ? "Discount (%)" : "Discount Amount"}
                    type="number"
                    value={formData.discount_value}
                    onChange={handleInputChange}
                    variant="outlined"
                    fullWidth
                    disabled={formData.discount_type === "NONE"}
                    error={!!errors.discount_value}
                    helperText={errors.discount_value}
                    InputProps={{ 
                      inputProps: { 
                        min: 0,
                        max: formData.discount_type === "PERCENTAGE" ? 100 : undefined,
                        step: formData.discount_type === "PERCENTAGE" ? 1 : 0.01
                      } 
                    }}
                  />

                  {/* Salesman Dropdown with Add Button */}
                  <div className="flex items-center gap-2">
                    <Autocomplete
                      id="salesman-select"
                      options={salesmen}
                      getOptionLabel={(option) => option.name}
                      value={selectedSalesman}
                      onChange={(_, newValue) => handleSalesmanChange(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Salesman"
                          variant="outlined"
                          fullWidth
                          error={!!errors.salesman_id}
                          helperText={errors.salesman_id}
                        />
                      )}
                      className="flex-1"
                    />
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => setIsSalesmanPanelOpen(true)}
                      className="min-w-[40px] h-[56px]"
                    >
                      <AddIcon />
                    </Button>
                  </div>

                  {/* Ship To */}
                  <TextField
                    name="ship_to"
                    label="Ship To (Optional)"
                    value={formData.ship_to}
                    onChange={handleInputChange}
                    variant="outlined"
                    fullWidth
                  />
                </div>

                {/* Final Price Display */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 col-span-1 md:col-span-2 lg:col-span-3">
                  <div className="flex justify-between items-center">
                    <div className="text-gray-700">Final Price:</div>
                    <div className="text-xl font-semibold text-green-600">
                      {formatCurrency(calculateFinalPrice())}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formData.discount_type !== "NONE" && (
                      <>
                        MRP: {formatCurrency(formData.mrp)} - Discount: {
                          formData.discount_type === "PERCENTAGE" 
                            ? `${formData.discount_value}%` 
                            : formatCurrency(formData.discount_value)
                        }
                      </>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-6 flex justify-end col-span-1 md:col-span-2 lg:col-span-3">
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-blue-500 to-red-500 hover:from-blue-600 hover:to-red-600 text-white px-6 py-3 rounded-md shadow-md transition-all duration-200"
                  >
                    {isSubmitting ? "Creating..." : "Create Sale"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Sidepanels for adding new entities */}
      <Sidepanel
        isOpen={isCustomerPanelOpen}
        onClose={() => setIsCustomerPanelOpen(false)}
      >
        <AddCustomer
          onCustomerAdded={handleCustomerAdded}
          onClose={() => setIsCustomerPanelOpen(false)}
        />
      </Sidepanel>

      <Sidepanel
        isOpen={isProductPanelOpen}
        onClose={() => setIsProductPanelOpen(false)}
      >
        <AddProduct
          onProductAdded={handleProductAdded}
          onClose={() => setIsProductPanelOpen(false)}
        />
      </Sidepanel>

      <Sidepanel
        isOpen={isSalesmanPanelOpen}
        onClose={() => setIsSalesmanPanelOpen(false)}
      >
        <AddSalesman
          onSalesmanAdded={handleSalesmanAdded}
          onClose={() => setIsSalesmanPanelOpen(false)}
        />
      </Sidepanel>

      {/* Snackbar for notifications */}
      <Snackbar
        open={isOpen}
        message={message}
        type={type}
        onClose={hideSnackbar}
      />
    </div>
  );
} 