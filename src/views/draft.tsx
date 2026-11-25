'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Download, ExternalLink as ExtIcon, RotateCcw, Printer } from 'lucide-react';
import { useLocale } from '@/components/locale';
import { Button, Card, Input, Label, Notice, PageHeader, Select, Textarea } from '@/components/ui';
import { ExternalLink } from '@/components/links';
import { PinGate } from '@/components/pin-gate';
import { useStore } from '@/lib/store';
import { legal, platforms, platformById, flow } from '@/lib/content';
import { fillTemplate, type DraftFields, type DraftLang, type TemplateId } from '@content/templates';
import { formatIST } from '@/lib/time';
import { isOverdue } from '@/lib/deadline';
import { copyText, downloadBlob, textToPdf } from '@/lib/pdf';
import { cn } from '@/lib/utils';
import type { Key } from '@/lib/i18n';

const TEMPLATES: TemplateId[] = ['ncrp', 'grievance', 'police', 'followup'];
const TYPES = ['real', 'fake', 'threat', 'filmed'];
const DEMO_DESCRIPTION = {
  en: 'An AI-morphed sexual image made from my public Instagram photo was posted in a Telegram channel and then reposted on X with my name in the caption. I have never shared any such image. (Demo case: fictional.)',
  hi: 'मेरी सार्वजनिक Instagram फ़ोटो से एआई द्वारा बनाई गई मॉर्फ़्ड यौन तस्वीर एक Telegram चैनल में पोस्ट की गई और फिर X पर मेरे नाम के साथ दोबारा पोस्ट की गई। मैंने ऐसी कोई तस्वीर कभी साझा नहीं की। (डेमो केस: काल्पनिक।)',
};

function DraftInner() {
  const { t, locale, pick } = useLocale();
  const hydrated = useStore((s) => s.hydrated);
  const c = useStore((s) => s.case);
  const answers = useStore((s) => s.answers);
  const log = useStore((s) => s.log);
  const [tpl, setTpl] = useState<TemplateId>('ncrp');
  const [lang, setLang] = useState<DraftLang>(locale);
  const [f, setF] = useState<Omit<DraftFields, 'legal'>>({
    name: '', city: '', contentTypes: [], platforms: [], urls: [], handles: [], seenAt: '', description: '',
    escalationPlatform: '', reportedAt: '', refId: '', recipient: '', earlierDate: '', daysElapsed: '',
  });
  const [legalOn, setLegalOn] = useState<Record<string, boolean>>({});
  const [text, setText] = useState('');
  const [edited, setEdited] = useState(false);
  const [msg, setMsg] = useState('');
  const outRef = useRef<HTMLTextAreaElement>(null);
  const [escPlatform, setEscPlatform] = useState<string>('');

  // Prefill once from the case and the help-flow answers.
  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('t') as TemplateId | null;
    if (q && TEMPLATES.includes(q)) setTpl(q);
    const a = c?.answers?.what?.length ? c.answers : answers;
    const where = (a.where ?? []).filter((w) => platformById[w]);
    const reports = c?.reports ?? [];
    const pid = params.get('p') || reports.find((r) => isOverdue(r))?.platform || reports.find((r) => r.reportedAt)?.platform || where[0] || '';
    const rep = reports.find((r) => r.platform === pid && r.reportedAt) ?? reports.find((r) => r.platform === pid);
    const first = c?.evidence.map((e) => e.seenAt).filter(Boolean).sort()[0] ?? null;
    const days = rep?.reportedAt ? String(Math.max(1, Math.floor((Date.now() - new Date(rep.reportedAt).getTime()) / 86400000))) : '';
    setEscPlatform(pid);
    setF((prev) => ({
      ...prev,
      name: c?.person?.name ?? '',
      city: c?.person?.city ?? '',
      contentTypes: a.what ?? [],
      platforms: (where.length ? where : reports.map((r) => r.platform)).map((w) => platformById[w]?.name ?? w),
      urls: c?.evidence.map((e) => e.url) ?? [],
      handles: c?.evidence.map((e) => e.handle).filter(Boolean) ?? [],
      seenAt: first ? formatIST(first, lang) : '',
      description: c?.demo ? DEMO_DESCRIPTION[lang] : prev.description,
      escalationPlatform: platformById[pid]?.name ?? '',
      reportedAt: rep?.reportedAt ? formatIST(rep.reportedAt, lang) : '',
      refId: rep?.refId ?? '',
      recipient: platformById[pid]?.name ?? '',
      earlierDate: rep?.reportedAt ? formatIST(rep.reportedAt, lang, false) : '',
      daysElapsed: days,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, lang]);

  const suggested = useMemo(() => legal.filter((l) => l.appliesTo.some((x) => f.contentTypes.includes(x))), [f.contentTypes]);
  useEffect(() => {
    setLegalOn((prev) => Object.fromEntries(suggested.map((l) => [l.id, prev[l.id] ?? true])));
  }, [suggested]);

  const generated = useMemo(
    () => fillTemplate(tpl, { ...f, legal: suggested.filter((l) => legalOn[l.id]).map((l) => ({ short: l.short, summary: l.summary[lang] })) }, lang),
    [tpl, f, suggested, legalOn, lang],
  );
  useEffect(() => { if (!edited) setText(generated); }, [generated, edited]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const lines = (v: string) => v.split('\n').map((x) => x.trim()).filter(Boolean);
  const plat = platformById[escPlatform];
  const officialUrl = tpl === 'ncrp' ? 'https://cybercrime.gov.in/' : tpl === 'grievance' && plat ? (plat.grievanceOfficer.route === 'form' ? plat.grievanceOfficer.value : plat.grievanceOfficer.route === 'email' ? `mailto:${plat.grievanceOfficer.value}` : null) : null;

  return (
    <div>
      <div className="no-print">
      <PageHeader title={t('draft.title')} sub={t('draft.sub')} />
      {c && <Notice className="mb-6">{t('draft.prefilled')}</Notice>}
      <fieldset className="mb-6">
        <legend className="mb-3 text-sm font-semibold">{t('draft.template')}</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" role="radiogroup">
          {TEMPLATES.map((id) => (
            <button key={id} type="button" role="radio" aria-checked={tpl === id} data-testid={`tpl-${id}`} onClick={() => { setTpl(id); setEdited(false); }}
              className={cn('rounded-xl border-2 bg-surface px-4 py-3 text-left', tpl === id ? 'border-brand bg-brand-soft/50' : 'border-line hover:border-brand/50')}>
              <span className="block font-semibold">{t(`draft.t.${id}` as Key)}</span>
              <span className="block text-sm text-muted">{t(`draft.t.${id}.desc` as Key)}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{t('draft.fields')}</h2>
            <div className="flex items-center gap-2 text-sm" role="radiogroup" aria-label={t('draft.language')}>
              <span className="text-muted">{t('draft.language')}</span>
              {(['en', 'hi'] as const).map((l) => (
                <button key={l} type="button" role="radio" aria-checked={lang === l} data-testid={`draft-lang-${l}`} onClick={() => { setLang(l); setEdited(false); }}
                  className={cn('rounded-lg px-2.5 py-1.5 font-semibold', lang === l ? 'bg-brand text-on-brand' : 'bg-line/60')}>
                  {l === 'en' ? 'EN' : 'हिं'}
                </button>
              ))}
            </div>
          </div>
          {(tpl === 'grievance' || tpl === 'followup') && (
            <div>
              <Label htmlFor="d-plat">{t('draft.f.escalationPlatform')}</Label>
              <Select id="d-plat" value={escPlatform} onChange={(e) => { setEscPlatform(e.target.value); const n = platformById[e.target.value]?.name ?? ''; setF((p) => ({ ...p, escalationPlatform: n, recipient: n })); }}>
                <option value="">—</option>
                {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="d-name">{t('draft.f.name')}</Label><Input id="d-name" value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="off" /></div>
            <div><Label htmlFor="d-city">{t('draft.f.city')}</Label><Input id="d-city" value={f.city} onChange={(e) => set('city', e.target.value)} autoComplete="off" /></div>
          </div>
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">{t('draft.f.types')}</legend>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((ty) => {
                const on = f.contentTypes.includes(ty);
                const label = flow.questions.find((q) => q.id === 'what')!.options.find((o) => o.value === ty)!.label;
                return (
                  <label key={ty} className={cn('flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm', on ? 'border-brand bg-brand-soft/50' : 'border-line')}>
                    <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--brand))]" checked={on} onChange={() => set('contentTypes', on ? f.contentTypes.filter((x) => x !== ty) : [...f.contentTypes, ty])} />
                    {pick(label)}
                  </label>
                );
              })}
            </div>
          </fieldset>
          {(tpl === 'ncrp' || tpl === 'police') && (
            <>
              <div><Label htmlFor="d-plats">{t('draft.f.platforms')}</Label><Input id="d-plats" value={f.platforms.join(', ')} onChange={(e) => set('platforms', e.target.value.split(',').map((x) => x.trim()))} /></div>
              <div><Label htmlFor="d-seen">{t('draft.f.seenAt')}</Label><Input id="d-seen" value={f.seenAt} onChange={(e) => set('seenAt', e.target.value)} /></div>
              <div><Label htmlFor="d-handles">{t('draft.f.handles')}</Label><Textarea id="d-handles" rows={2} value={f.handles.join('\n')} onChange={(e) => set('handles', lines(e.target.value))} /></div>
              <div><Label htmlFor="d-desc">{t('draft.f.description')}</Label><Textarea id="d-desc" rows={4} value={f.description} onChange={(e) => set('description', e.target.value)} /></div>
            </>
          )}
          {tpl === 'grievance' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="d-rep">{t('draft.f.reportedAt')}</Label><Input id="d-rep" value={f.reportedAt} onChange={(e) => set('reportedAt', e.target.value)} /></div>
              <div><Label htmlFor="d-ref">{t('draft.f.refId')}</Label><Input id="d-ref" value={f.refId} onChange={(e) => set('refId', e.target.value)} /></div>
            </div>
          )}
          {tpl === 'followup' && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div><Label htmlFor="d-rec">{t('draft.f.recipient')}</Label><Input id="d-rec" value={f.recipient} onChange={(e) => set('recipient', e.target.value)} /></div>
              <div><Label htmlFor="d-ear">{t('draft.f.earlierDate')}</Label><Input id="d-ear" value={f.earlierDate} onChange={(e) => set('earlierDate', e.target.value)} /></div>
              <div><Label htmlFor="d-days">{t('draft.f.days')}</Label><Input id="d-days" inputMode="numeric" value={f.daysElapsed} onChange={(e) => set('daysElapsed', e.target.value)} /></div>
              <div className="sm:col-span-3"><Label htmlFor="d-ref2">{t('draft.f.refId')}</Label><Input id="d-ref2" value={f.refId} onChange={(e) => set('refId', e.target.value)} /></div>
            </div>
          )}
          <div><Label htmlFor="d-urls">{t('draft.f.urls')}</Label><Textarea id="d-urls" rows={3} value={f.urls.join('\n')} onChange={(e) => set('urls', lines(e.target.value))} /></div>
          {tpl !== 'grievance' && tpl !== 'followup' && suggested.length > 0 && (
            <fieldset>
              <legend className="text-sm font-semibold">{t('draft.legal')}</legend>
              <p className="mb-2 text-sm text-muted">{t('draft.legalHelp')}</p>
              <ul className="space-y-2">
                {suggested.map((l) => (
                  <li key={l.id} className="flex items-start gap-3 rounded-lg border border-line p-3">
                    <input id={`lg-${l.id}`} type="checkbox" className="mt-1 h-4 w-4 accent-[rgb(var(--brand))]" checked={legalOn[l.id] ?? true} onChange={(e) => setLegalOn((p) => ({ ...p, [l.id]: e.target.checked }))} />
                    <label htmlFor={`lg-${l.id}`} className="min-w-0 text-sm">
                      <span className="font-semibold">{l.short}</span>: {pick(l.summary)}{' '}
                      <ExternalLink url={l.sourceUrl} className="font-normal">{t('common.source')}</ExternalLink>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}
        </Card>

        <div className="space-y-3" data-tour="draft-output">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" id="out-label">{t('draft.output')}</h2>
            {edited && <button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-brand" onClick={() => setEdited(false)}><RotateCcw className="h-4 w-4" aria-hidden />{t('draft.reset')}</button>}
          </div>
          <Textarea ref={outRef} aria-labelledby="out-label" data-testid="draft-output" lang={lang} value={text} onChange={(e) => { setText(e.target.value); setEdited(true); }} className="min-h-[460px] font-[inherit] text-[15px]" />
          {edited && <p className="text-sm text-muted">{t('draft.edited')}</p>}
          <div className="flex flex-wrap gap-2">
            <Button data-testid="draft-copy" onClick={async () => { const ok = await copyText(text, outRef.current); setMsg(ok ? t('common.copied') : t('common.copyFailed')); if (ok && c) log({ en: `Copied ${tpl.toUpperCase()} draft`, hi: `${tpl.toUpperCase()} ड्राफ़्ट कॉपी किया` }); }}>
              <Copy className="h-4 w-4" aria-hidden />{t('draft.copy')}
            </Button>
            {lang === 'en' ? (
              <Button variant="secondary" data-testid="draft-pdf" onClick={async () => { const bytes = await textToPdf(`Reclaim draft: ${t(`draft.t.${tpl}` as Key)}`, text); downloadBlob(bytes as BlobPart, `reclaim-${tpl}-draft.pdf`, 'application/pdf'); }}>
                <Download className="h-4 w-4" aria-hidden />{t('draft.pdf')}
              </Button>
            ) : (
              <Button variant="secondary" data-testid="draft-pdf" title={t('draft.pdfHiHelp')} onClick={() => window.print()}>
                <Printer className="h-4 w-4" aria-hidden />{t('draft.pdfHi')}
              </Button>
            )}
            {officialUrl && (
              <Button asChild variant="ghost"><a href={officialUrl} target="_blank" rel="noopener noreferrer"><ExtIcon className="h-4 w-4" aria-hidden />{t('draft.openSite')}</a></Button>
            )}
          </div>
          {lang === 'hi' && <p className="text-sm text-muted">{t('draft.pdfHiHelp')}</p>}
          <p role="status" aria-live="polite" className="text-sm font-semibold text-ok">{msg}</p>
          <p className="text-xs text-muted">{t('draft.footerNote')}</p>
        </div>
      </div>
      </div>
      <pre className="print-only whitespace-pre-wrap font-sans text-[12pt] leading-relaxed" lang={lang}>{text}</pre>
    </div>
  );
}

export default function Draft() {
  return (
    <PinGate>
      <DraftInner />
    </PinGate>
  );
}
