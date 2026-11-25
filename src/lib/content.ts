import type { Platform, LegalItem, Helpline, Criterion, PlatformScore, Incident, Flow, Case } from './schemas';
import instagram from '@content/platforms/instagram.json';
import facebook from '@content/platforms/facebook.json';
import whatsapp from '@content/platforms/whatsapp.json';
import telegram from '@content/platforms/telegram.json';
import x from '@content/platforms/x.json';
import reddit from '@content/platforms/reddit.json';
import youtube from '@content/platforms/youtube.json';
import googleSearch from '@content/platforms/google-search.json';
import legalRaw from '@content/legal.json';
import helplinesRaw from '@content/helplines.json';
import criteriaRaw from '@content/tracker/criteria.json';
import scoresRaw from '@content/tracker/scores.json';
import incidentsRaw from '@content/tracker/incidents.json';
import flowRaw from '@content/flow.json';
import demoCaseRaw from '@content/demo/case.json';

// Content is validated with Zod at build time (scripts/validate-content.ts) and in tests,
// so the browser only gets typed data and never ships the validator.
export const rawContent = { platforms: [instagram, facebook, whatsapp, telegram, x, reddit, youtube, googleSearch], legalRaw, helplinesRaw, criteriaRaw, scoresRaw, incidentsRaw, flowRaw, demoCaseRaw };
export const platforms = ([instagram, facebook, whatsapp, telegram, x, reddit, youtube, googleSearch] as unknown as Platform[]).slice().sort((a, b) => a.reach - b.reach);
export const platformById = Object.fromEntries(platforms.map((p) => [p.id, p])) as Record<string, Platform>;
export const legal = legalRaw as unknown as LegalItem[];
export const legalById = Object.fromEntries(legal.map((l) => [l.id, l]));
export const helplines = helplinesRaw as unknown as Helpline[];
export const helplineById = Object.fromEntries(helplines.map((h) => [h.id, h]));
export const criteria = criteriaRaw as unknown as Criterion[];
export const scores = scoresRaw as unknown as PlatformScore[];
export const incidents = (incidentsRaw as unknown as Incident[]).slice().sort((a, b) => b.date.localeCompare(a.date));
export const flow = flowRaw as unknown as Flow;
export const demoCase = demoCaseRaw as unknown as Case;

export function platformName(id: string): string {
  return platformById[id]?.name ?? id;
}
