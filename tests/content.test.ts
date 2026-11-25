import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { platforms, legal, helplines, flow, demoCase, scores, rawContent } from '@/lib/content';
import { platformSchema, legalSchema, helplineSchema, platformScoreSchema, incidentSchema, flowSchema, caseSchema, criterionSchema } from '@/lib/schemas';
import { generateSynthetic, insights } from '@/lib/synthetic';
import { href, neutralPath } from '@/lib/utils';
import en from '@content/i18n/en.json';
import hi from '@content/i18n/hi.json';

describe('content files', () => {
  it('pass Zod validation', () => {
    z.array(platformSchema).parse(rawContent.platforms);
    z.array(legalSchema).parse(rawContent.legalRaw);
    z.array(helplineSchema).parse(rawContent.helplinesRaw);
    z.array(criterionSchema).parse(rawContent.criteriaRaw);
    z.array(platformScoreSchema).parse(rawContent.scoresRaw);
    z.array(incidentSchema).parse(rawContent.incidentsRaw);
    flowSchema.parse(rawContent.flowRaw);
    caseSchema.parse(rawContent.demoCaseRaw);
  });
  it('load', () => {
    expect(platforms).toHaveLength(8);
    expect(legal.length).toBeGreaterThanOrEqual(10);
    expect(helplines.map((h) => h.id)).toEqual(expect.arrayContaining(['112', '1930', '181', '1098', '14416', 'ncrp']));
    expect(scores).toHaveLength(8);
  });
  it('rejects a platform with no source or date', () => {
    const bad = { ...platforms[0], sources: [], lastVerified: undefined };
    expect(() => platformSchema.parse(bad)).toThrow();
    expect(() => legalSchema.parse({ ...legal[0], sourceUrl: 'not-a-url' })).toThrow();
  });
  it('flow has 8 questions, each bilingual', () => {
    expect(flow.questions).toHaveLength(8);
    for (const q of flow.questions) { expect(q.title.en).toBeTruthy(); expect(q.title.hi).toBeTruthy(); }
  });
  it('demo case uses only obviously fake identifiers', () => {
    for (const e of demoCase.evidence) expect(e.url + e.handle).toMatch(/demo_|example\.com/);
    for (const r of demoCase.reports) if (r.refId) expect(r.refId).toMatch(/^DEMO-/);
    expect(demoCase.reports).toHaveLength(3);
  });
  it('English and Hindi UI strings have the same keys and placeholders', () => {
    expect(Object.keys(hi).sort()).toEqual(Object.keys(en).sort());
    for (const [k, v] of Object.entries(en)) {
      const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
      expect(ph((hi as Record<string, string>)[k]), k).toEqual(ph(v));
    }
  });
  it('no file upload control text exists in content', () => {
    expect(JSON.stringify(en)).not.toMatch(/type="file"/);
  });
});

describe('synthetic data', () => {
  it('is deterministic for the same seed', () => {
    expect(generateSynthetic()).toEqual(generateSynthetic());
    expect(generateSynthetic(200, 1)).not.toEqual(generateSynthetic(200, 2));
    const s = insights(generateSynthetic());
    expect(s.total).toBe(200);
    expect(s.byPlatform.reduce((a, p) => a + p.count, 0)).toBe(200);
  });
});

describe('paths', () => {
  it('builds locale-aware paths', () => {
    expect(href('en', '/help')).toBe('/help/');
    expect(href('hi', '/help/')).toBe('/hi/help/');
    expect(href('hi', '/')).toBe('/hi/');
    expect(href('en', '/draft?t=ncrp')).toBe('/draft/?t=ncrp');
    expect(neutralPath('/hi/tracker/x/')).toBe('/tracker/x/');
    expect(neutralPath('/hi')).toBe('/');
  });
  it('zod is v4-compatible here', () => {
    expect(z.string().url().safeParse('https://a.b').success).toBe(true);
  });
});
