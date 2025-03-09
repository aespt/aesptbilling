'use client';

import { TextField } from '@mui/material';
import { useState, useEffect } from 'react';
import { Salesman } from "@/lib/types";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Define the validation schema using Zod
const salesmanFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contact_number: z.string().min(10, "Contact number must be at least 10 characters")
    .max(20, "Contact number must not exceed 20 characters"),
});

// Infer the type from the schema
type SalesmanFormData = z.infer<typeof salesmanFormSchema>;

interface AddSalesmanProps {
  onSalesmanAdded?: (salesmanName: string) => void;
  onSalesmanUpdated?: (salesmanName: string) => void;
  salesmanToEdit?: Salesman | null;
  onClose: () => void;
}

// Error message component
const ErrorMessage = ({ message }: { message?: string }) => {
  if (!message) return null;
  return <p className="text-sm text-red-600 mt-1">{message}</p>;
};

export default function AddSalesman({ 
  onSalesmanAdded, 
  onSalesmanUpdated,
  salesmanToEdit,
  onClose
}: AddSalesmanProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditMode = !!salesmanToEdit;

  // Initialize React Hook Form
  const { 
    control, 
    handleSubmit, 
    reset, 
    formState: { errors, isSubmitted } 
  } = useForm<SalesmanFormData>({
    resolver: zodResolver(salesmanFormSchema),
    defaultValues: {
      name: '',
      contact_number: '',
    }
  });

  // Set form values when editing an existing salesman
  useEffect(() => {
    if (salesmanToEdit) {
      reset({
        name: salesmanToEdit.name,
        contact_number: salesmanToEdit.contact_number,
      });
    }
  }, [salesmanToEdit, reset]);

  // Handle form submission
  const onSubmit = async (data: SalesmanFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      if (isEditMode && salesmanToEdit) {
        // Update existing salesman
        const response = await fetch('/api/salesmen', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: salesmanToEdit.id,
            ...data,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update salesman');
        }

        onSalesmanUpdated?.(data.name);
      } else {
        // Create new salesman
        const response = await fetch('/api/salesmen', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create salesman');
        }

        onSalesmanAdded?.(data.name);
      }

      // Close the form after successful submission
      onClose();
    } catch (error: any) {
      console.error('Error submitting salesman form:', error);
      setServerError(error.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-black/70">
          {isEditMode ? 'Edit Salesman' : 'Add Salesman'}
        </h1>
      </div>
      
      <div className="flex-grow p-6 overflow-y-auto">
        {serverError && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
            {serverError}
          </div>
        )}
        
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Name</label>
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
            <label className="text-sm font-medium text-gray-700">Contact Number</label>
            <Controller
              name="contact_number"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  variant="outlined"
                  fullWidth
                  error={!!errors.contact_number}
                  disabled={isSubmitting}
                  className="bg-white"
                />
              )}
            />
            <ErrorMessage message={errors.contact_number?.message} />
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