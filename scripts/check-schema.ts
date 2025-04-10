import { sql } from 'drizzle-orm';

import { db } from '../lib/drizzle';

async function checkSchema() {
  try {
    const result = await db.execute(sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'invoices'
      ORDER BY ordinal_position;
    `);

    console.log('Invoice table schema:', result);
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkSchema();
