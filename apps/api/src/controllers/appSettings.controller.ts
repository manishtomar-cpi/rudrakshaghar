import { Request, Response } from "express";
import { AppSettingsService } from "../services/appSettings.service";
import { AppSettingsCreateSchema, AppSettingsUpdateSchema, UpiQrUploadByUrlSchema } from "../validators/appSettings.schema";

export class AppSettingsController {
  constructor(private svc: AppSettingsService) {}

  getOwner = async (_req: Request, res: Response) => {
    const s = await this.svc.get();
    if (!s) return res.status(404).json({ error: "Not configured" });
    return res.json(this.toOwnerDto(s));
  };

  createOwner = async (req: Request, res: Response) => {
    const parsed = AppSettingsCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const actor = (req as any).user?.id as string;
    const created = await this.svc.createIfEmpty(actor, parsed.data);
    return res.status(201).json(this.toOwnerDto(created));
  };

  updateOwner = async (req: Request, res: Response) => {
    const parsed = AppSettingsUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const actor = (req as any).user?.id as string;
    const updated = await this.svc.update(actor, parsed.data);
    return res.json(this.toOwnerDto(updated));
  };

  uploadQrByUrl = async (req: Request, res: Response) => {
    const parsed = UpiQrUploadByUrlSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const actor = (req as any).user?.id as string;
    const updated = await this.svc.setQrFromUrl(actor, parsed.data.url);
    return res.json({ upiQrUrl: updated.upi_qr_url });
  };

  uploadQrByFile = async (req: Request, res: Response) => {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ error: "file is required" });
    const actor = (req as any).user?.id as string;
    const updated = await this.svc.setQrFromFile(actor, file);
    return res.json({ upiQrUrl: updated.upi_qr_url });
  };

  getPublicPaymentsConfig = async (_req: Request, res: Response) => {
    const cfg = await this.svc.getPublicPaymentsConfig();
    if (!cfg) return res.status(404).json({ error: "Not configured" });
    return res.json(cfg);
  };

  private toOwnerDto(s: any) {
    return {
      businessName: s.business_name,
      supportEmail: s.support_email,
      supportPhone: s.support_phone,
      whatsappNumber: s.whatsapp_number,
      upiVpa: s.upi_vpa,
      upiPayeeName: s.upi_payee_name,
      upiQrUrl: s.upi_qr_url,
      pickupAddress: s.pickup_address,
      currency: s.currency,
      logoUrl: s.logo_url,
      returnAddress: s.return_address,
      privacyUrl: s.privacy_url,
      termsUrl: s.terms_url,
      returnPolicyUrl: s.return_policy_url,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    };
  }
}
