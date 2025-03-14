'use client';

import { TextField } from '@mui/material';
import { useState, useEffect } from 'react';
import { Product } from "@/lib/types";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormButton, ErrorMessage } from '@/app/shared/components/form-utils';

// Define the validation schema using Zod
const productFormSchema = z.object({
  partNo: z.string().min(1, "Part number is required"),
  partName: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0.01, "Price must be greater than zero")
  ),
  mrp: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0.01, "MRP must be greater than zero")
  ),
  count: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().int("Quantity must be a whole number").nonnegative("Quantity cannot be negative")
  )
});

// Infer the type from the schema
type ProductFormData = z.infer<typeof productFormSchema>;

interface AddProductProps {
  onProductAdded: (product: Product) => void;
  onProductUpdated: (product: Product) => void;
  productToEdit?: Product;
  onClose: () => void;
}

export default function AddProduct({ 
  onProductAdded, 
  onProductUpdated,
  productToEdit,
  onClose
}: AddProductProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Initialize form with react-hook-form and zod validation
  const { 
    control, 
    handleSubmit, 
    reset,
    formState: { errors } 
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      partNo: '',
      partName: '',
      description: '',
      price: 0,
      mrp: 0,
      count: 0
    }
  });

  // Set form values if editing an existing product
  useEffect(() => {
    if (productToEdit) {
      reset({
        partNo: productToEdit.partNo,
        partName: productToEdit.name,
        description: productToEdit.description || '',
        price: productToEdit.price,
        mrp: productToEdit.mrp,
        count: productToEdit.count
      });
    }
  }, [productToEdit, reset]);

  // Handle form submission
  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    setIsSubmitted(true);
    
    try {
      if (productToEdit) {
        // Update existing product
        const response = await fetch(`/api/products/${productToEdit.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            partNo: data.partNo,
            name: data.partName,
            description: data.description,
            price: data.price,
            mrp: data.mrp,
            count: data.count
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update product');
        }
        
        const updatedProduct = await response.json();
        onProductUpdated(updatedProduct);
      } else {
        // Create new product
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            partNo: data.partNo,
            name: data.partName,
            description: data.description,
            price: data.price,
            mrp: data.mrp,
            count: data.count
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create product');
        }
        
        const newProduct = await response.json();
        onProductAdded(newProduct);
      }
      
      // Close the panel after successful submission
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          {productToEdit ? 'Edit Product' : 'Add New Product'}
        </h2>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              )}
            />
            <ErrorMessage message={errors.description?.message} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    disabled={isSubmitting}
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
              <label className="text-sm font-medium text-gray-700">MRP</label>
              <Controller
                name="mrp"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    placeholder="Enter MRP"
                    variant="outlined"
                    size="small"
                    inputProps={{ step: 0.01 }}
                    error={!!errors.mrp}
                    disabled={isSubmitting}
                    value={field.value === 0 && !isSubmitted ? '' : field.value}
                    onChange={(e) => {
                      const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                      field.onChange(value);
                    }}
                  />
                )}
              />
              <ErrorMessage message={errors.mrp?.message} />
            </div>
          </div>
          
          <div className="space-y-1 hidden">
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
                  disabled={isSubmitting}
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
      </form>
      
      {/* Footer with buttons */}
      <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
        <FormButton
          variant="outlined"
          color="inherit"
          onClick={onClose}
          disabled={isSubmitting}
          small
        >
          Cancel
        </FormButton>
        <FormButton
          variant="contained"
          color="primary"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          small
        >
          {productToEdit ? 'Update' : 'Save'}
        </FormButton>
      </div>
    </div>
  );
}