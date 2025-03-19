import postgres from 'postgres';
import { ProductsTable } from './models/products';
import { CustomersTable } from './models/customers';
import { GstMasterTable } from './models/gst_master';
import { SalesmenTable } from './models/salesmen';
import { SuppliersTable } from './models/suppliers';
import { VatMasterTable } from './models/vat_master';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function seed() {
  // Seed products
  const products = await Promise.all([
    sql`
      INSERT INTO products (part_no, name, description, price, mrp, count, created_by, updated_by)
      VALUES ('P001', 'Brake Pad Set', 'High-performance brake pads for all vehicle types', 45.99, 59.99, 100, 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO products (part_no, name, description, price, mrp, count, created_by, updated_by)
      VALUES ('P002', 'Oil Filter', 'Premium quality oil filter for engines', 12.50, 15.99, 250, 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO products (part_no, name, description, price, mrp, count, created_by, updated_by)
      VALUES ('P003', 'Air Filter', 'High-flow air filter for improved performance', 18.75, 24.99, 175, 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO products (part_no, name, description, price, mrp, count, created_by, updated_by)
      VALUES ('P004', 'Spark Plug Set', 'Set of 4 iridium spark plugs', 32.00, 39.99, 120, 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO products (part_no, name, description, price, mrp, count, created_by, updated_by)
      VALUES ('P005', 'Alternator', 'OEM replacement alternator for sedans', 125.00, 159.99, 30, 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
  ]);
  console.log(`Seeded ${products.length} products`);

  // Seed customers
  const customers = await Promise.all([
    sql`
      INSERT INTO customers (name, email, phone, address, created_by, updated_by)
      VALUES ('John Smith', 'john.smith@example.com', '+971501234567', 'Downtown Dubai, UAE', 'system', 'system')
      ON CONFLICT (email) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO customers (name, email, phone, address, created_by, updated_by)
      VALUES ('Sarah Johnson', 'sarah.j@example.com', '+971502345678', 'Sharjah City, UAE', 'system', 'system')
      ON CONFLICT (email) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO customers (name, email, phone, address, created_by, updated_by)
      VALUES ('Mohammed Al-Farsi', 'mohammed.af@example.com', '+971503456789', 'Abu Dhabi Marina, UAE', 'system', 'system')
      ON CONFLICT (email) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO customers (name, email, phone, address, created_by, updated_by)
      VALUES ('Priya Patel', 'priya.p@example.com', '+971504567890', 'Silicon Oasis, Dubai, UAE', 'system', 'system')
      ON CONFLICT (email) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO customers (name, email, phone, address, created_by, updated_by)
      VALUES ('Ali Hassan', 'ali.h@example.com', '+971505678901', 'Ajman Corniche, UAE', 'system', 'system')
      ON CONFLICT (email) DO NOTHING RETURNING *;
    `,
  ]);
  console.log(`Seeded ${customers.length} customers`);

  // Seed GST master
  const gstEntries = await Promise.all([
    sql`
      INSERT INTO gst_master (country, gst_percentage, description, effective_from, created_by, updated_by)
      VALUES ('India', 5.00, 'Basic essential goods', '2023-01-01', 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO gst_master (country, gst_percentage, description, effective_from, created_by, updated_by)
      VALUES ('India', 12.00, 'Standard goods', '2023-01-01', 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO gst_master (country, gst_percentage, description, effective_from, created_by, updated_by)
      VALUES ('India', 18.00, 'Most manufactured goods', '2023-01-01', 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO gst_master (country, gst_percentage, description, effective_from, created_by, updated_by)
      VALUES ('India', 28.00, 'Luxury and premium goods', '2023-01-01', 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO gst_master (country, gst_percentage, description, effective_from, effective_to, created_by, updated_by)
      VALUES ('India', 0.00, 'Zero-rated goods', '2023-01-01', NULL, 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
  ]);
  console.log(`Seeded ${gstEntries.length} GST entries`);

  // Seed salesmen
  const salesmen = await Promise.all([
    sql`
      INSERT INTO salesmen (name, contact_number, created_by, updated_by)
      VALUES ('Raj Kumar', '+971551234567', 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO salesmen (name, contact_number, created_by, updated_by)
      VALUES ('Ahmed Al-Mansouri', '+971552345678', 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO salesmen (name, contact_number, created_by, updated_by)
      VALUES ('Lisa Chen', '+971553456789', 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO salesmen (name, contact_number, created_by, updated_by)
      VALUES ('Fahad Al-Otaibi', '+971554567890', 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO salesmen (name, contact_number, created_by, updated_by)
      VALUES ('Sanjay Mehta', '+971555678901', 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
  ]);
  console.log(`Seeded ${salesmen.length} salesmen`);

  // Seed suppliers
  const suppliers = await Promise.all([
    sql`
      INSERT INTO suppliers (tax_registration_number, name, address, contact_number, created_by, updated_by)
      VALUES ('TRN123456789', 'AutoParts Global', 'Industrial Area 1, Dubai, UAE', '+97142345678', 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO suppliers (tax_registration_number, name, address, contact_number, created_by, updated_by)
      VALUES ('TRN234567890', 'Emirates Auto Supplies', 'Sheikh Zayed Road, Dubai, UAE', '+97143456789', 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO suppliers (tax_registration_number, name, address, contact_number, created_by, updated_by)
      VALUES ('TRN345678901', 'Jebel Ali Parts Co.', 'Jebel Ali Free Zone, Dubai, UAE', '+97144567890', 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO suppliers (tax_registration_number, name, address, contact_number, created_by, updated_by)
      VALUES ('TRN456789012', 'Abu Dhabi Motors Supply', 'Mussafah Industrial Area, Abu Dhabi, UAE', '+97125678901', 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO suppliers (tax_registration_number, name, address, contact_number, created_by, updated_by)
      VALUES ('TRN567890123', 'Sharjah Auto Components', 'Industrial Area 10, Sharjah, UAE', '+97166789012', 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
  ]);
  console.log(`Seeded ${suppliers.length} suppliers`);

  // Seed VAT master
  const vatEntries = await Promise.all([
    sql`
      INSERT INTO vat_master (country, vat_percentage, description, effective_from, created_by, updated_by)
      VALUES ('UAE', 5.00, 'Standard VAT rate', '2023-01-01', 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO vat_master (country, vat_percentage, description, effective_from, created_by, updated_by)
      VALUES ('UAE', 0.00, 'Zero-rated supplies', '2023-01-01', 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO vat_master (country, vat_percentage, description, effective_from, created_by, updated_by)
      VALUES ('Saudi Arabia', 15.00, 'Standard VAT rate', '2023-01-01', 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO vat_master (country, vat_percentage, description, effective_from, created_by, updated_by)
      VALUES ('Bahrain', 10.00, 'Standard VAT rate', '2023-01-01', 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
    sql`
      INSERT INTO vat_master (country, vat_percentage, description, effective_from, created_by, updated_by)
      VALUES ('Oman', 5.00, 'Standard VAT rate', '2023-01-01', 'system', 'system')
      ON CONFLICT (id) DO NOTHING RETURNING *;
    `,
  ]);
  console.log(`Seeded ${vatEntries.length} VAT entries`);

  return {
    products,
    customers,
    gstEntries,
    salesmen,
    suppliers,
    vatEntries
  };
}
