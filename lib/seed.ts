import { db } from './drizzle';
import { CustomersTable } from './models/customers';
import { GstMasterTable } from './models/gst_master';
import { ProductsTable } from './models/products';
import { SalesmenTable } from './models/salesmen';
import { SuppliersTable } from './models/suppliers';
import { VatMasterTable } from './models/vat_master';

export async function seed() {
  // Seed products
  const products = await Promise.all([
    db
      .insert(ProductsTable)
      .values({
        partNo: 'P001',
        name: 'Brake Pad Set',
        description: 'High-performance brake pads for all vehicle types',
        price: '45.99',
        mrp: '59.99',
        count: 100,
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(ProductsTable)
      .values({
        partNo: 'P002',
        name: 'Oil Filter',
        description: 'Premium quality oil filter for engines',
        price: '12.50',
        mrp: '15.99',
        count: 250,
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(ProductsTable)
      .values({
        partNo: 'P003',
        name: 'Air Filter',
        description: 'High-flow air filter for improved performance',
        price: '18.75',
        mrp: '24.99',
        count: 175,
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(ProductsTable)
      .values({
        partNo: 'P004',
        name: 'Spark Plug Set',
        description: 'Set of 4 iridium spark plugs',
        price: '32.00',
        mrp: '39.99',
        count: 120,
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(ProductsTable)
      .values({
        partNo: 'P005',
        name: 'Alternator',
        description: 'OEM replacement alternator for sedans',
        price: '125.00',
        mrp: '159.99',
        count: 30,
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
  ]);

  // Seed customers
  const customers = await Promise.all([
    db
      .insert(CustomersTable)
      .values({
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+971501234567',
        address: 'Downtown Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        phone: '+971502345678',
        address: 'Sharjah City, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Mohammed Al-Farsi',
        email: 'mohammed.af@example.com',
        phone: '+971503456789',
        address: 'Abu Dhabi Marina, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Priya Patel',
        email: 'priya.p@example.com',
        phone: '+971504567890',
        address: 'Silicon Oasis, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Ali Hassan',
        email: 'ali.h@example.com',
        phone: '+971505678901',
        address: 'Ajman Corniche, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
  ]);

  // Seed GST master
  const gstEntries = await Promise.all([
    db
      .insert(GstMasterTable)
      .values({
        country: 'India',
        cgst_percentage: '2.50',
        sgst_percentage: '2.50',
        description: 'Basic essential goods',
        effective_from: new Date('2023-01-01'),
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(GstMasterTable)
      .values({
        country: 'India',
        cgst_percentage: '6.00',
        sgst_percentage: '6.00',
        description: 'Standard goods',
        effective_from: new Date('2023-01-01'),
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(GstMasterTable)
      .values({
        country: 'India',
        cgst_percentage: '9.00',
        sgst_percentage: '9.00',
        description: 'Most manufactured goods',
        effective_from: new Date('2023-01-01'),
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(GstMasterTable)
      .values({
        country: 'India',
        cgst_percentage: '14.00',
        sgst_percentage: '14.00',
        description: 'Luxury and premium goods',
        effective_from: new Date('2023-01-01'),
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(GstMasterTable)
      .values({
        country: 'India',
        cgst_percentage: '0.00',
        sgst_percentage: '0.00',
        description: 'Zero-rated goods',
        effective_from: new Date('2023-01-01'),
        effective_to: null,
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
  ]);

  // Seed salesmen
  const salesmen = await Promise.all([
    db
      .insert(SalesmenTable)
      .values({
        name: 'Raj Kumar',
        contact_number: '+971551234567',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(SalesmenTable)
      .values({
        name: 'Ahmed Al-Mansouri',
        contact_number: '+971552345678',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(SalesmenTable)
      .values({
        name: 'Lisa Chen',
        contact_number: '+971553456789',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(SalesmenTable)
      .values({
        name: 'Fahad Al-Otaibi',
        contact_number: '+971554567890',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(SalesmenTable)
      .values({
        name: 'Sanjay Mehta',
        contact_number: '+971555678901',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
  ]);

  // Seed suppliers
  const suppliers = await Promise.all([
    db
      .insert(SuppliersTable)
      .values({
        tax_registration_number: 'TRN123456789',
        name: 'AutoParts Global',
        address: 'Industrial Area 1, Dubai, UAE',
        contact_number: '+97142345678',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(SuppliersTable)
      .values({
        tax_registration_number: 'TRN234567890',
        name: 'Emirates Auto Supplies',
        address: 'Sheikh Zayed Road, Dubai, UAE',
        contact_number: '+97143456789',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(SuppliersTable)
      .values({
        tax_registration_number: 'TRN345678901',
        name: 'Jebel Ali Parts Co.',
        address: 'Jebel Ali Free Zone, Dubai, UAE',
        contact_number: '+97144567890',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(SuppliersTable)
      .values({
        tax_registration_number: 'TRN456789012',
        name: 'Abu Dhabi Motors Supply',
        address: 'Mussafah Industrial Area, Abu Dhabi, UAE',
        contact_number: '+97125678901',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(SuppliersTable)
      .values({
        tax_registration_number: 'TRN567890123',
        name: 'Sharjah Auto Components',
        address: 'Industrial Area 10, Sharjah, UAE',
        contact_number: '+97166789012',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
  ]);

  // Seed VAT master
  const vatEntries = await Promise.all([
    db
      .insert(VatMasterTable)
      .values({
        country: 'UAE',
        vat_percentage: '5.00',
        description: 'Standard VAT rate',
        effective_from: new Date('2023-01-01'),
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(VatMasterTable)
      .values({
        country: 'UAE',
        vat_percentage: '0.00',
        description: 'Zero-rated supplies',
        effective_from: new Date('2023-01-01'),
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(VatMasterTable)
      .values({
        country: 'Saudi Arabia',
        vat_percentage: '15.00',
        description: 'Standard VAT rate',
        effective_from: new Date('2023-01-01'),
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(VatMasterTable)
      .values({
        country: 'Bahrain',
        vat_percentage: '10.00',
        description: 'Standard VAT rate',
        effective_from: new Date('2023-01-01'),
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(VatMasterTable)
      .values({
        country: 'Oman',
        vat_percentage: '5.00',
        description: 'Standard VAT rate',
        effective_from: new Date('2023-01-01'),
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
  ]);

  return {
    products,
    customers,
    gstEntries,
    salesmen,
    suppliers,
    vatEntries,
  };
}
