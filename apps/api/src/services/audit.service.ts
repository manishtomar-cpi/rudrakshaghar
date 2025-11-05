import type { Client } from "pg";

type AuditAppendInput = {
  actorUserId: string;
  entity: string;
  entityId: string;
  action: string;
  before: unknown;
  after: unknown;
};

export class AuditService {
  constructor(private db: Client) {}

  async append(input: AuditAppendInput) {
    await this.db.query(
      `INSERT INTO audit_log (id, actor_user_id, entity, entity_id, action, before, after, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, now())`,
      [input.actorUserId, input.entity, input.entityId, input.action, input.before ?? null, input.after ?? null]
    );
  }
}
