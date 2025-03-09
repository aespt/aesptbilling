'use client';

import { TextField } from '@mui/material';
import { useState, useEffect } from 'react';
import { Supplier } from "@/lib/types";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Define the validation schema using Zod
const supplierFormSchema = z.object({
  taxRegistrationNumber: z.string().min(1, "Tax registration number is required"),
  name: z.string().min(2, "Supplier name must be at least 2 characters"),
  address: z.string().min(1, "Address is required"),
  contactNumber: z.string()
    .min(10, "Contact number must be at least 10 characters")
    .max(20, "Contact number must not exceed 20 characters")
});

// Infer the type from the schema
type SupplierFormData = z.infer<typeof supplierFormSchema>;

interface AddSupplierProps {
  onSupplierAdded?: (supplierName: string) => void;
  onSupplierUpdated?: (supplierName: string) => void;
  supplierToEdit?: Supplier | null;
  onClose: () => void;
}

export default function AddSupplier({ 
  onSupplierAdded, 
  onSupplierUpdated,
  supplierToEdit,
  onClose
}: AddSupplierProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditMode = !!supplierToEdit;

  // Initialize React Hook Form
  const { 
    control, 
    handleSubmit, 
    reset, 
    formState: { errors, isSubmitted } 
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      taxRegistrationNumber: '',
      name: '',
      address: '',
      contactNumber: ''
    },
    mode: 'onChange' // Validate on change for immediate feedback
  });

  // Load supplier data if in edit mode
  useEffect(() => {
    if (supplierToEdit) {
      reset({
        taxRegistrationNumber: supplierToEdit.tax_registration_number,
        name: supplierToEdit.name,
        address: supplierToEdit.address,
        contactNumber: supplierToEdit.contact_number
      });
    }
  }, [supplierToEdit, reset]);

  // Form submission handler
  const onSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true);
    setServerError(null);
    
    try {
      // Convert form data to match the API expectations
      const supplierData = {
        tax_registration_number: data.taxRegistrationNumber,
        name: data.name,
        address: data.address,
        contact_number: data.contactNumber
      };
      
      // If in edit mode, add the ID and use PUT method
      if (isEditMode && supplierToEdit) {
        const updateData = {
          id: supplierToEdit.id,
          ...supplierData
        };
        
        const response = await fetch('/api/suppliers', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update supplier');
        }
        
        // Call the callback function if provided
        if (onSupplierUpdated) {
          onSupplierUpdated(data.name);
        }
      } else {
        // Create new supplier
        const response = await fetch('/api/suppliers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(supplierData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create supplier');
        }
        
        // Call the callback function if provided
        if (onSupplierAdded) {
          onSupplierAdded(data.name);
        }
      }
      
      // Reset the form
      reset();
      
    } catch (error: any) {
      console.error('Error submitting supplier:', error);
      setServerError(error.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Component for displaying error messages
  const ErrorMessage = ({ message }: { message?: string }) => {
    if (!message) return null;
    return (
      <p className="mt-1 text-sm text-red-600">
        {message}
      </p>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col" noValidate>
      {/* Content wrapper */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-black/70">
            {isEditMode ? 'Edit Supplier' : 'Add Supplier'}
          </h1>
        </div>

        {/* Server error message */}
        {serverError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {serverError}
          </div>
        )}
        
        {/* Form fields */}
        <div className="p-6 space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Tax Registration Number</label>
            <Controller
              name="taxRegistrationNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  variant="outlined"
                  fullWidth
                  error={!!errors.taxRegistrationNumber}
                  disabled={isSubmitting}
                  className="bg-white"
                />
              )}
            />
            <ErrorMessage message={errors.taxRegistrationNumber?.message} />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Supplier Name</label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  variant="outlined"
                  fullWidth
                  error={!!errors.name}
                  disabled={isSubmitting}
                  className="bg-white"
                />
              )}
            />
            <ErrorMessage message={errors.name?.message} />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Address</label>
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={3}
                  error={!!errors.address}
                  disabled={isSubmitting}
                  className="bg-white"
                />
              )}
            />
            <ErrorMessage message={errors.address?.message} />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Contact Number</label>
            <Controller
              name="contactNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  variant="outlined"
                  fullWidth
                  error={!!errors.contactNumber}
                  disabled={isSubmitting}
                  className="bg-white"
                />
              )}
            />
            <ErrorMessage message={errors.contactNumber?.message} />
          </div>
        </div>
      </div>

      {/* Buttons - Fixed at bottom */}
      <div className="sticky bottom-0 p-6 border-t bg-white mt-auto">
        <div className="flex gap-4">
          <button
            type="button"
            className="cursor-pointer flex-1 px-4 py-2.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="cursor-pointer flex-1 px-4 py-2.5 rounded-md overflow-hidden bg-gradient-to-r from-red-500 to-blue-500 text-white hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:hover:scale-100"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Submit'}
          </button>
        </div>
      </div>
    </form>
  );
} 