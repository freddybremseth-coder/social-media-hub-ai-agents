import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/social_media_hub',
});

export const db = drizzle(pool, { schema });
