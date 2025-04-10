'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { TextField } from '@mui/material';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';

import { type Customer } from '@/lib/types';

// Define the validation schema using Zod
const customerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters")
    .max(20, "Phone number must not exceed 20 characters"),
    trn: z.string().min(3, "TRN must be at least 3 characters"),
    address: z.string().optional().or(z.literal(''))
  });

// Infer the type from the schema
type CustomerFormData = z.infer<typeof customerFormSchema>;

interface AddCustomerProps {
  onCustomerAdded?: (customerName: string) => void;
  onCustomerUpdated?: (customerName: string) => void;
  customerToEdit?: Customer | null;
  onClose: () => void;
  useFormTag?: boolean;
}

export default function AddCustomer({
  onCustomerAdded,
  onCustomerUpdated,
  customerToEdit,
  onClose,
  useFormTag = true,
}: AddCustomerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditMode = !!customerToEdit;

  // Initialize React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      trn: ''
    },
    mode: 'onChange', // Validate on change for immediate feedback
  });

  // Load customer data if in edit mode
  useEffect(() => {
    if (customerToEdit) {
      reset({
        name: customerToEdit.name,
        email: customerToEdit.email,
        phone: customerToEdit.phone || '',
        address: customerToEdit.address || '',
        trn: customerToEdit.trn || ''
      });
    }
  }, [customerToEdit, reset]);

  // Form submission handler
  const onSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      // Convert form data to match the API expectations
      const customerData = {
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        address: data.address || '',
        trn: data.trn || ''
      };

      // If in edit mode, add the ID and use PUT method
      if (isEditMode && customerToEdit) {
        const updateData = {
          id: customerToEdit.id,
          ...customerData,
        };

        console.log(updateData);

        const response = await fetch('/api/customers', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update customer');
        }

        // Call the callback function if provided
        if (onCustomerUpdated) {
          onCustomerUpdated(data.name);
        }
      } else {
        // Create new customer
        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customerData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.log(errorData);
          throw new Error(errorData.error || 'Failed to create customer');
        }

        // Call the callback function if provided
        if (onCustomerAdded) {
          onCustomerAdded(data.name);
        }
      }

      // Reset the form
      reset();
    } catch (error: unknown) {
      console.error('Error submitting customer:', error);
      setServerError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Component for displaying error messages
  const ErrorMessage = ({ message }: { message?: string }) => {
    if (!message) {
      return null;
    }
    return <p className="mt-1 text-sm text-red-600">{message}</p>;
  };

  const formContent = (
    <>
      {/* Content wrapper */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b p-6">
          <h1 className="text-2xl font-bold text-black/70">
            {isEditMode ? 'Edit Customer' : 'Add Customer'}
          </h1>
        </div>

        {/* Server error message */}
        {serverError && (
          <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-600">
            {serverError}
          </div>
        )}

        {/* Form fields */}
        <div className="space-y-6 p-6">
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Customer Name
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
                  error={!!errors.name}
                  size="small"
                  placeholder="Enter customer name"
                  disabled={isSubmitting}
                  className="bg-white"
                />
              )}
            />
            <ErrorMessage message={errors.name?.message} />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="email"
                  variant="outlined"
                  fullWidth
                  error={!!errors.email}
                  size="small"
                  placeholder="Enter email address"
                  disabled={isSubmitting}
                  className="bg-white"
                />
              )}
            />
            <ErrorMessage message={errors.email?.message} />
          </div>

          <div className="space-y-1">
            <label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="phone"
                  variant="outlined"
                  fullWidth
                  error={!!errors.phone}
                  size="small"
                  placeholder="Enter phone number"
                  disabled={isSubmitting}
                  className="bg-white"
                />
              )}
            />
            <ErrorMessage message={errors.phone?.message} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">TRN</label>
            <Controller
              name="trn"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  variant="outlined"
                  fullWidth
                  error={!!errors.trn}
                  size="small"
                  placeholder="Enter TRN"
                  disabled={isSubmitting}
                  className="bg-white"
                />
              )}
            />
            <ErrorMessage message={errors.trn?.message} />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="address" className="text-sm font-medium text-gray-700">
              Address (Optional)
            </label>
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="address"
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  placeholder="Enter address"
                  error={!!errors.address}
                  disabled={isSubmitting}
                  className="bg-white"
                />
              )}
            />
            <ErrorMessage message={errors.address?.message} />
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
            type={useFormTag ? 'submit' : 'button'}
            className="flex-1 cursor-pointer overflow-hidden rounded-md bg-gradient-to-r from-red-500 to-blue-500 px-4 py-2.5 text-white transition-all duration-300 hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
            onClick={useFormTag ? undefined : () => handleSubmit(onSubmit)()}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Submit'}
          </button>
        </div>
      </div>
    </>
  );

  if (useFormTag) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col" noValidate>
        {formContent}
      </form>
    );
  }

  return <div className="flex h-full flex-col">{formContent}</div>;
}
