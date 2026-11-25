import type { Criterion, CriterionId, PlatformScore } from './schemas';
import { criterionIds } from './constants';

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
export interface ScoreSummary {
  platform: string;
  earned: number; // points earned out of 100
  assessedMax: number; // max points of the criteria that were assessed
  assessedCount: number;
  percent: number | null; // earned / assessedMax, 0-100
  grade: Grade | null; // null when too little is assessed
  provisional: boolean;
  perCriterion: Record<CriterionId, { points: number | null; max: number }>;
}

export const MIN_CRITERIA_FOR_GRADE = 5;

export function gradeFor(percent: number): Grade {
  if (percent >= 85) return 'A';
  if (percent >= 70) return 'B';
  if (percent >= 55) return 'C';
  if (percent >= 40) return 'D';
  return 'F';
}

/** Totals and grades are always computed here, never typed by hand. */
export function summarize(s: PlatformScore, criteria: Criterion[]): ScoreSummary {
  const maxById = Object.fromEntries(criteria.map((c) => [c.id, c.max])) as Record<CriterionId, number>;
  let earned = 0;
  let assessedMax = 0;
  let assessedCount = 0;
  const perCriterion = {} as ScoreSummary['perCriterion'];
  for (const id of criterionIds) {
    const c = s.criteria[id];
    const max = maxById[id];
    if (c.points !== null && c.points > max) throw new Error(`${s.platform} ${id}: ${c.points} > max ${max}`);
    perCriterion[id] = { points: c.points, max };
    if (c.points !== null) {
      earned += c.points;
      assessedMax += max;
      assessedCount += 1;
    }
  }
  const percent = assessedMax > 0 ? Math.round((earned / assessedMax) * 100) : null;
  const enough = assessedCount >= MIN_CRITERIA_FOR_GRADE && percent !== null;
  return {
    platform: s.platform,
    earned,
    assessedMax,
    assessedCount,
    percent,
    grade: enough ? gradeFor(percent!) : null,
    provisional: assessedCount < criterionIds.length,
    perCriterion,
  };
}
