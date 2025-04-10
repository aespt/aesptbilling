'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const PrintButton = ({ invoiceId }: { invoiceId: string | string[] | undefined }) => {
  const handlePrintClick = async () => {
    if (!invoiceId) {
      console.error('Invoice ID is undefined');
      return;
    }

    try {
      const response = await fetch(`/api/invoices/pdf/${invoiceId}`);
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

  useEffect(() => {
    // Check if the PDF is available by making a HEAD request
    const checkPdfAvailability = async () => {
      try {
        const response = await fetch(`/api/invoices/pdf/${invoiceId}`, {
          method: 'HEAD',
        });

        if (!response.ok) {
          // If response is not OK, try to get error details
          const errorResponse = await fetch(`/api/invoices/pdf/${invoiceId}`);
          const errorData = await errorResponse.json();
          throw new Error(errorData.error || errorData.details || 'Failed to load invoice PDF');
        }
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
          {/* Floating Action Panel - Only show when not loading */}
          {!loading && (
            <div className="fixed right-6 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-3 transition-all duration-300 ease-in-out print:hidden">
              <PrintButton invoiceId={invoiceId} />

              <button
                onClick={() => {
                  const pdfUrl = `/api/invoices/pdf/${invoiceId}`;
                  const link = document.createElement('a');
                  link.href = pdfUrl;
                  link.download = `invoice-${invoiceId}.pdf`;
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

          {/* PDF Container */}
          <div className="h-full overflow-hidden bg-white">
            <iframe
              id="pdf-iframe"
              src={`/api/invoices/pdf/${invoiceId}`}
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
          </div>
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
