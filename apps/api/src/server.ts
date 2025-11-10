import "dotenv/config";
import app from "./app";
import { env } from "./config/env";
import { ensureDbConnected } from "./modules/db";
import { runMigrations } from "./modules/migrate";
import { ensureOwnerUser } from "./modules/seedOwner";
import { hardResetDatabase } from "./modules/devReset"; // <— add this

const port = Number(env.API_PORT) || 4000;

const server = app.listen(port, async () => {
  console.log(`[api] Server started at http://localhost:${port}`);

  try {
    // ⚠️ DEV ONLY: reset DB if flag is set in .env
    if (process.env.RESET_DB === "true") {
      console.warn("[db] HARD RESET starting (DEV ONLY)...");
      await hardResetDatabase();
      console.warn("[db] HARD RESET done.");

      // Optionally, comment this line after first successful reset:
      process.env.RESET_DB = "false";
    }
    await ensureDbConnected();
    await runMigrations();
    await ensureOwnerUser();
   

  } catch (err: any) {
    console.error("[db] connect on boot failed:", err?.message ?? err);
  }
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});
