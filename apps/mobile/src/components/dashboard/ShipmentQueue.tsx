import { View } from "react-native";
import { Card } from "../shared/Card";
import { SectionHeader } from "./SectionHeader";
import { EmptyState } from "../shared/EmptyState";
import { ShipmentRow } from "./ShipmentRow";

export function ShipmentQueue({ items, onSeeAll, onRowPress }: {
  items: Array<{ orderId: string; status: string; placedAt: string }>;
  onSeeAll?: () => void;
  onRowPress?: (orderId: string) => void;
}) {
  return (
    <Card>
      <SectionHeader title="Needs shipment" subtitle={`${items.length} awaiting action`} actionLabel="See all" onActionPress={onSeeAll} />
      <View>
        {items.length === 0 ? <EmptyState title="No orders need shipment" /> :
          items.map((it) => <ShipmentRow key={it.orderId} {...it} onPress={() => onRowPress?.(it.orderId)} />)
        }
      </View>
    </Card>
  );
}
