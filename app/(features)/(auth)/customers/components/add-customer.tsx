'use client';

import { TextField } from '@mui/material';
import { useState, useEffect } from 'react';
import { Customer } from "@/lib/types";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormButton, ErrorMessage } from '@/app/shared/components/form-utils';

// Define the validation schema using Zod
const customerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters")
    .max(20, "Phone number must not exceed 20 characters"),
    address: z.string().optional().or(z.literal(''))
  });

// Infer the type from the schema
type CustomerFormData = z.infer<typeof customerFormSchema>;

interface AddCustomerProps {
  onCustomerAdded: (customer: Customer) => void;
  onCustomerUpdated: (customer: Customer) => void;
  customerToEdit?: Customer;
  onClose: () => void;
}

export default function AddCustomer({ 
  onCustomerAdded, 
  onCustomerUpdated,
  customerToEdit,
  onClose
}: AddCustomerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Initialize form with react-hook-form and zod validation
  const { 
    control, 
    handleSubmit, 
    reset,
    formState: { errors } 
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: ''
    }
  });

  // Set form values if editing an existing customer
  useEffect(() => {
    if (customerToEdit) {
      reset({
        name: customerToEdit.name,
        email: customerToEdit.email,
        phone: customerToEdit.phone || '',
        address: customerToEdit.address || ''
      });
    }
  }, [customerToEdit, reset]);

  // Handle form submission
  const onSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    setIsSubmitted(true);
    
    try {
      if (customerToEdit) {
        // Update existing customer
        const response = await fetch(`/api/customers/${customerToEdit.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update customer');
        }
        
        const updatedCustomer = await response.json();
        onCustomerUpdated(updatedCustomer);
      } else {
        // Create new customer
        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create customer');
        }
        
        const newCustomer = await response.json();
        onCustomerAdded(newCustomer);
      }
      
      // Close the panel after successful submission
      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          {customerToEdit ? 'Edit Customer' : 'Add New Customer'}
        </h2>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Customer Name</label>
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
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  variant="outlined"
                  fullWidth
                  error={!!errors.email}
                  disabled={isSubmitting}
                  className="bg-white"
                />
              )}
            />
            <ErrorMessage message={errors.email?.message} />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Phone Number</label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  variant="outlined"
                  fullWidth
                  error={!!errors.phone}
                  disabled={isSubmitting}
                  className="bg-white"
                />
              )}
            />
            <ErrorMessage message={errors.phone?.message} />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Address (Optional)</label>
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
          {customerToEdit ? 'Update' : 'Save'}
        </FormButton>
      </div>
    </div>
  );
} 