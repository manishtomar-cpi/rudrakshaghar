/* eslint-disable */
exports.shorthands = undefined;

exports.up = async (pgm) => {
  // create the final table with a singleton constraint + timestamps
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS app_settings_new (
      id TEXT PRIMARY KEY DEFAULT 'settings',
      business_name TEXT NOT NULL,
      support_email TEXT NOT NULL,
      support_phone TEXT NOT NULL,
      whatsapp_number TEXT NOT NULL,
      upi_vpa TEXT NOT NULL,
      upi_payee_name TEXT NOT NULL,
      upi_qr_url TEXT,
      pickup_address TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      logo_url TEXT,
      return_address TEXT,
      privacy_url TEXT,
      terms_url TEXT,
      return_policy_url TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT app_settings_singleton CHECK (id = 'settings')
    );
  `);

  // migrate minimal data from old table if it exists
  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_settings') THEN
        INSERT INTO app_settings_new (
          id, business_name, support_email, support_phone, whatsapp_number,
          upi_vpa, upi_payee_name, upi_qr_url, pickup_address, currency
        )
        SELECT
          'settings',
          COALESCE((SELECT business_name FROM app_settings LIMIT 1), 'Your Business'),
          COALESCE((SELECT support_email  FROM app_settings LIMIT 1), 'support@example.com'),
          '+910000000000',
          COALESCE((SELECT whatsapp_number FROM app_settings LIMIT 1), '+910000000000'),
          COALESCE((SELECT upi_vpa FROM app_settings LIMIT 1), 'merchant@bank'),
          'Owner',
          NULL,
          COALESCE((
            SELECT CASE
              WHEN json_typeof(pickup_address) = 'string' THEN pickup_address::text
              ELSE (pickup_address->>'line1')
            END
            FROM app_settings LIMIT 1
          ), 'Address TBD'),
          'INR'
        ON CONFLICT (id) DO NOTHING;
      ELSE
        INSERT INTO app_settings_new (
          id, business_name, support_email, support_phone, whatsapp_number,
          upi_vpa, upi_payee_name, pickup_address, currency
        )
        VALUES (
          'settings','Your Business','support@example.com',
          '+910000000000','+910000000000',
          'merchant@bank','Owner','Address TBD','INR'
        ) ON CONFLICT (id) DO NOTHING;
      END IF;
    END$$;
  `);

  // swap
  pgm.sql(`
    DROP TABLE IF EXISTS app_settings CASCADE;
    ALTER TABLE app_settings_new RENAME TO app_settings;
  `);

  // updated_at trigger
  pgm.sql(`
    CREATE OR REPLACE FUNCTION app_settings_set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = now(); RETURN NEW; END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS app_settings_touch ON app_settings;
    CREATE TRIGGER app_settings_touch
      BEFORE UPDATE ON app_settings
      FOR EACH ROW EXECUTE FUNCTION app_settings_set_updated_at();
  `);
};

exports.down = async (pgm) => {
  // revert to original minimal shape (best-effort)
  pgm.sql(`
    DROP TRIGGER IF EXISTS app_settings_touch ON app_settings;
    DROP FUNCTION IF EXISTS app_settings_set_updated_at;

    CREATE TABLE IF NOT EXISTS app_settings_old (
      id TEXT PRIMARY KEY,
      business_name TEXT,
      upi_vpa TEXT,
      whatsapp_number TEXT,
      pickup_address JSON,
      support_email TEXT
    );

    INSERT INTO app_settings_old (id, business_name, upi_vpa, whatsapp_number, pickup_address, support_email)
    SELECT
      'singleton',
      business_name,
      upi_vpa,
      whatsapp_number,
      to_jsonb(pickup_address)::json,
      support_email
    FROM app_settings
    ON CONFLICT (id) DO NOTHING;

    DROP TABLE IF EXISTS app_settings;
    ALTER TABLE app_settings_old RENAME TO app_settings;
  `);
};
