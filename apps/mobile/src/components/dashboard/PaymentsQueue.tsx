import { View } from "react-native";
import { Card } from "../shared/Card";
import { SectionHeader } from "./SectionHeader";
import { EmptyState } from "../shared/EmptyState";
import { PaymentRow } from "./PaymentRow";

export function PaymentsQueue({ items, onSeeAll, onRowPress }: {
  items: Array<{ orderId: string; amount: number; submittedAt: string; customer?: { name?: string | null; phone?: string | null } | null }>;
  onSeeAll?: () => void;
  onRowPress?: (orderId: string) => void;
}) {
  return (
    <Card>
      <SectionHeader title="Payments to review" subtitle={`Last ${items.length} submissions`} actionLabel="See all" onActionPress={onSeeAll} />
      <View>
        {items.length === 0 ? <EmptyState title="No pending payments" /> :
          items.map((it) => <PaymentRow key={it.orderId} {...it} onPress={() => onRowPress?.(it.orderId)} />)
        }
      </View>
    </Card>
  );
}
