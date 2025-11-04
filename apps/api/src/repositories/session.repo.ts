// apps/api/src/repositories/session.repo.ts
import { getDb } from "../modules/db";

export type SessionRow = {
  id: string;
  user_id: string;
  refresh_hash: string;
  user_agent: string | null;
  ip: string | null;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  replaced_by: string | null;
};

export const SessionRepo = {
  async create(s: {
    id: string;
    user_id: string;
    refresh_hash: string;
    user_agent?: string | null;
    ip?: string | null;
    ttlSec: number;
  }): Promise<SessionRow> {
    const db = getDb();
    const q = await db.query<SessionRow>(
      `INSERT INTO sessions (id, user_id, refresh_hash, user_agent, ip, created_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + ($6 || ' seconds')::interval)
       RETURNING *`,
      [s.id, s.user_id, s.refresh_hash, s.user_agent ?? null, s.ip ?? null, s.ttlSec]
    );
    return q.rows[0];
  },

  async findActiveByHash(hash: string): Promise<SessionRow | null> {
    const db = getDb();
    const q = await db.query<SessionRow>(
      `SELECT * FROM sessions
       WHERE refresh_hash = $1 AND revoked_at IS NULL AND NOW() < expires_at`,
      [hash]
    );
    return q.rows[0] ?? null;
  },

  async revoke(id: string): Promise<void> {
    const db = getDb();
    await db.query(`UPDATE sessions SET revoked_at = NOW() WHERE id = $1`, [id]);
  },

  async replace(oldId: string, newId: string): Promise<void> {
    const db = getDb();
    await db.query(`UPDATE sessions SET replaced_by = $2, revoked_at = NOW() WHERE id = $1`, [oldId, newId]);
  },

  async revokeAllForUser(userId: string): Promise<void> {
    const db = getDb();
    await db.query(`UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`, [userId]);
  },
};
