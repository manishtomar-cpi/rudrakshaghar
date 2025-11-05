import "dotenv/config";
import app from "./app";
import { env } from "./config/env";
import { ensureDbConnected } from "./modules/db";
import { runMigrations } from "./modules/migrate";
import { ensureOwnerUser } from "./modules/seedOwner";

const port = Number(env.API_PORT) || 4000;

const server = app.listen(port, async () => {
  // eslint-disable-next-line no-console
  console.log(`[api] Server started at http://localhost:${port}`);
  try {
    await runMigrations();
    await ensureDbConnected();
    await ensureOwnerUser();
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("[db] connect on boot failed:", err?.message ?? err);
  }
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});
