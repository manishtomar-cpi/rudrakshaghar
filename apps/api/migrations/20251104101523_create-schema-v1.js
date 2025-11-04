/* eslint-disable */
exports.shorthands = undefined;

exports.up = async (pgm) => {
  // ==========================
  // Enums
  // ==========================
  pgm.sql(`
    CREATE TYPE user_role AS ENUM ('OWNER', 'CUSTOMER');
    CREATE TYPE order_status AS ENUM ('PLACED','PAYMENT_SUBMITTED','PAYMENT_CONFIRMED','PACKED','SHIPPED','DELIVERED','CANCELLED');
    CREATE TYPE payment_status AS ENUM ('NONE','SUBMITTED','CONFIRMED','REJECTED');
    CREATE TYPE meeting_status AS ENUM ('BOOKED','CANCELLED','COMPLETED','NO_SHOW');
    CREATE TYPE review_status AS ENUM ('PENDING','APPROVED','HIDDEN');
    CREATE TYPE call_channel AS ENUM ('MEET');
    CREATE TYPE product_category AS ENUM ('RUDRAKSHA','GEMSTONE','ACCESSORY');
  `);

  // ==========================
  // Tables
  // ==========================

  // users
  pgm.sql(`
    CREATE TABLE users (
      id UUID PRIMARY KEY,
      role user_role NOT NULL DEFAULT 'CUSTOMER',
      name TEXT,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );
  `);

  // addresses
  pgm.sql(`
    CREATE TABLE addresses (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id),
      label TEXT,
      line1 TEXT,
      line2 TEXT,
      city TEXT,
      state TEXT,
      pincode TEXT,
      country TEXT,
      is_default BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );

    CREATE INDEX addresses_user_default_idx ON addresses (user_id, is_default);
  `);

  // products
  pgm.sql(`
    CREATE TABLE products (
      id UUID PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      category product_category NOT NULL,
      price_paise INT NOT NULL,
      description TEXT,
      authenticity_note TEXT,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      stock_qty INT,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      deleted_at TIMESTAMP
    );

    CREATE INDEX products_active_category_idx ON products (active, category);
  `);

  // product_images
  pgm.sql(`
    CREATE TABLE product_images (
      id UUID PRIMARY KEY,
      product_id UUID NOT NULL REFERENCES products(id),
      url TEXT NOT NULL,
      position INT NOT NULL DEFAULT 0
    );

    CREATE INDEX product_images_product_position_idx ON product_images (product_id, position);
  `);

  // product_variants
  pgm.sql(`
    CREATE TABLE product_variants (
      id UUID PRIMARY KEY,
      product_id UUID NOT NULL REFERENCES products(id),
      label TEXT NOT NULL,
      price_paise INT,
      sku TEXT UNIQUE,
      active BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE INDEX product_variants_product_active_idx ON product_variants (product_id, active);
  `);

  // orders
  pgm.sql(`
    CREATE TABLE orders (
      id UUID PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      user_id UUID NOT NULL REFERENCES users(id),
      status order_status NOT NULL DEFAULT 'PLACED',

      total_item_paise INT NOT NULL,
      shipping_paise INT NOT NULL DEFAULT 0,
      discount_paise INT NOT NULL DEFAULT 0,
      total_payable_paise INT NOT NULL,

      ship_name TEXT,
      ship_phone TEXT,
      ship_line1 TEXT,
      ship_line2 TEXT,
      ship_city TEXT,
      ship_state TEXT,
      ship_pincode TEXT,
      ship_country TEXT,

      payment_method TEXT NOT NULL DEFAULT 'UPI_MANUAL',
      payment_status payment_status NOT NULL DEFAULT 'NONE',

      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );

    CREATE INDEX orders_user_created_idx ON orders (user_id, created_at);
    CREATE INDEX orders_status_idx ON orders (status);
    CREATE INDEX orders_payment_status_idx ON orders (payment_status);
  `);

  // order_items
  pgm.sql(`
    CREATE TABLE order_items (
      id UUID PRIMARY KEY,
      order_id UUID NOT NULL REFERENCES orders(id),
      product_id UUID NOT NULL REFERENCES products(id),
      variant_id UUID REFERENCES product_variants(id),
      title_snapshot TEXT NOT NULL,
      variant_snapshot TEXT,
      unit_price_paise INT NOT NULL,
      qty INT NOT NULL,
      line_total_paise INT NOT NULL
    );

    CREATE INDEX order_items_order_idx ON order_items (order_id);
  `);

  // payments (1:1 with orders)
  pgm.sql(`
    CREATE TABLE payments (
      id UUID PRIMARY KEY,
      order_id UUID NOT NULL UNIQUE REFERENCES orders(id),
      upi_vpa TEXT NOT NULL,
      qr_payload TEXT NOT NULL,
      intent_url TEXT NOT NULL,

      submitted_at TIMESTAMP,
      screenshot_url TEXT,
      reference_text TEXT,

      status payment_status NOT NULL DEFAULT 'NONE',
      verified_at TIMESTAMP,
      verified_by UUID REFERENCES users(id),
      rejection_reason TEXT,

      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );

    CREATE INDEX payments_order_idx ON payments (order_id);
    CREATE INDEX payments_status_idx ON payments (status);
  `);

  // shipments (1:1 with orders)
  pgm.sql(`
    CREATE TABLE shipments (
      id UUID PRIMARY KEY,
      order_id UUID NOT NULL UNIQUE REFERENCES orders(id),
      courier_name TEXT,
      awb_number TEXT,
      tracking_url TEXT,
      shipped_at TIMESTAMP,
      delivered_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );

    CREATE INDEX shipments_order_idx ON shipments (order_id);
  `);

  // availability_rules
  pgm.sql(`
    CREATE TABLE availability_rules (
      id UUID PRIMARY KEY,
      owner_id UUID NOT NULL REFERENCES users(id),
      weekday SMALLINT NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      slot_minutes INT NOT NULL,
      buffer_minutes INT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE INDEX availability_rules_active_weekday_idx ON availability_rules (active, weekday);
    CREATE UNIQUE INDEX availability_rules_owner_week_time_uidx
      ON availability_rules (owner_id, weekday, start_time, end_time);
  `);

  // availability_blackouts
  pgm.sql(`
    CREATE TABLE availability_blackouts (
      id UUID PRIMARY KEY,
      owner_id UUID NOT NULL REFERENCES users(id),
      date DATE NOT NULL,
      reason TEXT
    );

    CREATE UNIQUE INDEX availability_blackouts_owner_date_uidx ON availability_blackouts (owner_id, date);
  `);

  // meetings
  pgm.sql(`
    CREATE TABLE meetings (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id),
      owner_id UUID NOT NULL REFERENCES users(id),
      status meeting_status NOT NULL DEFAULT 'BOOKED',
      purpose TEXT,
      channel call_channel NOT NULL DEFAULT 'MEET',
      meet_link TEXT,
      slot_start TIMESTAMP NOT NULL,
      slot_end TIMESTAMP NOT NULL,
      notes TEXT,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );

    CREATE INDEX meetings_owner_slot_idx ON meetings (owner_id, slot_start);
    CREATE INDEX meetings_user_slot_idx ON meetings (user_id, slot_start);
  `);

  // reviews
  pgm.sql(`
    CREATE TABLE reviews (
      id UUID PRIMARY KEY,
      order_id UUID NOT NULL REFERENCES orders(id),
      product_id UUID NOT NULL REFERENCES products(id),
      user_id UUID NOT NULL REFERENCES users(id),
      rating SMALLINT NOT NULL,
      comment TEXT,
      status review_status NOT NULL DEFAULT 'PENDING',
      is_testimonial_pinned BOOLEAN NOT NULL DEFAULT FALSE,
      published_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );

    CREATE INDEX reviews_product_status_idx ON reviews (product_id, status);
  `);

  // posts
  pgm.sql(`
    CREATE TABLE posts (
      id UUID PRIMARY KEY,
      image_url TEXT NOT NULL,
      caption TEXT,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      priority INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );
  `);

  // post_products (join)
  pgm.sql(`
    CREATE TABLE post_products (
      post_id UUID NOT NULL REFERENCES posts(id),
      product_id UUID NOT NULL REFERENCES products(id),
      PRIMARY KEY (post_id, product_id)
    );

    CREATE INDEX post_products_post_idx ON post_products (post_id);
    CREATE INDEX post_products_product_idx ON post_products (product_id);
  `);

  // app_settings (singleton row with id='singleton')
  pgm.sql(`
    CREATE TABLE app_settings (
      id TEXT PRIMARY KEY,
      business_name TEXT,
      upi_vpa TEXT,
      whatsapp_number TEXT,
      pickup_address JSON,
      support_email TEXT
    );
  `);

  // notifications_outbox
  pgm.sql(`
    CREATE TABLE notifications_outbox (
      id UUID PRIMARY KEY,
      channel TEXT NOT NULL,
      to_address TEXT NOT NULL,
      template_key TEXT NOT NULL,
      payload JSON NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      last_error TEXT,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      sent_at TIMESTAMP
    );

    CREATE INDEX notifications_outbox_status_idx ON notifications_outbox (status);
  `);

  // audit_log
  pgm.sql(`
    CREATE TABLE audit_log (
      id UUID PRIMARY KEY,
      actor_user_id UUID REFERENCES users(id),
      entity TEXT NOT NULL,
      entity_id UUID NOT NULL,
      action TEXT NOT NULL,
      before JSON,
      after JSON,
      created_at TIMESTAMP NOT NULL
    );

    CREATE INDEX audit_log_entity_idx ON audit_log (entity, entity_id, created_at);
  `);
};

exports.down = async (pgm) => {
  // Drop tables in reverse dependency order
  pgm.sql(`
    DROP TABLE IF EXISTS audit_log CASCADE;
    DROP TABLE IF EXISTS notifications_outbox CASCADE;
    DROP TABLE IF EXISTS app_settings CASCADE;
    DROP TABLE IF EXISTS post_products CASCADE;
    DROP TABLE IF EXISTS posts CASCADE;
    DROP TABLE IF EXISTS reviews CASCADE;
    DROP TABLE IF EXISTS meetings CASCADE;
    DROP TABLE IF EXISTS availability_blackouts CASCADE;
    DROP TABLE IF EXISTS availability_rules CASCADE;
    DROP TABLE IF EXISTS shipments CASCADE;
    DROP TABLE IF EXISTS payments CASCADE;
    DROP TABLE IF EXISTS order_items CASCADE;
    DROP TABLE IF EXISTS orders CASCADE;
    DROP TABLE IF EXISTS product_variants CASCADE;
    DROP TABLE IF EXISTS product_images CASCADE;
    DROP TABLE IF EXISTS products CASCADE;
    DROP TABLE IF EXISTS addresses CASCADE;
    DROP TABLE IF EXISTS users CASCADE;

    DROP TYPE IF EXISTS product_category;
    DROP TYPE IF EXISTS call_channel;
    DROP TYPE IF EXISTS review_status;
    DROP TYPE IF EXISTS meeting_status;
    DROP TYPE IF EXISTS payment_status;
    DROP TYPE IF EXISTS order_status;
    DROP TYPE IF EXISTS user_role;
  `);
};





