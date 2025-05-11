'use client';

import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import PurchaseDetails from '@/app/(features)/(auth)/purchases/components/purchase-details';
import PurchaseItems from '@/app/(features)/(auth)/purchases/components/purchase-items';
import PurchaseSummary from '@/app/(features)/(auth)/purchases/components/purchase-summary';
import FullSpinner from '@/app/shared/components/full-spinner';
import PageHeader from '@/app/shared/components/page-header';
import Snackbar from '@/app/shared/components/snackbar';
import useSnackbar from '@/app/shared/hooks/useSnackbar';
import type { FormErrors, PurchaseFormData, PurchaseItem } from '@/lib/types';

export default function CreatePurchasePage() {
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
  const [formData, setFormData] = useState<PurchaseFormData>({
    purchase_number: '',
    date: new Date(),
    supplier_id: null,
    ship_from: '',
    status: 'DRAFT',
    // Tax and discount fields
    tax_type: 'VAT',
    vat_percentage: 0,
    cgst_percentage: 0,
    sgst_percentage: 0,
    discount_type: 'PERCENTAGE',
    discount_value: 0,
    tax_rate: 0, // Initialize with default tax rate
    discount_rate: 0, // Initialize with default discount rate
  });

  // Purchase items
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
    purchase_number: '',
    supplier_id: '',
    items: '',
  });

  // Validate form
  const validateForm = () => {
    const newErrors: FormErrors = {
      purchase_number: !formData.purchase_number ? 'Purchase number is required' : '',
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

  // Calculate purchase totals including tax and discount
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

      const purchaseData = {
        ...formData,
        status: saveAsDraft ? 'DRAFT' : 'PENDING',
        type: purchaseType,
        items: purchaseItems.filter(item => item.product_id), // Only send items with a product selected
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
      };

      // Send data to the API
      const response = await fetch('/api/purchases/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to create purchase');
      }

      // Open PDF view in a new tab
      if (result.data && result.data.id) {
        window.open(`/purchases/pdf/${result.data.id}`, '_blank');
      }

      showSnackbar('Purchase created successfully', 'success');

      // Redirect back to purchases list
      setTimeout(() => {
        router.push('/purchases');
      }, 1500);
    } catch (error: unknown) {
      console.error('Error creating purchase:', error);
      showSnackbar(error instanceof Error ? error.message : 'Failed to create purchase', 'error');
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
            heading="Create Purchase"
            buttonText="Back to Purchases"
            onButtonClick={() => router.push('/purchases')}
            buttonVariant="secondary"
          />

          <form onSubmit={e => handleSubmit(e, false)}>
            <PurchaseDetails
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
            />

            <PurchaseItems
              purchaseItems={adaptPurchaseItemsForSummary(purchaseItems)}
              setPurchaseItems={setPurchaseItems}
              errors={errors}
              setErrors={setErrors}
            />

            {/* <PurchaseTaxDiscount
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
              onTaxDiscountChange={handleTaxDiscountChange}
            /> */}

            <PurchaseSummary
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
                {isSubmitting ? 'Creating...' : 'Create Purchase'}
              </Button>
            </div>
          </form>
          <Snackbar open={isOpen} message={message} onClose={hideSnackbar} />
        </div>
      </div>
    </>
  );
}
