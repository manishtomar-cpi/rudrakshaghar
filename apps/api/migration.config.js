// apps/api/migration.config.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
module.exports = {
  databaseUrl: process.env.DATABASE_URL,
   dir: "src/migrations",  
  migrationsTable: "pgmigrations",
  createSchema: true,
};
