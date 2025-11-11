// apps/mobile/src/features/orders/types.ts
export type OrderStatus =
  | "PLACED"
  | "PAYMENT_SUBMITTED"
  | "PAYMENT_CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type OwnerOrderRow = {
  id: string;
  order_number?: string;
  status: OrderStatus;
  placed_at?: string;  // backend snake_case
  placedAt?: string;   // legacy camelCase support (if any older code)
  customer?: { name?: string | null; phone?: string | null } | null;
  total?: number;
};

export type OwnerOrderItem = {
  id: string;
  title: string;
  qty: number;
  price: number;     // rupees
  subtotal: number;  // rupees
  productId?: string | null;
  variant?: string | null;
};

export type OwnerOrderDetail = {
  id: string;
  order_number?: string;
  status: OrderStatus;
  payment_status?: string;
  placed_at?: string;
  customer: {
    name: string | null;
    phone: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
  };
  items: OwnerOrderItem[];
  totals: {
    subtotal: number;
    shipping: number;
    discount: number;
    payable: number;
    paid: number;
    due: number;
  };
  payment?: any;
  shipment?: { provider?: string; awb?: string; status?: string; created_at?: string } | null;
  timeline?: Array<{ at: string; event: string; by?: string }> | null;
};
