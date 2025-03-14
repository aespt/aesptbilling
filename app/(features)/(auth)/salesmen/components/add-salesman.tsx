'use client';

import { TextField } from '@mui/material';
import { useState, useEffect } from 'react';
import { Salesman } from "@/lib/types";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormButton, ErrorMessage } from '@/app/shared/components/form-utils';

// Define the validation schema using Zod
const salesmanFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contact_number: z.string().min(10, "Contact number must be at least 10 characters")
    .max(20, "Contact number must not exceed 20 characters"),
});

// Infer the type from the schema
type SalesmanFormData = z.infer<typeof salesmanFormSchema>;

interface AddSalesmanProps {
  onSalesmanAdded: (salesman: Salesman) => void;
  onSalesmanUpdated?: (salesman: Salesman) => void;
  salesmanToEdit?: Salesman;
  onClose: () => void;
}

export default function AddSalesman({ 
  onSalesmanAdded, 
  onSalesmanUpdated,
  salesmanToEdit,
  onClose
}: AddSalesmanProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Initialize form with react-hook-form and zod validation
  const { 
    control, 
    handleSubmit, 
    reset, 
    formState: { errors } 
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
    setIsSubmitted(true);

    try {
      if (salesmanToEdit) {
        // Update existing salesman
        const response = await fetch(`/api/salesmen/${salesmanToEdit.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Failed to update salesman');
        }
        
        const updatedSalesman = await response.json();
        if (onSalesmanUpdated) {
          onSalesmanUpdated(updatedSalesman);
        } else {
          onSalesmanAdded(updatedSalesman);
        }
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
          throw new Error('Failed to create salesman');
        }
        
        const newSalesman = await response.json();
        onSalesmanAdded(newSalesman);
      }

      // Close the form after successful submission
      onClose();
    } catch (error) {
      console.error('Error submitting salesman form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          {salesmanToEdit ? 'Edit Salesman' : 'Add New Salesman'}
        </h2>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
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
      </form>
      
      {/* Footer with buttons */}
      <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
        <FormButton
          variant="outlined"
          color="inherit"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </FormButton>
        <FormButton
          variant="contained"
          color="primary"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {salesmanToEdit ? 'Update' : 'Save'}
        </FormButton>
      </div>
    </div>
  );
} 