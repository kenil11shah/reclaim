/* Build-time content checks. The build fails if any content file is missing a source or a date. */
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { rawContent } from '../src/lib/content';
import { platformSchema, legalSchema, helplineSchema, criterionSchema, platformScoreSchema, incidentSchema, flowSchema, caseSchema, sendStepsSchema } from '../src/lib/schemas';
import { summarize } from '../src/lib/score';
import en from '../content/i18n/en.json';
import sendStepsRaw from '../content/send-steps.json';
import hi from '../content/i18n/hi.json';

function parse<T>(label: string, schema: z.ZodType<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    console.error(`error ${label}:\n${r.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`);
    process.exit(1);
  }
  return r.data;
}
const platforms = parse('platforms', z.array(platformSchema), rawContent.platforms);
const legal = parse('legal.json', z.array(legalSchema), rawContent.legalRaw);
const helplines = parse('helplines.json', z.array(helplineSchema), rawContent.helplinesRaw);
const criteria = parse('criteria.json', z.array(criterionSchema), rawContent.criteriaRaw);
const scores = parse('scores.json', z.array(platformScoreSchema), rawContent.scoresRaw);
const incidents = parse('incidents.json', z.array(incidentSchema), rawContent.incidentsRaw);
const flow = parse('flow.json', flowSchema, rawContent.flowRaw);
parse('send-steps.json', sendStepsSchema, sendStepsRaw);
const demoCase = parse('demo/case.json', caseSchema, rawContent.demoCaseRaw);

const errors: string[] = [];
const warnings: string[] = [];
const today = new Date();
const STALE_DAYS = 90;

function age(d: string) {
  return (today.getTime() - new Date(`${d}T00:00:00+05:30`).getTime()) / 86400000;
}
function checkDate(label: string, d: string | null) {
  if (!d) return;
  if (age(d) > STALE_DAYS) warnings.push(`${label}: last verified ${d} (older than ${STALE_DAYS} days)`);
  if (age(d) < -1) errors.push(`${label}: date ${d} is in the future`);
}

platforms.forEach((p) => checkDate(`platform ${p.id}`, p.lastVerified));
legal.forEach((l) => checkDate(`legal ${l.id}`, l.lastVerified));
helplines.forEach((h) => checkDate(`helpline ${h.id}`, h.lastVerified));

const ids = new Set(platforms.map((p) => p.id));
if (scores.length !== platforms.length) errors.push(`scores.json has ${scores.length} platforms, expected ${platforms.length}`);
for (const s of scores) {
  if (!ids.has(s.platform)) errors.push(`scores.json: unknown platform ${s.platform}`);
  summarize(s, criteria); // throws if a score exceeds its max
  for (const [cid, c] of Object.entries(s.criteria)) if (c.checked) checkDate(`score ${s.platform} ${cid}`, c.checked);
}
for (const i of incidents) for (const p of i.platforms) if (!ids.has(p)) errors.push(`incident ${i.id}: unknown platform ${p}`);

const verify = platforms.filter((p) => p.grievanceOfficer.route === 'VERIFY').map((p) => p.id);
if (verify.length) warnings.push(`Grievance route still marked VERIFY (shown as Not assessed): ${verify.join(', ')}`);

const enKeys = Object.keys(en);
const hiKeys = new Set(Object.keys(hi));
for (const k of enKeys) if (!hiKeys.has(k)) errors.push(`hi.json missing key ${k}`);
for (const k of hiKeys) if (!(k in en)) errors.push(`hi.json has extra key ${k}`);

const learnDir = path.join(process.cwd(), 'content', 'learn');
const enArticles = fs.readdirSync(path.join(learnDir, 'en')).filter((f) => f.endsWith('.md'));
if (enArticles.length !== 12) errors.push(`expected 12 English Learn articles, found ${enArticles.length}`);
for (const f of enArticles) {
  for (const loc of ['en', 'hi']) {
    const p = path.join(learnDir, loc, f);
    if (!fs.existsSync(p)) { errors.push(`missing ${loc}/${f}`); continue; }
    const raw = fs.readFileSync(p, 'utf8');
    const body = raw.replace(/^---[\s\S]*?---/, '');
    const words = body.split(/\s+/).filter(Boolean).length;
    if (words > 600) errors.push(`${loc}/${f} has ${words} words (max 600)`);
    if (!/^## (Sources|स्रोत)/m.test(raw)) errors.push(`${loc}/${f} has no Sources section`);
    if (!/summary3:/.test(raw)) errors.push(`${loc}/${f} needs a 3-line summary`);
  }
}

// Demo data must be obviously fake.
for (const e of demoCase.evidence) {
  if (!/demo_|example\.com/.test(e.url + e.handle)) errors.push(`demo evidence ${e.id} is not obviously fake`);
}
for (const r of demoCase.reports) if (r.refId && !r.refId.startsWith('DEMO-')) errors.push(`demo report ${r.id} refId must start with DEMO-`);
if (!flow.questions.find((q) => q.id === 'about')?.options.some((o) => o.value === 'minor')) errors.push('help flow must offer the under-18 option');

warnings.forEach((w) => console.warn(`warn  ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`error ${e}`));
  process.exit(1);
}
console.log(`content ok: ${platforms.length} platforms, ${legal.length} legal items, ${helplines.length} helplines, ${incidents.length} incidents, ${enArticles.length * 2} articles`);
