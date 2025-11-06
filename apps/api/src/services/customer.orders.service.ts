import { randomUUID } from "crypto";
import { AppError } from "../utils/errors";
import { ProductRepo } from "../repositories/product.repo";
import { ProductVariantRepo } from "../repositories/productVariant.repo";
import { CustomerOrdersRepo } from "../repositories/customerOrders.repo";
import { CustomerPaymentsRepo } from "../repositories/customerPayments.repo";
import { AddressesRepo } from "../repositories/addresses.repo";
import { AppSettingsRepo } from "../repositories/appSettings.repo";
import { uploadBuffer, ensureContainer } from "../storage/azureBlob";
import { AuditService } from "./audit.service";
import { getDb } from "../modules/db";

type PlaceOrderItem = {
  productId: string;
  variantId?: string | null;
  qty: number;
};

type PlaceOrderInput = {
  userId: string;
  items: PlaceOrderItem[];
  addressId: string;
  idempotencyKey?: string;
};

type ListMyOrdersInput = {
  userId: string;
  page: number;
  pageSize: number;
};

type GetMyOrderInput = {
  userId: string;
  orderId: string;
};

type SubmitPaymentProofInput = {
  userId: string;
  orderId: string;
  file: Express.Multer.File;
  referenceText?: string | null;
};

// ---------- UPI helpers ----------
function toOrderNumber(): string {
  const y = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RG-${y}-${rand}`;
}

function toINRString(paise: number): string {
  return (paise / 100).toFixed(2);
}

function buildUpiIntentUrl(
  upiVpa: string,
  payeeName: string,
  amountPaise: number,
  orderNumber: string
) {
  const am = toINRString(amountPaise);
  const pn = encodeURIComponent(payeeName);
  const pa = encodeURIComponent(upiVpa);
  const tn = encodeURIComponent(`Order ${orderNumber}`);
  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
}

function buildUpiQrPayload(
  upiVpa: string,
  payeeName: string,
  amountPaise: number,
  orderNumber: string
) {
  // MVP: reuse intent URL as QR payload
  return buildUpiIntentUrl(upiVpa, payeeName, amountPaise, orderNumber);
}

export const CustomerOrdersService = {
  // ---------------- Place Order ----------------
  async placeOrder(input: PlaceOrderInput) {
    if (!input.items?.length) {
      throw AppError.badRequest("No items provided");
    }

    // Ensure address belongs to user
    const address = await AddressesRepo.findByIdForUser(input.addressId, input.userId);
    if (!address) throw AppError.badRequest("Invalid address");

    // Payments config
    const settings = await AppSettingsRepo.getOwner();
    if (!settings?.upi_vpa || !settings?.business_name) {
      throw AppError.conflict("Payments not configured");
    }

    let totalItemsPaise = 0;
    const itemSnapshots: {
      product_id: string;
      variant_id: string | null;
      title_snapshot: string;
      variant_snapshot: string | null;
      unit_price_paise: number;
      qty: number;
      line_total_paise: number;
    }[] = [];

    for (const it of input.items) {
      if (it.qty < 1 || it.qty > 10) {
        throw AppError.badRequest("Invalid quantity");
      }

      const product = await ProductRepo.findById(it.productId);
      if (!product || !product.active || product.deleted_at) {
        throw AppError.badRequest("Invalid product");
      }

      let variantLabel: string | null = null;
      let unitPrice = product.price_paise;

      if (it.variantId) {
        const v = await ProductVariantRepo.findById(it.variantId);
        if (!v || !v.active || v.product_id !== it.productId) {
          throw AppError.badRequest("Invalid variant");
        }
        variantLabel = v.label;
        if (typeof v.price_paise === "number") unitPrice = v.price_paise;
      }

      const available = product.stock_qty == null || product.stock_qty > 0;
      if (!available) {
        throw AppError.conflict("Product out of stock");
      }

      const lineTotal = unitPrice * it.qty;
      totalItemsPaise += lineTotal;

      itemSnapshots.push({
        product_id: it.productId,
        variant_id: it.variantId ?? null,
        title_snapshot: product.title,
        variant_snapshot: variantLabel,
        unit_price_paise: unitPrice,
        qty: it.qty,
        line_total_paise: lineTotal,
      });
    }

    const shippingPaise = 0;
    const discountPaise = 0;
    const totalPayablePaise = totalItemsPaise + shippingPaise - discountPaise;

    const orderId = randomUUID();
    const orderNumber = toOrderNumber();

    const intentUrl = buildUpiIntentUrl(
      settings.upi_vpa,
      settings.business_name,
      totalPayablePaise,
      orderNumber
    );
    const qrPayload = buildUpiQrPayload(
      settings.upi_vpa,
      settings.business_name,
      totalPayablePaise,
      orderNumber
    );

    const db = getDb();
    const audit = new AuditService(db);

    const created = await CustomerOrdersRepo.createFull({
      order: {
        id: orderId,
        order_number: orderNumber,
        user_id: input.userId,
        status: "PLACED",
        total_item_paise: totalItemsPaise,
        shipping_paise: shippingPaise,
        discount_paise: discountPaise,
        total_payable_paise: totalPayablePaise,
        ship_name: address.label ?? null,
        ship_phone: null,
        ship_line1: address.line1 ?? null,
        ship_line2: address.line2 ?? null,
        ship_city: address.city ?? null,
        ship_state: address.state ?? null,
        ship_pincode: address.pincode ?? null,
        ship_country: address.country ?? null,
        payment_method: "UPI_MANUAL",
        payment_status: "NONE",
      },
      items: itemSnapshots,
      payment: {
        upi_vpa: settings.upi_vpa,
        qr_payload: qrPayload,
        intent_url: intentUrl,
        status: "NONE",
      },
      idempotencyKey: input.idempotencyKey,
    });

    await audit.append({
      actorUserId: input.userId,
      entity: "order",
      entityId: orderId,
      action: "CREATE",
      before: null,
      after: {
        order: created.order,
        items: created.items,
        payment: created.payment,
      },
    });

    return created;
  },

  // ---------------- List My Orders ----------------
  async listMyOrders(input: ListMyOrdersInput) {
    const page = Math.max(1, input.page);
    const pageSize = Math.min(100, Math.max(1, input.pageSize));

    const { items, total } = await CustomerOrdersRepo.listForUser({
      userId: input.userId,
      page,
      pageSize,
    });

    return { items, page, pageSize, total };
  },

  // ---------------- Get My Order ----------------
  async getMyOrder(input: GetMyOrderInput) {
    const data = await CustomerOrdersRepo.getByIdForUser(input.orderId, input.userId);
    if (!data) throw AppError.notFound("Order not found");
    return data;
  },

  // ---------------- Submit Payment Proof ----------------
  async submitPaymentProof(input: SubmitPaymentProofInput) {
    const found = await CustomerOrdersRepo.getByIdForUser(input.orderId, input.userId);
    if (!found) throw AppError.notFound("Order not found");

    const { order, payment } = found;

    // Legacy safety: some old orders might not have a payment row
    if (!payment) {
      throw AppError.conflict("Payment channel not initialized for this order");
    }

    if (payment.status === "CONFIRMED") {
      throw AppError.conflict("Payment already confirmed");
    }
    if (order.status === "CANCELLED" || order.status === "DELIVERED") {
      throw AppError.conflict("Order not eligible for proof submission");
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(input.file.mimetype)) {
      throw AppError.badRequest("Invalid file type");
    }

    await ensureContainer();
    const ext =
      input.file.mimetype === "image/png"
        ? ".png"
        : input.file.mimetype === "image/webp"
        ? ".webp"
        : ".jpg";
    const uid = Math.random().toString(36).slice(2, 10);
    const blobName = `payments/${order.id}/proof-${uid}${ext}`;

    const { url } = await uploadBuffer(blobName, input.file.buffer, input.file.mimetype);

    const updated = await CustomerPaymentsRepo.submitProof({
      orderId: order.id,
      screenshotUrl: url,
      referenceText: input.referenceText ?? null,
    });

    const db = getDb();
    const audit = new AuditService(db);
    await audit.append({
      actorUserId: input.userId,
      entity: "payment",
      entityId: updated.payment.id,
      action: "SUBMIT_PROOF",
      before: { status: payment.status }, // safe now because we guarded above
      after: {
        status: updated.payment.status,
        screenshot_url: url,
        reference_text: input.referenceText ?? null,
      },
    });

    return updated;
  },
};
