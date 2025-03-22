"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/app/shared/components/page-header";
import Snackbar from "@/app/shared/components/snackbar";
import useSnackbar from "@/app/shared/hooks/useSnackbar";
import { IconButton, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InvoiceDetailsSection from "../../invoices/components/invoice-details-section";
import CustomerInfoSection from "../../invoices/components/customer-info-section";
import InvoiceItemsSection from "../../invoices/components/invoice-items-section";

export default function CreateInvoicePage() {
  const router = useRouter();
  const { isOpen, message, type, showSnackbar, hideSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    invoice_number: "",
    date: new Date(),
    due_date: new Date(new Date().setDate(new Date().getDate() + 30)),
    customer_id: null as number | null,
    shipping_address: "",
    billing_address: "",
    payment_terms: "NET_30",
    notes: "",
    status: "DRAFT",
  });

  // Invoice items
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);

  // Form validation
  const [errors, setErrors] = useState({
    invoice_number: "",
    customer_id: "",
    items: "",
  });

  // Validate form
  const validateForm = () => {
    const newErrors = {
      invoice_number: !formData.invoice_number ? "Invoice number is required" : "",
      customer_id: !formData.customer_id ? "Customer is required" : "",
      items: invoiceItems.length === 0 ? "At least one item is required" : "",
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  // Calculate invoice totals
  const calculateTotals = () => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountTotal = invoiceItems.reduce((sum, item) => {
      if (item.discount_type === "PERCENTAGE") {
        return sum + ((item.price * item.qty) * (item.discount_value / 100));
      } else if (item.discount_type === "FIXED") {
        return sum + item.discount_value;
      }
      return sum;
    }, 0);
    const taxTotal = invoiceItems.reduce((sum, item) => {
      const itemSubtotal = (item.price * item.qty) - (
        item.discount_type === "PERCENTAGE" 
          ? (item.price * item.qty) * (item.discount_value / 100)
          : item.discount_type === "FIXED" ? item.discount_value : 0
      );
      return sum + (itemSubtotal * (item.tax_rate / 100));
    }, 0);
    const total = subtotal - discountTotal + taxTotal;
    
    return { subtotal, discountTotal, taxTotal, total };
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
      const invoiceData = {
        ...formData,
        status: saveAsDraft ? "DRAFT" : "PENDING",
        items: invoiceItems,
        ...calculateTotals(),
      };

      const response = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create invoice');
      }

      showSnackbar('Invoice created successfully', 'success');
      router.push('/invoices');
    } catch (error) {
      console.error('Error creating invoice:', error);
      showSnackbar('Failed to create invoice', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="md:ml-[280px] px-4 md:px-6 py-8 mt-16">
      <div className="max-w-screen-2xl mx-auto">
        <PageHeader
          heading="Create Invoice"
          buttonText="Back to Invoices"
          onButtonClick={() => router.push('/invoices')}
        />
        
        <form onSubmit={(e) => handleSubmit(e, false)}>
          <InvoiceDetailsSection 
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
          
          <CustomerInfoSection 
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
          />
          
          <InvoiceItemsSection 
            invoiceItems={invoiceItems}
            setInvoiceItems={setInvoiceItems}
            errors={errors}
            setErrors={setErrors}
          />
          
          <div className="flex justify-end space-x-4 mt-6">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Invoice
            </Button>
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