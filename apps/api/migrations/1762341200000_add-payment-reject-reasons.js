/* 1762341200000_add-payment-reject-reasons.js */
exports.shorthands = undefined;

exports.up = async (pgm) => {
  pgm.createTable("payment_reject_reasons_global", {
    id: "id",
    reason: { type: "text", notNull: true, unique: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.sql(`
    INSERT INTO payment_reject_reasons_global (reason)
    VALUES
      ('Incorrect UPI reference'),
      ('Amount mismatch'),
      ('Duplicate payment'),
      ('Illegible screenshot')
    ON CONFLICT (reason) DO NOTHING;
  `);
};

exports.down = async (pgm) => {
  pgm.dropTable("payment_reject_reasons_global");
};
