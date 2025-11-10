import { api } from "../../api/axios";
import type { OwnerPaymentRow, PaymentStatus } from "./types";

export async function listOwnerPayments(params: { status?: PaymentStatus; page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const { data } = await api.get<{ items: OwnerPaymentRow[]; page?: number; nextPage?: number | null }>(`/owner/payments?${qs.toString()}`);
  // Adapt the backend response shape if needed; assuming {items, nextPage}
  return data;
}

export async function confirmPayment(orderId: string, body: { reference?: string }) {
  const { data } = await api.post(`/owner/payments/${orderId}/confirm`, body);
  return data;
}

export async function rejectPayment(orderId: string, reason: string) {
  const { data } = await api.post(`/owner/payments/${orderId}/reject`, { reason });
  return data;
}
