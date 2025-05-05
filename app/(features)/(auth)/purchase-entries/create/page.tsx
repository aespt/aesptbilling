'use client';

import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import PurchaseEntryDetails from '@/app/(features)/(auth)/purchase-entries/components/purchase-entry-details';
import type { PurchaseEntryFormData } from '@/app/(features)/(auth)/purchase-entries/components/purchase-entry-details';
import PurchaseEntryItems from '@/app/(features)/(auth)/purchase-entries/components/purchase-entry-items';
import PurchaseEntrySummary from '@/app/(features)/(auth)/purchase-entries/components/purchase-entry-summary';
import PurchaseEntryTaxDiscount from '@/app/(features)/(auth)/purchase-entries/components/purchase-entry-tax-discount';
import FullSpinner from '@/app/shared/components/full-spinner';
import PageHeader from '@/app/shared/components/page-header';
import Snackbar from '@/app/shared/components/snackbar';
import useSnackbar from '@/app/shared/hooks/useSnackbar';
import type { FormErrors, PurchaseItem } from '@/lib/types';

export default function CreatePurchaseEntryPage() {
  const router = useRouter();
  const { isOpen, message, showSnackbar, hideSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to convert item types for component compatibility
  const adaptPurchaseItemsForSummary = (items: PurchaseItem[]) => {
    return items.map(item => ({
      ...item,
      // Ensure required properties have default values
      rate: item.rate ?? 0,
    }));
  };

  // Form state
  const [formData, setFormData] = useState<PurchaseEntryFormData>({
    purchaseentry_number: '',
    date: new Date(),
    supplier_id: null,
    ship_from: '',
    status: 'DRAFT',
    // Tax and discount fields
    tax_type: 'VAT',
    vat_percentage: 5,
    cgst_percentage: 0,
    sgst_percentage: 0,
    discount_type: 'PERCENTAGE',
    discount_value: 0,
    tax_rate: 5, // Initialize with default tax rate
    discount_rate: 0, // Initialize with default discount rate
  });

  // Purchase entry items
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([
    {
      id: Date.now().toString(),
      product_id: null,
      part_no: '',
      qty: 1,
      rate: 0,
      total: 0,
    },
  ]);

  // Form validation
  const [errors, setErrors] = useState<FormErrors>({
    purchaseentry_number: '',
    supplier_id: '',
    items: '',
  });

  // Force re-render of components when tax or discount changes
  const handleTaxDiscountChange = () => {
    // Simply trigger a re-render of components
    setPurchaseItems([...purchaseItems]);
  };

  // Validate form
  const validateForm = () => {
    const newErrors: FormErrors = {
      purchaseentry_number: !formData.purchaseentry_number
        ? 'Purchase entry number is required'
        : '',
      supplier_id: !formData.supplier_id ? 'Supplier is required' : '',
      items:
        purchaseItems.length === 0
          ? 'At least one item is required'
          : purchaseItems.some(item => !item.product_id)
            ? 'All items must have a product selected'
            : '',
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  // Calculate purchase entry totals including tax and discount
  const calculatePurchaseTotals = () => {
    const subtotal = purchaseItems.reduce((sum, item) => sum + (item.total || 0), 0);

    // Get discount as direct value (no longer percentage)
    const discountValue =
      typeof formData.discount_rate === 'string' ? 0 : Number(formData.discount_rate) || 0;
    // Ensure discount doesn't exceed subtotal
    const discountAmount = Math.min(discountValue, subtotal);

    // Calculate tax using tax_rate as a direct value (no longer percentage)
    const taxableAmount = subtotal - discountAmount;
    const taxValue = typeof formData.tax_rate === 'string' ? 0 : Number(formData.tax_rate) || 0;

    // Apply tax as absolute value
    const taxAmount = taxValue;

    const total = taxableAmount + taxAmount;

    return {
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total,
    };
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false, purchaseType = 'TAX') => {
    e.preventDefault();

    if (!validateForm()) {
      showSnackbar('Please fix the errors in the form', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const totals = calculatePurchaseTotals();

      const purchaseEntryData = {
        ...formData,
        purchaseentry_date: formData.date, // Use the proper field name for the API
        status: saveAsDraft ? 'DRAFT' : 'PENDING',
        type: purchaseType,
        items: purchaseItems.filter(item => item.product_id), // Only send items with a product selected
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
      };

      // Send data to the API
      const response = await fetch('/api/purchase-entries/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseEntryData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to create purchase entry');
      }

      showSnackbar('Purchase entry created successfully', 'success');

      // Redirect back to purchase entries list
      setTimeout(() => {
        router.push('/purchases');
      }, 1500);
    } catch (error: unknown) {
      console.error('Error creating purchase entry:', error);
      showSnackbar(
        error instanceof Error ? error.message : 'Failed to create purchase entry',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isSubmitting && <FullSpinner />}
      <div className="mt-16 px-4 py-2 md:ml-[280px] md:px-6">
        <div className="mx-auto max-w-screen-2xl">
          <PageHeader
            heading="Create Purchase Entry"
            buttonText="Back to Purchases"
            onButtonClick={() => router.push('/purchases')}
            buttonVariant="secondary"
          />

          <form onSubmit={e => handleSubmit(e, false)}>
            <PurchaseEntryDetails
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
            />

            <PurchaseEntryItems
              purchaseItems={adaptPurchaseItemsForSummary(purchaseItems)}
              setPurchaseItems={setPurchaseItems}
              errors={errors}
              setErrors={setErrors}
            />

            <PurchaseEntryTaxDiscount
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
              onTaxDiscountChange={handleTaxDiscountChange}
            />

            <PurchaseEntrySummary
              purchaseItems={adaptPurchaseItemsForSummary(purchaseItems)}
              formData={formData}
            />

            <div className="my-6 flex justify-end space-x-4">
              <Button
                type="submit"
                variant="contained"
                color="primary"
                className="bg-gradient-to-r from-red-500 to-blue-500 transition-all duration-300 hover:scale-105"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Purchase Entry'}
              </Button>
            </div>
          </form>
          <Snackbar open={isOpen} message={message} onClose={hideSnackbar} />
        </div>
      </div>
    </>
  );
}
