import * as fs from 'fs';
import * as path from 'path';
import { type NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/drizzle';
import { AddressTable } from '@/lib/models/address';
import { BankDetailsTable } from '@/lib/models/bank_details';
import { CustomersTable } from '@/lib/models/customers';
import { InvoiceItemsTable } from '@/lib/models/invoice_items';
import { InvoicesTable } from '@/lib/models/invoices';
import { ProductsTable } from '@/lib/models/products';
import { SalesmenTable } from '@/lib/models/salesmen';

// Initialize Firebase Admin
let firebaseApp: admin.app.App;
try {
  firebaseApp = admin.app();
} catch (error) {
  // Initialize with service account if not already initialized
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const invoiceId = parseInt((await params).id);

    if (isNaN(invoiceId)) {
      console.error('Invalid invoice ID:', (await params).id);
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    // Get the invoiceStage from query parameter if it exists
    const url = new URL(request.url);

    const invoiceStage =
      url.searchParams.get('invoiceStage') ||
      url.searchParams.get('invoicestage') ||
      url.searchParams.get('InvoiceStage') ||
      url.searchParams.get('INVOICESTAGE');

    // Debugging information
    console.log(`Processing PDF for invoice ID: ${invoiceId}, stage: ${invoiceStage || 'default'}`);
    console.log(`Running in environment: ${process.env.NODE_ENV}`);

    // Get invoice data from database
    const invoices = await db.select().from(InvoicesTable).where(eq(InvoicesTable.id, invoiceId));

    if (!invoices || invoices.length === 0) {
      console.error('Invoice not found:', invoiceId);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Create a copy of the invoice to avoid modifying the original data
    const invoice = {
      ...invoices[0],
      // Override invoice_stage with the one from query params if it exists
      invoice_stage: invoiceStage || invoices[0].invoice_stage,
    };

    // Get customer data
    const customers = await db
      .select()
      .from(CustomersTable)
      .where(eq(CustomersTable.id, invoice.customer_id));

    // Get salesperson data only if salesperson_name exists
    const salesPerson = invoice.salesman_id
      ? await db.select().from(SalesmenTable).where(eq(SalesmenTable.id, invoice.salesman_id))
      : null;

    const customer = customers.length > 0 ? customers[0] : null;

    // Get primary address
    const addresses = await db.select().from(AddressTable).where(eq(AddressTable.is_primary, true));

    const primaryAddress = addresses.length > 0 ? addresses[0] : null;

    // Get primary bank details for proforma invoices
    let primaryBankDetails = null;
    if (invoiceStage === 'PROFORMA' || invoice.invoice_stage === 'PROFORMA') {
      const bankDetailsResults = await db
        .select()
        .from(BankDetailsTable)
        .where(eq(BankDetailsTable.is_primary, true));
      if (bankDetailsResults.length > 0) {
        primaryBankDetails = bankDetailsResults[0];
      }
    }

    // Get invoice items
    const invoiceItems = await db
      .select()
      .from(InvoiceItemsTable)
      .where(eq(InvoiceItemsTable.invoice_id, invoiceId));

    // Get products for invoice items
    const productsMap = new Map();

    // Fetch products one by one
    for (const item of invoiceItems) {
      const productRows = await db
        .select()
        .from(ProductsTable)
        .where(eq(ProductsTable.id, item.product_id));

      if (productRows.length > 0) {
        productsMap.set(item.product_id, productRows[0]);
      }
    }

    // Convert Map to plain object for the function call
    const productsObject: Record<string | number, any> = {};
    productsMap.forEach((value, key) => {
      productsObject[key] = value;
    });

    // Read the HTML template
    const templatePath = path.join(process.cwd(), 'app/templates/invoice-template.html');
    const htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Call the Firebase function using the REST API approach
    const functionData = {
      data: {
        invoiceId,
        invoiceStage,
        htmlTemplate,
        invoice,
        customer,
        primaryAddress,
        salesPerson,
        primaryBankDetails,
        invoiceItems,
        productsMap: productsObject,
      },
    };

    // Use fetch with the Firebase function URL
    const region = process.env.FIREBASE_REGION || 'us-central1';
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const functionUrl = `https://${region}-${projectId}.cloudfunctions.net/generateInvoicePdf`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (await getIdToken()),
      },
      body: JSON.stringify(functionData),
    });

    if (!response.ok) {
      throw new Error(`Failed to call Firebase function: ${response.statusText}`);
    }

    const result = await response.json();
    const responseData = result.result as {
      success: boolean;
      pdfBase64: string;
      filename: string;
      warning?: string;
    };

    if (responseData.success) {
      // Convert the base64 PDF back to a buffer
      const pdfBuffer = Buffer.from(responseData.pdfBase64, 'base64');

      // Determine filename based on document type
      const filename = responseData.filename;

      // Return the PDF
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${filename}"`,
        },
      });
    } else {
      throw new Error('Failed to generate PDF from Firebase function');
    }
  } catch (error) {
    console.error('Error generating PDF:', error);

    // Provide detailed error information
    let errorMessage = 'Failed to generate PDF';
    let errorDetails = '';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    } else {
      errorDetails = String(error);
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        environment: process.env.NODE_ENV,
      },
      { status: 500 }
    );
  }
}

// Helper function to get ID token for authenticated requests
async function getIdToken(): Promise<string> {
  try {
    // For server-to-server authentication, use a service account ID token
    const token = await admin.auth().createCustomToken('server');
    return token;
  } catch (error) {
    console.error('Error creating ID token:', error);
    throw error;
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // For POST requests to generate a PDF with a specific invoiceStage
  try {
    const invoiceId = parseInt((await params).id);

    if (isNaN(invoiceId)) {
      console.error('Invalid invoice ID:', (await params).id);
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    // Parse the request body to get invoice_stage
    const requestBody = await request.json();

    const invoiceStage =
      requestBody.invoiceStage ||
      requestBody.invoicestage ||
      requestBody.InvoiceStage ||
      requestBody.INVOICESTAGE ||
      'SALE';

    // Similar code to the GET method but with invoiceStage from request body
    // This reuses the same Firebase function call structure

    // Debugging information
    console.log(`Processing PDF (POST) for invoice ID: ${invoiceId}, stage: ${invoiceStage}`);
    console.log(`Running in environment: ${process.env.NODE_ENV}`);

    // Get invoice data from database
    const invoices = await db.select().from(InvoicesTable).where(eq(InvoicesTable.id, invoiceId));

    if (!invoices || invoices.length === 0) {
      console.error('Invoice not found:', invoiceId);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = {
      ...invoices[0],
      // Override invoice_stage with the one from the request
      invoice_stage: invoiceStage,
    };

    // Get customer data
    const customers = await db
      .select()
      .from(CustomersTable)
      .where(eq(CustomersTable.id, invoice.customer_id));

    // Get salesperson data only if salesperson_name exists
    const salesPerson = invoice.salesman_id
      ? await db.select().from(SalesmenTable).where(eq(SalesmenTable.id, invoice.salesman_id))
      : null;

    const customer = customers.length > 0 ? customers[0] : null;

    // Get primary address
    const addresses = await db.select().from(AddressTable).where(eq(AddressTable.is_primary, true));

    const primaryAddress = addresses.length > 0 ? addresses[0] : null;

    // Get primary bank details for proforma invoices
    let primaryBankDetails = null;
    if (invoiceStage === 'PROFORMA') {
      const bankDetailsResults = await db
        .select()
        .from(BankDetailsTable)
        .where(eq(BankDetailsTable.is_primary, true));
      if (bankDetailsResults.length > 0) {
        primaryBankDetails = bankDetailsResults[0];
      }
    }

    // Get invoice items
    const invoiceItems = await db
      .select()
      .from(InvoiceItemsTable)
      .where(eq(InvoiceItemsTable.invoice_id, invoiceId));

    // Get products for invoice items
    const productsMap = new Map();

    // Fetch products one by one
    for (const item of invoiceItems) {
      const productRows = await db
        .select()
        .from(ProductsTable)
        .where(eq(ProductsTable.id, item.product_id));

      if (productRows.length > 0) {
        productsMap.set(item.product_id, productRows[0]);
      }
    }

    // Convert Map to plain object for the function call
    const productsObject: Record<string | number, any> = {};
    productsMap.forEach((value, key) => {
      productsObject[key] = value;
    });

    // Read the HTML template
    const templatePath = path.join(process.cwd(), 'app/templates/invoice-template.html');
    const htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Call the Firebase function using the REST API approach
    const functionData = {
      data: {
        invoiceId,
        invoiceStage,
        htmlTemplate,
        invoice,
        customer,
        primaryAddress,
        salesPerson,
        primaryBankDetails,
        invoiceItems,
        productsMap: productsObject,
      },
    };

    // Use fetch with the Firebase function URL
    const region = process.env.FIREBASE_REGION || 'us-central1';
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const functionUrl = `https://${region}-${projectId}.cloudfunctions.net/generateInvoicePdf`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (await getIdToken()),
      },
      body: JSON.stringify(functionData),
    });

    if (!response.ok) {
      throw new Error(`Failed to call Firebase function: ${response.statusText}`);
    }

    const result = await response.json();
    const responseData = result.result as {
      success: boolean;
      pdfBase64: string;
      filename: string;
      warning?: string;
    };

    if (responseData.success) {
      // Convert the base64 PDF back to a buffer
      const pdfBuffer = Buffer.from(responseData.pdfBase64, 'base64');

      // Determine filename based on document type
      const filename = responseData.filename;

      // Return the PDF
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${filename}"`,
        },
      });
    } else {
      throw new Error('Failed to generate PDF from Firebase function');
    }
  } catch (error) {
    console.error('Error generating PDF:', error);

    // Provide detailed error information
    let errorMessage = 'Failed to generate PDF';
    let errorDetails = '';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    } else {
      errorDetails = String(error);
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        environment: process.env.NODE_ENV,
      },
      { status: 500 }
    );
  }
}
