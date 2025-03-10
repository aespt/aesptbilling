"use client";

import { useState, useEffect } from "react";
import Sidepanel from "@/app/shared/components/sidepanel";
import PageHeader from "@/app/shared/components/page-header";
import ActionMenu from "@/app/shared/components/action-menu";
import AddSalesman from "./components/add-salesman";
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
import { Salesman } from "@/lib/types";

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
];

export default function SalesmenPage() {
  const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSalesman, setSelectedSalesman] = useState<Salesman | null>(null);
  
  // Custom hooks for confirmation dialog and snackbar
  const { 
    isConfirmationOpen, 
    confirmationMessage, 
    showConfirmation, 
    handleConfirm, 
    handleCancel 
  } = useConfirmation();
  
  const { 
    isOpen: isSnackbarOpen, 
    message: snackbarMessage, 
    type: snackbarType,
    showSnackbar,
    hideSnackbar
  } = useSnackbar();

  // Fetch salesmen data
  const fetchSalesmen = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/salesmen');
      
      if (!response.ok) {
        throw new Error('Failed to fetch salesmen');
      }
      
      const data = await response.json();
      setSalesmen(data.salesmen);
    } catch (error: any) {
      console.error('Error fetching salesmen:', error);
      setError(error.message || 'An error occurred while fetching salesmen');
    } finally {
      setIsLoading(false);
    }
  };

  // Load salesmen on component mount
  useEffect(() => {
    fetchSalesmen();
  }, []);

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
        title: "Confirm Deletion",
        message: `Are you sure you want to delete ${salesman.name}?`
      });
    }
  };

  // Handle salesman deletion
  const handleDeleteSalesman = async () => {
    if (!selectedSalesman) return;
    
    try {
      const response = await fetch(`/api/salesmen/${selectedSalesman.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete salesman');
      }
      
      // Refresh the salesmen list
      fetchSalesmen();
      
      // Show success message
      showSnackbar(`${selectedSalesman.name} has been deleted successfully`, 'success');
    } catch (error: any) {
      console.error('Error deleting salesman:', error);
      showSnackbar(error.message || 'Failed to delete salesman', 'error');
    } finally {
      handleCancel();
      setSelectedSalesman(null);
    }
  };

  // Handle salesman added event
  const handleSalesmanAdded = (salesmanName: string) => {
    fetchSalesmen();
    showSnackbar(`${salesmanName} has been added successfully`, 'success');
  };

  // Handle salesman updated event
  const handleSalesmanUpdated = (salesmanName: string) => {
    fetchSalesmen();
    showSnackbar(`${salesmanName} has been updated successfully`, 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50 md:ml-[280px] pt-16 px-4 md:px-6 py-8">
      <div className="max-w-screen-2xl mx-auto">
        <PageHeader 
          heading="Salesmen" 
          buttonText="Add Salesman"
          onButtonClick={handleAddSalesman}
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
                  <TableCell className="font-semibold">Name</TableCell>
                  <TableCell className="font-semibold">Contact Number</TableCell>
                  <TableCell className="font-semibold">Created At</TableCell>
                  <TableCell className="font-semibold">Last Updated</TableCell>
                  <TableCell className="font-semibold">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salesmen.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No salesmen found. Click "Add Salesman" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  salesmen.map((salesman) => (
                    <TableRow
                      key={salesman.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <TableCell className="text-gray-700">{salesman.name}</TableCell>
                      <TableCell className="text-gray-600">{salesman.contact_number}</TableCell>
                      <TableCell className="text-gray-600">{formatDate(salesman.created_at)}</TableCell>
                      <TableCell className="text-gray-600">{formatDate(salesman.updated_at)}</TableCell>
                      <TableCell>
                        <ActionMenu 
                          menuItems={actionMenuItems} 
                          onMenuItemClick={(action) => handleActionSelect(action, salesman)} 
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {/* Sidepanel for adding/editing salesmen */}
        <Sidepanel
          isOpen={isSidepanelOpen}
          onClose={() => setIsSidepanelOpen(false)}
        >
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
