'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const PrintButton = ({ invoiceId }: { invoiceId: string | string[] | undefined }) => {
  const handlePrintClick = async () => {
    if (!invoiceId) return;
    
    try {
      // Fetch the PDF data
      const response = await fetch(`/api/invoices/pdf/${invoiceId}`);
      const pdfBlob = await response.blob();
      
      // Create a URL for the blob
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Open a new window with the PDF
      const printWindow = window.open(pdfUrl, '_blank');
      
      // If the window was opened successfully, trigger print
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    } catch (error) {
      console.error('Error printing PDF:', error);
      // Fall back to basic print
      window.print();
    }
  };

  return (
    <button
      onClick={handlePrintClick}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
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
          method: 'HEAD'
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

    // Add event listener to handle the print button functionality
    const handlePrint = () => {
      window.print();
    };

    // Add the buttons to the document
    const addButtons = () => {
      const iframe = document.getElementById('pdf-iframe') as HTMLIFrameElement;
      if (!iframe) return;

      // Create buttons container with fixed position
      const buttonsContainer = document.createElement('div');
      buttonsContainer.className = 'fixed top-4 right-4 flex space-x-2 z-50 print:hidden';
      document.body.appendChild(buttonsContainer);

      // Create print button
      const printButton = document.createElement('button');
      printButton.innerText = 'Print';
      printButton.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded';
      printButton.onclick = handlePrint;
      buttonsContainer.appendChild(printButton);

      // Create download button
      const downloadButton = document.createElement('button');
      downloadButton.innerText = 'Download';
      downloadButton.className = 'bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded';
      downloadButton.onclick = () => {
        const pdfUrl = `/api/invoices/pdf/${invoiceId}`;
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `invoice-${invoiceId}.pdf`;
        link.click();
      };
      buttonsContainer.appendChild(downloadButton);

      // Create close button
      const closeButton = document.createElement('button');
      closeButton.innerText = 'Close';
      closeButton.className = 'bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded';
      closeButton.onclick = () => {
        window.close();
      };
      buttonsContainer.appendChild(closeButton);
    };

    if (!error) {
      setTimeout(addButtons, 1000); // Give the iframe a moment to load
    }

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
    <div className="w-full h-screen bg-gray-100">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error ? (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
          <button 
            onClick={() => router.back()} 
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go Back
          </button>
        </div>
      ) : (
        <>
          <div className="fixed top-4 left-4 z-50 print:hidden">
            <PrintButton invoiceId={invoiceId} />
          </div>
          <iframe
            id="pdf-iframe"
            src={`/api/invoices/pdf/${invoiceId}`}
            className="w-full h-full border-none"
            style={{ 
              display: 'block',
              width: '100%',
              height: '100%',
              border: '0',
              overflow: 'hidden'
            }}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="Invoice PDF"
          />
        </>
      )}
      
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
          
          body * {
            visibility: hidden;
          }
          
          #pdf-iframe, #pdf-iframe * {
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