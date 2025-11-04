// apps/api/src/modules/migrate.ts
import { exec } from "child_process";
import path from "path";

export async function runMigrations() {
  const apiRoot = path.resolve(__dirname, "..", ".."); // points to apps/api
  return new Promise((resolve, reject) => {
    exec(
      `pnpm exec node-pg-migrate up --config ${path.join(apiRoot, "migration.config.js")}`,
      { cwd: apiRoot, env: process.env },
      (err, stdout, stderr) => {
        if (err) return reject(err);
        console.log(stdout || stderr);
        resolve(true);
      }
    );
  });
}
