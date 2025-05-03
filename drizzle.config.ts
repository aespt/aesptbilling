import * as dotenv from 'dotenv';
import type { Config } from 'drizzle-kit';

dotenv.config();

export default {
  schema: ['./lib/models/*.ts'],
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.PGHOST || 'localhost',
    port: parseInt('5432'),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'aespt_db',
    ssl: true,
  },
  verbose: true,
  strict: true,
} satisfies Config;
