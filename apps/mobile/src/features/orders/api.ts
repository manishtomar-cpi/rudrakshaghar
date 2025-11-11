// apps/mobile/src/features/orders/api.ts
import { api } from "../../api/axios";

type WindowArgs = {
  range?: "today" | "7d" | "30d" | "90d" | "custom";
  from?: string;
  to?: string;
  tz?: string;
};

/** ---------------- Helpers to normalize totals ---------------- */
function toNum(v: any): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/** Get nested value: e.g. getPath(o, "totals.payable_paise") */
function getPath(obj: any, path: string): any {
  return path.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

/** First defined numeric (number or numeric string) among keys/paths */
function firstNumeric(obj: any, paths: string[]): number | undefined {
  for (const p of paths) {
    const v = p.includes(".") ? getPath(obj, p) : obj?.[p];
    const n = toNum(v);
    if (n !== undefined) return n;
  }
  return undefined;
}

/** Return RUPEES regardless of whether server sends paise or rupees */
function getTotalRupees(o: any): number {
  // 1) Prefer paise fields (flat or nested)
  const paise = firstNumeric(o, [
    "total_payable_paise",
    "total_paise",
    "grand_total_paise",
    "amount_paise",
    "payable_paise",
    "total_paid_paise",
    "totals.payable_paise",
    "totals.total_payable_paise",
  ]);
  if (paise !== undefined) return paise / 100;

  // 2) Fall back to rupee fields (flat or nested)
  const rupees = firstNumeric(o, [
    "total_payable",
    "total",
    "grand_total",
    "amount",
    "payable",
    "total_paid",
    "totalPaid",
    "totals.payable", // in rupees
  ]);
  if (rupees !== undefined) return rupees;

  // 3) Last resort: sum item subtotals
  if (Array.isArray(o?.items) && o.items.length) {
    let paiseSum = 0;
    let rupeeSum = 0;
    for (const it of o.items) {
      const sp = toNum(it?.subtotal_paise);
      if (sp !== undefined) paiseSum += sp;
      const sr = toNum(it?.subtotal);
      if (sr !== undefined) rupeeSum += sr;
    }
    if (paiseSum > 0) return paiseSum / 100;
    if (rupeeSum > 0) return rupeeSum;
  }

  return 0;
}

/** ---------------- API: list ---------------- */
export async function listOwnerOrders(args: {
  status?: string | string[];
  payment_status?: string | string[];
  q?: string;
  page?: number;
  limit?: number;
  sort?: "created_at" | "-created_at" | "order_number";
} & WindowArgs) {
  const { data } = await api.get("/owner/orders", { params: args });

  const items = (data?.items ?? []).map((o: any) => ({
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    payment_status: o.payment_status,
    created_at: o.created_at,
    placed_at: o.placed_at ?? o.created_at,
    customer: {
      name: o.customer?.name ?? o.ship_name ?? "Anonymous",
      phone: o.customer?.phone ?? o.ship_phone ?? "",
    },
    // ✅ robust normalization to RUPEES (numbers or numeric strings, nested or flat)
    total: getTotalRupees(o),
  }));

  return {
    items,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? items.length,
    total: data?.total ?? items.length,
    nextPage:
      data?.page && data?.pageSize && data?.total && data.page * data.pageSize < data.total
        ? data.page + 1
        : null,
  };
}

/** ---------------- API: detail ---------------- */
export async function getOwnerOrder(orderId: string) {
  const { data } = await api.get(`/owner/orders/${orderId}`);
  const o = data?.order ?? data;
  return {
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    payment_status: o.payment_status,
    placed_at: o.placed_at ?? o.created_at,
    customer: {
      name: o.customer?.name ?? o.ship_name ?? "Anonymous",
      phone: o.customer?.phone ?? o.ship_phone ?? "",
      address: o.ship_address ?? null,
      city: o.ship_city ?? null,
      state: o.ship_state ?? null,
      pincode: o.ship_pincode ?? null,
    },
    items: (o.items ?? []).map((it: any) => ({
      id: it.id,
      title: it.title ?? it.product_title ?? "Item",
      qty: it.qty ?? it.quantity ?? 1,
      price: ((toNum(it.price_paise) ?? toNum(it.price) ?? 0) / 100) as number,
      subtotal: (
        (toNum(it.subtotal_paise) ??
          toNum(it.subtotal) ??
          (toNum(it.qty) ?? 1) * (toNum(it.price_paise) ?? 0)) / 100
      ) as number,
      productId: it.product_id ?? it.productId ?? null,
      variant: it.variant ?? null,
    })),
    totals: {
      subtotal: ((toNum(o.subtotal_paise) ?? toNum(o.subtotal) ?? 0) / 100) as number,
      shipping: ((toNum(o.shipping_paise) ?? toNum(o.shipping) ?? 0) / 100) as number,
      discount: ((toNum(o.discount_paise) ?? toNum(o.discount) ?? 0) / 100) as number,
      payable: ((toNum(o.total_payable_paise) ?? toNum(o.total) ?? 0) / 100) as number,
      paid: ((toNum(o.total_paid_paise) ?? toNum(o.paid) ?? 0) / 100) as number,
      due: ((toNum(o.total_due_paise) ?? toNum(o.due) ?? 0) / 100) as number,
    },
    payment: o.payment ?? null,
    shipment: o.shipment ?? null,
    timeline: o.timeline ?? [],
  };
}

/** ---------------- API: actions ---------------- */
export async function patchOwnerOrderStatus(
  orderId: string,
  status: "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED"
) {
  const { data } = await api.patch(`/owner/orders/${orderId}/status`, { status });
  return data;
}

export async function createOwnerShipment(
  orderId: string,
  body: { provider: string; awb: string; notes?: string }
) {
  const { data } = await api.post(`/owner/orders/${orderId}/ship`, body);
  return data;
}

export async function markOwnerOrderDelivered(orderId: string) {
  const { data } = await api.post(`/owner/orders/${orderId}/delivered`, {});
  return data;
}
