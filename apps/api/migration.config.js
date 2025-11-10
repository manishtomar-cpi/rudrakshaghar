module.exports = {
  databaseUrl: process.env.DATABASE_URL,
  dir: "migrations",          // <— keep this
  migrationsTable: "pgmigrations",
  createSchema: true,
};
