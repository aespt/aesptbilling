'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import type { Salesman } from '@/lib/types';

// Define the validation schema using Zod
const salesmanFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  contact_number: z
    .string()
    .min(10, 'Contact number must be at least 10 characters')
    .max(20, 'Contact number must not exceed 20 characters'),
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
  if (!message) {
    return null;
  }
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
};

export default function AddSalesman({
  onSalesmanAdded,
  onSalesmanUpdated,
  salesmanToEdit,
  onClose,
}: AddSalesmanProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditMode = !!salesmanToEdit;

  // Initialize React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SalesmanFormData>({
    resolver: zodResolver(salesmanFormSchema),
    defaultValues: {
      name: '',
      contact_number: '',
    },
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
    } catch (error: unknown) {
      console.error('Error submitting salesman form:', error);
      setServerError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-6">
        <h1 className="text-2xl font-bold text-black/70">
          {isEditMode ? 'Edit Salesman' : 'Add Salesman'}
        </h1>
      </div>

      <div className="grow overflow-y-auto p-6">
        {serverError && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
            {serverError}
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Name
            </label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="name"
                  variant="outlined"
                  fullWidth
                  size="small"
                  placeholder="Enter salesman name"
                  error={!!errors.name}
                  disabled={isSubmitting}
                  className="bg-white"
                />
              )}
            />
            <ErrorMessage message={errors.name?.message} />
          </div>

          <div className="space-y-1">
            <label htmlFor="contact_number" className="text-sm font-medium text-gray-700">
              Contact Number
            </label>
            <Controller
              name="contact_number"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="contact_number"
                  variant="outlined"
                  fullWidth
                  size="small"
                  placeholder="Enter contact number"
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
      <div className="sticky bottom-0 mt-auto border-t bg-white p-6">
        <div className="flex gap-4">
          <button
            type="button"
            className="flex-1 cursor-pointer rounded-md border border-gray-300 px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 cursor-pointer overflow-hidden rounded-md bg-gradient-to-r from-red-500 to-blue-500 px-4 py-2.5 text-white transition-all duration-300 hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Submit'}
          </button>
        </div>
      </div>
    </form>
  );
}
