'use client';

import { useCallback, useState } from 'react';

import { generateInvoicePDF } from '../lib/pdfGenerator';

interface InvoicePdfButtonPostProps {
  invoiceId: number;
  invoiceStage: string; // Required for POST method
  variant?: 'default' | 'outline' | 'destructive' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export default function InvoicePdfButtonPost({
  invoiceId,
  invoiceStage,
  variant = 'default',
  size = 'md',
  label = 'Generate PDF',
  className = '',
}: InvoicePdfButtonPostProps) {
  const [isLoading, setIsLoading] = useState(false);

  const generatePdf = useCallback(async () => {
    try {
      setIsLoading(true);

      // Use POST method with invoice stage in the body
      const response = await fetch(`/api/invoices/pdf/${invoiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceStage }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch invoice data: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error('Invalid data received from server');
      }

      // Generate the PDF using the data
      await generateInvoicePDF(data.data);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // You can add a toast notification here
      alert(`Error generating PDF: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId, invoiceStage]);

  const buttonClasses = {
    base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'underline-offset-4 hover:underline text-primary',
    },
    size: {
      sm: 'h-9 px-3 text-xs',
      md: 'h-10 py-2 px-4',
      lg: 'h-11 px-8',
    },
  };

  const buttonClass = `${buttonClasses.base} ${buttonClasses.variant[variant]} ${buttonClasses.size[size]} ${className}`;

  return (
    <button type="button" onClick={generatePdf} disabled={isLoading} className={buttonClass}>
      {isLoading ? 'Generating...' : label}
    </button>
  );
}
