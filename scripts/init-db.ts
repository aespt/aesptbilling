import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

import { db } from '../lib/drizzle';
import { UsersTable } from '../lib/models';
// Load environment variables
dotenv.config();

// Connection string with explicit credentials
const connectionString = 'postgres://postgres:postgres@localhost:5432/aespt_db';

// For migrations - don't use SSL for local development
const migrationClient = postgres(connectionString, {
  max: 3, // Limit connections for migrations
  idle_timeout: 30,
  connect_timeout: 15,
  ssl: false,
});

async function main() {
  console.log('🔄 Checking drizzle schema status...');

  try {
    // Check if drizzle schema exists and create it if needed
    const schemaExists = await migrationClient`
      SELECT EXISTS (
        SELECT 1 FROM pg_namespace WHERE nspname = 'drizzle'
      )
    `;

    if (schemaExists[0].exists) {
      console.log('ℹ️ Drizzle schema already exists');

      // Check if __drizzle_migrations table exists
      const migrationTableExists = await migrationClient`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'drizzle' 
          AND table_name = '__drizzle_migrations'
        )
      `;

      if (migrationTableExists[0].exists) {
        // Get count of migrations in the database
        const migrationsCount = await migrationClient`
          SELECT COUNT(*) FROM drizzle.__drizzle_migrations
        `;

        console.log(`ℹ️ Found ${migrationsCount[0].count} migrations in the database`);

        // If migrations already exist, don't recreate schema
        if (Number(migrationsCount[0].count) > 0) {
          console.log('ℹ️ Running migrations with existing schema...');
        }
      }
    } else {
      console.log('ℹ️ Drizzle schema does not exist, creating it...');

      // Create the drizzle schema
      await migrationClient`CREATE SCHEMA IF NOT EXISTS drizzle`;

      // Create the migrations table
      await migrationClient`
        CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
          id SERIAL PRIMARY KEY,
          hash text NOT NULL,
          created_at timestamp with time zone DEFAULT now() NOT NULL
        )
      `;

      console.log('✅ Created drizzle schema and migrations table');
    }

    console.log('🔄 Running migrations...');

    // Add debug logging
    console.log('Migration folder path:', 'drizzle/migrations');

    try {
      // Run migrations
      await migrate(drizzle(migrationClient), { migrationsFolder: 'drizzle/migrations' });
      console.log('✅ Migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration error:', error);
      throw error;
    }

    // Force create all tables if they don't exist
    const db2 = drizzle(migrationClient);

    // Check if tables exist first
    const tablesList = await db2.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public'
    `);

    console.log(
      'Current tables in database:',
      tablesList.map(t => t.table_name)
    );

    // Check for users table data
    const usersCount = await db.select({ count: sql`count(*)` }).from(UsersTable);
    const userCount = Number(usersCount[0]?.count || '0');

    // Seed only the users table if empty
    if (userCount === 0) {
      console.log('🌱 Seeding users table with initial data...');

      // Insert admin user
      await db
        .insert(UsersTable)
        .values({
          username: 'admin',
          email: 'admin@example.com',
          password_hash: '$2b$10$KHi1f67cSdJwoV4wU5AJaeJJp8EPUxvE4v3pHmX/pg2OpdGLqJfZi', // password is 'admin123'
          created_by: 1,
          updated_by: 1,
          // Let the defaultNow() handle timestamps
        })
        .execute();

      console.log('✅ Initial user data seeded successfully');
    } else {
      console.log('ℹ️ Users table already has data, skipping seed');
    }

    // Verify all tables have been created
    const allTables = [
      'users',
      'customers',
      'products',
      'invoices',
      'invoice_items',
      'vat_master',
      'gst_master',
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
