// utils/window.ts
import { DateTime } from "luxon";

export type WindowParams =
  | { range: "today" | "7d" | "30d" | "90d" }
  | { range: "custom"; from: string; to: string };

export function computeWindow(p: WindowParams, tz = "Asia/Kolkata") {
  const now = DateTime.now().setZone(tz);
  if (p.range === "custom") {
    const from = DateTime.fromISO(p.from, { zone: tz });
    const to = DateTime.fromISO(p.to, { zone: tz });
    return { from: from.toUTC().toISO(), to: to.toUTC().toISO(), tz };
  }
  if (p.range === "today") {
    const from = now.startOf("day"); const to = now.endOf("day");
    return { from: from.toUTC().toISO(), to: to.toUTC().toISO(), tz };
  }
  const days = p.range === "7d" ? 7 : p.range === "30d" ? 30 : 90; // ✅ 90d supported
  const from = now.minus({ days: days - 1 }).startOf("day");
  const to = now.endOf("day");
  return { from: from.toUTC().toISO(), to: to.toUTC().toISO(), tz };
}

export function calcNextPage(page: number, pageSize: number, total: number) {
  return page * pageSize < total ? page + 1 : null;
}
