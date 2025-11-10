export type OrderStatus = "NEW" | "PAYMENT_SUBMITTED" | "PAYMENT_CONFIRMED" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELED";

export type OwnerOrderRow = {
  id: string;
  status: OrderStatus;
  placedAt: string;
  customer?: { name?: string | null; phone?: string | null } | null;
  total?: number;
};
