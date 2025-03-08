import { db, UsersTable } from '../lib/drizzle';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connection string with explicit credentials
const connectionString = 'postgres://postgres:postgres@localhost:5432/aespt_db';

// For migrations - don't use SSL for local development
const migrationClient = postgres(connectionString, { 
  max: 1,
  ssl: false
});

async function main() {
  console.log('🔄 Running migrations...');
  
  try {
    // Run migrations
    await migrate(drizzle(migrationClient), { migrationsFolder: 'drizzle/migrations' });
    console.log('✅ Migrations completed successfully');
    
    // Seed initial data if needed
    const usersCount = await db.select().from(UsersTable).execute();
    
    if (usersCount.length === 0) {
      console.log('🌱 Seeding initial data...');
      
      // Insert admin user
      await db.insert(UsersTable).values({
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '1234567890',
        createdBy: 'system',
        updatedBy: 'system'
      }).execute();
      
      console.log('✅ Initial data seeded successfully');
    } else {
      console.log('ℹ️ Database already has data, skipping seed');
    }
    
    console.log('🎉 Database setup completed successfully');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await migrationClient.end();
    process.exit(0);
  }
}

main(); 