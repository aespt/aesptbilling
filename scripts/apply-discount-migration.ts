import { db } from '../lib/drizzle';
import { sql } from 'drizzle-orm';

async function applyDiscountMigration() {
  try {
    // First check if the column exists
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' 
      AND column_name = 'discount';
    `);

    if (checkResult.length === 0) {
      // Column doesn't exist, add it
      await db.execute(sql`
        ALTER TABLE "invoices" 
        ADD COLUMN "discount" numeric(10, 2) DEFAULT '0';
      `);
      console.log('Successfully added discount column');
    } else {
      console.log('Discount column already exists');
    }
  } catch (error) {
    console.error('Error applying migration:', error);
  }
}

applyDiscountMigration(); 