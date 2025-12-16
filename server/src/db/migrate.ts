import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import dotenv from 'dotenv';
import * as schema from './schema.js';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function runMigrations() {
  try {
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully!');
    
    // Add partial unique index for booking concurrency safety
    console.log('Adding partial unique index for bookings...');
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS bookings_pitch_date_time_unique 
      ON bookings (pitch_id, date, start_time) 
      WHERE status IN ('PENDING', 'CONFIRMED')
    `;
    console.log('Partial unique index created!');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();

