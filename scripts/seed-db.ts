import dotenv from 'dotenv';

import { seed } from '../lib/seed';

// Load environment variables
dotenv.config();

async function main() {
  console.log('Starting database seeding...');
  try {
    const result = await seed();
    console.log('Database seeding completed successfully!');
    console.log(`- ${result.products.length} products created`);
    console.log(`- ${result.customers.length} customers created`);
    console.log(`- ${result.gstEntries.length} GST entries created`);
    console.log(`- ${result.salesmen.length} salesmen created`);
    console.log(`- ${result.suppliers.length} suppliers created`);
    console.log(`- ${result.vatEntries.length} VAT entries created`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

main();
