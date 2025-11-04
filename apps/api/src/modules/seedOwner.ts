import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { ensureDbConnected, getDb } from "./db";

export async function ensureOwnerUser() {
  await ensureDbConnected();

  const name = process.env.OWNER_NAME?.trim();
  const email = process.env.OWNER_EMAIL?.trim();
  const phone = process.env.OWNER_PHONE?.trim();
  const password = process.env.OWNER_PASSWORD;

  if (!name || !email || !phone || !password) {
    console.log(
      "[seed] Skipped — missing one of OWNER_NAME/OWNER_EMAIL/OWNER_PHONE/OWNER_PASSWORD envs"
    );
    return;
  }

  const db = getDb();

  // Hash password
  const hash = await bcrypt.hash(password, 10);

  // Use Node-generated UUID to avoid requiring DB uuid extensions
  const id = randomUUID();

  // Upsert by unique email (your schema has unique(email))
  const sql = `
    INSERT INTO users (id, role, name, email, phone, password_hash, is_active, created_at, updated_at)
    VALUES ($1, 'OWNER', $2, $3, $4, $5, TRUE, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE
      SET name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          password_hash = EXCLUDED.password_hash,
          updated_at = NOW();
  `;

  await db.query(sql, [id, name, email, phone, hash]);

  // Verify role is OWNER (in case an old record had CUSTOMER)
  await db.query(
    `UPDATE users SET role = 'OWNER', updated_at = NOW() WHERE email = $1`,
    [email]
  );

  console.log(`[seed] Owner ensured → name="${name}", email="${email}"`);
}
