import { describe, expect, it } from 'vitest';
import { deadlineOf, deadlineState, formatDuration, isOverdue } from '@/lib/deadline';
import { formatIST, fromLocalInput, nowIST, toLocalInput } from '@/lib/time';

const at = (iso: string) => new Date(iso);

describe('2-hour deadline logic (IST)', () => {
  const reportedAt = '2026-11-18T10:40:00+05:30';
  it('deadline is reportedAt + 2 hours', () => {
    expect(deadlineOf(reportedAt).toISOString()).toBe('2026-11-18T07:10:00.000Z'); // 12:40 IST
  });
  it('is running before the deadline', () => {
    const s = deadlineState({ reportedAt, status: 'reported', resolvedAt: null }, at('2026-11-18T12:00:00+05:30'));
    expect(s.kind).toBe('running');
    if (s.kind === 'running') expect(formatDuration(s.msLeft)).toBe('00:40:00');
  });
  it('is overdue after 2 hours if not removed, for every non-removed status', () => {
    for (const status of ['reported', 'acknowledged', 'rejected', 'escalated'] as const) {
      expect(isOverdue({ reportedAt, status, resolvedAt: null }, at('2026-11-18T12:40:01+05:30'))).toBe(true);
      expect(isOverdue({ reportedAt, status, resolvedAt: null }, at('2026-11-18T12:39:59+05:30'))).toBe(false);
    }
  });
  it('is never overdue when removed, and reports whether the deadline was met', () => {
    const late = deadlineState({ reportedAt, status: 'removed', resolvedAt: '2026-11-19T16:40:00+05:30' }, at('2026-11-25T00:00:00+05:30'));
    expect(late.kind).toBe('missed_removed');
    if (late.kind === 'missed_removed') {
      expect(late.hoursToRemove).toBe(30);
      expect(late.hoursLate).toBe(28);
    }
    const met = deadlineState({ reportedAt, status: 'removed', resolvedAt: '2026-11-18T11:30:00+05:30' });
    expect(met.kind).toBe('met');
  });
  it('does not start until reported', () => {
    expect(deadlineState({ reportedAt: null, status: 'not_reported', resolvedAt: null }).kind).toBe('not_started');
  });
  it('works across midnight and month boundaries in IST', () => {
    const r = { reportedAt: '2026-11-30T23:30:00+05:30', status: 'reported' as const, resolvedAt: null };
    expect(deadlineOf(r.reportedAt).toISOString()).toBe('2026-11-30T20:00:00.000Z'); // 01:30 IST on 1 Dec
    expect(isOverdue(r, at('2026-12-01T01:31:00+05:30'))).toBe(true);
  });
  it('converts datetime-local input to IST and back', () => {
    expect(fromLocalInput('2026-11-18T10:40')).toBe('2026-11-18T10:40:00+05:30');
    expect(toLocalInput('2026-11-18T10:40:00+05:30')).toBe('2026-11-18T10:40');
    expect(fromLocalInput('bad')).toBeNull();
    expect(nowIST(at('2026-11-18T05:10:00Z'))).toBe('2026-11-18T10:40:00+05:30');
    expect(formatIST('2026-11-18T10:40:00+05:30', 'en')).toContain('IST');
  });
  it('formats long durations in days', () => {
    expect(formatDuration(3 * 86400000 + 3600000)).toBe('3d 1h');
  });
});
