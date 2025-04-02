"use client";

import { useState, useEffect } from "react";
import Sidepanel from "@/app/shared/components/sidepanel";
import PageHeader from "@/app/shared/components/page-header";
import ActionMenu from "@/app/shared/components/action-menu";
import AddProduct from "./components/add-product";
import ConfirmationDialog from "@/app/shared/components/confirmation-dialog";
import Snackbar from "@/app/shared/components/snackbar";
import useConfirmation from "@/app/shared/hooks/useConfirmation";
import useSnackbar from "@/app/shared/hooks/useSnackbar";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Product } from "@/lib/types";

const actionMenuItems = [
  { 
    name: "edit", 
    displayText: "Edit",
    icon: <EditIcon fontSize="small" className="text-gray-600" />
  },
  { 
    name: "delete", 
    displayText: "Delete",
    icon: <DeleteIcon fontSize="small" className="text-gray-600" />
  },
  // { 
  //   name: "view", 
  //   displayText: "View Details",
  //   icon: <VisibilityIcon fontSize="small" className="text-gray-600" />
  // },
];

export default function ProductsPage() {
  const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sidepanelMode, setSidepanelMode] = useState<'add' | 'edit'>('add');
  
  // Use our custom confirmation hook
  const {
    isConfirmationOpen,
    confirmationTitle,
    confirmationMessage,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor,
    showConfirmation,
    handleConfirm,
    handleCancel
  } = useConfirmation();
  
  // Use our custom snackbar hook
  const { isOpen, message, type, showSnackbar, hideSnackbar } = useSnackbar();

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data.products);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
      showSnackbar('Failed to load products', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const handleActionClick = async (productId: number, actionName: string) => {
    console.log(`Action ${actionName} clicked for product ${productId}`);
    
    if (actionName === 'edit') {
      const productToEdit = products.find(p => p.id === productId);
      if (productToEdit) {
        setSelectedProduct(productToEdit);
        setSidepanelMode('edit');
        setIsSidepanelOpen(true);
      }
    } else if (actionName === 'delete') {
      // Use our confirmation dialog instead of the browser's confirm
      const product = products.find(p => p.id === productId);
      if (!product) return;
      
      const confirmed = await showConfirmation({
        title: 'Delete Product',
        message: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
        confirmButtonText: 'Delete',
        confirmButtonColor: 'red'
      });
      
      if (confirmed) {
        handleDeleteProduct(productId, product.name);
      }
    } else if (actionName === 'view') {
      // Implement view details functionality
      const productToView = products.find(p => p.id === productId);
      if (productToView) {
        alert(`Product Details:\n${JSON.stringify(productToView, null, 2)}`);
      }
    }
  };

  // Handle deleting a product
  const handleDeleteProduct = async (productId: number, productName: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      
      // Show success message
      showSnackbar(`Product "${productName}" deleted successfully`, 'success');
      
      // Refresh the product list
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      showSnackbar('Failed to delete product', 'error');
    }
  };

  // Format price to display with 2 decimal places
  const formatPrice = (price: any) => {
    // Convert price to number if it's not already
    const numericPrice = typeof price === 'number' ? price : parseFloat(price);
    
    // Check if conversion was successful
    if (isNaN(numericPrice)) {
      return '0.00';
    }
    
    return `${numericPrice.toFixed(2)}`;
  };

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle opening the add product panel
  const handleAddProductClick = () => {
    setSelectedProduct(null);
    setSidepanelMode('add');
    setIsSidepanelOpen(true);
  };

  // Handle closing the sidepanel
  const handleCloseSidepanel = () => {
    setIsSidepanelOpen(false);
    setSelectedProduct(null);
  };

  // Handle product added
  const handleProductAdded = (productName: string) => {
    fetchProducts();
    setIsSidepanelOpen(false);
    showSnackbar(`Product "${productName}" added successfully`, 'success');
  };

  // Handle product updated
  const handleProductUpdated = (productName: string) => {
    fetchProducts();
    setIsSidepanelOpen(false);
    showSnackbar(`Product "${productName}" updated successfully`, 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50 md:ml-[280px] pt-16 px-4 md:px-6 py-8">
      <div className="max-w-screen-2xl mx-auto">
        <PageHeader
          heading="Products"
          buttonText="Add Product"
          onButtonClick={handleAddProductClick}
        />

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-b-red-500 border-l-blue-300 border-r-red-300 animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-center">
            {error}
          </div>
        ) : (
          <TableContainer
            component={Paper}
            className="shadow-md rounded-lg overflow-hidden border border-gray-100"
            elevation={0}
          >
            <Table className="border border-gray-100">
              <TableHead>
                <TableRow className="bg-gray-100">
                  <TableCell className="font-semibold">Part No</TableCell>
                  <TableCell className="font-semibold">Name</TableCell>
                  <TableCell className="font-semibold">Description</TableCell>
                  <TableCell className="font-semibold">Price</TableCell>
                  <TableCell className="font-semibold">MRP</TableCell>
                  <TableCell className="font-semibold">Last Updated</TableCell>
                  <TableCell className="font-semibold">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No products found. Click "Add Product" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow
                      key={product.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <TableCell className="text-gray-700">{product.partNo}</TableCell>
                      <TableCell className="text-gray-700">{product.name}</TableCell>
                      <TableCell className="text-gray-600">{product.description || '-'}</TableCell>
                      <TableCell className="text-gray-700">{formatPrice(product.price)}</TableCell>
                      <TableCell className="text-gray-700">{formatPrice(product.mrp)}</TableCell>
                      {/* <TableCell className="text-gray-600">{product.count || 0}</TableCell> */}
                      <TableCell className="text-gray-600">{formatDate(product.updated_at)}</TableCell>
                      <TableCell>
                        <ActionMenu
                          menuItems={actionMenuItems}
                          onMenuItemClick={(actionName) =>
                            handleActionClick(product.id, actionName)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmationOpen}
        title={confirmationTitle}
        message={confirmationMessage}
        confirmButtonText={confirmButtonText}
        cancelButtonText={cancelButtonText}
        confirmButtonColor={confirmButtonColor}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={isOpen}
        message={message}
        type={type}
        onClose={hideSnackbar}
      />

      <Sidepanel
        isOpen={isSidepanelOpen}
        onClose={handleCloseSidepanel}
        size="small"
      >
        <div className="h-screen">
          <AddProduct 
            productToEdit={selectedProduct}
            onProductAdded={(name) => handleProductAdded(name)}
            onProductUpdated={(name) => handleProductUpdated(name)}
            onClose={handleCloseSidepanel}
          />
        </div>
      </Sidepanel>
    </div>
  );
}
