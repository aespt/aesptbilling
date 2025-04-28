/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';

import FullSpinner from '@/app/shared/components/full-spinner';
import PageHeader from '@/app/shared/components/page-header';
import Snackbar from '@/app/shared/components/snackbar';
import useSnackbar from '@/app/shared/hooks/useSnackbar';
import type { FormErrors } from '@/lib/types';
import type { Customer, Salesman } from '@/lib/types/index';
import type { InvoiceFormData, InvoiceItem } from '@/lib/types/invoice';

import { fetchInvoiceById, type PaymentData } from '../components/invoice-loader';
import InvoiceSearch from '../components/invoice-search';
import PaymentDetails from '../components/payment-details';
import PreviousInvoicesModal from '../components/previous-invoices-modal';
import SalesInvoiceDetails from '../components/sales-invoice-details';
import SalesInvoiceItems from '../components/sales-invoice-items';
import SalesInvoiceSummary from '../components/sales-invoice-summary';
import SalesTaxDiscount from '../components/sales-tax-discount';

export default function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isOpen, message, type, showSnackbar, hideSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const invoiceIdLoaded = useRef<string | null>(null);

  // Search and modal state
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedSalesman, setSelectedSalesman] = useState<Salesman | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<number | null>(null);

  // Cache for customers and salesmen to avoid unnecessary API calls
  const [customersCache, setCustomersCache] = useState<Record<number, Customer>>({});
  const [salesmenCache, setSalesmenCache] = useState<Record<number, Salesman>>({});
  const [hasLoadedCustomers, setHasLoadedCustomers] = useState(false);
  const [hasLoadedSalesmen, setHasLoadedSalesmen] = useState(false);

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

  // Payment Details State
  const [paymentData, setPaymentData] = useState<PaymentData>({
    payment_method: '',
    payment_status: 'UNPAID',
    payment_date: null,
    reference_number: '',
    payment_notes: '',
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

  // Invoice stage
  const [invoiceStage, setInvoiceStage] = useState<'SALE' | 'QUOTATION' | 'PROFORMA'>('SALE');

  // Function to fetch and cache customers with proper loading flags
  const fetchCustomers = useCallback(
    async (forceRefresh = false) => {
      // Return cached data if already loaded and not forcing refresh
      if (hasLoadedCustomers && !forceRefresh) {
        return customersCache;
      }

      // Skip if already loading
      if (isLoadingInvoice) {
        return customersCache;
      }

      try {
        // Mark as loading
        setHasLoadedCustomers(true);

        const response = await fetch('/api/dropdown/customers');
        if (response.ok) {
          const data = await response.json();
          const customers = data.customers || [];

          // Build cache object
          const cache: Record<number, Customer> = {};
          customers.forEach((customer: Customer) => {
            cache[customer.id] = customer;
          });

          setCustomersCache(cache);
          return cache;
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        // Reset the loading state if there was an error
        setHasLoadedCustomers(false);
      }

      return customersCache;
    },
    [customersCache, hasLoadedCustomers, isLoadingInvoice]
  );

  // Function to fetch and cache salesmen with proper loading flags
  const fetchSalesmen = useCallback(
    async (forceRefresh = false) => {
      // Return cached data if already loaded and not forcing refresh
      if (hasLoadedSalesmen && !forceRefresh) {
        return salesmenCache;
      }

      // Skip if already loading
      if (isLoadingInvoice) {
        return salesmenCache;
      }

      try {
        // Mark as loading
        setHasLoadedSalesmen(true);

        const response = await fetch('/api/dropdown/salesmen');
        if (response.ok) {
          const data = await response.json();
          const salesmen = data.salesmen || [];

          // Build cache object
          const cache: Record<number, Salesman> = {};
          salesmen.forEach((salesman: Salesman) => {
            cache[salesman.id] = salesman;
          });

          setSalesmenCache(cache);
          return cache;
        }
      } catch (error) {
        console.error('Error fetching salesmen:', error);
        // Reset the loading state if there was an error
        setHasLoadedSalesmen(false);
      }

      return salesmenCache;
    },
    [salesmenCache, hasLoadedSalesmen, isLoadingInvoice]
  );

  // Load all dropdown data on first render only, with URL check
  useEffect(() => {
    // Don't fetch if we're in loading state
    if (isLoadingInvoice) {
      return;
    }

    // Check if we have an ID in the URL
    const id = searchParams.get('id');

    // If we have an ID but haven't loaded the invoice yet, the loadInvoice function will handle data fetching
    if (id) {
      return;
    }

    // Fetch data only once and only if not already loading data
    if (!hasLoadedCustomers && !hasLoadedSalesmen) {
      // Use a single Promise.all to load all data at once
      Promise.all([fetchCustomers(), fetchSalesmen()]).catch(error => {
        console.error('Error loading dropdown data:', error);
      });
    }
  }, [
    fetchCustomers,
    fetchSalesmen,
    hasLoadedCustomers,
    hasLoadedSalesmen,
    searchParams,
    isLoadingInvoice,
  ]);

  // Load invoice by ID
  const loadInvoice = useCallback(
    async (invoiceId: string) => {
      // Skip if already loading or the same invoice
      if (
        isLoadingInvoice ||
        (currentInvoiceId !== null && currentInvoiceId.toString() === invoiceId)
      ) {
        return;
      }

      setIsLoadingInvoice(true);
      try {
        // Load the invoice first
        const result = await fetchInvoiceById(invoiceId);

        // Once we have the invoice data, fetch dropdown data if needed
        const [customersData, salesmenData] = await Promise.all([
          fetchCustomers(),
          fetchSalesmen(),
        ]);

        if (result) {
          // Set edit mode and current invoice ID
          setIsEditMode(true);
          setCurrentInvoiceId(Number(invoiceId));

          // Merge the loaded data with current formData to preserve defaults for any missing fields
          setFormData(currentData => ({
            ...currentData,
            ...result.formData,
            // Ensure discount_type is the correct type
            discount_type: result.formData.discount_type as InvoiceFormData['discount_type'],
            invoice_stage: result.formData.invoice_stage as InvoiceFormData['invoice_stage'],
          }));

          // Replace invoice items only if we got items
          if (result.invoiceItems && result.invoiceItems.length > 0) {
            setInvoiceItems(result.invoiceItems);
          }

          // Load payment details if available
          if (result.paymentData) {
            setPaymentData(currentData => ({
              ...currentData,
              ...result.paymentData,
            }));
          }

          // Set customer data from cache if available
          if (result.formData.customer_id && customersData[result.formData.customer_id]) {
            const customer = customersData[result.formData.customer_id];
            setSelectedCustomer(customer as Customer);

            // Update ship_to with customer's address if it's empty
            if (!result.formData.ship_to && customer.address) {
              setFormData(currentData => ({
                ...currentData,
                ship_to: customer.address || '',
              }));
            }
          }

          // Set salesman data from cache if available
          if (result.formData.salesman_id && salesmenData[result.formData.salesman_id]) {
            setSelectedSalesman(salesmenData[result.formData.salesman_id] as Salesman);
          }

          showSnackbar('Invoice loaded successfully', 'success');
        } else {
          showSnackbar('Failed to load invoice', 'error');
        }
      } catch (error) {
        console.error('Error loading invoice:', error);
        showSnackbar('Error loading invoice', 'error');
      } finally {
        setIsLoadingInvoice(false);
      }
    },
    [showSnackbar, currentInvoiceId, isLoadingInvoice, fetchCustomers, fetchSalesmen, setFormData]
  );

  // Check for invoice ID in URL query params on component mount only once
  useEffect(() => {
    // Check for any query param that could be an invoice ID
    const id = searchParams.get('id');
    if (id && id !== invoiceIdLoaded.current && !isLoadingInvoice) {
      invoiceIdLoaded.current = id;
      loadInvoice(id);
    }

    // Cleanup function to reset the ref when component unmounts
    return () => {
      invoiceIdLoaded.current = null;
    };
  }, [searchParams, loadInvoice, isLoadingInvoice]);

  // Helper to convert item types for component compatibility
  const adaptInvoiceItemsForSummary = (items: InvoiceItem[]) => {
    return items.map(item => ({
      ...item,
      // Ensure required properties have default values
      mrp: item.mrp ?? 0,
      price: item.price ?? 0,
    }));
  };

  // Handle invoice search
  const searchInvoiceByNumber = useCallback(
    async (number: string) => {
      if (!number.trim()) {
        return;
      }

      try {
        const response = await fetch(`/api/invoices?invoice_number=${encodeURIComponent(number)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data && result.data.length > 0) {
            // If invoice found, load it
            const invoice = result.data[0];
            // Check if we're already loaded this invoice
            if (invoice.id !== invoiceIdLoaded.current) {
              await loadInvoice(invoice.id);
            }
          }
        }
      } catch (error) {
        console.error('Error searching for invoice:', error);
      }
    },
    [loadInvoice, invoiceIdLoaded]
  );

  useEffect(() => {
    if (searchTerm) {
      const delaySearch = setTimeout(() => {
        // Skip loading if we're currently in edit mode
        if (!isEditMode && !isLoadingInvoice) {
          searchInvoiceByNumber(searchTerm);
        }
      }, 500);
      return () => clearTimeout(delaySearch);
    }
  }, [searchTerm, searchInvoiceByNumber, isEditMode, isLoadingInvoice]);

  // Form validation
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

  // Handle invoice stage change
  const handleInvoiceStageChange = (event: SelectChangeEvent) => {
    const newStage = event.target.value as 'SALE' | 'QUOTATION' | 'PROFORMA';
    setInvoiceStage(newStage);
    setFormData(prev => ({
      ...prev,
      invoice_stage: newStage,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault();

    if (!validateForm()) {
      showSnackbar('Please fix the errors in the form', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const totals = calculateInvoiceTotals();

      let profit = 0;
      if (invoiceStage === 'SALE') {
        profit = calculateProfit(invoiceItems, totals.discount);
      } else {
        profit = 0;
      }

      // Store the discount percentage if discount type is PERCENTAGE
      const discountPercentage =
        formData.discount_type === 'PERCENTAGE' && formData.discount_value !== ''
          ? Number(formData.discount_value)
          : 0;

      const invoiceData = {
        ...formData,
        status: saveAsDraft ? 'DRAFT' : 'PENDING',
        invoice_stage: invoiceStage,
        items: invoiceItems.filter(item => item.product_id), // Only send items with a product selected
        subtotal: totals.subtotal,
        discount: totals.discount,
        discount_percentage: discountPercentage,
        tax: totals.tax,
        total: totals.total,
        profit,
        // Include payment details
        payment: paymentData,
      };

      let response;

      // If in edit mode, update the existing invoice
      if (isEditMode && currentInvoiceId) {
        response = await fetch(`/api/invoices/${currentInvoiceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invoiceData),
        });
      } else {
        // Otherwise create a new invoice
        response = await fetch('/api/invoices/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invoiceData),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to process invoice');
      }

      // Open PDF view in a new tab
      if (result.data && result.data.id) {
        window.open(`/invoices/pdf/${result.data.id}?invoiceStage=${invoiceStage}`, '_blank');
      } else if (isEditMode && currentInvoiceId) {
        window.open(`/invoices/pdf/${currentInvoiceId}?invoiceStage=${invoiceStage}`, '_blank');
      }

      showSnackbar(
        isEditMode ? 'Invoice updated successfully' : 'Invoice created successfully',
        'success'
      );
      setTimeout(() => {
        router.push('/invoices');
      }, 1500);
    } catch (error: unknown) {
      console.error(isEditMode ? 'Error updating invoice:' : 'Error creating invoice:', error);
      showSnackbar(error instanceof Error ? error.message : 'Failed to process invoice', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch(`/api/invoices/pdf/${currentInvoiceId}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${currentInvoiceId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const getTitleCase = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <>
      {(isSubmitting || isLoadingInvoice) && <FullSpinner />}
      <div className="mt-16 px-4 py-2 md:ml-[280px] md:px-6">
        <div className="mx-auto max-w-screen-2xl">
          <PageHeader
            heading={
              isEditMode
                ? `Edit ${getTitleCase(formData.invoice_stage as string)} Invoice`
                : `Create ${getTitleCase(invoiceStage)} Invoice`
            }
            buttonText="Back to Invoices"
            onButtonClick={() => router.push('/invoices')}
            buttonVariant="secondary"
          />

          {/* Invoice Search and Stage Selection */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="w-full">
              <InvoiceSearch
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onOpenModal={() => setIsModalOpen(true)}
              />
            </div>

            <div className="w-full">
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="invoice-stage-label">Invoice Type</InputLabel>
                <Select
                  labelId="invoice-stage-label"
                  id="invoice-stage"
                  value={invoiceStage}
                  onChange={handleInvoiceStageChange}
                  label="Invoice Type"
                >
                  <MenuItem value="SALE">Tax Invoice</MenuItem>
                  <MenuItem value="QUOTATION">Quotation</MenuItem>
                  <MenuItem value="PROFORMA">Proforma Invoice</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>

          <form onSubmit={e => handleSubmit(e, false)}>
            <SalesInvoiceDetails
              formData={formData as any}
              setFormData={newFormData => setFormData(newFormData as any)}
              errors={errors}
              setErrors={setErrors}
              selectedCustomer={selectedCustomer as any}
              setSelectedCustomer={customer => setSelectedCustomer(customer as any)}
              selectedSalesman={selectedSalesman as any}
              setSelectedSalesman={salesman => setSelectedSalesman(salesman as any)}
              customers={Object.values(customersCache) as any}
              salesmen={Object.values(salesmenCache) as any}
            />

            <SalesTaxDiscount
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
              onTaxDiscountChange={() => setInvoiceItems([...invoiceItems])}
              invoiceSubtotal={invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0)}
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

            {/* Show Payment Details only for Sales Invoices */}
            {invoiceStage === 'SALE' && (
              <PaymentDetails paymentData={paymentData} setPaymentData={setPaymentData} />
            )}

            <div className="mt-6 flex justify-end space-x-4">
              {isEditMode && (
                <Button
                  type="button"
                  variant="outlined"
                  onClick={e => handleDownload(e)}
                  disabled={isSubmitting || isLoadingInvoice}
                >
                  Download
                </Button>
              )}

              <Button
                variant="contained"
                type="submit"
                disabled={isSubmitting || isLoadingInvoice}
                className="bg-gradient-to-r from-red-500 to-blue-500 transition-all duration-300 hover:scale-105"
              >
                {isEditMode ? 'Update Invoice' : 'Create Invoice'}
              </Button>
            </div>
          </form>
        </div>

        {/* Previous Invoices Modal */}
        <PreviousInvoicesModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelectInvoice={loadInvoice}
        />

        {/* Snackbar for notifications */}
        <Snackbar open={isOpen} message={message} type={type} onClose={hideSnackbar} />
      </div>
    </>
  );
}
