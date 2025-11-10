import { api } from "../../api/axios";
import type { OrderStatus, OwnerOrderRow } from "./types";

export async function listOwnerOrders(params: { status?: string; needsShipment?: boolean; page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.needsShipment) qs.set("needsShipment", "true");
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));

  const { data } = await api.get<{ items: OwnerOrderRow[]; nextPage?: number | null }>(`/owner/orders?${qs.toString()}`);
  return data;
}
