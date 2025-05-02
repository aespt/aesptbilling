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
import { useState, useEffect, useCallback } from 'react';

import ActionMenu from '@/app/shared/components/action-menu';
import ConfirmationDialog from '@/app/shared/components/confirmation-dialog';
import PageHeader from '@/app/shared/components/page-header';
import Pagination, { type PaginationInfo } from '@/app/shared/components/pagination';
import Sidepanel from '@/app/shared/components/sidepanel';
import Snackbar from '@/app/shared/components/snackbar';
import useConfirmation from '@/app/shared/hooks/useConfirmation';
import useSnackbar from '@/app/shared/hooks/useSnackbar';
import type { Salesman } from '@/lib/types';

import AddSalesman from './components/add-salesman';

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
];

export default function SalesmenPage() {
  const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSalesman, setSelectedSalesman] = useState<Salesman | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 10,
    hasNext: false,
    hasPrev: false,
  });

  // Custom hooks for confirmation dialog and snackbar
  const { isConfirmationOpen, confirmationMessage, showConfirmation, handleCancel } =
    useConfirmation();

  const {
    isOpen: isSnackbarOpen,
    message: snackbarMessage,
    type: snackbarType,
    showSnackbar,
    hideSnackbar,
  } = useSnackbar();

  // Fetch salesmen data with pagination
  const fetchSalesmen = useCallback(
    async (page?: number, pageSize?: number) => {
      setIsLoading(true);
      setError(null);

      const currentPage = page ?? pagination.currentPage;
      const currentPageSize = pageSize ?? pagination.pageSize;

      try {
        const response = await fetch(
          `/api/salesmen?page=${currentPage}&pageSize=${currentPageSize}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch salesmen');
        }

        const data = await response.json();
        setSalesmen(data.salesmen);
        setPagination(data.pagination);
      } catch (error: unknown) {
        console.error('Error fetching salesmen:', error);
        setError(
          error instanceof Error ? error.message : 'An error occurred while fetching salesmen'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      pagination.currentPage,
      pagination.pageSize,
      setIsLoading,
      setError,
      setSalesmen,
      setPagination,
    ]
  );

  // Load salesmen on component mount
  useEffect(() => {
    fetchSalesmen();
  }, [fetchSalesmen]);

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchSalesmen(page, pagination.pageSize);
  };

  // Handle page size change
  const handlePageSizeChange = (pageSize: number) => {
    fetchSalesmen(1, pageSize);
  };

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle opening the sidepanel for adding a new salesman
  const handleAddSalesman = () => {
    setSelectedSalesman(null);
    setIsSidepanelOpen(true);
  };

  // Handle salesman action menu selection
  const handleActionSelect = (action: string, salesman: Salesman) => {
    if (action === 'edit') {
      setSelectedSalesman(salesman);
      setIsSidepanelOpen(true);
    } else if (action === 'delete') {
      setSelectedSalesman(salesman);
      showConfirmation({
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete ${salesman.name}?`,
      });
    }
  };

  // Handle salesman deletion
  const handleDeleteSalesman = async () => {
    if (!selectedSalesman) {
      return;
    }

    try {
      const response = await fetch(`/api/salesmen/${selectedSalesman.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete salesman');
      }

      // Refresh the salesmen list with current pagination
      fetchSalesmen(pagination.currentPage, pagination.pageSize);

      // Show success message
      showSnackbar(`${selectedSalesman.name} has been deleted successfully`, 'success');
    } catch (error: unknown) {
      console.error('Error deleting salesman:', error);
      showSnackbar(error instanceof Error ? error.message : 'Failed to delete salesman', 'error');
    } finally {
      handleCancel();
      setSelectedSalesman(null);
    }
  };

  // Handle salesman added event
  const handleSalesmanAdded = (salesmanName: string) => {
    fetchSalesmen(pagination.currentPage, pagination.pageSize);
    showSnackbar(`${salesmanName} has been added successfully`, 'success');
  };

  // Handle salesman updated event
  const handleSalesmanUpdated = (salesmanName: string) => {
    fetchSalesmen(pagination.currentPage, pagination.pageSize);
    showSnackbar(`${salesmanName} has been updated successfully`, 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 pt-16 md:ml-[280px] md:px-6">
      <div className="mx-auto max-w-screen-2xl">
        <PageHeader
          heading="Salesmen"
          buttonText="Add Salesman"
          onButtonClick={handleAddSalesman}
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
                    <TableCell className="font-semibold">Name</TableCell>
                    <TableCell className="font-semibold">Contact Number</TableCell>
                    <TableCell className="font-semibold">Email</TableCell>
                    <TableCell className="font-semibold">Created At</TableCell>
                    <TableCell className="font-semibold">Last Updated</TableCell>
                    <TableCell className="font-semibold">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salesmen.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                        No salesmen found. Click &quot;Add Salesman&quot; to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesmen.map(salesman => (
                      <TableRow key={salesman.id} className="transition-colors hover:bg-gray-50/50">
                        <TableCell className="text-gray-700">{salesman.name}</TableCell>
                        <TableCell className="text-gray-600">{salesman.contact_number}</TableCell>
                        <TableCell className="text-gray-600">{salesman.email || '-'}</TableCell>
                        <TableCell className="text-gray-600">
                          {formatDate(salesman.created_at)}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {formatDate(salesman.updated_at)}
                        </TableCell>
                        <TableCell>
                          <ActionMenu
                            menuItems={actionMenuItems}
                            onMenuItemClick={action => handleActionSelect(action, salesman)}
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
                itemName="salesmen"
              />
            )}
          </>
        )}

        {/* Sidepanel for adding/editing salesmen */}
        <Sidepanel isOpen={isSidepanelOpen} onClose={() => setIsSidepanelOpen(false)}>
          <AddSalesman
            onClose={() => setIsSidepanelOpen(false)}
            onSalesmanAdded={handleSalesmanAdded}
            onSalesmanUpdated={handleSalesmanUpdated}
            salesmanToEdit={selectedSalesman}
          />
        </Sidepanel>

        {/* Confirmation dialog for delete action */}
        <ConfirmationDialog
          isOpen={isConfirmationOpen}
          title="Confirm Deletion"
          message={confirmationMessage}
          onConfirm={handleDeleteSalesman}
          onCancel={handleCancel}
        />

        {/* Snackbar for notifications */}
        <Snackbar
          open={isSnackbarOpen}
          message={snackbarMessage}
          type={snackbarType}
          onClose={hideSnackbar}
        />
      </div>
    </div>
  );
}
