import postgres from 'postgres';

async function main() {
  // Connection string with explicit credentials
  const connectionString = 'postgres://postgres:postgres@localhost:5432/aespt_db';

  // Create a client
  const client = postgres(connectionString, {
    ssl: false,
  });

  try {
    console.log('Adding discount_percentage column to invoices table...');

    // First, check if the column exists
    const checkColumn = await client.unsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name = 'discount_percentage'
    `);

    if (checkColumn.length === 0) {
      // Column doesn't exist, add it
      await client.unsafe(`
        ALTER TABLE invoices 
        ADD COLUMN discount_percentage DECIMAL(5, 2) DEFAULT '0'
      `);
      console.log('Column added successfully!');
    } else {
      console.log('Column already exists, no changes made.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

main();
