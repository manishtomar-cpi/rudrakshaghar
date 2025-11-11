// apps/mobile/src/features/payments/api.ts
import { api } from "../../api/axios";

import type { PaymentStatus } from "./types";

type WindowArgs = {
  range?: "today" | "7d" | "30d" | "90d" | "custom";
  from?: string;
  to?: string;
  tz?: string;
};

export async function listOwnerPayments(args: {
  status?: PaymentStatus;
  page?: number;
  limit?: number;
} & WindowArgs) {
  const { data } = await api.get("/owner/payments", { params: args });

  // Map server -> UI list shape your PaymentRow/queue expects
  const items = (data?.items ?? []).map((p: any) => {
    const ord = p.order ?? {};
    const orderId: string = ord.id ?? p.order_id ?? "";
    const orderNumber: string = ord.order_number ?? p.order_number ?? "";
    const customerName: string = ord.ship_name ?? "Anonymous";

    // prefer verified_at for confirmed, else submitted_at, else created_at
    const dateIso: string | null =
      p.status === "CONFIRMED"
        ? (p.verified_at ?? null)
        : (p.submitted_at ?? p.created_at ?? null);

    return {
      id: p.id,
      status: p.status as PaymentStatus,
      // queue row props:
      orderId,
      orderNumber,
      customerName,
      amount: p.amount ?? null, // paise; your screen converts to rupees
      createdAt: p.created_at ?? null,
      submittedAt: p.submitted_at ?? null,
      verifiedAt: p.verified_at ?? null,
      dateIso,
      // keep original object if needed
      _raw: p,
    };
  });

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

export async function confirmPayment(orderId: string, body: { utr?: string; notes?: string }) {
  // API expects orderId in path
  const { data } = await api.post(`/owner/payments/${orderId}/confirm`, body);
  return data;
}

export async function rejectPayment(orderId: string, reason: string) {
  const { data } = await api.post(`/owner/payments/${orderId}/reject`, { reason });
  return data;
}
