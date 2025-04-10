'use client';

import { useState, useEffect } from 'react';
import { 
  Box,
  TextField,
  Typography,
  Button,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import { FiX } from 'react-icons/fi';

// UI representation of bank details
interface BankDetails {
  id: number;
  name: string;
  details: string;
  isPrimary: boolean;
}

// API representation of bank details
interface ApiBankDetails {
  id?: number;
  name: string;
  details: string;
  is_primary: boolean;
  created_by?: string;
  updated_by?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Define props interface for component
interface AddBankDetailsProps {
  onClose: () => void;
  onBankDetailsAdded?: (bankDetails: BankDetails) => void;
  onBankDetailsUpdated?: (bankDetails: BankDetails) => void;
  bankDetailsToEdit?: BankDetails | null;
}

export default function AddBankDetails({ 
  onClose, 
  onBankDetailsAdded, 
  onBankDetailsUpdated, 
  bankDetailsToEdit 
}: AddBankDetailsProps) {
  // Setup state for the form
  const [bankDetails, setBankDetails] = useState<ApiBankDetails>({
    name: '',
    details: '',
    is_primary: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // If bankDetailsToEdit is provided, use it to populate the form
  useEffect(() => {
    if (bankDetailsToEdit) {
      // Convert from UI format to API format
      setBankDetails({
        id: bankDetailsToEdit.id,
        name: bankDetailsToEdit.name,
        details: bankDetailsToEdit.details,
        is_primary: false, // Always set to false, let the settings page handle primary status
      });
    }
  }, [bankDetailsToEdit]);

  // Handle text input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBankDetails(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form input
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!bankDetails.name) newErrors.name = 'Bank name is required';
    if (!bankDetails.details) newErrors.details = 'Bank details are required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Convert API bank details to UI bank details
  const convertToUiBankDetails = (apiBankDetails: ApiBankDetails): BankDetails => {
    return {
      id: apiBankDetails.id || 0,
      name: apiBankDetails.name,
      details: apiBankDetails.details,
      isPrimary: apiBankDetails.is_primary
    };
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Ensure is_primary is always false when creating or updating
      const bankDetailsData = {
        ...bankDetails,
        is_primary: false
      };
      
      console.log('Sending bank details data:', bankDetailsData);
      
      if (bankDetailsToEdit) {
        // Update existing bank details
        const response = await fetch(`/api/bank-details/${bankDetails.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bankDetailsData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update bank details');
        }
        
        const result = await response.json();
        console.log('Update response:', result);
        
        // Call the callback with UI-formatted bank details
        onBankDetailsUpdated?.(convertToUiBankDetails(result.bankDetails));
      } else {
        // Create new bank details
        const response = await fetch('/api/bank-details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bankDetailsData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create bank details');
        }
        
        const result = await response.json();
        console.log('Create response:', result);
        
        // Call the callback with UI-formatted bank details
        onBankDetailsAdded?.(convertToUiBankDetails(result.bankDetails));
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting bank details:', error);
      setErrors({ submit: 'Failed to save bank details. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <Typography variant="h6" className="font-medium">
          {bankDetailsToEdit ? 'Edit Bank Details' : 'Add New Bank Details'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <FiX />
        </IconButton>
      </div>
      
      {/* Form */}
      <Box component="form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Bank Name */}
          <TextField
            label="Bank Name"
            name="name"
            value={bankDetails.name}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            size="small"
            required
            error={!!errors.name}
            helperText={errors.name}
          />
          
          {/* Bank Details */}
          <TextField
            label="Bank Details"
            name="details"
            value={bankDetails.details}
            onChange={handleChange}
            fullWidth
            multiline
            rows={6}
            variant="outlined"
            size="small"
            required
            error={!!errors.details}
            helperText={errors.details || 'Enter all bank details including account number, IFSC, branch, etc.'}
          />
          
          {/* General error message */}
          {errors.submit && (
            <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{errors.submit}</div>
          )}
        </div>
      </Box>
      
      {/* Footer with action buttons */}
      <div className="border-t p-4 flex justify-end space-x-3">
        <Button
          variant="outlined"
          onClick={onClose}
          className="border-gray-300 text-gray-700 flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          type="submit"
          onClick={handleSubmit}
          className="cursor-pointer flex-1 px-4 py-2.5 rounded-md overflow-hidden bg-gradient-to-r from-red-500 to-blue-500 text-white hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:hover:scale-100"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
              <span>Saving...</span>
            </div>
          ) : (
            bankDetailsToEdit ? 'Update Bank Details' : 'Add Bank Details'
          )}
        </Button>
      </div>
    </div>
  );
} 