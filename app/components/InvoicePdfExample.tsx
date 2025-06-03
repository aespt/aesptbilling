'use client';

import InvoicePdfButton from './InvoicePdfButton';
import InvoicePdfButtonPost from './InvoicePdfButtonPost';

interface InvoicePdfExampleProps {
  invoiceId: number;
}

export default function InvoicePdfExample({ invoiceId }: InvoicePdfExampleProps) {
  return (
    <div className="flex flex-col gap-4 rounded-md border p-4">
      <h3 className="text-lg font-semibold">PDF Generation Options</h3>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Using GET Method</h4>
          <div className="flex flex-wrap gap-2">
            <InvoicePdfButton invoiceId={invoiceId} label="Invoice PDF" variant="default" />
            <InvoicePdfButton
              invoiceId={invoiceId}
              invoiceStage="DELIVERY"
              label="Delivery Note"
              variant="outline"
            />
            <InvoicePdfButton
              invoiceId={invoiceId}
              invoiceStage="QUOTATION"
              label="Quotation"
              variant="ghost"
            />
            <InvoicePdfButton
              invoiceId={invoiceId}
              invoiceStage="PROFORMA"
              label="Proforma Invoice"
              variant="link"
            />
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Using POST Method</h4>
          <div className="flex flex-wrap gap-2">
            <InvoicePdfButtonPost
              invoiceId={invoiceId}
              invoiceStage="SALE"
              label="Invoice PDF"
              variant="default"
            />
            <InvoicePdfButtonPost
              invoiceId={invoiceId}
              invoiceStage="DELIVERY"
              label="Delivery Note"
              variant="outline"
            />
            <InvoicePdfButtonPost
              invoiceId={invoiceId}
              invoiceStage="QUOTATION"
              label="Quotation"
              variant="ghost"
            />
            <InvoicePdfButtonPost
              invoiceId={invoiceId}
              invoiceStage="PROFORMA"
              label="Proforma Invoice"
              variant="link"
            />
          </div>
        </div>
      </div>

      <div className="mt-2 text-sm text-gray-600">
        <p>
          Note: PDFs are generated on the client-side using PDFKit. No server-side rendering is
          used.
        </p>
      </div>
    </div>
  );
}
