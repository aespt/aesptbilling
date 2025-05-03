'use client';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Autocomplete,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

import type { FormErrors, PurchaseItem } from '@/lib/types';

interface Product {
  id: number;
  partNo: string;
  name: string;
  description: string;
  price: number;
  mrp: number;
}

interface PurchaseEntryItemsProps {
  purchaseItems: PurchaseItem[];
  setPurchaseItems: (items: PurchaseItem[]) => void;
  errors: FormErrors;
  setErrors: (errors: FormErrors) => void;
}

export default function PurchaseEntryItems({
  purchaseItems,
  setPurchaseItems,
  errors,
  setErrors,
}: PurchaseEntryItemsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Add an empty item to the list
  const handleAddItem = () => {
    setPurchaseItems([
      ...purchaseItems,
      {
        id: Date.now().toString(),
        product_id: null,
        part_no: '',
        qty: 1,
        rate: 0,
        total: 0,
      },
    ]);

    // Clear items error if it exists
    if (errors.items) {
      setErrors({
        ...errors,
        items: '',
      });
    }
  };

  // Remove an item from the list
  const handleRemoveItem = (id: string) => {
    // Keep at least one item
    if (purchaseItems.length <= 1) {
      return;
    }

    setPurchaseItems(purchaseItems.filter(item => item.id !== id));
  };

  // Handle product selection
  const handleProductChange = (item: PurchaseItem, selectedProduct: Product | null) => {
    // Update the item with the selected product details
    const updatedItems = purchaseItems.map(existingItem => {
      if (existingItem.id === item.id) {
        const price =
          typeof selectedProduct?.price === 'string'
            ? parseFloat(selectedProduct.price)
            : selectedProduct?.price || 0;

        return {
          ...existingItem,
          product_id: selectedProduct?.id || null,
          part_no: selectedProduct?.partNo || '',
          rate: price,
          total: price * existingItem.qty,
        };
      }
      return existingItem;
    });

    setPurchaseItems(updatedItems);

    // Clear errors if all items now have products
    if (errors.items && updatedItems.every(item => item.product_id)) {
      setErrors({
        ...errors,
        items: '',
      });
    }
  };

  // Handle quantity change
  const handleQtyChange = (itemId: string, newQty: number) => {
    // Ensure quantity is at least 1
    const qty = Math.max(1, newQty);

    const updatedItems = purchaseItems.map(existingItem => {
      if (existingItem.id === itemId) {
        return {
          ...existingItem,
          qty,
          total: existingItem.rate * qty,
        };
      }
      return existingItem;
    });

    setPurchaseItems(updatedItems);
  };

  // Handle rate change
  const handleRateChange = (itemId: string, newRate: number) => {
    // Ensure rate is at least 0
    const rate = Math.max(0, newRate);

    const updatedItems = purchaseItems.map(existingItem => {
      if (existingItem.id === itemId) {
        return {
          ...existingItem,
          rate,
          total: existingItem.qty * rate,
        };
      }
      return existingItem;
    });

    setPurchaseItems(updatedItems);
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

  return (
    <Paper elevation={0} className="mb-6 overflow-hidden border border-gray-200 shadow-lg">
      <Box className="border-b border-gray-200 bg-blue-50 px-6 py-4">
        <Typography variant="subtitle1" className="font-medium text-gray-700">
          Purchase Entry Items
        </Typography>
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
        {purchaseItems.map(item => (
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
                <Autocomplete
                  options={products}
                  getOptionLabel={option => (option ? `${option.partNo} - ${option.name}` : '')}
                  value={products.find(p => p.id === item.product_id) || null}
                  onChange={(_, newValue) => handleProductChange(item, newValue)}
                  renderInput={params => (
                    <TextField
                      {...params}
                      placeholder="Select product"
                      variant="outlined"
                      size="small"
                      error={!!errors.items}
                      helperText={errors.items}
                      fullWidth
                    />
                  )}
                  disabled={isLoading}
                  size="small"
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  className="w-full"
                />
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
                  {purchaseItems.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveItem(item.id)}
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
        {purchaseItems.length > 0 && (
          <Box className="flex justify-center border-t border-gray-100 py-3">
            <Button
              variant="text"
              startIcon={<AddIcon />}
              onClick={handleAddItem}
              size="small"
              className="text-blue-600 hover:bg-blue-50"
            >
              Add Item
            </Button>
          </Box>
        )}
      </Box>

      {/* Empty state */}
      {purchaseItems.length === 0 && (
        <Box className="p-8 text-center">
          <Typography variant="body2" className="mb-4 text-gray-500">
            No items added to this purchase entry yet
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddItem} size="small">
            Add First Item
          </Button>
        </Box>
      )}
    </Paper>
  );
}
