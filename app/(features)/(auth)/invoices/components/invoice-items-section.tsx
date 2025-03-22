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
  Box,
  CircularProgress,
  Autocomplete,
  Tooltip
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Sidepanel from "@/app/shared/components/sidepanel";
import AddProduct from "../../products/components/add-product";
import useSnackbar from "@/app/shared/hooks/useSnackbar";
import PrimaryButton from "@/app/shared/components/primary-button";

interface Product {
  id: number;
  name: string;
  partNo: string;
  description: string;
  price: number;
}

interface VatRate {
  id: number;
  vat_percentage: number;
  country: string;
  description: string;
}

interface InvoiceItem {
  id: string;
  no: number;
  product_id: number | null;
  part_no: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
  vat_percentage: number;
  vat_amount: number;
  total_amount: number;
}

interface InvoiceItemsSectionProps {
  invoiceItems: InvoiceItem[];
  setInvoiceItems: (items: InvoiceItem[]) => void;
  errors: any;
  setErrors: (errors: any) => void;
}

export default function InvoiceItemsSection({ 
  invoiceItems, 
  setInvoiceItems, 
  errors,
  setErrors
}: InvoiceItemsSectionProps) {
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [vatRates, setVatRates] = useState<VatRate[]>([]);
  const [defaultVatRate, setDefaultVatRate] = useState<number>(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductPanelOpen, setIsProductPanelOpen] = useState(false);
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Fetch products and VAT rates on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsResponse = await fetch('/api/products');
        if (!productsResponse.ok) throw new Error('Failed to fetch products');
        const productsData = await productsResponse.json();
        setProducts(productsData.products);

        // Fetch VAT rates
        const vatResponse = await fetch('/api/vat-rates');
        if (!vatResponse.ok) throw new Error('Failed to fetch VAT rates');
        const vatData = await vatResponse.json();
        setVatRates(vatData.vatRates);
        
        // Set default VAT rate (using the first one if available)
        if (vatData.vatRates && vatData.vatRates.length > 0) {
          setDefaultVatRate(Number(vatData.vatRates[0].vat_percentage));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        showSnackbar('Failed to load data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add new invoice item
  const addInvoiceItem = async () => {
    if (!selectedProduct) return;
    
    setIsAddingItem(true);

    try {
      // Always increment the number by 1 from the last item or start with 1
      const newItemNo = invoiceItems.length > 0 
        ? invoiceItems[invoiceItems.length - 1].no + 1 
        : 1;

      const newItem: InvoiceItem = {
        id: Date.now().toString(),
        no: newItemNo,
        product_id: selectedProduct.id,
        part_no: selectedProduct.partNo,
        description: selectedProduct.description || selectedProduct.name,
        qty: newItemQty,
        rate: selectedProduct.price,
        amount: selectedProduct.price * newItemQty,
        vat_percentage: defaultVatRate,
        vat_amount: (selectedProduct.price * newItemQty * defaultVatRate) / 100,
        total_amount: (selectedProduct.price * newItemQty) + ((selectedProduct.price * newItemQty * defaultVatRate) / 100),
      };

      setInvoiceItems([...invoiceItems, newItem]);
      setSelectedProduct(null);
      setNewItemQty(1);
      
      // Clear items error if it exists
      if (errors.items) {
        setErrors({
          ...errors,
          items: "",
        });
      }
      
      showSnackbar('Item added successfully', 'success');
    } catch (error) {
      console.error('Error adding item:', error);
      showSnackbar('Failed to add item', 'error');
    } finally {
      setIsAddingItem(false);
    }
  };

  // Update invoice item
  const updateInvoiceItem = (id: string, field: string, value: any) => {
    try {
      const updatedItems = invoiceItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Recalculate financial values
          if (field === 'qty' || field === 'rate' || field === 'vat_percentage') {
            updatedItem.amount = updatedItem.qty * updatedItem.rate;
            updatedItem.vat_amount = (updatedItem.amount * updatedItem.vat_percentage) / 100;
            updatedItem.total_amount = updatedItem.amount + updatedItem.vat_amount;
          }
          
          return updatedItem;
        }
        return item;
      });
      
      setInvoiceItems(updatedItems);
    } catch (error) {
      console.error('Error updating item:', error);
      showSnackbar('Failed to update item', 'error');
    }
  };

  // Remove invoice item
  const removeInvoiceItem = (id: string) => {
    try {
      // Remove the item
      const filteredItems = invoiceItems.filter(item => item.id !== id);
      
      // Renumber the remaining items
      const renumberedItems = filteredItems.map((item, index) => ({
        ...item,
        no: index + 1
      }));
      
      setInvoiceItems(renumberedItems);
      showSnackbar('Item removed successfully', 'success');
    } catch (error) {
      console.error('Error removing item:', error);
      showSnackbar('Failed to remove item', 'error');
    }
  };

  // Calculate invoice totals
  const calculateTotals = () => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
    const vatTotal = invoiceItems.reduce((sum, item) => sum + item.vat_amount, 0);
    const total = subtotal + vatTotal;
    
    return { subtotal, vatTotal, total };
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'AED',
    }).format(amount);
  };

  // Handle product added from sidepanel
  const handleProductAdded = (productName: string) => {
    setIsProductPanelOpen(false);
    
    // Refresh products list
    fetch('/api/products')
      .then(response => response.json())
      .then(data => {
        setProducts(data.products);
        
        // Find the newly added product
        const newProduct = data.products.find((p: Product) => p.name === productName);
        if (newProduct) {
          setSelectedProduct(newProduct);
          showSnackbar(`Product "${productName}" added and selected`, 'success');
        }
      })
      .catch(error => {
        console.error('Error refreshing products:', error);
        showSnackbar('Error refreshing products list', 'error');
      });
  };

  const { subtotal, vatTotal, total } = calculateTotals();

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h6" className="text-gray-800 font-medium">Invoice Items</Typography>
        </div>
        
        {errors.items && (
          <div className="text-red-500 mb-4 p-2 bg-red-50 border border-red-200 rounded">
            {errors.items}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <CircularProgress />
          </div>
        ) : (
          <TableContainer component={Paper} className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
            <Table size="small">
              <TableHead className="bg-gray-50">
                <TableRow>
                  <TableCell className="font-medium text-gray-700">No</TableCell>
                  <TableCell className="font-medium text-gray-700">Part No</TableCell>
                  <TableCell className="font-medium text-gray-700">Description</TableCell>
                  <TableCell align="right" className="font-medium text-gray-700">QTY</TableCell>
                  <TableCell align="right" className="font-medium text-gray-700">Rate</TableCell>
                  <TableCell align="right" className="font-medium text-gray-700">Amount</TableCell>
                  <TableCell align="right" className="font-medium text-gray-700">VAT %</TableCell>
                  <TableCell align="right" className="font-medium text-gray-700">VAT</TableCell>
                  <TableCell align="right" className="font-medium text-gray-700">Total Amount</TableCell>
                  <TableCell align="right" className="font-medium text-gray-700">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoiceItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="text-gray-700">{item.no}</TableCell>
                    <TableCell className="text-gray-700">{item.part_no}</TableCell>
                    <TableCell className="text-gray-700 max-w-[200px] truncate" title={item.description}>
                      {item.description}
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateInvoiceItem(item.id, 'qty', Number(e.target.value))}
                        size="small"
                        inputProps={{ min: 1 }}
                        className="w-16"
                      />
                    </TableCell>
                    <TableCell align="right" className="text-gray-700">{formatCurrency(item.rate)}</TableCell>
                    <TableCell align="right" className="text-gray-700">{formatCurrency(item.amount)}</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={item.vat_percentage}
                        onChange={(e) => updateInvoiceItem(item.id, 'vat_percentage', Number(e.target.value))}
                        size="small"
                        inputProps={{ min: 0, max: 100, step: 0.01 }}
                        className="w-16"
                      />
                    </TableCell>
                    <TableCell align="right" className="text-gray-700">{formatCurrency(item.vat_amount)}</TableCell>
                    <TableCell align="right" className="text-gray-700 font-medium">{formatCurrency(item.total_amount)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Remove item">
                        <IconButton 
                          onClick={() => removeInvoiceItem(item.id)} 
                          size="small" 
                          className="text-gray-600 hover:text-red-500 transition-colors"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        <Box className="flex flex-col items-end mb-4 bg-gray-50 p-4 rounded-md border border-gray-200">
          <Typography variant="body1" className="mb-1 text-gray-700">
            Subtotal: {formatCurrency(subtotal)}
          </Typography>
          <Typography variant="body1" className="mb-1 text-gray-700">
            VAT: {formatCurrency(vatTotal)}
          </Typography>
          <Typography variant="h6" className="font-bold text-gray-800">
            Total: {formatCurrency(total)}
          </Typography>
        </Box>
      </div>

    </>
  );
} 