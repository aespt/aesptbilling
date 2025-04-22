import postgres from 'postgres';

interface ColumnInfo {
  column_name: string;
  data_type: string;
  column_default: string | null;
  is_nullable: string;
}

async function main() {
  // Connection string with explicit credentials
  const connectionString = 'postgres://postgres:postgres@localhost:5432/aespt_db';

  // Create a client
  const client = postgres(connectionString, {
    ssl: false,
  });

  try {
    // Check invoices table structure
    console.log('Checking invoices table structure...');
    const tableSchema = await client.unsafe<ColumnInfo[]>(`
      SELECT column_name, data_type, column_default, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' 
      ORDER BY ordinal_position
    `);

    console.log('Invoices table columns:');
    tableSchema.forEach((column: ColumnInfo) => {
      console.log(
        `- ${column.column_name}: ${column.data_type} (Default: ${column.column_default}, Nullable: ${column.is_nullable})`
      );
    });

    // Specifically check for discount_percentage
    const discountPercentageColumn = tableSchema.find(
      (col: ColumnInfo) => col.column_name === 'discount_percentage'
    );
    if (discountPercentageColumn) {
      console.log('\nThe discount_percentage column ALREADY EXISTS in the invoices table.');
    } else {
      console.log('\nThe discount_percentage column DOES NOT EXIST in the invoices table.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

main();
