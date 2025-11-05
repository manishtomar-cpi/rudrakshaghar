import { Router } from "express";
import multer from "multer";
import { ensureDbConnected, getDb } from "../modules/db";
import { AppSettingsRepo } from "../repositories/appSettings.repo";
import { AppSettingsService } from "../services/appSettings.service";
import { AuditService } from "../services/audit.service";
import { AppSettingsController } from "../controllers/appSettings.controller";
import { authJwt } from "../middlewares/authJwt";

const r = Router();
const upload = multer(); // memory storage

// Ensure one-time DB connect in router context (safe if called multiple times)
async function deps() {
  await ensureDbConnected();
  const db = getDb();
  const repo = new AppSettingsRepo(db);
  const audit = new AuditService(db);
  const svc = new AppSettingsService(repo, audit);
  const ctrl = new AppSettingsController(svc);
  return { ctrl };
}

// GET /owner/app-settings
r.get("/app-settings", authJwt, async (req, res) => {
  const { ctrl } = await deps();
  return ctrl.getOwner(req, res);
});

// POST /owner/app-settings
r.post("/app-settings", authJwt, async (req, res) => {
  const { ctrl } = await deps();
  return ctrl.createOwner(req, res);
});

// PUT /owner/app-settings
r.put("/app-settings", authJwt, async (req, res) => {
  const { ctrl } = await deps();
  return ctrl.updateOwner(req, res);
});

// POST /owner/app-settings/qr
r.post("/app-settings/qr", authJwt, async (req, res) => {
  const { ctrl } = await deps();
  return ctrl.uploadQrByUrl(req, res);
});

// POST /owner/app-settings/qr-file
r.post("/app-settings/qr-file", authJwt, upload.single("file"), async (req, res) => {
  const { ctrl } = await deps();
  return ctrl.uploadQrByFile(req, res);
});

export default r;
