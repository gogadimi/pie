#!/usr/bin/env tsx
/**
 * Database Migration Script
 * Run: npx tsx scripts/migrate.ts
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local' });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set. Check your .env.local file.');
    process.exit(1);
  }

  console.log('🔍 Connecting to database...');
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  try {
    await sql`SELECT 1`;
    console.log('✅ Connected to database');
  } catch (e: any) {
    console.error('❌ Cannot connect to database:', e.message);
    process.exit(1);
  }

  console.log('🚀 Running migrations...');
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ All migrations applied successfully!');
  } catch (e: any) {
    console.error('❌ Migration failed:', e.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
