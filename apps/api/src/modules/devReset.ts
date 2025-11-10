import { Client } from "pg";

export async function hardResetDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    // If your DB requires SSL in dev, set: ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  // Drop everything in public and recreate it fresh
  await client.query(`DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;`);

  // If node-pg-migrate created the ledger in a different schema in the past, belt & braces:
  await client.query(`DROP TABLE IF EXISTS pgmigrations;`).catch(() => {});

  await client.end();
}
