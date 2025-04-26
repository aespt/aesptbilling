import * as dotenv from 'dotenv';
import postgres from 'postgres';

// Load environment variables
dotenv.config();

// Connection string with explicit credentials
const connectionString = 'postgres://postgres:postgres@localhost:5432/postgres';

async function main() {
  console.log('🔄 Performing complete database reset and migration fix...');

  // Connect to postgres database to perform operations
  const client = postgres(connectionString, {
    max: 1,
    ssl: false,
  });

  try {
    // Step 1: Drop the database if it exists
    await client.unsafe(`DROP DATABASE IF EXISTS aespt_db WITH (FORCE);`);
    console.log('✅ Dropped database if it existed');

    // Step 2: Create the database
    await client.unsafe(`CREATE DATABASE aespt_db;`);
    console.log('✅ Created fresh database');

    // Step 3: Connect to the newly created database
    const aesptClient = postgres('postgres://postgres:postgres@localhost:5432/aespt_db', {
      max: 1,
      ssl: false,
    });

    // Step 4: Create a fresh drizzle schema
    await aesptClient.unsafe(`CREATE SCHEMA drizzle;`);
    console.log('✅ Created fresh drizzle schema');

    // Step 5: Create empty migrations table
    await aesptClient.unsafe(`
      CREATE TABLE drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
    console.log('✅ Created fresh migrations table');

    // Clean up
    await aesptClient.end();

    console.log('🎉 Complete database reset successful');
    console.log('');
    console.log('Now run:');
    console.log('yarn db:migrate');
  } catch (error) {
    console.error('❌ Error during complete reset:', error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

main();
