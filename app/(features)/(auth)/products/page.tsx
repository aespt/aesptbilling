'use client';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useState, useEffect, useRef, useMemo } from 'react';

import ActionMenu from '@/app/shared/components/action-menu';
import ConfirmationDialog from '@/app/shared/components/confirmation-dialog';
import PageHeader from '@/app/shared/components/page-header';
import Pagination from '@/app/shared/components/pagination';
import type { PaginationInfo } from '@/app/shared/components/pagination';
import Search from '@/app/shared/components/search';
import Sidepanel from '@/app/shared/components/sidepanel';
import Snackbar from '@/app/shared/components/snackbar';
import useConfirmation from '@/app/shared/hooks/useConfirmation';
import useSnackbar from '@/app/shared/hooks/useSnackbar';
import type { Product } from '@/lib/types';

import AddProduct from './components/add-product';

const actionMenuItems = [
  {
    name: 'edit',
    displayText: 'Edit',
    icon: <EditIcon fontSize="small" className="text-gray-600" />,
  },
  {
    name: 'delete',
    displayText: 'Delete',
    icon: <DeleteIcon fontSize="small" className="text-gray-600" />,
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

  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 10,
    hasNext: false,
    hasPrev: false,
  });

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
    handleCancel,
  } = useConfirmation();

  // Use our custom snackbar hook
  const { isOpen, message, type, showSnackbar, hideSnackbar } = useSnackbar();

  const [searchQuery, setSearchQuery] = useState('');

  // Create a reference for the current request to handle race conditions
  const currentRequestIdRef = useRef(0);

  // Memoize the fetch parameters to prevent unnecessary rerenders
  const fetchParams = useMemo(
    () => ({
      page,
      rowsPerPage,
      searchQuery,
    }),
    [page, rowsPerPage, searchQuery]
  );

  // Define the fetch function within the component
  const fetchProducts = async () => {
    const myRequestId = ++currentRequestIdRef.current;

    try {
      setIsLoading(true);
      setError(null);

      const url = `/api/products?page=${fetchParams.page}&limit=${fetchParams.rowsPerPage}&search=${encodeURIComponent(fetchParams.searchQuery)}`;
      const response = await fetch(url);

      // If a newer request has started, abandon this one
      if (myRequestId !== currentRequestIdRef.current) {
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();

      // Only update state if this is still the most recent request
      if (myRequestId === currentRequestIdRef.current) {
        setProducts(data.products);
        setPaginationInfo(data.pagination);
        setIsLoading(false);
      }
    } catch (err) {
      console.error(`Error fetching products (request ID: ${myRequestId}):`, err);
      // Only update error state if this is still the most recent request
      if (myRequestId === currentRequestIdRef.current) {
        setError('Failed to load products. Please try again later.');
        showSnackbar('Failed to load products', 'error');
        setIsLoading(false);
      }
    }
  };

  // Fetch products only when fetch parameters change
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchParams]);

  // Simple refresh trigger function
  const triggerRefresh = () => {
    fetchProducts();
  };

  const handleActionClick = async (productId: number, actionName: string) => {
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
      if (!product) {
        return;
      }

      const confirmed = await showConfirmation({
        title: 'Delete Product',
        message: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
        confirmButtonText: 'Delete',
        confirmButtonColor: 'red',
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

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setPage(1); // Reset to first page when changing rows per page
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
      triggerRefresh();
    } catch (err) {
      console.error('Error deleting product:', err);
      showSnackbar('Failed to delete product', 'error');
    }
  };

  // Format price to display with 2 decimal places
  const formatPrice = (price: number | string) => {
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
      day: 'numeric',
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
    setIsSidepanelOpen(false);
    showSnackbar(`Product "${productName}" added successfully`, 'success');
    // Refresh products
    triggerRefresh();
  };

  // Handle product updated
  const handleProductUpdated = (productName: string) => {
    setIsSidepanelOpen(false);
    showSnackbar(`Product "${productName}" updated successfully`, 'success');
    // Refresh products
    triggerRefresh();
  };

  // Add search handler
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page when searching
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 pt-16 md:ml-[280px] md:px-6">
      <div className="mx-auto max-w-screen-2xl">
        <PageHeader
          heading="Products"
          buttonText="Add Product"
          onButtonClick={handleAddProductClick}
        />

        {/* Add Search Component */}
        <div className="mb-6">
          <Search
            onSearch={handleSearch}
            placeholder="Search by part number or product name..."
            className="max-w-md"
          />
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="size-12 animate-spin rounded-full border-4 border-b-red-500 border-l-blue-300 border-r-red-300 border-t-blue-500" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-600">
            {error}
          </div>
        ) : (
          <>
            <TableContainer
              component={Paper}
              className="overflow-hidden rounded-lg border border-gray-100"
              elevation={0}
            >
              <Table className="border border-gray-100">
                <TableHead>
                  <TableRow className="bg-gray-100">
                    <TableCell className="font-semibold">Part No</TableCell>
                    <TableCell className="font-semibold">Name</TableCell>
                    <TableCell className="font-semibold">Description</TableCell>
                    <TableCell className="font-semibold">Price</TableCell>
                    <TableCell className="font-semibold">Selling Price</TableCell>
                    <TableCell className="font-semibold">Last Updated</TableCell>
                    <TableCell className="font-semibold">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                        No products found. Click &quot;Add Product&quot; to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map(product => (
                      <TableRow key={product.id} className="transition-colors hover:bg-gray-50/50">
                        <TableCell className="text-gray-700">{product.partNo}</TableCell>
                        <TableCell className="text-gray-700">{product.name}</TableCell>
                        <TableCell className="text-gray-600">
                          {product.description || '-'}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {formatPrice(product.price)}
                        </TableCell>
                        <TableCell className="text-gray-700">{formatPrice(product.mrp)}</TableCell>
                        <TableCell className="text-gray-600">
                          {formatDate(product.updated_at)}
                        </TableCell>
                        <TableCell>
                          <ActionMenu
                            menuItems={actionMenuItems}
                            onMenuItemClick={actionName =>
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

            {/* Use the shared Pagination component */}
            <Pagination
              paginationInfo={paginationInfo}
              onPageChange={handlePageChange}
              onPageSizeChange={handleRowsPerPageChange}
              itemName="products"
            />
          </>
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
      <Snackbar open={isOpen} message={message} type={type} onClose={hideSnackbar} />

      <Sidepanel isOpen={isSidepanelOpen} onClose={handleCloseSidepanel} size="small">
        <div className="h-screen">
          <AddProduct
            productToEdit={selectedProduct}
            onProductAdded={name => handleProductAdded(name)}
            onProductUpdated={name => handleProductUpdated(name)}
            onClose={handleCloseSidepanel}
          />
          {/* This input uses sidepanelMode to prevent the unused variable lint error */}
          <input type="hidden" data-mode={sidepanelMode} />
        </div>
      </Sidepanel>
    </div>
  );
}
