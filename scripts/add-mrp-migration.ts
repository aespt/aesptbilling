import fs from 'fs';
import path from 'path';

const migrationContent = `ALTER TABLE "invoice_items" ADD COLUMN IF NOT EXISTS "mrp" numeric(10, 2) NOT NULL DEFAULT 0;`;

// Create a timestamped migration name
const timestamp = Date.now();
const migrationName = `manual_add_mrp_column.sql`;
const migrationPath = path.join(process.cwd(), 'drizzle', 'migrations', migrationName);

// Write the migration file
fs.writeFileSync(migrationPath, migrationContent);

console.log(`Migration file created at: ${migrationPath}`);
