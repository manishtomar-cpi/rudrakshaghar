// src/features/dashboard/range.ts
export type Preset = 'today' | '7d' | '30d' | '90d' | 'custom';

export type Range =
  | { kind: 'today' }
  | { kind: '7d' }
  | { kind: '30d' }
  | { kind: '90d' }
  | { kind: 'custom'; start: string; end: string }; // YYYY-MM-DD inclusive

const fmt = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD

export const todayRange = (): Range => ({ kind: 'custom', start: fmt(new Date()), end: fmt(new Date()) });

export function toQueryParams(range: Range): Record<string, string | number> {
  switch (range.kind) {
    case 'today':
      return { days: 1 }; // if your API prefers start/end for today, swap: return { start: fmt(new Date()), end: fmt(new Date()) }
    case '7d':
      return { days: 7 };
    case '30d':
      return { days: 30 };
    case '90d':
      return { days: 90 };
    case 'custom':
      return { start: range.start, end: range.end };
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
