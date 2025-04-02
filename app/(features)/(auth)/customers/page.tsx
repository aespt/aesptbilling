"use client";

import { useState, useEffect } from "react";
import Sidepanel from "@/app/shared/components/sidepanel";
import PageHeader from "@/app/shared/components/page-header";
import ActionMenu from "@/app/shared/components/action-menu";
import AddCustomer from "./components/add-customer";
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
import { Customer } from "@/lib/types";
import Pagination, { PaginationInfo } from "@/app/shared/components/pagination";

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

export default function CustomersPage() {
  const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
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
    handleCancel
  } = useConfirmation();
  
  // Use our custom snackbar hook
  const { isOpen, message, type, showSnackbar, hideSnackbar } = useSnackbar();

  // Fetch customers from API with pagination
  const fetchCustomers = async (page = pagination.currentPage, pageSize = pagination.pageSize) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/customers?page=${page}&pageSize=${pageSize}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      
      const data = await response.json();
      setCustomers(data.customers);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Please try again later.');
      showSnackbar('Failed to load customers', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchCustomers(page, pagination.pageSize);
  };

  // Handle page size change
  const handlePageSizeChange = (pageSize: number) => {
    fetchCustomers(1, pageSize);
  };

  const handleActionClick = async (customerId: number, actionName: string) => {
    console.log(`Action ${actionName} clicked for customer ${customerId}`);
    
    if (actionName === 'edit') {
      const customerToEdit = customers.find(c => c.id === customerId);
      if (customerToEdit) {
        setSelectedCustomer(customerToEdit);
        setSidepanelMode('edit');
        setIsSidepanelOpen(true);
      }
    } else if (actionName === 'delete') {
      // Use our confirmation dialog instead of the browser's confirm
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return;
      
      const confirmed = await showConfirmation({
        title: 'Delete Customer',
        message: `Are you sure you want to delete "${customer.name}"? This action cannot be undone.`,
        confirmButtonText: 'Delete',
        confirmButtonColor: 'red'
      });
      
      if (confirmed) {
        handleDeleteCustomer(customerId, customer.name);
      }
    } else if (actionName === 'view') {
      // Implement view details functionality
      const customerToView = customers.find(c => c.id === customerId);
      if (customerToView) {
        alert(`Customer Details:\n${JSON.stringify(customerToView, null, 2)}`);
      }
    }
  };

  // Handle deleting a customer
  const handleDeleteCustomer = async (customerId: number, customerName: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }
      
      // Show success message
      showSnackbar(`Customer "${customerName}" deleted successfully`, 'success');
      
      // Refresh the customer list
      fetchCustomers(pagination.currentPage, pagination.pageSize);
    } catch (err) {
      console.error('Error deleting customer:', err);
      showSnackbar('Failed to delete customer', 'error');
    }
  };

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle opening the add customer panel
  const handleAddCustomerClick = () => {
    setSelectedCustomer(null);
    setSidepanelMode('add');
    setIsSidepanelOpen(true);
  };

  // Handle closing the sidepanel
  const handleCloseSidepanel = () => {
    setIsSidepanelOpen(false);
    setSelectedCustomer(null);
  };

  // Handle customer added
  const handleCustomerAdded = (customerName: string) => {
    fetchCustomers(pagination.currentPage, pagination.pageSize);
    setIsSidepanelOpen(false);
    showSnackbar(`Customer "${customerName}" added successfully`, 'success');
  };

  // Handle customer updated
  const handleCustomerUpdated = (customerName: string) => {
    fetchCustomers(pagination.currentPage, pagination.pageSize);
    setIsSidepanelOpen(false);
    showSnackbar(`Customer "${customerName}" updated successfully`, 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50 md:ml-[280px] pt-16 px-4 md:px-6 py-8">
      <div className="max-w-screen-2xl mx-auto">
        <PageHeader
          heading="Customers"
          buttonText="Add Customer"
          onButtonClick={handleAddCustomerClick}
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
          <>
            <TableContainer
              component={Paper}
              className="rounded-lg overflow-hidden border border-gray-100"
              elevation={0}
            >
              <Table className="border border-gray-100">
                <TableHead>
                  <TableRow className="bg-gray-100">
                    <TableCell className="font-semibold">Name</TableCell>
                    <TableCell className="font-semibold">Email</TableCell>
                    <TableCell className="font-semibold">Phone</TableCell>
                    <TableCell className="font-semibold">Address</TableCell>
                    <TableCell className="font-semibold">Last Updated</TableCell>
                    <TableCell className="font-semibold">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No customers found. Click "Add Customer" to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((customer) => (
                      <TableRow
                        key={customer.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <TableCell className="text-gray-700">{customer.name}</TableCell>
                        <TableCell className="text-gray-700">{customer.email}</TableCell>
                        <TableCell className="text-gray-600">{customer.phone || '-'}</TableCell>
                        <TableCell className="text-gray-600">{customer.address || '-'}</TableCell>
                        <TableCell className="text-gray-600">{formatDate(customer.updated_at)}</TableCell>
                        <TableCell>
                          <ActionMenu 
                            menuItems={actionMenuItems} 
                            onMenuItemClick={(actionName) => handleActionClick(customer.id, actionName)}
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
                itemName="customers"
              />
            )}
          </>
        )}
      </div>

      {/* Sidepanel for adding/editing customers */}
      <Sidepanel
        isOpen={isSidepanelOpen}
        onClose={handleCloseSidepanel}
      >
        <AddCustomer
          onCustomerAdded={handleCustomerAdded}
          onCustomerUpdated={handleCustomerUpdated}
          customerToEdit={selectedCustomer}
          onClose={handleCloseSidepanel}
        />
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
      <Snackbar
        open={isOpen}
        message={message}
        type={type}
        onClose={hideSnackbar}
      />
    </div>
  );
}
