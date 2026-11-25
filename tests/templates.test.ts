import { describe, expect, it } from 'vitest';
import { fillTemplate, type DraftFields, type TemplateId } from '@content/templates';

const base: DraftFields = {
  name: 'Ananya S.', city: 'Pune', contentTypes: ['fake'], platforms: ['Telegram', 'X'], urls: ['https://example.com/demo_post'], handles: ['@demo_channel_123'],
  seenAt: '18 Nov 2026, 9:50 am IST', description: 'A morphed image was posted.', escalationPlatform: 'Telegram', reportedAt: '18 Nov 2026, 11:15 am IST',
  refId: 'DEMO-456', recipient: 'Telegram', earlierDate: '18 Nov 2026', daysElapsed: '7', legal: [{ short: 'IT Act s. 67A', summary: 'Sexually explicit material.' }],
};
const ids: TemplateId[] = ['ncrp', 'grievance', 'police', 'followup'];

describe('complaint templates', () => {
  it('fill all 4 templates in English and Hindi with no leftover placeholders', () => {
    for (const id of ids) for (const lang of ['en', 'hi'] as const) {
      const out = fillTemplate(id, base, lang);
      expect(out.length).toBeGreaterThan(150);
      expect(out).not.toMatch(/\$\{|undefined|null/);
      expect(out).toContain('https://example.com/demo_post');
      expect(out).toContain(lang === 'en' ? 'This is not legal advice.' : 'यह क़ानूनी सलाह नहीं है।');
    }
  });
  it('the grievance escalation cites Rule 3(2)(b) and the reference ID', () => {
    const en = fillTemplate('grievance', base, 'en');
    expect(en).toContain('Rule 3(2)(b)');
    expect(en).toContain('2 hours');
    expect(en).toContain('DEMO-456');
    expect(fillTemplate('grievance', base, 'hi')).toContain('3(2)(b)');
  });
  it('lists selected legal sections in NCRP and police drafts', () => {
    expect(fillTemplate('ncrp', base, 'en')).toContain('IT Act s. 67A');
    expect(fillTemplate('police', base, 'en')).toContain('IT Act s. 67A');
  });
  it('marks empty fields clearly instead of leaving gaps', () => {
    const out = fillTemplate('ncrp', { ...base, name: '', urls: [] }, 'en');
    expect(out).toContain('[add]');
  });
});

import { splitSubject } from '@content/templates';
import { platforms } from '@/lib/content';
import sendStepsRaw from '@content/send-steps.json';
import { sendStepsSchema } from '@/lib/schemas';
const sendSteps = sendStepsSchema.parse(sendStepsRaw);

describe('where-to-send guide', () => {
  it('splits the subject line out of email drafts in both languages', () => {
    const en = splitSubject(fillTemplate('grievance', base, 'en'));
    expect(en.subject).toMatch(/^Urgent removal under Rule 3\(2\)\(b\)/);
    expect(en.body).not.toMatch(/^Subject:/m);
    expect(en.body).toContain('DEMO-456');
    const hi = splitSubject(fillTemplate('followup', base, 'hi'));
    expect(hi.subject).toContain('DEMO-456');
    expect(hi.body).not.toMatch(/^विषय:/m);
    expect(splitSubject('no subject here')).toEqual({ subject: '', body: 'no subject here' });
  });
  it('has bilingual steps for every template, each citing only government sources', () => {
    sendStepsSchema.parse(sendSteps);
    for (const g of Object.values(sendSteps)) {
      for (const s of g.steps) { expect(s.en).toBeTruthy(); expect(s.hi).toBeTruthy(); }
      for (const src of g.sources) expect(new URL(src.url).hostname).toMatch(/(^|\.)gov\.in$/);
    }
  });
  it('gives the grievance guide one step for each contact route', () => {
    const routes = sendSteps.grievance.steps.map((s) => s.route).filter(Boolean);
    expect(routes.sort()).toEqual(['email', 'form']);
  });
  it('every shown grievance contact has a source, and unverified ones show none', () => {
    for (const p of platforms) {
      const g = p.grievanceOfficer;
      if (g.route === 'VERIFY') expect(g.value).toBe('');
      else { expect(g.value).toBeTruthy(); expect(g.source).toMatch(/^https:\/\//); }
      if (g.route === 'email') expect(g.value).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/);
    }
  });
});
