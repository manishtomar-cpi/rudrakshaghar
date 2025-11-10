/* eslint-disable */
exports.shorthands = undefined;

/**
 * Adds availability, blackout, and a sample meeting.
 * - No DO $$/RAISE guard.
 * - Uses subselects + WHERE EXISTS so it’s safe if data is missing.
 * - Assumes 1762341000000_seed-mock-data.js inserted OWNER and customer 1111-...-1111.
 */
exports.up = async (pgm) => {
  // Availability rule for the OWNER (Mon 10:00–13:00)
  pgm.sql(`
    INSERT INTO availability_rules (id, owner_id, weekday, start_time, end_time, slot_minutes, buffer_minutes, active)
    SELECT
      '50505050-5050-5050-5050-505050505001',
      o.id, 1, '10:00', '13:00', 30, 10, TRUE
    FROM (SELECT id FROM users WHERE role='OWNER' ORDER BY created_at LIMIT 1) o
    WHERE EXISTS (SELECT 1 FROM users WHERE role='OWNER')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Blackout for the OWNER (2025-11-12)
  pgm.sql(`
    INSERT INTO availability_blackouts (id, owner_id, date, reason)
    SELECT
      '60606060-6060-6060-6060-606060606001',
      o.id, DATE '2025-11-12', 'Personal'
    FROM (SELECT id FROM users WHERE role='OWNER' ORDER BY created_at LIMIT 1) o
    WHERE EXISTS (SELECT 1 FROM users WHERE role='OWNER')
    ON CONFLICT (id) DO NOTHING;
  `);

  // One meeting between customer 1111… and OWNER (2025-11-13 10:00–10:30)
  pgm.sql(`
    INSERT INTO meetings
      (id, user_id, owner_id, status, purpose, channel, meet_link, slot_start, slot_end, notes, created_at, updated_at)
    SELECT
      '70707070-7070-7070-7070-707070707001',
      c.id, o.id,
      'BOOKED', 'Gemstone consultation', 'MEET', 'https://meet.example/abc',
      TIMESTAMP '2025-11-13 10:00:00+00', TIMESTAMP '2025-11-13 10:30:00+00',
      'Bring previous reports', TIMESTAMP '2025-11-10 09:00:00+00', TIMESTAMP '2025-11-10 09:00:00+00'
    FROM
      (SELECT id FROM users WHERE role='OWNER'  ORDER BY created_at LIMIT 1) o,
      (SELECT id FROM users WHERE id='11111111-1111-1111-1111-111111111111') c
    WHERE EXISTS (SELECT 1 FROM users WHERE role='OWNER')
      AND EXISTS (SELECT 1 FROM users WHERE id='11111111-1111-1111-1111-111111111111')
    ON CONFLICT (id) DO NOTHING;
  `);
};

exports.down = async (pgm) => {
  pgm.sql(`
    DELETE FROM meetings WHERE id = '70707070-7070-7070-7070-707070707001';
    DELETE FROM availability_blackouts WHERE id = '60606060-6060-6060-6060-606060606001';
    DELETE FROM availability_rules WHERE id = '50505050-5050-5050-5050-505050505001';
  `);
};
