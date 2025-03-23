"use client";

import { useState, useEffect } from "react";
import { 
  TextField, 
  IconButton,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Autocomplete
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import useSnackbar from "@/app/shared/hooks/useSnackbar";
import Sidepanel from "@/app/shared/components/sidepanel";

interface Product {
  id: number;
  part_no: string;
  name: string;
  mrp: number;
}

interface InvoiceItem {
  id: string;
  product_id: number | null;
  part_no: string;
  qty: number;
  rate: number;
  total: number;
}

interface SalesInvoiceItemsProps {
  invoiceItems: InvoiceItem[];
  setInvoiceItems: (items: InvoiceItem[]) => void;
  errors: any;
  setErrors: (errors: any) => void;
}

export default function SalesInvoiceItems({ 
  invoiceItems, 
  setInvoiceItems, 
  errors,
  setErrors
}: SalesInvoiceItemsProps) {
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductPanelOpen, setIsProductPanelOpen] = useState(false);

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // This would be replaced with your actual API
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        // For now, use mock data
        setProducts([
          { id: 1, part_no: 'P001', name: 'Product 1', mrp: 100 },
          { id: 2, part_no: 'P002', name: 'Product 2', mrp: 200 },
          { id: 3, part_no: 'P003', name: 'Product 3', mrp: 300 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Add new invoice item
  const addInvoiceItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      product_id: null,
      part_no: "",
      qty: 1,
      rate: 0,
      total: 0
    };

    setInvoiceItems([...invoiceItems, newItem]);
    
    // Clear items error if it exists
    if (errors.items) {
      setErrors({
        ...errors,
        items: "",
      });
    }
  };

  // Handle product selection for an item
  const handleProductChange = (itemId: string, product: Product | null) => {
    const updatedItems = invoiceItems.map(item => {
      if (item.id === itemId) {
        const rate = product?.mrp || 0;
        return {
          ...item,
          product_id: product?.id || null,
          part_no: product?.part_no || "",
          rate: rate,
          total: item.qty * rate
        };
      }
      return item;
    });
    
    setInvoiceItems(updatedItems);
    
    // Clear items error if it exists
    if (errors.items) {
      setErrors({
        ...errors,
        items: "",
      });
    }
  };

  // Handle quantity change for an item
  const handleQtyChange = (itemId: string, qty: number) => {
    if (qty < 1) qty = 1; // Ensure quantity is at least 1
    
    const updatedItems = invoiceItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          qty: qty,
          total: qty * item.rate
        };
      }
      return item;
    });
    
    setInvoiceItems(updatedItems);
  };

  // Handle direct rate change (manual override)
  const handleRateChange = (itemId: string, rate: number) => {
    if (rate < 0) rate = 0; // Ensure rate is non-negative
    
    const updatedItems = invoiceItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          rate: rate,
          total: item.qty * rate
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
        items: "At least one item is required",
      });
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' AED';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h6" className="text-gray-800 font-medium">Invoice Items</Typography>
      </div>
      
      {errors.items && (
        <Typography color="error" className="mb-2">{errors.items}</Typography>
      )}
      
      <TableContainer component={Paper} className="mb-4">
        <Table>
          <TableHead className="bg-gray-50">
            <TableRow>
              <TableCell width="35%">Part Number</TableCell>
              <TableCell width="15%" align="center">Quantity</TableCell>
              <TableCell width="20%" align="right">Rate</TableCell>
              <TableCell width="20%" align="right">Total</TableCell>
              <TableCell width="10%" align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoiceItems.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Autocomplete
                    options={products}
                    getOptionLabel={(option) => `${option.part_no} - ${option.name}`}
                    value={products.find(p => p.id === item.product_id) || null}
                    onChange={(_, newValue) => handleProductChange(item.id, newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select product"
                        variant="outlined"
                        size="small"
                        fullWidth
                      />
                    )}
                    disabled={isLoading}
                  />
                </TableCell>
                <TableCell align="center">
                  <TextField
                    type="number"
                    value={item.qty}
                    onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value || "1"))}
                    variant="outlined"
                    size="small"
                    inputProps={{ min: 1, style: { textAlign: 'center' } }}
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    type="number"
                    value={item.rate}
                    onChange={(e) => handleRateChange(item.id, parseFloat(e.target.value || "0"))}
                    variant="outlined"
                    size="small"
                    inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right' } }}
                  />
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(item.total)}
                </TableCell>
                <TableCell align="center">
                  {invoiceItems.length > 1 && (
                    <IconButton 
                      size="small" 
                      onClick={() => removeInvoiceItem(item.id)}
                      className="text-red-500"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <div className="flex justify-end">
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addInvoiceItem}
          className="mt-2"
        >
          Add Item
        </Button>
      </div>
    </div>
  );
} 