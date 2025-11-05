import { AppSettingsRepo, AppSettingsRow } from "../repositories/appSettings.repo";
import { AppSettingsCreateDto, AppSettingsUpdateDto } from "../validators/appSettings.schema";
import { AuditService } from "./audit.service";
import { ensureContainer, uploadBuffer } from "../storage/azureBlob";

function makeSettingsBlobName(fileName = "upi-qr.png") {
  const ext = fileName.includes(".") ? fileName.substring(fileName.lastIndexOf(".")) : ".png";
  const uid = Math.random().toString(36).slice(2, 10);
  return `app-settings/upi-qr-${uid}${ext}`;
}

export class AppSettingsService {
  constructor(
    private repo: AppSettingsRepo,
    private audit: AuditService,
  ) {}

  async get(): Promise<AppSettingsRow | null> {
    return this.repo.find();
  }

  async createIfEmpty(actorUserId: string, dto: AppSettingsCreateDto): Promise<AppSettingsRow> {
    const before = await this.repo.find();
    if (before) return before; // idempotent create

    const created = await this.repo.create(dto);
    await this.audit.append({
      actorUserId,
      entity: "app_settings",
      entityId: created.id,
      action: "CREATE",
      before: null,
      after: created,
    });
    return created;
  }

  async update(actorUserId: string, dto: AppSettingsUpdateDto): Promise<AppSettingsRow> {
    const before = await this.repo.find();
    if (!before) throw new Error("Settings not found");

    const updated = await this.repo.update(dto);
    await this.audit.append({
      actorUserId,
      entity: "app_settings",
      entityId: updated.id,
      action: "UPDATE",
      before,
      after: updated,
    });
    return updated;
  }

  async setQrFromUrl(actorUserId: string, url: string): Promise<AppSettingsRow> {
    const before = await this.repo.find();
    if (!before) throw new Error("Settings not found");

    const updated = await this.repo.setQrUrl(url);
    await this.audit.append({
      actorUserId,
      entity: "app_settings",
      entityId: updated.id,
      action: "UPDATE_QR_URL",
      before,
      after: updated,
    });
    return updated;
  }

  async setQrFromFile(actorUserId: string, file: Express.Multer.File): Promise<AppSettingsRow> {
    const before = await this.repo.find();
    if (!before) throw new Error("Settings not found");

    await ensureContainer();
    const blobName = makeSettingsBlobName(file.originalname || "upi-qr.png");
    const { url } = await uploadBuffer(blobName, file.buffer, file.mimetype);

    const updated = await this.repo.setQrUrl(url);
    await this.audit.append({
      actorUserId,
      entity: "app_settings",
      entityId: updated.id,
      action: "UPDATE_QR_FILE",
      before,
      after: updated,
    });
    return updated;
  }

  getPublicPaymentsConfig = async () => {
    const s = await this.repo.find();
    if (!s) return null;
    return {
      businessName: s.business_name,
      upiVpa: s.upi_vpa,
      upiPayeeName: s.upi_payee_name,
      upiQrUrl: s.upi_qr_url,
    };
  };
}
