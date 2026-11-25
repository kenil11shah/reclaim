import { z } from 'zod';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
const url = z.string().url();
export const bi = z.object({ en: z.string().min(1), hi: z.string().min(1) });
export type Bi = z.infer<typeof bi>;

export const platformSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['social', 'messaging', 'search', 'video', 'forum']),
  reach: z.number().int().min(1),
  stopnciiPartner: z.enum(['listed', 'announced', 'no']),
  reportSteps: z.array(bi).min(3),
  webForm: z.object({ url: url.nullable(), label: bi, needsAccount: z.enum(['yes', 'no', 'unknown']) }),
  email: z.string().email().nullable(),
  grievanceOfficer: z.object({
    route: z.enum(['form', 'email', 'VERIFY']),
    value: z.string(),
    source: z.string(),
    note: bi.optional(),
  }),
  policySummary: bi,
  aiContentCovered: z.enum(['yes', 'unclear', 'no']),
  tips: z.array(bi),
  sources: z.array(z.object({ label: z.string(), url })).min(1),
  lastVerified: date,
});
export type Platform = z.infer<typeof platformSchema>;

export const legalSchema = z.object({
  id: z.string(),
  short: z.string(),
  name: bi,
  summary: bi,
  penalty: bi,
  appliesTo: z.array(z.enum(['real', 'fake', 'threat', 'filmed'])),
  sourceLabel: z.string(),
  sourceUrl: url,
  lastVerified: date,
});
export type LegalItem = z.infer<typeof legalSchema>;

export const helplineSchema = z.object({
  id: z.string(),
  name: bi,
  contact: z.string(),
  altContact: z.string().optional(),
  url: url.optional(),
  kind: z.enum(['phone', 'web', 'info']),
  purpose: bi,
  hours: bi,
  sourceLabel: z.string(),
  sourceUrl: url,
  lastVerified: date,
});
export type Helpline = z.infer<typeof helplineSchema>;

import { criterionIds, reportStatuses, type CriterionId } from './constants';
export { criterionIds, type CriterionId };
export const criterionSchema = z.object({ id: z.enum(criterionIds), max: z.number().int().positive(), name: bi, how: bi });
export type Criterion = z.infer<typeof criterionSchema>;

export const criterionScoreSchema = z
  .object({ points: z.number().int().min(0).nullable(), evidence: z.string().min(1), source: url.nullable(), checked: date.nullable() })
  .refine((c) => c.points === null || (c.source !== null && c.checked !== null), {
    message: 'A scored criterion needs a source URL and a checked date',
  });
export type CriterionScore = z.infer<typeof criterionScoreSchema>;

export const platformScoreSchema = z.object({
  platform: z.string(),
  reviewed: date,
  criteria: z.object(Object.fromEntries(criterionIds.map((id) => [id, criterionScoreSchema])) as Record<CriterionId, typeof criterionScoreSchema>),
});
export type PlatformScore = z.infer<typeof platformScoreSchema>;

export const incidentSchema = z.object({
  id: z.string(),
  date,
  platforms: z.array(z.string()),
  title: z.string(),
  summary: z.string(),
  sourceLabel: z.string(),
  source: url,
  scored: z.boolean(),
  note: z.string(),
});
export type Incident = z.infer<typeof incidentSchema>;

const when = z.object({
  aboutIn: z.array(z.string()).optional(),
  whatAny: z.array(z.string()).optional(),
  whereAny: z.array(z.string()).optional(),
  whoIn: z.array(z.string()).optional(),
  whenIn: z.array(z.string()).optional(),
  hasPlatforms: z.boolean().optional(),
  threatOrWhat: z.boolean().optional(),
});
export const flowSchema = z.object({
  questions: z.array(
    z.object({
      id: z.enum(['safety', 'about', 'what', 'where', 'who', 'threat', 'when', 'lang']),
      type: z.enum(['single', 'multi']),
      title: bi,
      help: bi,
      options: z.array(z.object({ value: z.string(), label: bi })).min(2),
    }),
  ),
  sextortionCard: z.object({ title: bi, points: z.array(bi) }),
  steps: z.array(
    z.object({
      id: z.string(),
      when,
      optional: z.boolean().optional(),
      title: bi,
      body: bi,
      cta: z.object({ label: bi, href: z.string() }).optional(),
    }),
  ),
});
export type Flow = z.infer<typeof flowSchema>;

export const reportStatus = z.enum(reportStatuses);
export type ReportStatus = z.infer<typeof reportStatus>;
const isoIST = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?\+05:30$/, 'Expected ISO time with +05:30');

export const answersSchema = z.object({
  safety: z.string().optional(),
  about: z.string().optional(),
  what: z.array(z.string()).default([]),
  where: z.array(z.string()).default([]),
  who: z.string().optional(),
  threat: z.string().optional(),
  when: z.string().optional(),
  lang: z.string().optional(),
});
export type Answers = z.infer<typeof answersSchema>;

export const reportSchema = z.object({
  id: z.string(),
  platform: z.string(),
  reportedAt: isoIST.nullable(),
  refId: z.string(),
  status: reportStatus,
  resolvedAt: isoIST.nullable(),
  notes: z.string().default(''),
});
export type Report = z.infer<typeof reportSchema>;

export const evidenceSchema = z.object({
  id: z.string(),
  url: z.string(),
  platform: z.string(),
  handle: z.string(),
  seenAt: isoIST.nullable(),
  notes: z.string(),
});
export type Evidence = z.infer<typeof evidenceSchema>;

export const caseSchema = z.object({
  id: z.string(),
  demo: z.boolean().default(false),
  createdAt: isoIST,
  answers: answersSchema,
  plan: z.array(z.object({ stepId: z.string(), done: z.boolean() })),
  reports: z.array(reportSchema),
  evidence: z.array(evidenceSchema),
  timeline: z.array(z.object({ at: isoIST, event: z.union([z.string(), bi]) })),
  person: z.object({ name: z.string(), age: z.number(), city: z.string() }).optional(),
});
export type Case = z.infer<typeof caseSchema>;
