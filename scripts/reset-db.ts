import * as dotenv from 'dotenv';
import postgres from 'postgres';

// Load environment variables
dotenv.config();

// Connection string with explicit credentials
const connectionString = 'postgres://postgres:postgres@localhost:5432/postgres';

async function main() {
  console.log('🔄 Resetting database...');

  const client = postgres(connectionString, {
    max: 1,
    ssl: true,
  });

  try {
    // Drop the database if it exists
    await client.unsafe(`DROP DATABASE IF EXISTS aespt_db;`);
    console.log('✅ Dropped database if it existed');

    // Create the database
    await client.unsafe(`CREATE DATABASE aespt_db;`);
    console.log('✅ Created fresh database');

    // Connect to the newly created database
    const aesptClient = postgres('postgres://postgres:postgres@localhost:5432/aespt_db', {
      max: 1,
      ssl: true,
    });

    // Make sure no drizzle schema exists
    await aesptClient.unsafe(`DROP SCHEMA IF EXISTS drizzle CASCADE;`);
    console.log('✅ Cleaned up any existing drizzle schema');

    await aesptClient.end();

    console.log('🎉 Database reset completed successfully');
    console.log('');
    console.log('Now run:');
    console.log('yarn db:migrate');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

main();
