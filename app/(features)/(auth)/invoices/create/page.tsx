"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/app/shared/components/page-header";
import Snackbar from "@/app/shared/components/snackbar";
import useSnackbar from "@/app/shared/hooks/useSnackbar";
import { Button } from "@mui/material";
import SalesInvoiceDetails from "../components/sales-invoice-details";
import SalesTaxDiscount from "../components/sales-tax-discount";
import SalesInvoiceItems from "../components/sales-invoice-items";
import SalesInvoiceSummary from "../components/sales-invoice-summary";
import PrimaryButton from "@/app/shared/components/primary-button";

export default function CreateInvoicePage() {
  const router = useRouter();
  const { isOpen, message, type, showSnackbar, hideSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    invoice_number: "",
    date: new Date(),
    salesman_id: null as number | null,
    ship_from: "",
    customer_id: null as number | null,
    ship_to: "",
    status: "DRAFT",
    // Tax and discount fields
    tax_type: "VAT",
    vat_percentage: 5,
    cgst_percentage: 0,
    sgst_percentage: 0,
    discount_type: "PERCENTAGE",
    discount_value: 0
  });

  // Invoice items
  const [invoiceItems, setInvoiceItems] = useState<any[]>([
    {
      id: Date.now().toString(),
      product_id: null,
      part_no: "",
      qty: 1,
      rate: 0,
      total: 0
    }
  ]);

  // Form validation
  const [errors, setErrors] = useState({
    invoice_number: "",
    customer_id: "",
    salesman_id: "",
    items: "",
  });

  // Force re-render of components when tax or discount changes
  const handleTaxDiscountChange = () => {
    // This is just to trigger a re-render of the summary
    setInvoiceItems([...invoiceItems]);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {
      invoice_number: !formData.invoice_number ? "Invoice number is required" : "",
      customer_id: !formData.customer_id ? "Customer is required" : "",
      salesman_id: !formData.salesman_id ? "Salesman is required" : "",
      items: invoiceItems.length === 0 ? "At least one item is required" : 
             invoiceItems.some(item => !item.product_id) ? "All items must have a product selected" : "",
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
      discountAmount = (subtotal * formData.discount_value) / 100;
    } else if (formData.discount_type === 'FIXED') {
      discountAmount = Math.min(formData.discount_value, subtotal);
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
      total
    };
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
      
      const invoiceData = {
        ...formData,
        status: saveAsDraft ? "DRAFT" : "PENDING",
        items: invoiceItems.filter(item => item.product_id), // Only send items with a product selected
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total
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

      showSnackbar('Invoice created successfully', 'success');
      router.push('/invoices');
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      showSnackbar(error.message || 'Failed to create invoice', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="md:ml-[280px] px-4 md:px-6 py-8 mt-16">
      <div className="max-w-screen-2xl mx-auto">
        <PageHeader
          heading="Create Sales Invoice"
          buttonText="Back to Invoices"
          onButtonClick={() => router.push('/invoices')}
        />
        
        <form onSubmit={(e) => handleSubmit(e, false)}>
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
            invoiceItems={invoiceItems}
            setInvoiceItems={setInvoiceItems}
            errors={errors}
            setErrors={setErrors}
          />
          
          <SalesInvoiceSummary 
            invoiceItems={invoiceItems}
            formData={formData}
          />
          
          <div className="flex justify-end space-x-4 mt-6">
            <Button
              type="button"
              variant="outlined"
              onClick={(e) => handleSubmit(e, true)}
              disabled={isSubmitting}
            >
              Save as Draft
            </Button>
            <PrimaryButton
              label="Create Invoice"
              type="submit"
              disabled={isSubmitting}
            />
          </div>
        </form>
      </div>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={isOpen}
        message={message}
        type={type}
        onClose={hideSnackbar}
      />
    </div>
  );
} 