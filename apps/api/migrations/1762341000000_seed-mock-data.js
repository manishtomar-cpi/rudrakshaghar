/* eslint-disable */
exports.shorthands = undefined;

/**
 * Seeds mock data for dev/testing with valid UUIDs and realistic dates (around 10 Nov 2025).
 * Includes:
 * - 3 customers + their addresses
 * - 3 products + images + variants
 * - 5 orders across different statuses
 * - order_items, payments (NONE/SUBMITTED/CONFIRMED), shipments
 * - 1 review (delivered order)
 * - 1 promo post + post_products
 * - 2 notifications (pending)
 *
 * NOTE: Availability rules, blackout, and meeting are seeded in 1762341100000_fix-availability-seed.js
 */
exports.up = async (pgm) => {
  // Ensure we have an OWNER user present (created by your ensureOwnerUser)
  pgm.sql(`
    DO $$
    DECLARE v_owner UUID;
    BEGIN
      SELECT id INTO v_owner FROM users WHERE role = 'OWNER' LIMIT 1;
      IF v_owner IS NULL THEN
        RAISE EXCEPTION 'OWNER user not found. Run ensureOwnerUser() first.';
      END IF;
    END$$;
  `);

  // === Customers ===
  pgm.sql(`
    INSERT INTO users (id, role, name, email, phone, password_hash, is_active, created_at, updated_at) VALUES
      ('11111111-1111-1111-1111-111111111111', 'CUSTOMER', 'Aarav Patel', 'aarav@example.com', '+919876543210', NULL, TRUE, '2025-10-20 10:00:00+00', '2025-11-05 10:00:00+00'),
      ('22222222-2222-2222-2222-222222222222', 'CUSTOMER', 'Isha Sharma', 'isha@example.com',  '+919812345678', NULL, TRUE, '2025-10-21 11:00:00+00', '2025-11-06 11:00:00+00'),
      ('33333333-3333-3333-3333-333333333333', 'CUSTOMER', 'Rahul Mehta', 'rahul@example.com', '+919700000001', NULL, TRUE, '2025-10-22 12:00:00+00', '2025-11-07 12:00:00+00')
    ON CONFLICT (id) DO NOTHING;
  `);

  // === Addresses ===
  pgm.sql(`
    INSERT INTO addresses (id, user_id, label, line1, line2, city, state, pincode, country, is_default, created_at, updated_at) VALUES
      ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', 'Home', '12 MG Road', 'Near Park', 'Bengaluru', 'KA', '560001', 'IN', TRUE,  '2025-10-25 09:00:00+00', '2025-11-01 09:00:00+00'),
      ('44444444-4444-4444-4444-444444444442', '22222222-2222-2222-2222-222222222222', 'Home', '22 Connaught Place', NULL, 'New Delhi', 'DL', '110001', 'IN', TRUE,  '2025-10-25 09:10:00+00', '2025-11-01 09:10:00+00'),
      ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333333', 'Home', '4 Law Garden', 'Apt 5B', 'Ahmedabad', 'GJ', '380006', 'IN', TRUE, '2025-10-25 09:20:00+00', '2025-11-01 09:20:00+00')
    ON CONFLICT (id) DO NOTHING;
  `);

  // === Products ===
  pgm.sql(`
    INSERT INTO products (id, title, slug, category, price_paise, description, authenticity_note, active, stock_qty, created_at, updated_at, deleted_at) VALUES
      ('55555555-5555-5555-5555-555555555551', 'Original 5-Mukhi Rudraksha', '5-mukhi-rudraksha', 'RUDRAKSHA', 149900, 'Sacred 5-mukhi bead with certificate', 'Lab-certified authenticity', TRUE, 100, '2025-10-15 08:00:00+00', '2025-11-01 08:00:00+00', NULL),
      ('55555555-5555-5555-5555-555555555552', 'Yellow Sapphire (Pukhraj) 5.25 Ratti', 'yellow-sapphire-5-25', 'GEMSTONE', 999900, 'Premium Jyotish-quality gemstone', 'IGI certified', TRUE, 25, '2025-10-16 08:00:00+00', '2025-11-01 08:00:00+00', NULL),
      ('55555555-5555-5555-5555-555555555553', 'Rudraksha Mala Thread', 'rudraksha-mala-thread', 'ACCESSORY', 29900, 'Durable red thread for malas', NULL, TRUE, 250, '2025-10-17 08:00:00+00', '2025-11-01 08:00:00+00', NULL)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Product images
  pgm.sql(`
    INSERT INTO product_images (id, product_id, url, position) VALUES
      ('66666666-6666-6666-6666-666666666661', '55555555-5555-5555-5555-555555555551', 'https://pics.example/5mukhi-1.jpg', 0),
      ('66666666-6666-6666-6666-666666666662', '55555555-5555-5555-5555-555555555552', 'https://pics.example/pukhraj-1.jpg', 0),
      ('66666666-6666-6666-6666-666666666663', '55555555-5555-5555-5555-555555555553', 'https://pics.example/thread-1.jpg', 0)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Variants
  pgm.sql(`
    INSERT INTO product_variants (id, product_id, label, price_paise, sku, active) VALUES
      ('77777777-7777-7777-7777-777777777771', '55555555-5555-5555-5555-555555555551', 'Single Bead', NULL, 'RUD-5M-1', TRUE),
      ('77777777-7777-7777-7777-777777777772', '55555555-5555-5555-5555-555555555551', 'Pendant (Silver Cap)', 219900, 'RUD-5M-2', TRUE),
      ('77777777-7777-7777-7777-777777777773', '55555555-5555-5555-5555-555555555552', 'Loose Stone', 999900, 'GEM-PUK-525', TRUE),
      ('77777777-7777-7777-7777-777777777774', '55555555-5555-5555-5555-555555555553', 'One Thread Pack', NULL, 'ACC-THR-RED', TRUE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // === Orders ===
  pgm.sql(`
    INSERT INTO orders (
      id, order_number, user_id, status,
      total_item_paise, shipping_paise, discount_paise, total_payable_paise,
      ship_name, ship_phone, ship_line1, ship_line2, ship_city, ship_state, ship_pincode, ship_country,
      payment_method, payment_status, created_at, updated_at
    ) VALUES
      -- c1 delivered
      ('88888888-8888-8888-8888-888888888881', 'RUD-20251102-0001', '11111111-1111-1111-1111-111111111111', 'DELIVERED',
       149900, 0, 0, 149900,
       'Aarav Patel', '+919876543210', '12 MG Road', 'Near Park', 'Bengaluru','KA','560001','IN',
       'UPI_MANUAL', 'CONFIRMED', '2025-10-28 08:45:00+00', '2025-11-02 09:10:00+00'),

      -- c1 shipped
      ('88888888-8888-8888-8888-888888888882', 'RUD-20251108-0002', '11111111-1111-1111-1111-111111111111', 'SHIPPED',
       249800, 0, 0, 249800,
       'Aarav Patel', '+919876543210', '12 MG Road', 'Near Park', 'Bengaluru','KA','560001','IN',
       'UPI_MANUAL', 'CONFIRMED', '2025-11-07 10:00:00+00', '2025-11-08 12:00:00+00'),

      -- c2 payment submitted
      ('88888888-8888-8888-8888-888888888883', 'RUD-20251109-0003', '22222222-2222-2222-2222-222222222222', 'PAYMENT_SUBMITTED',
       999900, 0, 0, 999900,
       'Isha Sharma', '+919812345678', '22 Connaught Place', NULL, 'New Delhi','DL','110001','IN',
       'UPI_MANUAL', 'SUBMITTED', '2025-11-09 09:30:00+00', '2025-11-09 09:45:00+00'),

      -- c2 cancelled
      ('88888888-8888-8888-8888-888888888884', 'RUD-20251105-0004', '22222222-2222-2222-2222-222222222222', 'CANCELLED',
       29900, 0, 0, 29900,
       'Isha Sharma', '+919812345678', '22 Connaught Place', NULL, 'New Delhi','DL','110001','IN',
       'UPI_MANUAL', 'NONE', '2025-11-05 14:00:00+00', '2025-11-05 16:00:00+00'),

      -- c3 placed
      ('88888888-8888-8888-8888-888888888885', 'RUD-20251110-0005', '33333333-3333-3333-3333-333333333333', 'PLACED',
       149900, 0, 0, 149900,
       'Rahul Mehta', '+919700000001', '4 Law Garden', 'Apt 5B', 'Ahmedabad','GJ','380006','IN',
       'UPI_MANUAL', 'NONE', '2025-11-10 08:10:00+00', '2025-11-10 08:10:00+00')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Order items
  pgm.sql(`
    INSERT INTO order_items (id, order_id, product_id, variant_id, title_snapshot, variant_snapshot, unit_price_paise, qty, line_total_paise) VALUES
      ('99999999-9999-9999-9999-999999999991', '88888888-8888-8888-8888-888888888881', '55555555-5555-5555-5555-555555555551', '77777777-7777-7777-7777-777777777771', 'Original 5-Mukhi Rudraksha', 'Single Bead', 149900, 1, 149900),

      ('99999999-9999-9999-9999-999999999992', '88888888-8888-8888-8888-888888888882', '55555555-5555-5555-5555-555555555551', '77777777-7777-7777-7777-777777777772', 'Original 5-Mukhi Rudraksha', 'Pendant (Silver Cap)', 219900, 1, 219900),
      ('99999999-9999-9999-9999-999999999993', '88888888-8888-8888-8888-888888888882', '55555555-5555-5555-5555-555555555553', '77777777-7777-7777-7777-777777777774', 'Rudraksha Mala Thread', 'One Thread Pack', 29900, 1, 29900),

      ('99999999-9999-9999-9999-999999999994', '88888888-8888-8888-8888-888888888883', '55555555-5555-5555-5555-555555555552', '77777777-7777-7777-7777-777777777773', 'Yellow Sapphire (Pukhraj) 5.25 Ratti', 'Loose Stone', 999900, 1, 999900),

      ('99999999-9999-9999-9999-999999999995', '88888888-8888-8888-8888-888888888884', '55555555-5555-5555-5555-555555555553', '77777777-7777-7777-7777-777777777774', 'Rudraksha Mala Thread', 'One Thread Pack', 29900, 1, 29900),

      ('99999999-9999-9999-9999-999999999996', '88888888-8888-8888-8888-888888888885', '55555555-5555-5555-5555-555555555551', '77777777-7777-7777-7777-777777777771', 'Original 5-Mukhi Rudraksha', 'Single Bead', 149900, 1, 149900)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Payments (CTE scoped to this single statement is fine)
  pgm.sql(`
    WITH owner AS (SELECT id FROM users WHERE role = 'OWNER' LIMIT 1)
    INSERT INTO payments (
      id, order_id, upi_vpa, qr_payload, intent_url,
      submitted_at, screenshot_url, reference_text,
      status, verified_at, verified_by, rejection_reason,
      created_at, updated_at
    ) VALUES
      ('10101010-1010-1010-1010-101010101001', '88888888-8888-8888-8888-888888888881', 'merchant@bank', 'upi://pay?pa=merchant@bank&am=1499', 'upi://intent/o1',
       '2025-10-28 08:50:00+00', 'https://pics.example/pay-o1.jpg', 'TXN-O1-1499',
       'CONFIRMED', '2025-10-28 09:10:00+00', (SELECT id FROM owner), NULL,
       '2025-10-28 08:45:00+00', '2025-11-02 09:10:00+00'),

      ('10101010-1010-1010-1010-101010101002', '88888888-8888-8888-8888-888888888882', 'merchant@bank', 'upi://pay?pa=merchant@bank&am=2498', 'upi://intent/o2',
       '2025-11-07 10:05:00+00', 'https://pics.example/pay-o2.jpg', 'TXN-O2-2498',
       'CONFIRMED', '2025-11-07 10:20:00+00', (SELECT id FROM owner), NULL,
       '2025-11-07 10:00:00+00', '2025-11-08 12:00:00+00'),

      ('10101010-1010-1010-1010-101010101003', '88888888-8888-8888-8888-888888888883', 'merchant@bank', 'upi://pay?pa=merchant@bank&am=9999', 'upi://intent/o3',
       '2025-11-09 09:35:00+00', 'https://pics.example/pay-o3.jpg', 'TXN-O3-9999',
       'SUBMITTED', NULL, NULL, NULL,
       '2025-11-09 09:30:00+00', '2025-11-09 09:45:00+00')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Shipments
  pgm.sql(`
    INSERT INTO shipments (id, order_id, courier_name, awb_number, tracking_url, shipped_at, delivered_at, created_at, updated_at) VALUES
      ('20202020-2020-2020-2020-202020202001', '88888888-8888-8888-8888-888888888881', 'BlueDart', 'BD123456789IN', 'https://track.example/BD123456789IN', '2025-10-30 09:00:00+00', '2025-11-02 09:00:00+00', '2025-10-30 09:00:00+00', '2025-11-02 09:00:00+00'),
      ('20202020-2020-2020-2020-202020202002', '88888888-8888-8888-8888-888888888882', 'Delhivery', 'DLV0987654321', 'https://track.example/DLV0987654321', '2025-11-08 11:30:00+00', NULL, '2025-11-08 11:30:00+00', '2025-11-08 11:30:00+00')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Review
  pgm.sql(`
    INSERT INTO reviews (id, order_id, product_id, user_id, rating, comment, status, is_testimonial_pinned, published_at, created_at, updated_at) VALUES
      ('30303030-3030-3030-3030-303030303001', '88888888-8888-8888-8888-888888888881', '55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111',
       5, 'Excellent quality and fast delivery!', 'APPROVED', TRUE, '2025-11-03 10:00:00+00', '2025-11-02 10:00:00+00', '2025-11-03 10:00:00+00')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Posts + mapping
  pgm.sql(`
    INSERT INTO posts (id, image_url, caption, active, priority, created_at, updated_at) VALUES
      ('40404040-4040-4040-4040-404040404001', 'https://pics.example/banner-diwali.jpg', 'Diwali offers on Rudraksha', TRUE, 10, '2025-11-01 07:00:00+00', '2025-11-01 07:00:00+00')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO post_products (post_id, product_id) VALUES
      ('40404040-4040-4040-4040-404040404001', '55555555-5555-5555-5555-555555555551'),
      ('40404040-4040-4040-4040-404040404001', '55555555-5555-5555-5555-555555555552')
    ON CONFLICT DO NOTHING;
  `);

  // Notifications outbox
  pgm.sql(`
    INSERT INTO notifications_outbox (id, channel, to_address, template_key, payload, status, created_at, updated_at) VALUES
      ('80808080-8080-8080-8080-808080808001', 'EMAIL', 'aarav@example.com', 'order_delivered',
        '{"orderNumber":"RUD-20251102-0001"}', 'PENDING', '2025-11-02 10:30:00+00', '2025-11-02 10:30:00+00'),
      ('80808080-8080-8080-8080-808080808002', 'WHATSAPP', '+919812345678', 'payment_pending',
        '{"orderNumber":"RUD-20251109-0003"}', 'PENDING', '2025-11-09 10:00:00+00', '2025-11-09 10:00:00+00')
    ON CONFLICT (id) DO NOTHING;
  `);
};

exports.down = async (pgm) => {
  pgm.sql(`
    DELETE FROM notifications_outbox WHERE id IN
      ('80808080-8080-8080-8080-808080808001','80808080-8080-8080-8080-808080808002');

    DELETE FROM reviews WHERE id = '30303030-3030-3030-3030-303030303001';

    DELETE FROM shipments WHERE id IN
      ('20202020-2020-2020-2020-202020202001','20202020-2020-2020-2020-202020202002');

    DELETE FROM payments WHERE id IN
      ('10101010-1010-1010-1010-101010101001','10101010-1010-1010-1010-101010101002','10101010-1010-1010-1010-101010101003');

    DELETE FROM order_items WHERE id IN
      ('99999999-9999-9999-9999-999999999991','99999999-9999-9999-9999-999999999992','99999999-9999-9999-9999-999999999993',
       '99999999-9999-9999-9999-999999999994','99999999-9999-9999-9999-999999999995','99999999-9999-9999-9999-999999999996');

    DELETE FROM orders WHERE id IN
      ('88888888-8888-8888-8888-888888888881','88888888-8888-8888-8888-888888888882','88888888-8888-8888-8888-888888888883',
       '88888888-8888-8888-8888-888888888884','88888888-8888-8888-8888-888888888885');

    DELETE FROM post_products WHERE post_id = '40404040-4040-4040-4040-404040404001';
    DELETE FROM posts WHERE id = '40404040-4040-4040-4040-404040404001';

    DELETE FROM product_images WHERE id IN
      ('66666666-6666-6666-6666-666666666661','66666666-6666-6666-6666-666666666662','66666666-6666-6666-6666-666666666663');

    DELETE FROM product_variants WHERE id IN
      ('77777777-7777-7777-7777-777777777771','77777777-7777-7777-7777-777777777772',
       '77777777-7777-7777-7777-777777777773','77777777-7777-7777-7777-777777777774');

    DELETE FROM products WHERE id IN
      ('55555555-5555-5555-5555-555555555551','55555555-5555-5555-5555-555555555552','55555555-5555-5555-5555-555555555553');

    DELETE FROM addresses WHERE id IN
      ('44444444-4444-4444-4444-444444444441','44444444-4444-4444-4444-444444444442','44444444-4444-4444-4444-444444444443');

    DELETE FROM users WHERE id IN
      ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333');
  `);
};
