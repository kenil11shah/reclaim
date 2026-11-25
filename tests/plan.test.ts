import { describe, expect, it } from 'vitest';
import { buildPlan, isBlocked, orderedPlatforms } from '@/lib/plan';
import type { Answers } from '@/lib/schemas';

const WHAT = ['real', 'fake', 'threat', 'filmed'];
const WHERE = ['instagram', 'facebook', 'whatsapp', 'telegram', 'x', 'reddit', 'youtube', 'google-search', 'other', 'unknown'];
function subsets<T>(xs: T[]): T[][] {
  return xs.reduce<T[][]>((acc, x) => acc.concat(acc.map((s) => [...s, x])), [[]]);
}

describe('action plan rules', () => {
  it('always opens with "breathe", then evidence, and always ends with support', () => {
    const p = buildPlan({ about: 'me', what: ['fake'], where: ['x'] }, 'en');
    expect(p[0].stepId).toBe('breathe');
    expect(p.map((s) => s.stepId)).toContain('evidence');
    expect(p.at(-1)!.stepId).toBe('support');
  });

  it('covers every combination of about × what × threat × who × when without errors', () => {
    let count = 0;
    for (const about of ['me', 'helper', undefined]) for (const what of subsets(WHAT)) for (const threat of ['yes', 'no', undefined]) for (const who of ['yes', 'suspect', 'no', undefined]) for (const when of ['today', 'week', 'earlier', undefined]) {
      const a: Answers = { about, what, where: ['instagram', 'telegram'], threat, who, when };
      const plan = buildPlan(a, 'en');
      const ids = plan.map((s) => s.stepId);
      expect(ids[0]).toBe('breathe');
      expect(ids).toContain('ncrp');
      expect(new Set(plan.map((s) => s.key)).size).toBe(plan.length);
      expect(ids.includes('sextortion')).toBe(threat === 'yes' || what.includes('threat'));
      expect(ids.includes('helper')).toBe(about === 'helper');
      expect(ids.includes('timing')).toBe(when === 'earlier');
      expect(ids.includes('known-person')).toBe(who === 'yes' || who === 'suspect');
      expect(ids.includes('stopncii')).toBe((about === 'me' || about === 'helper') && what.some((w) => w !== 'threat'));
      count++;
    }
    expect(count).toBeGreaterThan(2000);
  });

  it('adds one report step per platform, most public first, and handles every platform subset', () => {
    for (const where of subsets(WHERE)) {
      const plan = buildPlan({ about: 'me', what: ['real'], where }, 'en');
      const reports = plan.filter((s) => s.stepId === 'report-platform').map((s) => s.platformId);
      expect(reports).toEqual(orderedPlatforms(where));
      expect(plan.some((s) => s.stepId === 'grievance')).toBe(reports.length > 0);
      expect(plan.some((s) => s.stepId === 'other-site')).toBe(where.includes('other'));
      expect(plan.some((s) => s.stepId === 'unknown-where')).toBe(where.includes('unknown'));
    }
    expect(orderedPlatforms(['google-search', 'whatsapp', 'instagram'])).toEqual(['instagram', 'whatsapp', 'google-search']);
  });

  it('fills platform names and links into report steps', () => {
    const [step] = buildPlan({ about: 'me', what: ['fake'], where: ['telegram'] }, 'en').filter((s) => s.platformId === 'telegram');
    expect(step.title).toBe('Report on Telegram');
    expect(step.cta?.href).toBe('/platforms/telegram');
    const hi = buildPlan({ about: 'me', what: ['fake'], where: ['telegram'] }, 'hi').find((s) => s.platformId === 'telegram')!;
    expect(hi.title).toContain('Telegram');
    expect(hi.title).not.toContain('{platform}');
  });

  it('returns no plan when the person shown is under 18, or the user is in danger', () => {
    for (const what of subsets(WHAT)) {
      expect(buildPlan({ about: 'minor', what, where: ['x'] }, 'en')).toEqual([]);
      expect(isBlocked({ about: 'minor', what, where: [] })).toBe('minor');
    }
    expect(buildPlan({ safety: 'yes', about: 'me', what: ['fake'], where: [] }, 'en')).toEqual([]);
  });

  it('skips Google removal and StopNCII for a threat with nothing posted', () => {
    const ids = buildPlan({ about: 'me', what: ['threat'], where: [] }, 'en').map((s) => s.stepId);
    expect(ids).not.toContain('google');
    expect(ids).not.toContain('stopncii');
    expect(ids).toContain('sextortion');
  });
});
