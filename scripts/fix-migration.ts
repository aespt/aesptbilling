import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function main() {
  // Initialize Postgres connection
  const connectionString = process.env.DATABASE_URL || '';

  if (!connectionString) {
    console.error('ERROR: DATABASE_URL environment variable is required');
    console.error(
      'Usage: DATABASE_URL=postgresql://user:password@localhost:5432/dbname npx tsx scripts/fix-migration.ts'
    );
    process.exit(1);
  }

  try {
    // Create a dedicated connection for migrations
    const migrationClient = postgres(connectionString, { max: 1 });

    console.log('Starting migration fix process...');

    // STEP 1: Fix enum type issues
    // Define all the enum types that might cause conflicts
    const enumTypes = [
      'invoice_stage',
      'invoice_type',
      'payment_method',
      'payment_status',
      'purchase_tax_type',
      'purchase_type',
      'tax_type',
      'discount_type',
    ];

    for (const enumType of enumTypes) {
      console.log(`Checking if ${enumType} type exists...`);
      const checkQuery = await migrationClient`
        SELECT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = ${enumType}
        );
      `;

      const typeExists = checkQuery[0].exists;
      console.log(`${enumType} type exists: ${typeExists}`);

      if (typeExists) {
        console.log(`Attempting to drop columns that use ${enumType} type...`);

        try {
          // Find all columns using this enum type
          const columnQuery = await migrationClient`
            SELECT c.table_name, c.column_name
            FROM information_schema.columns c
            JOIN pg_type t ON c.udt_name = t.typname
            WHERE t.typname = ${enumType};
          `;

          // Drop each column that uses this enum type
          for (const col of columnQuery) {
            console.log(`Dropping column ${col.column_name} from table ${col.table_name}...`);
            await migrationClient`
              ALTER TABLE "${col.table_name}" DROP COLUMN IF EXISTS "${col.column_name}";
            `;
          }

          console.log(`Dropping ${enumType} type...`);
          await migrationClient`DROP TYPE IF EXISTS "public"."${enumType}";`;
          console.log('Type dropped successfully.');
        } catch (dropError) {
          console.error(`Error dropping type or column for ${enumType}:`, dropError);
        }
      }
    }

    // STEP 2: Fix foreign key constraint issues
    const constraintsToCheck = [
      { table: 'users', constraint: 'users_created_by_users_id_fk' },
      { table: 'users', constraint: 'users_updated_by_users_id_fk' },
      { table: 'invoices', constraint: 'invoices_user_id_users_id_fk' },
      { table: 'invoices', constraint: 'invoices_customer_id_customers_id_fk' },
      { table: 'invoices', constraint: 'invoices_salesman_id_salesmen_id_fk' },
      { table: 'invoice_items', constraint: 'invoice_items_invoice_id_invoices_id_fk' },
      { table: 'invoice_items', constraint: 'invoice_items_product_id_products_id_fk' },
      { table: 'payment_details', constraint: 'payment_details_invoice_id_invoices_id_fk' },
    ];

    console.log('Checking for foreign key constraints...');

    for (const { table, constraint } of constraintsToCheck) {
      try {
        // Check if the constraint exists before trying to drop it
        const constraintExistsQuery = await migrationClient`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = ${constraint}
            AND table_name = ${table}
          );
        `;

        if (constraintExistsQuery[0].exists) {
          console.log(`Dropping ${constraint} constraint from ${table}...`);
          await migrationClient`
            ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${constraint}";
          `;
        } else {
          console.log(`Constraint ${constraint} does not exist on table ${table}, skipping drop.`);
        }
      } catch (constraintError) {
        console.error(`Error handling constraint ${constraint}:`, constraintError);
      }
    }

    // STEP 3: Try to initialize the database from scratch if needed
    try {
      console.log('Checking if tables exist...');
      const tablesExistQuery = await migrationClient`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        );
      `;

      const tablesExist = tablesExistQuery[0].exists;

      if (!tablesExist) {
        console.log('No tables found, will create fresh schema.');
      } else {
        console.log('Tables already exist, will apply migration fixes.');
      }
    } catch (error) {
      console.error('Error checking table existence:', error);
    }

    // Initialize Drizzle
    const db = drizzle(migrationClient);

    // Apply migrations - this will create everything fresh
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle/migrations' });
    console.log('Migrations applied successfully.');

    // Close client
    await migrationClient.end();

    console.log('Migration fix complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

main().catch(console.error);
