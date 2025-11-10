export type PaymentStatus = "SUBMITTED" | "CONFIRMED" | "REJECTED";
export type OwnerPaymentRow = {
  orderId: string;
  amount: number;
  submittedAt?: string;
  status: PaymentStatus;
  customer?: { name?: string | null; phone?: string | null } | null;
};
