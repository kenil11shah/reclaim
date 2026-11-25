'use client';
import { useState } from 'react';
import { CheckCircle2, ShieldAlert, Trash2, FileDown, Download } from 'lucide-react';
import { useLocale } from '@/components/locale';
import { Button, Card, Input, Label, Notice, PageHeader, Select, Textarea } from '@/components/ui';
import { PinGate } from '@/components/pin-gate';
import { useStore } from '@/lib/store';
import { platforms, platformName } from '@/lib/content';
import { formatIST, fromLocalInput } from '@/lib/time';
import { downloadBlob, textToPdf } from '@/lib/pdf';
import { isHttpUrl } from '@/lib/utils';

function csvEscape(v: string) {
  const s = v.replace(/"/g, '""');
  // Neutralise spreadsheet formulas in exported cells.
  return /^[=+\-@]/.test(s) ? `"'${s}"` : `"${s}"`;
}

function EvidenceInner() {
  const { t, locale } = useLocale();
  const c = useStore((s) => s.case);
  const add = useStore((s) => s.addEvidence);
  const remove = useStore((s) => s.removeEvidence);
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState(platforms[0].id);
  const [handle, setHandle] = useState('');
  const [seen, setSeen] = useState('');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');
  const items = c?.evidence ?? [];

  const exportCsv = () => {
    const rows = [['URL', 'Platform', 'Handle', 'Seen at (IST)', 'Notes'], ...items.map((e) => [e.url, platformName(e.platform), e.handle, formatIST(e.seenAt, 'en'), e.notes])];
    downloadBlob('﻿' + rows.map((r) => r.map(csvEscape).join(',')).join('\r\n'), 'reclaim-evidence-log.csv', 'text/csv;charset=utf-8');
  };
  const exportPdf = async () => {
    const body = items.map((e, i) => `${i + 1}. ${e.url}\n   Platform: ${platformName(e.platform)}\n   Handle: ${e.handle || '-'}\n   Seen: ${formatIST(e.seenAt, 'en') || '-'}\n   Notes: ${e.notes || '-'}`).join('\n\n');
    const bytes = await textToPdf('Reclaim evidence log', `${body}\n\nKept privately by the person concerned. Generated in the browser; nothing was uploaded.`);
    downloadBlob(bytes as BlobPart, 'reclaim-evidence-log.pdf', 'application/pdf');
  };

  return (
    <div>
      <PageHeader title={t('evidence.title')} sub={t('evidence.sub')} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold">{t('evidence.checklist')}</h2>
          <ul className="mt-3 space-y-2.5">
            {(['c1', 'c2', 'c3', 'c4', 'c5'] as const).map((k) => (
              <li key={k} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />{t(`evidence.${k}`)}</li>
            ))}
          </ul>
        </Card>
        <Card className="border-amber/50 bg-amber-soft/50">
          <h2 className="text-lg font-bold">{t('evidence.guidance')}</h2>
          <ul className="mt-3 space-y-2.5">
            {(['g1', 'g2', 'g3', 'g4'] as const).map((k) => (
              <li key={k} className="flex gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber" aria-hidden />{t(`evidence.${k}`)}</li>
            ))}
          </ul>
        </Card>
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{t('evidence.log')}</h2>
            <p className="text-sm text-muted">{t('evidence.logHelp')}</p>
          </div>
          {items.length > 0 && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={exportCsv} data-testid="export-csv"><FileDown className="h-4 w-4" aria-hidden />{t('evidence.exportCsv')}</Button>
              <Button variant="secondary" size="sm" onClick={exportPdf} data-testid="export-pdf"><Download className="h-4 w-4" aria-hidden />{t('evidence.exportPdf')}</Button>
            </div>
          )}
        </div>
        <form
          noValidate
          className="mt-4 grid gap-4 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isHttpUrl(url.trim())) return setErr(t('evidence.invalidUrl'));
            add({ url: url.trim(), platform, handle: handle.trim(), seenAt: fromLocalInput(seen), notes: notes.trim() });
            setUrl(''); setHandle(''); setSeen(''); setNotes(''); setErr('');
          }}
        >
          <div className="sm:col-span-2">
            <Label htmlFor="ev-url">{t('evidence.f.url')}</Label>
            <Input id="ev-url" type="url" inputMode="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} aria-invalid={Boolean(err)} aria-describedby={err ? 'ev-err' : undefined} autoComplete="off" />
            {err && <p id="ev-err" className="mt-1 text-sm text-danger">{err}</p>}
          </div>
          <div>
            <Label htmlFor="ev-platform">{t('evidence.f.platform')}</Label>
            <Select id="ev-platform" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              <option value="other">{t('evidence.other')}</option>
            </Select>
          </div>
          <div><Label htmlFor="ev-handle">{t('evidence.f.handle')}</Label><Input id="ev-handle" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@" autoComplete="off" /></div>
          <div><Label htmlFor="ev-seen">{t('evidence.f.seenAt')}</Label><Input id="ev-seen" type="datetime-local" value={seen} onChange={(e) => setSeen(e.target.value)} /></div>
          <div><Label htmlFor="ev-notes">{t('evidence.f.notes')}</Label><Textarea id="ev-notes" rows={1} className="min-h-[44px]" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <div className="sm:col-span-2"><Button type="submit" data-testid="add-evidence">{t('evidence.add')}</Button></div>
        </form>

        {items.length === 0 ? (
          <p className="mt-6 text-muted">{t('evidence.empty')}</p>
        ) : (
          <>
            <p className="mt-6 text-sm text-muted">{t('evidence.count', { n: items.length })}</p>
            <ul className="mt-2 space-y-3" data-testid="evidence-list">
              {items.map((e) => (
                <li key={e.id} className="rounded-xl border border-line bg-surface p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="break-all font-mono text-[14px]">{e.url}</p>
                      <p className="mt-1 text-sm text-muted">
                        {e.platform === 'other' ? t('evidence.other') : platformName(e.platform)}
                        {e.handle && <> · {e.handle}</>}
                        {e.seenAt && <> · {formatIST(e.seenAt, locale)}</>}
                      </p>
                      {e.notes && <p className="mt-1 text-[15px]">{e.notes}</p>}
                    </div>
                    <button type="button" onClick={() => remove(e.id)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger" aria-label={`${t('common.delete')}: ${e.url}`}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
        {c?.demo && <Notice className="mt-4">{t('case.demoNote')}</Notice>}
      </section>
    </div>
  );
}

export default function EvidenceView() {
  return <PinGate><EvidenceInner /></PinGate>;
}
