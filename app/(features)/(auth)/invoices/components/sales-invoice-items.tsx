'use client';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState, useRef } from 'react';

import AddProduct from '@/app/(features)/(auth)/products/components/add-product';
import Sidepanel from '@/app/shared/components/sidepanel';
import type { FormErrors } from '@/lib/types';
import type { Product } from '@/lib/types/index';
import type { InvoiceItem, InvoiceFormData } from '@/lib/types/invoice';

interface SalesInvoiceItemsProps {
  invoiceItems: InvoiceItem[];
  setInvoiceItems: (items: InvoiceItem[]) => void;
  errors: FormErrors;
  setErrors: (errors: FormErrors) => void;
  formData: InvoiceFormData;
  setFormData: (formData: InvoiceFormData | ((prev: InvoiceFormData) => InvoiceFormData)) => void;
}

export default function SalesInvoiceItems({
  invoiceItems,
  setInvoiceItems,
  errors,
  setErrors,
  formData,
  setFormData,
}: SalesInvoiceItemsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductPanelOpen, setIsProductPanelOpen] = useState(false);
  const productsLoaded = useRef(false);

  // Fetch products only once
  useEffect(() => {
    const fetchProducts = async () => {
      // Skip if products already loaded
      if (productsLoaded.current && products.length > 0) {
        setIsLoading(false);
        return;
      }

      try {
        // This would be replaced with your actual API
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data.products || []);
        productsLoaded.current = true;
      } catch (error) {
        console.error('Error fetching products:', error);
        // For now, use mock data
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [products.length]);

  // Add new invoice item
  const addInvoiceItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      product_id: null,
      part_no: '',
      qty: 1,
      rate: 0,
      total: 0,
      price: 0,
      mrp: 0,
    };

    setInvoiceItems([...invoiceItems, newItem]);

    // Clear items error if it exists
    if (errors.items) {
      setErrors({
        ...errors,
        items: '',
      });
    }
  };

  // Handle product selection for an item
  const handleProductChange = (itemId: string, product: Product | null) => {
    const updatedItems = invoiceItems.map(item => {
      if (item.id === itemId) {
        // Get product details from the selection
        const productMrp = Number(product?.mrp) || 0;
        const productPrice = Number(product?.price) || 0;

        // Always use the product's values
        return {
          ...item,
          product_id: product?.id || null,
          part_no: product?.partNo || '',
          rate: productMrp, // MRP for display purposes (customer-facing rate)
          price: productPrice, // Actual cost price used for profit calculation and unit_price in database
          mrp: productMrp, // MRP stored separately for reference
          total: item.qty * productMrp, // Total is based on the displayed rate (MRP)
        };
      }
      return item;
    });

    setInvoiceItems(updatedItems);

    // Clear items error if it exists
    if (errors.items) {
      setErrors({
        ...errors,
        items: '',
      });
    }
  };

  // Handle quantity change for an item
  const handleQtyChange = (itemId: string, qty: number) => {
    if (qty < 1) {
      qty = 1; // Ensure quantity is at least 1
    }

    const updatedItems = invoiceItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          qty: qty,
          total: qty * item.rate, // Use rate (which is MRP) for total
        };
      }
      return item;
    });

    setInvoiceItems(updatedItems);
  };

  // Handle direct rate change (manual override)
  const handleRateChange = (itemId: string, rate: number) => {
    if (rate < 0) {
      rate = 0; // Ensure rate is non-negative
    }

    const updatedItems = invoiceItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          rate: rate, // Update the displayed rate (customer-facing)
          mrp: rate, // Update stored MRP to match the manually entered rate
          total: item.qty * rate,
          // Note: We don't update the price (cost price) when rate changes manually
          // This preserves the profit calculation
        };
      }
      return item;
    });

    setInvoiceItems(updatedItems);
  };

  // Remove invoice item
  const removeInvoiceItem = (id: string) => {
    const filteredItems = invoiceItems.filter(item => item.id !== id);
    setInvoiceItems(filteredItems);

    // If no items left, show error
    if (filteredItems.length === 0) {
      setErrors({
        ...errors,
        items: 'At least one item is required',
      });
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return (
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount) + ' AED'
    );
  };

  // Handle product added
  const handleProductAdded = (productName: string, newProduct?: Product) => {
    setIsProductPanelOpen(false);

    // Refresh products list
    if (newProduct) {
      // If we have the new product data, add it directly to state without fetching
      setProducts(prevProducts => [...prevProducts, newProduct]);

      // Find the first item without a product selected
      const emptyItem = invoiceItems.find(item => !item.product_id);
      if (emptyItem) {
        handleProductChange(emptyItem.id, newProduct);
      }
    } else {
      // Fallback to API call if we don't have the new product data
      fetch('/api/products')
        .then(response => response.json())
        .then(data => {
          setProducts(data.products || []);
          productsLoaded.current = true;

          // Find the newly added product and select it in the first empty item
          const addedProduct = data.products.find((p: Product) => p.name === productName);
          if (addedProduct) {
            // Find the first item without a product selected
            const emptyItem = invoiceItems.find(item => !item.product_id);
            if (emptyItem) {
              handleProductChange(emptyItem.id, addedProduct);
            }
          }
        })
        .catch(error => {
          console.error('Error refreshing products:', error);
        });
    }
  };

  return (
    <>
      <Paper elevation={0} className="mb-6 overflow-hidden border border-gray-200 shadow-lg">
        <Box className="border-b border-gray-200 bg-blue-50 px-6 py-4">
          <Box className="flex items-center justify-between">
            <Typography variant="subtitle1" className="font-medium text-gray-700">
              Invoice Items
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_used}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      is_used: e.target.checked,
                    })
                  }
                  size="small"
                />
              }
              label="Used Product"
              className="text-gray-700"
            />
          </Box>
        </Box>

        {errors.items && (
          <Box className="bg-red-50 px-6 py-2">
            <Typography color="error" variant="caption">
              {errors.items}
            </Typography>
          </Box>
        )}

        {/* Header row - desktop only */}
        <Box className="hidden border-b border-gray-200 bg-gray-50 px-6 py-3 md:flex">
          <Box width="40%" className="px-2">
            <Typography variant="caption" className="font-medium text-gray-600">
              Part Number
            </Typography>
          </Box>
          <Box width="15%" className="px-2 text-center">
            <Typography variant="caption" className="font-medium text-gray-600">
              Quantity
            </Typography>
          </Box>
          <Box width="20%" className="px-2 text-right">
            <Typography variant="caption" className="font-medium text-gray-600">
              Rate
            </Typography>
          </Box>
          <Box width="20%" className="px-2 text-right">
            <Typography variant="caption" className="font-medium text-gray-600">
              Total
            </Typography>
          </Box>
          <Box width="5%" className="px-2">
            <Typography variant="caption" className="font-medium text-gray-600">
              &nbsp;
            </Typography>
          </Box>
        </Box>

        {/* Item rows */}
        <Box className="max-h-[400px] overflow-y-auto">
          {invoiceItems.map(item => (
            <Box key={item.id} className="relative border-b border-gray-100">
              <Box className="flex flex-wrap items-center px-6 py-4 transition-colors hover:bg-gray-50 md:flex-nowrap">
                {/* Part Number */}
                <Box className="mb-3 w-full px-2 md:mb-0 md:w-2/5">
                  <Typography
                    variant="caption"
                    className="mb-1 block font-medium text-gray-600 md:hidden"
                  >
                    Part Number
                  </Typography>
                  <div className="flex items-center gap-2">
                    <Autocomplete
                      options={products}
                      getOptionLabel={option => (option ? `${option.partNo} - ${option.name}` : '')}
                      value={products.find(p => p.id === item.product_id) || null}
                      onChange={(_, newValue) => handleProductChange(item.id, newValue)}
                      renderInput={params => (
                        <TextField
                          {...params}
                          placeholder="Select product"
                          variant="outlined"
                          size="small"
                          fullWidth
                        />
                      )}
                      disabled={isLoading}
                      size="small"
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      className="grow"
                    />
                    <IconButton
                      onClick={() => setIsProductPanelOpen(true)}
                      className="border border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                      size="small"
                      title="Add New Product"
                      disabled={!!products.find(p => p.id === item.product_id)}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </div>
                </Box>

                {/* Quantity */}
                <Box className="w-1/3 px-2 md:w-[15%]">
                  <Typography
                    variant="caption"
                    className="mb-1 block font-medium text-gray-600 md:hidden"
                  >
                    Quantity
                  </Typography>
                  <TextField
                    type="number"
                    value={item.qty}
                    onChange={e => handleQtyChange(item.id, parseInt(e.target.value || '1'))}
                    variant="outlined"
                    size="small"
                    inputProps={{ min: 1 }}
                    fullWidth
                    sx={{
                      '& input': { textAlign: 'center' },
                    }}
                  />
                </Box>

                {/* Rate */}
                <Box className="w-1/3 px-2 md:w-1/5">
                  <Typography
                    variant="caption"
                    className="mb-1 block font-medium text-gray-600 md:hidden"
                  >
                    Rate
                  </Typography>
                  <TextField
                    type="number"
                    value={item.rate}
                    onChange={e => handleRateChange(item.id, parseFloat(e.target.value || '0'))}
                    variant="outlined"
                    size="small"
                    inputProps={{ min: 0, step: 0.01 }}
                    fullWidth
                    InputProps={{
                      endAdornment: <InputAdornment position="end">AED</InputAdornment>,
                    }}
                    sx={{
                      '& input': { textAlign: 'right' },
                    }}
                  />
                </Box>

                {/* Total */}
                <Box className="flex w-1/3 items-center justify-end px-2 md:w-1/5">
                  <Typography
                    variant="caption"
                    className="mb-1 block font-medium text-gray-600 md:hidden"
                  >
                    Total
                  </Typography>
                  <Box>
                    <Typography variant="body2" className="font-medium">
                      {formatCurrency(item.total)}
                    </Typography>
                  </Box>
                </Box>

                {/* Actions */}
                <Box className="mt-3 flex w-full justify-end px-2 md:mt-0 md:w-[5%] md:justify-center">
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 1,
                      width: '30px',
                      justifyContent: 'center',
                    }}
                  >
                    {invoiceItems.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={() => removeInvoiceItem(item.id)}
                        className="text-red-500 hover:bg-red-50"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          ))}

          {/* Add button centered below the last row */}
          {invoiceItems.length > 0 && (
            <Box className="flex justify-center border-t border-gray-100 py-3">
              <Button
                variant="text"
                startIcon={<AddIcon />}
                onClick={addInvoiceItem}
                size="small"
                className="text-blue-600 hover:bg-blue-50"
              >
                Add Item
              </Button>
            </Box>
          )}
        </Box>

        {/* Empty state */}
        {invoiceItems.length === 0 && (
          <Box className="p-8 text-center">
            <Typography variant="body2" className="mb-4 text-gray-500">
              No items added to this invoice yet
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addInvoiceItem}
              size="small"
            >
              Add First Item
            </Button>
          </Box>
        )}
      </Paper>

      {/* Sidepanel for adding new product */}
      <Sidepanel
        isOpen={isProductPanelOpen}
        onClose={() => setIsProductPanelOpen(false)}
        size="small"
      >
        <AddProduct
          onProductAdded={handleProductAdded}
          onClose={() => setIsProductPanelOpen(false)}
          useFormTag={false}
        />
      </Sidepanel>
    </>
  );
}
