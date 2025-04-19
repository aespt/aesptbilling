'use client';

import { Button, Menu, MenuItem } from '@mui/material';
import { usePopupState, bindTrigger, bindMenu } from 'material-ui-popup-state/hooks';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import PageHeader from '@/app/shared/components/page-header';
import Snackbar from '@/app/shared/components/snackbar';
import useSnackbar from '@/app/shared/hooks/useSnackbar';
import type { FormErrors, InvoiceFormData, InvoiceItem, Customer, Salesman } from '@/lib/types';

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
  const popupState = usePopupState({ variant: 'popover', popupId: 'invoiceActions' });

  // Search and modal state
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedSalesman, setSelectedSalesman] = useState<Salesman | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<number | null>(null);

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

  // Load invoice by ID
  const loadInvoice = useCallback(
    async (invoiceId: string) => {
      setIsLoadingInvoice(true);
      try {
        const result = await fetchInvoiceById(invoiceId);

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
          }));

          // Replace invoice items only if we got items
          if (result.invoiceItems.length > 0) {
            setInvoiceItems(result.invoiceItems);
          }

          // Load payment details if available
          if (result.paymentData) {
            setPaymentData(currentData => ({
              ...currentData,
              ...result.paymentData,
            }));
          }

          // Fetch customer details if customer_id is available
          if (result.formData.customer_id) {
            try {
              const customerResponse = await fetch('/api/dropdown/customers');
              if (customerResponse.ok) {
                const customersData = await customerResponse.json();
                const customer = customersData.customers.find(
                  (c: Customer) => c.id === result.formData.customer_id
                );

                if (customer) {
                  setSelectedCustomer(customer);

                  // Update ship_to with customer's address if it's empty
                  if (!result.formData.ship_to && customer.address) {
                    setFormData(currentData => ({
                      ...currentData,
                      ship_to: customer.address,
                    }));
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching customer details:', error);
            }
          }

          // Fetch salesman details if salesman_id is available
          if (result.formData.salesman_id) {
            try {
              const salesmanResponse = await fetch('/api/dropdown/salesmen');
              if (salesmanResponse.ok) {
                const salesmenData = await salesmanResponse.json();
                const salesman = salesmenData.salesmen.find(
                  (s: Salesman) => s.id === result.formData.salesman_id
                );

                if (salesman) {
                  setSelectedSalesman(salesman);
                }
              }
            } catch (error) {
              console.error('Error fetching salesman details:', error);
            }
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
    [showSnackbar]
  );

  // Check for invoice ID in URL query params on component mount
  useEffect(() => {
    // Check for any query param that could be an invoice ID
    const id = searchParams.get('id');
    if (id) {
      loadInvoice(id);
    }
  }, [searchParams, loadInvoice]);

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
            await loadInvoice(invoice.id);
          }
        }
      } catch (error) {
        console.error('Error searching for invoice:', error);
      }
    },
    [loadInvoice]
  );

  useEffect(() => {
    if (searchTerm) {
      const delaySearch = setTimeout(() => {
        searchInvoiceByNumber(searchTerm);
      }, 500);
      return () => clearTimeout(delaySearch);
    }
  }, [searchTerm, searchInvoiceByNumber]);

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false, invoiceStage = 'SALE') => {
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

      const invoiceData = {
        ...formData,
        status: saveAsDraft ? 'DRAFT' : 'PENDING',
        invoice_stage: invoiceStage,
        items: invoiceItems.filter(item => item.product_id), // Only send items with a product selected
        subtotal: totals.subtotal,
        discount: totals.discount,
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
    } catch (error: unknown) {
      console.error(isEditMode ? 'Error updating invoice:' : 'Error creating invoice:', error);
      showSnackbar(error instanceof Error ? error.message : 'Failed to process invoice', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-16 px-4 py-8 md:ml-[280px] md:px-6">
      <div className="mx-auto max-w-screen-2xl">
        <PageHeader
          heading={isEditMode ? 'Edit Sales Invoice' : 'Create Sales Invoice'}
          buttonText="Back to Invoices"
          onButtonClick={() => router.push('/invoices')}
        />

        {/* Invoice Search */}
        <InvoiceSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onOpenModal={() => setIsModalOpen(true)}
        />

        <form onSubmit={e => handleSubmit(e, false)}>
          <SalesInvoiceDetails
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={customer => setSelectedCustomer(customer)}
            selectedSalesman={selectedSalesman}
            setSelectedSalesman={salesman => setSelectedSalesman(salesman)}
          />

          <SalesTaxDiscount
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
            onTaxDiscountChange={() => setInvoiceItems([...invoiceItems])}
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

          {/* Payment Details */}
          <PaymentDetails paymentData={paymentData} setPaymentData={setPaymentData} />

          <div className="mt-6 flex justify-end space-x-4">
            <Button
              type="button"
              variant="outlined"
              onClick={e => handleSubmit(e, true)}
              disabled={isSubmitting || isLoadingInvoice}
            >
              Save as Draft
            </Button>

            <Button
              variant="contained"
              disabled={isSubmitting || isLoadingInvoice}
              className="bg-gradient-to-r from-red-500 to-blue-500 transition-all duration-300 hover:scale-105"
              {...bindTrigger(popupState)}
            >
              {isEditMode ? 'Update Invoice' : 'Create Invoice'}
            </Button>
            <Menu {...bindMenu(popupState)}>
              <MenuItem
                onClick={e => {
                  popupState.close();
                  handleSubmit(e, false, 'SALE');
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
                  handleSubmit(e, false, 'QUOTATION');
                }}
              >
                Quotation
              </MenuItem>
            </Menu>
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
  );
}
