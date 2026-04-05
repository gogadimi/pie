// Re-export the main DB connection from db/index.ts
// This keeps backward compatibility with @/lib/db imports
export { db, checkDbConnection } from '@/db';
export const getDb = () => {
  const { db } = require('@/db');
  return db;
};
