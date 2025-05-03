import * as dotenv from 'dotenv';
import postgres from 'postgres';

// Load environment variables
dotenv.config();

// PostgreSQL connection details
const host = process.env.POSTGRES_HOST || 'localhost';
const port = parseInt(process.env.POSTGRES_PORT || '5432');
const user = process.env.POSTGRES_USER || 'postgres';
const password = process.env.POSTGRES_PASSWORD || 'postgres';
const dbName = process.env.POSTGRES_DATABASE || 'aespt_db';

// Connection string for the postgres database (default database)
const connectionString = `postgres://${user}:${password}@${host}:${port}/postgres`;

async function createDatabase() {
  console.log(`🔍 Checking if database "${dbName}" exists...`);

  // Create a client connected to the default 'postgres' database
  const sql = postgres(connectionString, {
    max: 1,
    idle_timeout: 30,
    connect_timeout: 15,
    ssl: true,
  });

  try {
    // Check if database exists
    const result = await sql`
      SELECT 1
      FROM pg_database
      WHERE datname = ${dbName}
    `;

    if (result.length === 0) {
      console.log(`🆕 Database "${dbName}" does not exist. Creating it now...`);

      // Create the database if it doesn't exist
      await sql.unsafe(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database "${dbName}" created successfully!`);
    } else {
      console.log(`✓ Database "${dbName}" already exists.`);
    }
  } catch (error) {
    console.error('❌ Error creating database:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await sql.end();
  }

  console.log('🎉 Database setup complete!');
  console.log('📝 Next steps:');
  console.log('   1. Run "yarn db:push" to create schema');
  console.log('   2. Run "yarn db:migrate" to apply migrations');
}

createDatabase();
