import type { Report } from './schemas';

export const DEADLINE_HOURS = 2;
const H = 3600_000;

export type DeadlineState =
  | { kind: 'not_started' }
  | { kind: 'running'; deadline: Date; msLeft: number }
  | { kind: 'overdue'; deadline: Date; msOver: number }
  | { kind: 'met'; deadline: Date; hoursToRemove: number }
  | { kind: 'missed_removed'; deadline: Date; hoursToRemove: number; hoursLate: number };

export function deadlineOf(reportedAt: string): Date {
  return new Date(new Date(reportedAt).getTime() + DEADLINE_HOURS * H);
}

/** Deadline = reportedAt + 2 hours. Overdue = past the deadline and not Removed. */
export function deadlineState(r: Pick<Report, 'reportedAt' | 'status' | 'resolvedAt'>, now: Date = new Date()): DeadlineState {
  if (!r.reportedAt || r.status === 'not_reported') return { kind: 'not_started' };
  const start = new Date(r.reportedAt).getTime();
  const deadline = deadlineOf(r.reportedAt);
  if (r.status === 'removed') {
    const end = r.resolvedAt ? new Date(r.resolvedAt).getTime() : now.getTime();
    const hoursToRemove = (end - start) / H;
    if (end <= deadline.getTime()) return { kind: 'met', deadline, hoursToRemove };
    return { kind: 'missed_removed', deadline, hoursToRemove, hoursLate: (end - deadline.getTime()) / H };
  }
  const left = deadline.getTime() - now.getTime();
  if (left > 0) return { kind: 'running', deadline, msLeft: left };
  return { kind: 'overdue', deadline, msOver: -left };
}

export function isOverdue(r: Pick<Report, 'reportedAt' | 'status' | 'resolvedAt'>, now: Date = new Date()): boolean {
  return deadlineState(r, now).kind === 'overdue';
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h >= 48 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}
export function formatHours(h: number): string {
  return h < 1 ? `${Math.round(h * 60)} min` : `${Math.round(h * 10) / 10} h`;
}
