import * as dotenv from 'dotenv';
import postgres from 'postgres';

// Load environment variables
dotenv.config();

async function main() {
  // Connection string with explicit credentials
  const connectionString =
    process.env.POSTGRES_URL || 'postgres://postgres:postgres@localhost:5432/aespt_db';

  console.log(`Connecting to database: ${connectionString.replace(/:[^:]*@/, ':***@')}`);

  // Create a client
  const client = postgres(connectionString, {
    ssl: false,
  });

  try {
    console.log('Applying discount_percentage migration to invoices table...');

    // Execute the migration SQL directly
    await client.unsafe(`
      ALTER TABLE IF EXISTS invoices 
      ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2) DEFAULT '0'
    `);

    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Error applying migration:', error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

main();
