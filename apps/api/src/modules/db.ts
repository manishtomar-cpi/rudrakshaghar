import { Client, type ClientConfig } from "pg";
import { env } from "../config/env";

let client: Client | null = null;

function getHostFromUrl(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return "unknown-host";
  }
}

export function getDb(): Client {
  if (!client) {
    const cfg: ClientConfig = {
      connectionString: env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    };
    client = new Client(cfg);
  }
  return client;
}

export async function ensureDbConnected() {
  const db = getDb();
  // simple once-only guard
  // @ts-ignore
  if ((db as any)._connected) return;

  await db.connect();
  // @ts-ignore
  (db as any)._connected = true;

  const host = getHostFromUrl(env.DATABASE_URL);
  console.log(`[db] connected → ${host}`);
}
