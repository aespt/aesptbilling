'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

// Define invoice interface with necessary properties
interface Invoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  invoice_stage: 'SALE' | 'PROFORMA' | 'QUOTATION';
  // Add other properties as needed
}

// Client-only wrapper component to prevent hydration errors
const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
};

const PrintButton = ({ invoiceId }: { invoiceId: string | string[] | undefined }) => {
  const handlePrintClick = async () => {
    if (!invoiceId || typeof window === 'undefined') {
      console.error('Invoice ID is undefined or not in browser environment');
      return;
    }

    try {
      // Get current query parameters
      const queryParams = window.location.search;

      const response = await fetch(`/api/invoices/pdf/${invoiceId}${queryParams}`);
      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');

      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    } catch (error) {
      console.error('Error printing PDF:', error);
      window.print();
    }
  };

  return (
    <button
      onClick={handlePrintClick}
      className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 font-medium text-white shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-5 transition-transform duration-300 group-hover:scale-110"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
        />
      </svg>
      Print Invoice
    </button>
  );
};

const InvoicePdfPage = () => {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  useEffect(() => {
    // Set PDF URL on client side
    if (typeof window !== 'undefined') {
      setPdfUrl(`/api/invoices/pdf/${invoiceId}${window.location.search}`);
    }

    // Check if the PDF is available and fetch invoice details
    const checkPdfAvailability = async () => {
      try {
        // Get any existing query parameters if in browser environment
        const queryParams = typeof window !== 'undefined' ? window.location.search : '';

        // First check PDF availability
        const response = await fetch(`/api/invoices/pdf/${invoiceId}${queryParams}`, {
          method: 'HEAD',
        });

        if (!response.ok) {
          throw new Error('Failed to load invoice PDF');
        }

        // Then fetch invoice details to get the stage
        const invoiceResponse = await fetch(`/api/invoices/${invoiceId}`);
        if (!invoiceResponse.ok) {
          throw new Error('Failed to load invoice details');
        }

        const invoiceData = await invoiceResponse.json();
        setInvoice(invoiceData.data);
      } catch (err) {
        console.error('Error checking PDF availability:', err);
        setError(err instanceof Error ? err.message : 'Failed to load invoice PDF');
        setLoading(false);
      }
    };

    checkPdfAvailability();

    return () => {
      // Cleanup function
      const buttonsContainer = document.querySelector('.fixed.top-4.right-4');
      if (buttonsContainer) {
        document.body.removeChild(buttonsContainer);
      }
    };
  }, [invoiceId, error]);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError('Failed to load the PDF.');
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100">
      {loading && (
        <>
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white">
            {/* PDF skeleton loader */}
            <div className="relative mx-auto size-full max-w-4xl overflow-hidden rounded-md bg-white shadow-lg">
              {/* Fake PDF header */}
              <div className="flex h-12 items-center border-b border-gray-200 bg-gray-100 px-4">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-300" />
                <div className="ml-auto flex space-x-2">
                  <div className="size-8 animate-pulse rounded-full bg-gray-300" />
                  <div className="size-8 animate-pulse rounded-full bg-gray-300" />
                </div>
              </div>

              {/* Fake PDF content with blurry text */}
              <div className="h-full p-8">
                {/* Title and company header */}
                <div className="mb-8 flex justify-between">
                  <div>
                    <div className="mb-2 h-8 w-40 animate-pulse rounded bg-gray-300 blur-[2px]" />
                    <div className="h-4 w-60 animate-pulse rounded bg-gray-300 blur-[2px]" />
                  </div>
                  <div>
                    <div className="mb-2 h-10 w-32 animate-pulse rounded bg-gray-300 blur-[2px]" />
                  </div>
                </div>

                {/* Invoice details */}
                <div className="mb-8 flex justify-between">
                  <div className="w-1/2 pr-4">
                    <div className="mb-3 h-5 w-20 animate-pulse rounded bg-gray-300 blur-[2px]" />
                    <div className="mb-2 h-4 w-48 animate-pulse rounded bg-gray-300 blur-[2px]" />
                    <div className="mb-2 h-4 w-40 animate-pulse rounded bg-gray-300 blur-[2px]" />
                    <div className="h-4 w-44 animate-pulse rounded bg-gray-300 blur-[2px]" />
                  </div>
                  <div className="w-1/2 pl-4">
                    <div className="mb-3 h-5 w-28 animate-pulse rounded bg-gray-300 blur-[2px]" />
                    <div className="mb-2 h-4 w-36 animate-pulse rounded bg-gray-300 blur-[2px]" />
                    <div className="mb-2 h-4 w-24 animate-pulse rounded bg-gray-300 blur-[2px]" />
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-300 blur-[2px]" />
                  </div>
                </div>

                {/* Table-like structure */}
                <div className="my-8 rounded-md border border-gray-200 blur-[2px]">
                  <div className="flex h-10 bg-gray-100">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex-1 p-2">
                        <div className="h-4 animate-pulse rounded bg-gray-300" />
                      </div>
                    ))}
                  </div>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex h-12 border-t border-gray-200">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="flex-1 p-2">
                          <div className="h-4 animate-pulse rounded bg-gray-300" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Footer section - based on invoice-footer.html */}
                <div className="mt-auto">
                  {/* Footer text container */}
                  <div className="mx-5 my-3 rounded bg-gray-100 p-4">
                    <div className="mb-1 h-3 w-full animate-pulse rounded bg-gray-300 blur-[2px]" />
                    <div className="mb-1 h-3 w-11/12 animate-pulse rounded bg-gray-300 blur-[2px]" />
                    <div className="h-3 w-full animate-pulse rounded bg-gray-300 blur-[2px]" />
                  </div>

                  {/* Signature section */}
                  <div className="mx-5 my-8 flex justify-between">
                    <div className="w-1/3">
                      <div className="h-px w-full bg-gray-300" />
                      <div className="mt-3 h-3 w-32 animate-pulse rounded bg-gray-300 blur-[2px]" />
                    </div>
                    <div className="w-1/3">
                      <div className="h-px w-full bg-gray-300" />
                      <div className="mt-3 h-3 w-64 animate-pulse rounded bg-gray-300 blur-[2px]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Centered spinner overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-40 backdrop-blur-sm">
              <div className="size-12 animate-spin rounded-full border-4 border-b-red-500 border-l-blue-300 border-r-red-300 border-t-blue-500" />
            </div>

            {/* Skeleton for the action buttons (right side) */}
            <div className="fixed right-6 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-3">
              <div className="h-10 w-36 animate-pulse rounded-lg bg-gray-300" />
              <div className="h-10 w-36 animate-pulse rounded-lg bg-gray-300" />
              <div className="h-10 w-36 animate-pulse rounded-lg bg-gray-300" />
            </div>
          </div>
        </>
      )}

      {error ? (
        <div className="flex h-full flex-col items-center justify-center">
          <div
            className="mb-4 max-w-md rounded-lg border-l-4 border-red-500 bg-red-50 p-4 text-red-700 shadow-lg"
            role="alert"
          >
            <div className="flex items-center">
              <svg className="mr-2 size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 font-medium text-white shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-5 transition-transform duration-300 group-hover:scale-110"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Go Back
          </button>
        </div>
      ) : (
        <div className="relative h-full">
          <ClientOnly>
            {/* Floating Action Panel - Only show when not loading */}
            {!loading && (
              <div className="fixed right-6 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-3 transition-all duration-300 ease-in-out print:hidden">
                <PrintButton invoiceId={invoiceId} />

                <button
                  onClick={() => {
                    // Get current query parameters
                    const queryParams = window.location.search;
                    const pdfUrl = `/api/invoices/pdf/${invoiceId}${queryParams}`;
                    const link = document.createElement('a');
                    link.href = pdfUrl;

                    // Set filename based on invoiceStage if available
                    const invoiceStage = new URLSearchParams(window.location.search).get(
                      'invoiceStage'
                    );
                    let filename = `invoice-${invoiceId}.pdf`;
                    if (invoiceStage === 'DELIVERY') {
                      filename = `delivery-note-${invoiceId}.pdf`;
                    } else if (invoiceStage === 'QUOTATION') {
                      filename = `quotation-${invoiceId}.pdf`;
                    } else if (invoiceStage === 'PROFORMA') {
                      filename = `proforma-invoice-${invoiceId}.pdf`;
                    }

                    link.download = filename;
                    link.click();
                  }}
                  className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 font-medium text-white shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-5 transition-transform duration-300 group-hover:scale-110"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </button>

                {/* Delivery Note button - only visible when invoice_stage is SALE */}
                {new URLSearchParams(window.location.search).get('invoiceStage') === 'SALE' &&
                  invoice !== null && (
                    <button
                      onClick={() => {
                        // Get any existing query parameters from the current URL
                        const currentUrl = new URL(window.location.href);
                        const queryParams = new URLSearchParams(currentUrl.search);

                        // Set the invoiceStage parameter
                        queryParams.set('invoiceStage', 'DELIVERY');

                        // Open a delivery note version of the invoice with all query params
                        window.open(
                          `/invoices/pdf/${invoiceId}?${queryParams.toString()}`,
                          '_blank'
                        );
                      }}
                      className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2.5 font-medium text-white shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:from-purple-600 hover:to-purple-700 hover:shadow-xl"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-5 transition-transform duration-300 group-hover:scale-110"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      Delivery Note
                    </button>
                  )}

                <button
                  onClick={() => window.close()}
                  className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2.5 font-medium text-white shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:from-rose-600 hover:to-rose-700 hover:shadow-xl"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-5 transition-transform duration-300 group-hover:scale-110"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Close
                </button>
              </div>
            )}

            {/* PDF iframe - only render on client */}
            <div className="h-full overflow-hidden bg-white">
              <ClientOnly>
                <iframe
                  id="pdf-iframe"
                  src={pdfUrl}
                  className="size-full border-none"
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    border: '0',
                    overflow: 'hidden',
                  }}
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  title="Invoice PDF"
                />
              </ClientOnly>
            </div>
          </ClientOnly>
          {/* Fallback for server-side rendering */}
          <noscript>
            <div className="flex h-full items-center justify-center">
              <p className="text-lg text-gray-700">
                Please enable JavaScript to view the PDF invoice.
              </p>
            </div>
          </noscript>
        </div>
      )}

      {/* Global styles for printing */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }

          html,
          body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }

          body * {
            visibility: hidden;
          }

          #pdf-iframe,
          #pdf-iframe * {
            visibility: visible;
          }

          #pdf-iframe {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            height: 100% !important;
            border: none;
            margin: 0;
            padding: 0;
            transform-origin: top left;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print:hidden {
            display: none !important;
          }
        }

        /* Fix iframe scrolling for long invoices */
        #pdf-iframe {
          width: 100%;
          height: 100vh;
          display: block;
        }
      `}</style>
    </div>
  );
};

export default InvoicePdfPage;
