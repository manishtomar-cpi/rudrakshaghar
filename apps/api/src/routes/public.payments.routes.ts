import { Router } from "express";
import { ensureDbConnected, getDb } from "../modules/db";
import { AppSettingsRepo } from "../repositories/appSettings.repo";
import { AuditService } from "../services/audit.service";
import { AppSettingsService } from "../services/appSettings.service";
import { AppSettingsController } from "../controllers/appSettings.controller";

const r = Router();

async function deps() {
  await ensureDbConnected();
  const db = getDb();
  const repo = new AppSettingsRepo(db);
  const audit = new AuditService(db);
  const svc = new AppSettingsService(repo, audit);
  const ctrl = new AppSettingsController(svc);
  return { ctrl };
}

// GET /public/payments/config
r.get("/payments/config", async (req, res) => {
  const { ctrl } = await deps();
  return ctrl.getPublicPaymentsConfig(req, res);
});

export default r;
