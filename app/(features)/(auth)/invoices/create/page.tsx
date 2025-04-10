'use client';

import { Button, Menu, MenuItem } from '@mui/material';
import { usePopupState, bindTrigger, bindMenu } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import PageHeader from '@/app/shared/components/page-header';
import Snackbar from '@/app/shared/components/snackbar';
import useSnackbar from '@/app/shared/hooks/useSnackbar';
import type { FormErrors, InvoiceFormData, InvoiceItem } from '@/lib/types';

import SalesInvoiceDetails from '../components/sales-invoice-details';
import SalesInvoiceItems from '../components/sales-invoice-items';
import SalesInvoiceSummary from '../components/sales-invoice-summary';
import SalesTaxDiscount from '../components/sales-tax-discount';

export default function CreateInvoicePage() {
  const router = useRouter();
  const { isOpen, message, type, showSnackbar, hideSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const popupState = usePopupState({ variant: 'popover', popupId: 'invoiceActions' });

  // Helper to convert item types for component compatibility
  const adaptInvoiceItemsForSummary = (items: InvoiceItem[]) => {
    return items.map(item => ({
      ...item,
      // Ensure required properties have default values
      mrp: item.mrp ?? 0,
      price: item.price ?? 0,
    }));
  };

  // Form state
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoice_number: '',
    date: new Date(),
    salesman_id: null,
    ship_from: '',
    customer_id: null,
    ship_to: '',
    status: 'DRAFT',
    // Tax and discount fields
    tax_type: 'VAT',
    vat_percentage: 5,
    cgst_percentage: 0,
    sgst_percentage: 0,
    discount_type: 'PERCENTAGE',
    discount_value: 0,
  });

  // Invoice items
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    {
      id: Date.now().toString(),
      product_id: null,
      part_no: '',
      qty: 1,
      rate: 0,
      total: 0,
      price: 0,
      mrp: 0,
    },
  ]);

  // Form validation
  const [errors, setErrors] = useState<FormErrors>({
    invoice_number: '',
    customer_id: '',
    salesman_id: '',
    items: '',
  });

  // Force re-render of components when tax or discount changes
  const handleTaxDiscountChange = () => {
    // This is just to trigger a re-render of the summary
    setInvoiceItems([...invoiceItems]);
  };

  // Validate form
  const validateForm = () => {
    const newErrors: FormErrors = {
      invoice_number: !formData.invoice_number ? 'Invoice number is required' : '',
      customer_id: !formData.customer_id ? 'Customer is required' : '',
      salesman_id: !formData.salesman_id ? 'Salesman is required' : '',
      items:
        invoiceItems.length === 0
          ? 'At least one item is required'
          : invoiceItems.some(item => !item.product_id)
            ? 'All items must have a product selected'
            : '',
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  // Calculate invoice totals including tax and discount
  const calculateInvoiceTotals = () => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0);

    // Calculate discount
    let discountAmount = 0;
    if (formData.discount_type === 'PERCENTAGE') {
      const discountValue = formData.discount_value === '' ? 0 : Number(formData.discount_value);
      discountAmount = (subtotal * discountValue) / 100;
    } else if (formData.discount_type === 'FIXED') {
      const discountValue = formData.discount_value === '' ? 0 : Number(formData.discount_value);
      discountAmount = Math.min(discountValue, subtotal);
    }

    // Calculate tax
    const taxableAmount = subtotal - discountAmount;
    let taxAmount = 0;

    if (formData.tax_type === 'VAT') {
      taxAmount = (taxableAmount * formData.vat_percentage) / 100;
    } else if (formData.tax_type === 'GST') {
      const cgstAmount = (taxableAmount * formData.cgst_percentage) / 100;
      const sgstAmount = (taxableAmount * formData.sgst_percentage) / 100;
      taxAmount = cgstAmount + sgstAmount;
    }

    const total = taxableAmount + taxAmount;

    return {
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total,
    };
  };

  const calculateProfit = (items: InvoiceItem[], discountValue: number | string) => {
    // Calculate profit for each item
    const itemProfits = items.map(item => {
      if (!item.product_id) {
        return 0;
      }

      // Calculate profit per item: (MRP - Price) * Quantity
      const profitPerUnit = (item.mrp ?? 0) - (item.price ?? 0);
      return profitPerUnit * item.qty;
    });

    // Sum up all item profits
    const totalProfit = itemProfits.reduce((sum, profit) => sum + profit, 0);

    // Apply discount to profit
    const numericDiscount = discountValue === '' ? 0 : Number(discountValue);
    const discountedProfit = totalProfit - numericDiscount;

    return discountedProfit;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false, invoiceType = 'INVOICE') => {
    e.preventDefault();

    if (!validateForm()) {
      showSnackbar('Please fix the errors in the form', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const totals = calculateInvoiceTotals();
      const profit = calculateProfit(invoiceItems, totals.discount);

      const invoiceData = {
        ...formData,
        status: saveAsDraft ? 'DRAFT' : 'PENDING',
        type: invoiceType,
        items: invoiceItems.filter(item => item.product_id), // Only send items with a product selected
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        profit,
      };

      // Send data to the API
      const response = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to create invoice');
      }

      // Open PDF view in a new tab
      if (result.data && result.data.id) {
        window.open(`/invoices/pdf/${result.data.id}`, '_blank');
      }

      showSnackbar('Invoice created successfully', 'success');
    } catch (error: unknown) {
      console.error('Error creating invoice:', error);
      showSnackbar(error instanceof Error ? error.message : 'Failed to create invoice', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-16 px-4 py-8 md:ml-[280px] md:px-6">
      <div className="mx-auto max-w-screen-2xl">
        <PageHeader
          heading="Create Sales Invoice"
          buttonText="Back to Invoices"
          onButtonClick={() => router.push('/invoices')}
        />

        <form onSubmit={e => handleSubmit(e, false)}>
          <SalesInvoiceDetails
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
          />

          <SalesTaxDiscount
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
            onTaxDiscountChange={handleTaxDiscountChange}
          />

          <SalesInvoiceItems
            invoiceItems={adaptInvoiceItemsForSummary(invoiceItems)}
            setInvoiceItems={setInvoiceItems}
            errors={errors}
            setErrors={setErrors}
          />

          <SalesInvoiceSummary
            invoiceItems={adaptInvoiceItemsForSummary(invoiceItems)}
            formData={formData}
          />

          <div className="mt-6 flex justify-end space-x-4">
            <Button
              type="button"
              variant="outlined"
              onClick={e => handleSubmit(e, true)}
              disabled={isSubmitting}
            >
              Save as Draft
            </Button>

            <Button
              variant="contained"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-red-500 to-blue-500 transition-all duration-300 hover:scale-105"
              {...bindTrigger(popupState)}
            >
              Create Invoice
            </Button>
            <Menu {...bindMenu(popupState)}>
              <MenuItem
                onClick={e => {
                  popupState.close();
                  handleSubmit(e, false, 'TAX');
                }}
              >
                Tax Invoice
              </MenuItem>
              <MenuItem
                onClick={e => {
                  popupState.close();
                  handleSubmit(e, false, 'PROFORMA');
                }}
              >
                Proforma Invoice
              </MenuItem>
              <MenuItem
                onClick={e => {
                  popupState.close();
                  handleSubmit(e, false, 'DELIVERY');
                }}
              >
                Delivery Note
              </MenuItem>
              <MenuItem
                onClick={e => {
                  popupState.close();
                  handleSubmit(e, false, 'QUOTATION');
                }}
              >
                Quotation
              </MenuItem>
            </Menu>
          </div>
        </form>
      </div>

      {/* Snackbar for notifications */}
      <Snackbar open={isOpen} message={message} type={type} onClose={hideSnackbar} />
    </div>
  );
}
