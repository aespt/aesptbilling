'use client';

import { TextField } from '@mui/material';
import { useState, useEffect } from 'react';
import { Product } from "@/lib/types";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Define the validation schema using Zod
const productFormSchema = z.object({
  partNo: z.string().min(1, "Part number is required"),
  partName: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0.01, "Price must be greater than zero")
  ),
  count: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().int("Quantity must be a whole number").nonnegative("Quantity cannot be negative")
  )
});

// Infer the type from the schema
type ProductFormData = z.infer<typeof productFormSchema>;

interface AddProductProps {
  onProductAdded?: (productName: string) => void;
  onProductUpdated?: (productName: string) => void;
  productToEdit?: Product | null;
  onClose: () => void;
}

export default function AddProduct({ 
  onProductAdded, 
  onProductUpdated,
  productToEdit,
  onClose
}: AddProductProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditMode = !!productToEdit;

  // Initialize React Hook Form
  const { 
    control, 
    handleSubmit, 
    reset, 
    formState: { errors, isSubmitted } 
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      partNo: '',
      partName: '',
      description: '',
      price: 0,
      count: 0
    },
    mode: 'onChange' // Validate on change for immediate feedback
  });

  // Load product data if in edit mode
  useEffect(() => {
    if (productToEdit) {
      // Convert price to number if it's not already
      const numericPrice = typeof productToEdit.price === 'number' 
        ? productToEdit.price 
        : parseFloat(productToEdit.price as any);

      reset({
        partNo: productToEdit.partNo,
        partName: productToEdit.name,
        description: productToEdit.description || '',
        price: isNaN(numericPrice) ? 0 : numericPrice,
        count: productToEdit.count || 0
      });
    }
  }, [productToEdit, reset]);

  // Form submission handler
  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    setServerError(null);
    
    try {
      // Convert form data to match the API expectations
      const productData = {
        part_no: data.partNo,
        name: data.partName,
        description: data.description || '',
        price: data.price,
        count: data.count
      };
      
      // If in edit mode, add the ID and use PUT method
      if (isEditMode && productToEdit) {
        const updateData = {
          id: productToEdit.id,
          ...productData
        };
        
        // Call the API to update the product
        const response = await fetch('/api/products', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update product');
        }
        
        // Call the callback if provided
        if (onProductUpdated) {
          onProductUpdated(data.partName);
        }
      } else {
        // Call the API to create a new product
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create product');
        }
        
        // Reset form for new product
        reset({
          partNo: '',
          partName: '',
          description: '',
          price: 0,
          count: 0
        });
        
        // Call the callback if provided
        if (onProductAdded) {
          onProductAdded(data.partName);
        }
      }
    } catch (error: any) {
      console.error('Error saving product:', error);
      setServerError(error.message || 'An error occurred while saving the product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom error message component for consistent styling
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
            {isEditMode ? 'Edit Product' : 'Add Product'}
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
            <label className="text-sm font-medium text-gray-700">Part Number</label>
            <Controller
              name="partNo"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  placeholder="Enter part number"
                  variant="outlined"
                  size="small"
                  error={!!errors.partNo}
                />
              )}
            />
            <ErrorMessage message={errors.partNo?.message} />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Product Name</label>
            <Controller
              name="partName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  placeholder="Enter product name"
                  variant="outlined"
                  size="small"
                  error={!!errors.partName}
                />
              )}
            />
            <ErrorMessage message={errors.partName?.message} />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  placeholder="Enter description"
                  variant="outlined"
                  size="small"
                  multiline
                  rows={4}
                  error={!!errors.description}
                />
              )}
            />
            <ErrorMessage message={errors.description?.message} />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Price</label>
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="number"
                  placeholder="Enter price"
                  variant="outlined"
                  size="small"
                  inputProps={{ step: 0.01 }}
                  error={!!errors.price}
                  value={field.value === 0 && !isSubmitted ? '' : field.value}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                    field.onChange(value);
                  }}
                />
              )}
            />
            <ErrorMessage message={errors.price?.message} />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Quantity</label>
            <Controller
              name="count"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="number"
                  placeholder="Enter quantity"
                  variant="outlined"
                  size="small"
                  error={!!errors.count}
                  value={field.value === 0 && !isSubmitted ? '' : field.value}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                    field.onChange(value);
                  }}
                />
              )}
            />
            <ErrorMessage message={errors.count?.message} />
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