// apps/api/src/repositories/appSettings.repo.ts
import type { Client } from "pg";
import { AppSettingsCreateDto, AppSettingsUpdateDto } from "../validators/appSettings.schema";
import { getDb } from "../modules/db";

export type AppSettingsRow = {
  id: string;
  business_name: string;
  support_email: string;
  support_phone: string;
  whatsapp_number: string;
  upi_vpa: string;
  upi_payee_name: string;
  upi_qr_url: string | null;
  pickup_address: string;
  currency: string;
  logo_url: string | null;
  return_address: string | null;
  privacy_url: string | null;
  terms_url: string | null;
  return_policy_url: string | null;
  created_at: string;
  updated_at: string;
};

const SETTINGS_ID = "settings";

export class AppSettingsRepo {
  constructor(private db: Client) {}

  /** Static helper for read-only fetch used by public/checkout flows */
  static async getOwner(): Promise<AppSettingsRow | null> {
    const db = getDb();
    const repo = new AppSettingsRepo(db);
    return repo.find();
  }

  async find(): Promise<AppSettingsRow | null> {
    const res = await this.db.query<AppSettingsRow>(
      "SELECT * FROM app_settings WHERE id=$1",
      [SETTINGS_ID]
    );
    return res.rows[0] ?? null;
  }

  async create(dto: AppSettingsCreateDto): Promise<AppSettingsRow> {
    const res = await this.db.query<AppSettingsRow>(
      `
      INSERT INTO app_settings
        (id,business_name,support_email,support_phone,whatsapp_number,upi_vpa,upi_payee_name,upi_qr_url,
         pickup_address,currency,logo_url,return_address,privacy_url,terms_url,return_policy_url)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10,'INR'),$11,$12,$13,$14,$15)
      ON CONFLICT (id) DO NOTHING
      RETURNING *;
      `,
      [
        SETTINGS_ID,
        dto.businessName,
        dto.supportEmail,
        dto.supportPhone,
        dto.whatsappNumber,
        dto.upiVpa,
        dto.upiPayeeName,
        dto.upiQrUrl ?? null,
        dto.pickupAddress,
        dto.currency ?? "INR",
        dto.logoUrl ?? null,
        dto.returnAddress ?? null,
        dto.privacyUrl ?? null,
        dto.termsUrl ?? null,
        dto.returnPolicyUrl ?? null,
      ]
    );

    if (res.rowCount === 0) {
      const existing = await this.find();
      if (existing) return existing;
    }
    return res.rows[0];
  }

  async update(partial: AppSettingsUpdateDto): Promise<AppSettingsRow> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    const map: Record<string, any> = {
      business_name: partial.businessName,
      support_email: partial.supportEmail,
      support_phone: partial.supportPhone,
      whatsapp_number: partial.whatsappNumber,
      upi_vpa: partial.upiVpa,
      upi_payee_name: partial.upiPayeeName,
      upi_qr_url: partial.upiQrUrl,
      pickup_address: partial.pickupAddress,
      currency: partial.currency,
      logo_url: partial.logoUrl,
      return_address: partial.returnAddress,
      privacy_url: partial.privacyUrl,
      terms_url: partial.termsUrl,
      return_policy_url: partial.returnPolicyUrl,
    };

    for (const [col, val] of Object.entries(map)) {
      if (typeof val !== "undefined") {
        fields.push(`${col} = $${i++}`);
        values.push(val);
      }
    }

    if (!fields.length) {
      const existing = await this.find();
      if (!existing) throw new Error("Settings not found");
      return existing;
    }

    values.push(SETTINGS_ID);
    const res = await this.db.query<AppSettingsRow>(
      `UPDATE app_settings SET ${fields.join(", ")} WHERE id=$${i} RETURNING *;`,
      values
    );
    if (res.rowCount === 0) throw new Error("Settings not found");
    return res.rows[0];
  }

  async setQrUrl(url: string): Promise<AppSettingsRow> {
    const res = await this.db.query<AppSettingsRow>(
      `UPDATE app_settings SET upi_qr_url=$1 WHERE id=$2 RETURNING *;`,
      [url, SETTINGS_ID]
    );
    if (res.rowCount === 0) throw new Error("Settings not found");
    return res.rows[0];
  }
}
