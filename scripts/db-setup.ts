import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

// Load environment variables
dotenv.config();

/**
 * Complete database setup script
 * This script runs all the necessary steps to set up the database:
 * 1. Create the database if it doesn't exist
 * 2. Push the schema to the database
 * 3. Run migrations
 */
async function setupDatabase() {
  try {
    console.log('🚀 Starting complete database setup...');

    // Step 1: Create database
    console.log("\n📊 Step 1: Creating database if it doesn't exist");
    execSync('tsx scripts/create-db.ts', { stdio: 'inherit' });

    // Step 2: Push schema to database
    console.log('\n📐 Step 2: Pushing schema to database');
    execSync('npx drizzle-kit push', { stdio: 'inherit' });

    // Step 3: Run migrations and seed data
    console.log('\n🌱 Step 3: Running migrations and seeding data');
    execSync('tsx scripts/init-db.ts', { stdio: 'inherit' });

    console.log('\n✅ Database setup completed successfully!');
    console.log('Your database is now ready to use.');
  } catch (error) {
    console.error('\n❌ Error during database setup:', error);
    process.exit(1);
  }
}

setupDatabase();
