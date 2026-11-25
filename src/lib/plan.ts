import type { Answers, Flow } from './schemas';
import { flow as defaultFlow, platformById } from './content';

export type Locale = 'en' | 'hi';
export interface PlanStep {
  key: string; // unique, e.g. "report-platform:telegram"
  stepId: string;
  title: string;
  body: string;
  optional: boolean;
  cta?: { label: string; href: string };
  platformId?: string;
}

const PLATFORM_IDS = ['instagram', 'facebook', 'whatsapp', 'telegram', 'x', 'reddit', 'youtube', 'google-search'];

/** Platforms the user picked, most public first (feeds before private chats, Search last). */
export function orderedPlatforms(where: string[]): string[] {
  return where
    .filter((w) => PLATFORM_IDS.includes(w))
    .sort((a, b) => (platformById[a]?.reach ?? 99) - (platformById[b]?.reach ?? 99));
}

type When = Flow['steps'][number]['when'];
export function matches(when: When, a: Answers): boolean {
  const what = a.what ?? [];
  const where = a.where ?? [];
  if (when.aboutIn && !when.aboutIn.includes(a.about ?? '')) return false;
  if (when.whatAny && !when.whatAny.some((w) => what.includes(w))) return false;
  if (when.whereAny && !when.whereAny.some((w) => where.includes(w))) return false;
  if (when.whoIn && !when.whoIn.includes(a.who ?? '')) return false;
  if (when.whenIn && !when.whenIn.includes(a.when ?? '')) return false;
  if (when.hasPlatforms && orderedPlatforms(where).length === 0) return false;
  if (when.threatOrWhat && !(a.threat === 'yes' || what.includes('threat'))) return false;
  return true;
}

/** True when the normal flow must not run (under-18 hard stop, or danger). */
export function isBlocked(a: Answers): 'minor' | 'danger' | null {
  if (a.about === 'minor') return 'minor';
  if (a.safety === 'yes') return 'danger';
  return null;
}

/** Pure rules engine: answers in, ordered checklist out. */
export function buildPlan(a: Answers, locale: Locale, f: Flow = defaultFlow): PlanStep[] {
  if (isBlocked(a)) return [];
  const out: PlanStep[] = [];
  for (const step of f.steps) {
    if (!matches(step.when, a)) continue;
    if (step.id === 'report-platform') {
      for (const pid of orderedPlatforms(a.where ?? [])) {
        const name = platformById[pid]?.name ?? pid;
        const fill = (s: string) => s.replaceAll('{platform}', name).replaceAll('{id}', pid);
        out.push({
          key: `report-platform:${pid}`,
          stepId: step.id,
          platformId: pid,
          title: fill(step.title[locale]),
          body: fill(step.body[locale]),
          optional: false,
          cta: step.cta ? { label: fill(step.cta.label[locale]), href: fill(step.cta.href) } : undefined,
        });
      }
      continue;
    }
    out.push({
      key: step.id,
      stepId: step.id,
      title: step.title[locale],
      body: step.body[locale],
      optional: Boolean(step.optional),
      cta: step.cta ? { label: step.cta.label[locale], href: step.cta.href } : undefined,
    });
  }
  return out;
}
