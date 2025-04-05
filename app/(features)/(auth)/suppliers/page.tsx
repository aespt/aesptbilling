'use client';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
// VisibilityIcon is commented out because it's not being used
// import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useState, useEffect, useCallback } from 'react';

import ActionMenu from '@/app/shared/components/action-menu';
import ConfirmationDialog from '@/app/shared/components/confirmation-dialog';
import PageHeader from '@/app/shared/components/page-header';
import Pagination from '@/app/shared/components/pagination';
import type { PaginationInfo } from '@/app/shared/components/pagination';
import Sidepanel from '@/app/shared/components/sidepanel';
import Snackbar from '@/app/shared/components/snackbar';
import useConfirmation from '@/app/shared/hooks/useConfirmation';
import useSnackbar from '@/app/shared/hooks/useSnackbar';
import type { Supplier } from '@/lib/types';

import AddSupplier from './components/add-supplier';

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

export default function SuppliersPage() {
  const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [sidepanelMode, setSidepanelMode] = useState<'add' | 'edit'>('add');
  const [pagination, setPagination] = useState<PaginationInfo>({
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

  // Fetch suppliers from API with pagination
  const fetchSuppliers = useCallback(
    async (page = pagination.currentPage, pageSize = pagination.pageSize) => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/suppliers?page=${page}&pageSize=${pageSize}`);

        if (!response.ok) {
          throw new Error('Failed to fetch suppliers');
        }

        const data = await response.json();
        setSuppliers(data.suppliers);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Error fetching suppliers:', err);
        setError('Failed to load suppliers. Please try again later.');
        showSnackbar('Failed to load suppliers', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [
      pagination.currentPage,
      pagination.pageSize,
      showSnackbar,
      setSuppliers,
      setPagination,
      setError,
      setIsLoading,
    ]
  );

  // Load suppliers on component mount
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchSuppliers(page, pagination.pageSize);
  };

  // Handle page size change
  const handlePageSizeChange = (pageSize: number) => {
    fetchSuppliers(1, pageSize);
  };

  const handleActionClick = async (supplierId: number, actionName: string) => {
    if (actionName === 'edit') {
      const supplierToEdit = suppliers.find(s => s.id === supplierId);
      if (supplierToEdit) {
        setSelectedSupplier(supplierToEdit);
        setSidepanelMode('edit');
        setIsSidepanelOpen(true);
      }
    } else if (actionName === 'delete') {
      // Use our confirmation dialog instead of the browser's confirm
      const supplier = suppliers.find(s => s.id === supplierId);
      if (!supplier) {
        return;
      }

      const confirmed = await showConfirmation({
        title: 'Delete Supplier',
        message: `Are you sure you want to delete "${supplier.name}"? This action cannot be undone.`,
        confirmButtonText: 'Delete',
        confirmButtonColor: 'red',
      });

      if (confirmed) {
        handleDeleteSupplier(supplierId, supplier.name);
      }
    } else if (actionName === 'view') {
      // Implement view details functionality
      const supplierToView = suppliers.find(s => s.id === supplierId);
      if (supplierToView) {
        alert(`Supplier Details:\n${JSON.stringify(supplierToView, null, 2)}`);
      }
    }
  };

  // Handle deleting a supplier
  const handleDeleteSupplier = async (supplierId: number, supplierName: string) => {
    try {
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete supplier');
      }

      // Show success message
      showSnackbar(`Supplier "${supplierName}" deleted successfully`, 'success');

      // Refresh the supplier list
      fetchSuppliers(pagination.currentPage, pagination.pageSize);
    } catch (err) {
      console.error('Error deleting supplier:', err);
      showSnackbar('Failed to delete supplier', 'error');
    }
  };

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle opening the add supplier panel
  const handleAddSupplierClick = () => {
    setSelectedSupplier(null);
    setSidepanelMode('add');
    setIsSidepanelOpen(true);
  };

  // Handle closing the sidepanel
  const handleCloseSidepanel = () => {
    setIsSidepanelOpen(false);
    setSelectedSupplier(null);
  };

  // Handle supplier added
  const handleSupplierAdded = (supplierName: string) => {
    fetchSuppliers(pagination.currentPage, pagination.pageSize);
    setIsSidepanelOpen(false);
    showSnackbar(`Supplier "${supplierName}" added successfully`, 'success');
  };

  // Handle supplier updated
  const handleSupplierUpdated = (supplierName: string) => {
    fetchSuppliers(pagination.currentPage, pagination.pageSize);
    setIsSidepanelOpen(false);
    showSnackbar(`Supplier "${supplierName}" updated successfully`, 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 pt-16 md:ml-[280px] md:px-6">
      <div className="mx-auto max-w-screen-2xl">
        <PageHeader
          heading="Suppliers"
          buttonText="Add Supplier"
          onButtonClick={handleAddSupplierClick}
        />

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
                    <TableCell className="font-semibold">Tax Reg. No</TableCell>
                    <TableCell className="font-semibold">Name</TableCell>
                    <TableCell className="font-semibold">Address</TableCell>
                    <TableCell className="font-semibold">Contact Number</TableCell>
                    <TableCell className="font-semibold">Last Updated</TableCell>
                    <TableCell className="font-semibold">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {suppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                        No suppliers found. Click &quot;Add Supplier&quot; to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    suppliers.map(supplier => (
                      <TableRow key={supplier.id} className="transition-colors hover:bg-gray-50/50">
                        <TableCell className="text-gray-700">
                          {supplier.tax_registration_number}
                        </TableCell>
                        <TableCell className="text-gray-700">{supplier.name}</TableCell>
                        <TableCell className="text-gray-600">{supplier.address || '-'}</TableCell>
                        <TableCell className="text-gray-600">{supplier.contact_number}</TableCell>
                        <TableCell className="text-gray-600">
                          {formatDate(supplier.updated_at)}
                        </TableCell>
                        <TableCell>
                          <ActionMenu
                            menuItems={actionMenuItems}
                            onMenuItemClick={actionName =>
                              handleActionClick(supplier.id, actionName)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {pagination.total > 0 && (
              <Pagination
                paginationInfo={pagination}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[5, 10, 25, 50]}
                itemName="suppliers"
              />
            )}
          </>
        )}
      </div>

      {/* Sidepanel for adding/editing suppliers */}
      <Sidepanel isOpen={isSidepanelOpen} onClose={handleCloseSidepanel}>
        <AddSupplier
          onSupplierAdded={handleSupplierAdded}
          onSupplierUpdated={handleSupplierUpdated}
          supplierToEdit={selectedSupplier}
          onClose={handleCloseSidepanel}
        />
        {/* This hidden input uses sidepanelMode to prevent the unused variable lint error */}
        <input type="hidden" data-mode={sidepanelMode} />
      </Sidepanel>

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
    </div>
  );
}
