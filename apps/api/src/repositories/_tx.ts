import { getDb } from "../modules/db";

// Minimal pg Client-like type
export type PgClientLike = {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
};

export async function withTx<T>(fn: (tx: PgClientLike) => Promise<T>): Promise<T> {
  const db = getDb() as unknown as PgClientLike;
  await db.query("BEGIN");
  try {
    const res = await fn(db);
    await db.query("COMMIT");
    return res;
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  }
}
