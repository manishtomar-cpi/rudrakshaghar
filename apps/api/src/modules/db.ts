import { Client, type ClientConfig } from "pg";
import { env } from "../config/env";

let client: Client | null = null;
let connecting: Promise<void> | null = null;
let isConnected = false;

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

/**
 * Ensures a single shared Client connection is established.
 * Prevents "Client has already been connected" errors on concurrent requests.
 */
export async function ensureDbConnected() {
  const db = getDb();

  // Already connected
  if (isConnected) return;

  // Another request is connecting → wait for it
  if (connecting) {
    await connecting;
    return;
  }

  const host = getHostFromUrl(env.DATABASE_URL);
  console.log(`[db] connecting → ${host}`);

  // First one to connect
  connecting = db
    .connect()
    .then(() => {
      isConnected = true;
      console.log(`[db] connected → ${host}`);
    })
    .catch((err) => {
      console.error("[db] connection failed", err);
      throw err;
    })
    .finally(() => {
      connecting = null;
    });

  await connecting;
}
