import { describe, expect, it } from 'vitest';
import { gradeFor, summarize, MIN_CRITERIA_FOR_GRADE } from '@/lib/score';
import { criteria, scores } from '@/lib/content';
import type { PlatformScore } from '@/lib/schemas';

const blank = (pts: (number | null)[]): PlatformScore => ({
  platform: 'test',
  reviewed: '2026-11-25',
  criteria: Object.fromEntries(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'].map((id, i) => [id, pts[i] === null ? { points: null, evidence: 'n/a', source: null, checked: null } : { points: pts[i], evidence: 'x', source: 'https://example.com', checked: '2026-11-25' }])) as PlatformScore['criteria'],
});

describe('scorecard', () => {
  it('criteria add up to 100', () => {
    expect(criteria.reduce((a, c) => a + c.max, 0)).toBe(100);
  });
  it('grade bands match the methodology', () => {
    expect(gradeFor(100)).toBe('A'); expect(gradeFor(85)).toBe('A'); expect(gradeFor(84)).toBe('B');
    expect(gradeFor(70)).toBe('B'); expect(gradeFor(69)).toBe('C'); expect(gradeFor(55)).toBe('C');
    expect(gradeFor(54)).toBe('D'); expect(gradeFor(40)).toBe('D'); expect(gradeFor(39)).toBe('F');
  });
  it('a full score is 100 and grade A, not provisional', () => {
    const s = summarize(blank([15, 15, 10, 15, 10, 10, 10, 15]), criteria);
    expect(s).toMatchObject({ earned: 100, assessedMax: 100, percent: 100, grade: 'A', provisional: false });
  });
  it('ignores Not assessed criteria in the percentage and marks it provisional', () => {
    const s = summarize(blank([15, 8, null, 15, 10, null, null, 0]), criteria);
    expect(s.earned).toBe(48);
    expect(s.assessedMax).toBe(70);
    expect(s.percent).toBe(69);
    expect(s.grade).toBe('C');
    expect(s.provisional).toBe(true);
  });
  it(`withholds a grade when fewer than ${MIN_CRITERIA_FOR_GRADE} criteria are assessed`, () => {
    const s = summarize(blank([null, 3, null, 0, 10, null, null, null]), criteria);
    expect(s.grade).toBeNull();
    expect(s.percent).toBe(33);
  });
  it('rejects a score above the criterion maximum', () => {
    expect(() => summarize(blank([16, 0, 0, 0, 0, 0, 0, 0]), criteria)).toThrow();
  });
  it('every real score has a source and checked date for each scored criterion', () => {
    for (const sc of scores) for (const c of Object.values(sc.criteria)) if (c.points !== null) { expect(c.source).toMatch(/^https:\/\//); expect(c.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/); }
  });
  it('produces the expected leaderboard from the shipped evidence', () => {
    const got = Object.fromEntries(scores.map((s) => { const r = summarize(s, criteria); return [s.platform, [r.percent, r.grade]]; }));
    expect(got['x']).toEqual([73, 'B']);
    expect(got['telegram']).toEqual([44, 'D']);
    expect(got['whatsapp'][1]).toBeNull();
  });
});
