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
