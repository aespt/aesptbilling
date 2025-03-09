import { db } from '../lib/drizzle';
import { 
  UsersTable, 
  CustomersTable, 
  ProductsTable,
  InvoicesTable,
  InvoiceItemsTable,
  VatMasterTable,
  GstMasterTable
} from '../lib/models';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

// Load environment variables
dotenv.config();

// Connection string with explicit credentials
const connectionString = 'postgres://postgres:postgres@localhost:5432/aespt_db';

// For migrations - don't use SSL for local development
const migrationClient = postgres(connectionString, { 
  max: 1,
  ssl: false
});

async function main() {
  console.log('🔄 Running migrations...');
  
  try {
    // Run migrations
    await migrate(drizzle(migrationClient), { migrationsFolder: 'drizzle/migrations' });
    console.log('✅ Migrations completed successfully');
    
    // Force create all tables if they don't exist
    const db2 = drizzle(migrationClient);
    
    // Check if tables exist first
    const tablesList = await db2.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public'
    `);
    
    console.log('Current tables in database:', tablesList.map(t => t.table_name));
    
    // Check for users table data
    const usersCount = await db.select({ count: sql`count(*)` }).from(UsersTable);
    const userCount = Number(usersCount[0]?.count || '0');
    
    // Seed only the users table if empty
    if (userCount === 0) {
      console.log('🌱 Seeding users table with initial data...');
      
      // Insert admin user
      await db.insert(UsersTable).values({
        username: 'admin',
        email: 'admin@example.com',
        password_hash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // password is 'password'
        created_by: 'system',
        updated_by: 'system',
        created_at: new Date(),
        updated_at: new Date()
      }).execute();
      
      console.log('✅ Initial user data seeded successfully');
    } else {
      console.log('ℹ️ Users table already has data, skipping seed');
    }
    
    // Verify all tables have been created
    const allTables = [
      'users', 'customers', 'products', 'invoices', 
      'invoice_items', 'vat_master', 'gst_master'
    ];
    
    const finalTablesList = await db2.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public'
    `);
    
    const existingTables = finalTablesList.map(t => t.table_name);
    const missingTables = allTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.warn('⚠️ Some tables are missing:', missingTables);
    } else {
      console.log('✅ All tables were created successfully:', existingTables);
    }
    
    console.log('🎉 Database setup completed successfully');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await migrationClient.end();
    process.exit(0);
  }
}

main(); 