'use client';
import { useState } from 'react';
import { CheckCircle2, ShieldAlert, Trash2, FileDown, Download, Pencil } from 'lucide-react';
import { useLocale } from '@/components/locale';
import { Button, Card, Input, Label, Notice, PageHeader, Select, Textarea } from '@/components/ui';
import { PinGate } from '@/components/pin-gate';
import { useStore } from '@/lib/store';
import { platforms, platformName } from '@/lib/content';
import { formatIST, fromLocalInput, toLocalInput } from '@/lib/time';
import type { Evidence } from '@/lib/schemas';
import { downloadBlob, textToPdf } from '@/lib/pdf';
import { isHttpUrl } from '@/lib/utils';

function csvEscape(v: string) {
  const s = v.replace(/"/g, '""');
  // Neutralise spreadsheet formulas in exported cells.
  return /^[=+\-@]/.test(s) ? `"'${s}"` : `"${s}"`;
}

function EvidenceItem({ e }: { e: Evidence }) {
  const { t, locale } = useLocale();
  const update = useStore((s) => s.updateEvidence);
  const remove = useStore((s) => s.removeEvidence);
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({ url: e.url, platform: e.platform, handle: e.handle, seen: toLocalInput(e.seenAt), notes: e.notes });
  const [err, setErr] = useState('');
  const fid = (k: string) => `ev-${k}-${e.id}`;
  if (editing) {
    return (
      <li className="rounded-xl border border-brand/50 bg-surface p-4" data-testid="evidence-edit">
        <form noValidate className="grid gap-3 sm:grid-cols-2" onSubmit={(ev) => {
          ev.preventDefault();
          if (!isHttpUrl(f.url.trim())) return setErr(t('evidence.invalidUrl'));
          update(e.id, { url: f.url.trim(), platform: f.platform, handle: f.handle.trim(), seenAt: fromLocalInput(f.seen), notes: f.notes.trim() });
          setErr(''); setEditing(false);
        }}>
          <div className="sm:col-span-2">
            <Label htmlFor={fid('url')}>{t('evidence.f.url')}</Label>
            <Input id={fid('url')} type="url" inputMode="url" value={f.url} onChange={(x) => setF({ ...f, url: x.target.value })} aria-invalid={Boolean(err)} autoComplete="off" />
            {err && <p className="mt-1 text-sm text-danger">{err}</p>}
          </div>
          <div>
            <Label htmlFor={fid('pl')}>{t('evidence.f.platform')}</Label>
            <Select id={fid('pl')} value={f.platform} onChange={(x) => setF({ ...f, platform: x.target.value })}>
              {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              <option value="other">{t('evidence.other')}</option>
            </Select>
          </div>
          <div><Label htmlFor={fid('h')}>{t('evidence.f.handle')}</Label><Input id={fid('h')} value={f.handle} onChange={(x) => setF({ ...f, handle: x.target.value })} autoComplete="off" /></div>
          <div><Label htmlFor={fid('s')}>{t('evidence.f.seenAt')}</Label><Input id={fid('s')} type="datetime-local" value={f.seen} onChange={(x) => setF({ ...f, seen: x.target.value })} /></div>
          <div><Label htmlFor={fid('n')}>{t('evidence.f.notes')}</Label><Textarea id={fid('n')} rows={2} value={f.notes} onChange={(x) => setF({ ...f, notes: x.target.value })} /></div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" size="sm" data-testid="evidence-save">{t('common.save')}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setEditing(false); setErr(''); setF({ url: e.url, platform: e.platform, handle: e.handle, seen: toLocalInput(e.seenAt), notes: e.notes }); }}>{t('common.cancel')}</Button>
          </div>
        </form>
      </li>
    );
  }
  return (
    <li className="rounded-xl border border-line bg-surface p-4 transition-colors hover:border-brand/40">
      <div className="flex items-start gap-3">
        <button type="button" onClick={() => setEditing(true)} data-testid="evidence-open"
          className="-m-1.5 min-w-0 flex-1 rounded-lg p-1.5 text-left hover:bg-brand-soft/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30">
          <span className="block break-all font-mono text-[14px]">{e.url}</span>
          <span className="mt-1 block text-sm text-muted">
            {e.platform === 'other' ? t('evidence.other') : platformName(e.platform)}
            {e.handle && <> · {e.handle}</>}
            {e.seenAt && <> · {formatIST(e.seenAt, locale)}</>}
          </span>
          {e.notes && <span className="mt-1 block text-[15px]">{e.notes}</span>}
          <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand"><Pencil className="h-3.5 w-3.5" aria-hidden />{t('common.edit')}</span>
        </button>
        <button type="button" onClick={() => remove(e.id)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger" aria-label={`${t('common.delete')}: ${e.url}`}>
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}

function EvidenceInner() {
  const { t, locale } = useLocale();
  const c = useStore((s) => s.case);
  const add = useStore((s) => s.addEvidence);
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
              {items.map((e) => <EvidenceItem key={e.id} e={e} />)}
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
