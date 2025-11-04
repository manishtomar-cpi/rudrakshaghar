// apps/api/src/repositories/user.repo.ts
import { getDb } from "../modules/db";

export type UserRow = {
  id: string;
  role: "OWNER" | "CUSTOMER";
  name: string | null;
  email: string;
  phone: string;
  password_hash: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const UserRepo = {
  async findByEmail(email: string): Promise<UserRow | null> {
    const db = getDb();
    const q = await db.query<UserRow>("SELECT * FROM users WHERE email = $1", [email]);
    return q.rows[0] ?? null;
  },

  async findById(id: string): Promise<UserRow | null> {
    const db = getDb();
    const q = await db.query<UserRow>("SELECT * FROM users WHERE id = $1", [id]);
    return q.rows[0] ?? null;
  },

  async create(u: {
    id: string;
    name: string;
    email: string;
    phone: string;
    password_hash: string;
  }): Promise<UserRow> {
    const db = getDb();
    const q = await db.query<UserRow>(
      `INSERT INTO users (id, role, name, email, phone, password_hash, is_active, created_at, updated_at)
       VALUES ($1, 'CUSTOMER', $2, $3, $4, $5, TRUE, NOW(), NOW())
       RETURNING *`,
      [u.id, u.name, u.email, u.phone, u.password_hash]
    );
    return q.rows[0];
  },
};
