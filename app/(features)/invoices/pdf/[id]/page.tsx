'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const PrintButton = ({ invoiceId }: { invoiceId: string | string[] | undefined }) => {
  const handlePrintClick = async () => {
    if (!invoiceId) return;

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
      className="group flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-0.5"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 group-hover:scale-110 transition-transform duration-300"
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
    <div className="w-full h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {loading && (
        <>
          
          <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
            {/* PDF skeleton loader */}
            <div className="relative w-full h-full max-w-4xl mx-auto bg-white shadow-lg rounded-md overflow-hidden">
              {/* Fake PDF header */}
              <div className="h-12 bg-gray-100 border-b border-gray-200 flex items-center px-4">
                <div className="w-24 h-4 bg-gray-300 rounded animate-pulse"></div>
                <div className="ml-auto flex space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse"></div>
                </div>
              </div>

              {/* Fake PDF content with blurry text */}
              <div className="p-8 h-full">
                {/* Title and company header */}
                <div className="flex justify-between mb-8">
                  <div>
                    <div className="w-40 h-8 bg-gray-300 rounded mb-2 blur-[2px] animate-pulse"></div>
                    <div className="w-60 h-4 bg-gray-300 rounded blur-[2px] animate-pulse"></div>
                  </div>
                  <div>
                    <div className="w-32 h-10 bg-gray-300 rounded mb-2 blur-[2px] animate-pulse"></div>
                  </div>
                </div>

                {/* Invoice details */}
                <div className="flex justify-between mb-8">
                  <div className="w-1/2 pr-4">
                    <div className="h-5 w-20 bg-gray-300 rounded mb-3 blur-[2px] animate-pulse"></div>
                    <div className="h-4 w-48 bg-gray-300 rounded mb-2 blur-[2px] animate-pulse"></div>
                    <div className="h-4 w-40 bg-gray-300 rounded mb-2 blur-[2px] animate-pulse"></div>
                    <div className="h-4 w-44 bg-gray-300 rounded blur-[2px] animate-pulse"></div>
                  </div>
                  <div className="w-1/2 pl-4">
                    <div className="h-5 w-28 bg-gray-300 rounded mb-3 blur-[2px] animate-pulse"></div>
                    <div className="h-4 w-36 bg-gray-300 rounded mb-2 blur-[2px] animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-300 rounded mb-2 blur-[2px] animate-pulse"></div>
                    <div className="h-4 w-32 bg-gray-300 rounded blur-[2px] animate-pulse"></div>
                  </div>
                </div>

                {/* Table-like structure */}
                <div className="mt-8 border border-gray-200 rounded-md blur-[2px] mb-8">
                  <div className="h-10 bg-gray-100 flex">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex-1 p-2">
                        <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 flex border-t border-gray-200">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="flex-1 p-2">
                          <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Footer section - based on invoice-footer.html */}
                <div className="mt-auto">
                  {/* Footer text container */}
                  <div className="mx-5 my-3 p-4 bg-gray-100 rounded">
                    <div className="h-3 w-full bg-gray-300 rounded mb-1 blur-[2px] animate-pulse"></div>
                    <div className="h-3 w-11/12 bg-gray-300 rounded mb-1 blur-[2px] animate-pulse"></div>
                    <div className="h-3 w-full bg-gray-300 rounded blur-[2px] animate-pulse"></div>
                  </div>

                  {/* Signature section */}
                  <div className="mx-5 my-8 flex justify-between">
                    <div className="w-1/3">
                      <div className="h-px bg-gray-300 w-full"></div>
                      <div className="h-3 w-32 bg-gray-300 rounded mt-3 blur-[2px] animate-pulse"></div>
                    </div>
                    <div className="w-1/3">
                      <div className="h-px bg-gray-300 w-full"></div>
                      <div className="h-3 w-64 bg-gray-300 rounded mt-3 blur-[2px] animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Centered spinner overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-40 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-b-red-500 border-l-blue-300 border-r-red-300 animate-spin"></div>

            </div>

            {/* Skeleton for the action buttons (right side) */}
            <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
              <div className="w-36 h-10 bg-gray-300 rounded-lg animate-pulse"></div>
              <div className="w-36 h-10 bg-gray-300 rounded-lg animate-pulse"></div>
              <div className="w-36 h-10 bg-gray-300 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </>
      )}

      {error ? (
        <div className="flex flex-col items-center justify-center h-full">
          <div
            className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-lg mb-4 max-w-md"
            role="alert"
          >
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            className="group flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-0.5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 group-hover:scale-110 transition-transform duration-300"
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
            <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50 print:hidden transition-all duration-300 ease-in-out transform">
              <PrintButton invoiceId={invoiceId} />

              <button
                onClick={() => {
                  const pdfUrl = `/api/invoices/pdf/${invoiceId}`;
                  const link = document.createElement('a');
                  link.href = pdfUrl;
                  link.download = `invoice-${invoiceId}.pdf`;
                  link.click();
                }}
                className="group flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-0.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 group-hover:scale-110 transition-transform duration-300"
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
                className="group flex items-center gap-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-0.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 group-hover:scale-110 transition-transform duration-300"
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
          <div className="h-full bg-white  overflow-hidden">
            <iframe
              id="pdf-iframe"
              src={`/api/invoices/pdf/${invoiceId}`}
              className="w-full h-full border-none"
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

      <style jsx global>{`
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
