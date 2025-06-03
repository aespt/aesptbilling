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
        trn: '1234567890',
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
        trn: '1234567891',
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
        trn: '1234567892',
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
        trn: '1234567893',
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
        trn: '1234567894',
        phone: '+971505678901',
        address: 'Ajman Corniche, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Fatima Al-Mazroui',
        email: 'fatima.m@example.com',
        phone: '+971506789012',
        trn: '1234567895',
        address: 'Business Bay, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Ravi Singh',
        email: 'ravi.s@example.com',
        phone: '+971507890123',
        trn: '1234567896',
        address: 'Al Nahda, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Jasmine Wong',
        email: 'jasmine.w@example.com',
        phone: '+971508901234',
        trn: '1234567897',
        address: 'Mirdif, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Ibrahim Al-Qasimi',
        email: 'ibrahim.q@example.com',
        phone: '+971509012345',
        trn: '1234567898',
        address: 'Al Khan, Sharjah, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Sophia Rodriguez',
        email: 'sophia.r@example.com',
        phone: '+971510123456',
        trn: '1234567899',
        address: 'JBR, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Omar Abdulla',
        email: 'omar.a@example.com',
        phone: '+971511234567',
        trn: '1234567900',
        address: 'Al Reem Island, Abu Dhabi, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Aisha Al-Balushi',
        email: 'aisha.b@example.com',
        phone: '+971512345678',
        trn: '1234567901',
        address: 'Al Majaz, Sharjah, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'David Chen',
        email: 'david.c@example.com',
        phone: '+971513456789',
        trn: '1234567902',
        address: 'Al Qusais, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Layla Hassan',
        email: 'layla.h@example.com',
        phone: '+971514567890',
        trn: '1234567903',
        address: 'Al Mamzar, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Rajesh Kumar',
        email: 'rajesh.k@example.com',
        phone: '+971515678901',
        trn: '1234567904',
        address: 'Bur Dubai, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Noor Al-Suwaidi',
        email: 'noor.s@example.com',
        phone: '+971516789012',
        trn: '1234567905',
        address: 'Khalidiya, Abu Dhabi, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Michael Brown',
        email: 'michael.b@example.com',
        phone: '+971517890123',
        trn: '1234567906',
        address: 'Palm Jumeirah, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Fatma Al-Hashimi',
        email: 'fatma.h@example.com',
        phone: '+971518901234',
        trn: '1234567907',
        address: 'Al Warqa, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Sanjay Sharma',
        email: 'sanjay.s@example.com',
        phone: '+971519012345',
        trn: '1234567908',
        address: 'International City, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Mariam Al-Zaabi',
        email: 'mariam.z@example.com',
        phone: '+971520123456',
        trn: '1234567909',
        address: 'Al Bateen, Abu Dhabi, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Ahmad Al-Najjar',
        email: 'ahmad.n@example.com',
        phone: '+971521234567',
        trn: '1234567910',
        address: 'Deira, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Sunita Patel',
        email: 'sunita.p@example.com',
        phone: '+971522345678',
        trn: '1234567911',
        address: 'Al Barsha, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Khalid Al-Falasi',
        email: 'khalid.f@example.com',
        phone: '+971523456789',
        trn: '1234567912',
        address: 'Oud Metha, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Lakshmi Nair',
        email: 'lakshmi.n@example.com',
        phone: '+971524567890',
        trn: '1234567913',
        address: 'Discovery Gardens, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Sultan Al-Dhaheri',
        email: 'sultan.d@example.com',
        phone: '+971525678901',
        trn: '1234567914',
        address: 'Al Muroor, Abu Dhabi, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Emma Wilson',
        email: 'emma.w@example.com',
        phone: '+971526789012',
        trn: '1234567915',
        address: 'The Greens, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Hassan Al-Mansouri',
        email: 'hassan.m@example.com',
        phone: '+971527890123',
        trn: '1234567916',
        address: 'Al Karama, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Anita Desai',
        email: 'anita.d@example.com',
        phone: '+971528901234',
        trn: '1234567917',
        address: 'Al Garhoud, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Saeed Al-Shamsi',
        email: 'saeed.s@example.com',
        phone: '+971529012345',
        trn: '1234567918',
        address: 'Al Safa, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Jennifer Lewis',
        email: 'jennifer.l@example.com',
        phone: '+971530123456',
        trn: '1234567919',
        address: 'Marina Square, Abu Dhabi, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Yousef Al-Naqbi',
        email: 'yousef.n@example.com',
        phone: '+971531234567',
        trn: '1234567920',
        address: 'Al Nahyan, Abu Dhabi, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Meera Shah',
        email: 'meera.s@example.com',
        phone: '+971532345678',
        trn: '1234567921',
        address: 'Jumeirah Village Circle, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Hamad Al-Nuaimi',
        email: 'hamad.n@example.com',
        phone: '+971533456789',
        trn: '1234567922',
        address: 'Al Muteena, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Deepa Krishnan',
        email: 'deepa.k@example.com',
        phone: '+971534567890',
        trn: '1234567923',
        address: 'Rashidiya, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Abdullah Al-Mulla',
        email: 'abdullah.m@example.com',
        phone: '+971535678901',
        trn: '1234567924',
        address: 'Jumeirah Beach Residence, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Grace Zhang',
        email: 'grace.z@example.com',
        phone: '+971536789012',
        trn: '1234567925',
        address: 'DIFC, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Tariq Al-Qassimi',
        email: 'tariq.q@example.com',
        phone: '+971537890123',
        trn: '1234567926',
        address: 'Al Qasba, Sharjah, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Nina Thompson',
        email: 'nina.t@example.com',
        phone: '+971538901234',
        trn: '1234567927',
        address: 'Arabian Ranches, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Faisal Al-Khouri',
        email: 'faisal.k@example.com',
        phone: '+971539012345',
        trn: '1234567928',
        address: 'Al Mina, Abu Dhabi, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Arjun Menon',
        email: 'arjun.m@example.com',
        phone: '+971540123456',
        trn: '1234567929',
        address: 'Tecom, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Hessa Al-Marri',
        email: 'hessa.m@example.com',
        phone: '+971541234567',
        trn: '1234567930',
        address: 'Al Jafiliya, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Thomas Garcia',
        email: 'thomas.g@example.com',
        phone: '+971542345678',
        trn: '1234567931',
        address: 'Downtown Abu Dhabi, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Zainab Al-Bloushi',
        email: 'zainab.b@example.com',
        phone: '+971543456789',
        trn: '1234567932',
        address: 'Al Satwa, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Vijay Reddy',
        email: 'vijay.r@example.com',
        phone: '+971544567890',
        trn: '1234567933',
        address: 'Dubai Marina, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Mona Al-Kindi',
        email: 'mona.k@example.com',
        phone: '+971545678901',
        trn: '1234567934',
        address: 'Al Rigga, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Robert Miller',
        email: 'robert.m@example.com',
        phone: '+971546789012',
        trn: '1234567935',
        address: 'Jumeirah Lakes Towers, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Amina Al-Ahmed',
        email: 'amina.a@example.com',
        phone: '+971547890123',
        trn: '1234567936',
        address: 'Al Twar, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Rahul Malhotra',
        email: 'rahul.m@example.com',
        phone: '+971548901234',
        trn: '1234567937',
        address: 'Muhaisnah, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Shaima Al-Ameri',
        email: 'shaima.a@example.com',
        phone: '+971549012345',
        trn: '1234567938',
        address: 'Al Quoz, Dubai, UAE',
        created_by: 'system',
        updated_by: 'system',
      })
      .onConflictDoNothing()
      .returning(),
    db
      .insert(CustomersTable)
      .values({
        name: 'Daniel Wilson',
        email: 'daniel.w@example.com',
        phone: '+971550123456',
        trn: '1234567939',
        address: 'Motor City, Dubai, UAE',
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
        email: 'raj.kumar@example.com',
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
        email: 'ahmed.almansouri@example.com',
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
        email: 'lisa.chen@example.com',
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
        email: '',
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
