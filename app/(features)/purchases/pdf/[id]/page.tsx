/* eslint-disable import/order */
'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';
import { downloadPdf, generatePurchasePDF } from '@/app/lib/pdfGenerator';

// // Define purchase interface with necessary properties
// interface Purchase {
//   id: number;
//   purchase_number: string;
//   purchase_date: string;
//   // Add other properties as needed
// }

// Define PDF data interface for proper typing
interface PdfData {
  purchase: {
    purchase_number?: string;
    purchase_date?: string;
    ship_from?: string;
  };
  supplier: {
    name?: string;
    tax_registration_number?: string;
    address?: string;
    contact_number?: string;
  };
  primaryAddress: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    phone_no?: string;
    transaction_no?: string;
  };
  productsWithItems: Array<{
    item: {
      quantity: number;
    };
    product: {
      partNo?: string;
      brand?: string;
      name?: string;
    };
  }>;
  formattedDate: string;
  documentTitle: string;
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

const PrintButton = ({
  purchaseId,
  pdfUrl,
  setPdfUrl,
}: {
  purchaseId: string | string[] | undefined;
  pdfUrl?: string;
  setPdfUrl: (url: string) => void;
}) => {
  const handlePrintClick = async () => {
    if (!purchaseId || typeof window === 'undefined') {
      // Purchase ID is undefined or not in browser environment
      return;
    }

    try {
      if (pdfUrl) {
        // Printing PDF from existing URL
        const printWindow = window.open(pdfUrl, '_blank');
        if (printWindow) {
          printWindow.addEventListener('load', () => {
            printWindow.print();
          });
        } else {
          // Failed to open print window - popup blocked?
          // Try direct print
          window.print();
        }
      } else {
        // No PDF URL available, generating new PDF
        // Get current query parameters
        const queryParams = window.location.search;

        // Fetch purchase data
        const response = await fetch(`/api/purchases/pdf/${purchaseId}${queryParams}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch purchase data: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success || !data.data) {
          throw new Error('Invalid data received from server');
        }

        // Generate PDF and get the blob URL
        const blobUrl = await generatePurchasePDF(data.data);

        // Update the PDF URL
        setPdfUrl(blobUrl);

        // Open the PDF in a new window for printing
        const printWindow = window.open(blobUrl, '_blank');
        if (printWindow) {
          printWindow.addEventListener('load', () => {
            printWindow.print();
          });
        }
      }
    } catch (error) {
      console.error('Error printing PDF:', error);
      window.print(); // Fallback to printing the current page
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
      Print Purchase Order
    </button>
  );
};

const PurchasePdfPage = () => {
  const params = useParams();
  const router = useRouter();
  const purchaseId = params.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfData, setPdfData] = useState<PdfData | null>(null);

  const pdfObjectRef = useRef<HTMLObjectElement>(null);

  useEffect(() => {
    const fetchPurchaseData = async () => {
      try {
        setLoading(true);

        // Get any existing query parameters if in browser environment
        const queryParams = typeof window !== 'undefined' ? window.location.search : '';
        const url = `/api/purchases/pdf/${purchaseId}${queryParams}`;

        // Fetch the purchase data
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch purchase data: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error('Invalid data received from server');
        }

        // Store the PDF data
        setPdfData(result.data);

        // Then fetch purchase details
        const purchaseResponse = await fetch(`/api/purchases/${purchaseId}`);
        if (!purchaseResponse.ok) {
          throw new Error('Failed to load purchase details');
        }

        // const purchaseData = await purchaseResponse.json();
        // setPurchase(purchaseData.data);

        // Generate PDF on load
        if (typeof window !== 'undefined') {
          // Generate the PDF
          const blobUrl = await generatePurchasePDF(result.data);
          setPdfUrl(blobUrl);
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate PDF');
        setLoading(false);
      }
    };

    fetchPurchaseData();

    return () => {
      // Cleanup function
      const buttonsContainer = document.querySelector('.fixed.top-4.right-4');
      if (buttonsContainer) {
        document.body.removeChild(buttonsContainer);
      }
    };
  }, [purchaseId]);

  // When data is received, trigger PDF generation if needed
  useEffect(() => {
    const regeneratePdf = async () => {
      if (!pdfData || pdfUrl) {
        return;
      }

      try {
        // Generate the PDF
        const blobUrl = await generatePurchasePDF(pdfData);
        setPdfUrl(blobUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate PDF');
      }
    };

    if (pdfData && !loading && !error) {
      regeneratePdf();
    }
  }, [pdfData, pdfUrl, loading, error]);

  useEffect(() => {
    // Add error handler to the PDF object element
    const handlePdfError = () => {
      setLoading(false);
      setError('Failed to load the PDF.');
    };

    if (pdfObjectRef.current) {
      pdfObjectRef.current.addEventListener('error', handlePdfError);
    }

    return () => {
      if (pdfObjectRef.current) {
        pdfObjectRef.current.removeEventListener('error', handlePdfError);
      }
    };
  }, [pdfUrl]); // Re-run when pdfUrl changes

  const handleIframeLoad = () => {
    setLoading(false);
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
                <PrintButton purchaseId={purchaseId} pdfUrl={pdfUrl} setPdfUrl={setPdfUrl} />

                <button
                  onClick={async () => {
                    try {
                      if (pdfUrl) {
                        // Download the PDF
                        const filename = `purchase-order-${purchaseId}.pdf`;
                        downloadPdf(pdfUrl, filename);
                      } else {
                        // If PDF URL is not available yet, generate it
                        const queryParams = window.location.search;
                        const response = await fetch(
                          `/api/purchases/pdf/${purchaseId}${queryParams}`
                        );
                        if (!response.ok) {
                          throw new Error(`Failed to fetch purchase data: ${response.status}`);
                        }

                        const result = await response.json();
                        if (!result.success || !result.data) {
                          throw new Error('Invalid data received from server');
                        }

                        // Generate the PDF
                        const blobUrl = await generatePurchasePDF(result.data);

                        // Determine filename
                        const filename = `purchase-order-${purchaseId}.pdf`;

                        // Download PDF
                        downloadPdf(blobUrl, filename);

                        // Update PDF URL for viewing
                        setPdfUrl(blobUrl);
                      }
                    } catch (error) {
                      // Error downloading PDF
                      alert(
                        `Error downloading PDF: ${error instanceof Error ? error.message : String(error)}`
                      );
                    }
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

            {/* PDF iframe - only render on client */}
            <div className="h-full overflow-hidden bg-white">
              <ClientOnly>
                {pdfUrl ? (
                  <>
                    <object
                      ref={pdfObjectRef}
                      id="pdf-iframe"
                      data={pdfUrl}
                      type="application/pdf"
                      className="size-full border-none"
                      style={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        border: '0',
                        overflow: 'hidden',
                      }}
                      onLoad={handleIframeLoad}
                    >
                      <div className="flex h-full items-center justify-center">
                        <p>
                          Your browser cannot display the PDF.{' '}
                          <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            Click here to download
                          </a>
                          .
                        </p>
                      </div>
                    </object>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="mb-4 max-w-md text-center">
                      <h3 className="mb-4 text-lg font-semibold text-gray-800">
                        Generating PDF...
                      </h3>
                      <p className="text-gray-600">
                        Please wait while we generate your purchase order PDF.
                      </p>
                    </div>
                  </div>
                )}
              </ClientOnly>
            </div>
          </ClientOnly>
          {/* Fallback for server-side rendering */}
          <noscript>
            <div className="flex h-full items-center justify-center">
              <p className="text-lg text-gray-700">
                Please enable JavaScript to view the PDF purchase order.
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

        /* Fix iframe scrolling for long purchases */
        #pdf-iframe {
          width: 100%;
          height: 100vh;
          display: block;
        }
      `}</style>
    </div>
  );
};

export default PurchasePdfPage;
