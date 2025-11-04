/* eslint-disable */
exports.shorthands = undefined;

exports.up = async (pgm) => {
  pgm.sql(`
    CREATE TABLE sessions (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id),
      refresh_hash TEXT NOT NULL,
      user_agent TEXT,
      ip TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL,
      revoked_at TIMESTAMP,
      replaced_by UUID REFERENCES sessions(id)
    );
    CREATE INDEX sessions_user_idx ON sessions(user_id);
  `);
};

exports.down = async (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS sessions CASCADE;
  `);
};
