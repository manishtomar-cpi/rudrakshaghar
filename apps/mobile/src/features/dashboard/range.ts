// apps/mobile/src/features/dashboard/range.ts
export type Preset = 'today' | '7d' | '30d' | '90d' | 'custom';

export type CustomRange = { kind: 'custom'; start: string; end: string }; // explicit branch
export type Range =
  | { kind: 'today' }
  | { kind: '7d' }
  | { kind: '30d' }
  | { kind: '90d' }
  | CustomRange; // include explicit custom type

const toIsoStart = (yyyyMmDd: string) => `${yyyyMmDd}T00:00:00.000Z`;
const toIsoEnd = (yyyyMmDd: string) => `${yyyyMmDd}T23:59:59.999Z`;

const fmt = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD

export const todayRange = (): CustomRange => {
  const today = fmt(new Date());
  return { kind: 'custom', start: today, end: today };
};

/**
 * Backend contract:
 * - range: 'today' | '7d' | '30d' | 'custom'
 * - from/to: required only when range='custom' (ISO string)
 */
export function toQueryParams(range: Range): Record<string, string> {
  switch (range.kind) {
    case 'today':
      return { range: 'today' };
    case '7d':
      return { range: '7d' };
    case '30d':
      return { range: '30d' };
    case '90d': {
      // Map 90d to custom (inclusive 90 days)
      const now = new Date();
      const end = fmt(now);
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 89); // inclusive window of 90 days
      const start = fmt(startDate);
      return { range: 'custom', from: toIsoStart(start), to: toIsoEnd(end) };
    }
    case 'custom':
      return { range: 'custom', from: toIsoStart(range.start), to: toIsoEnd(range.end) };
  }
}

export function labelFor(range: Range): string {
  switch (range.kind) {
    case 'today':
      return 'Today';
    case '7d':
      return 'Last 7 days';
    case '30d':
      return 'Last 30 days';
    case '90d':
      return 'Last 90 days';
    case 'custom':
      return `${range.start} → ${range.end}`;
  }
}
