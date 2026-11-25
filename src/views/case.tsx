'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlarmClock, CheckCircle2, Clock, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { useLocale } from '@/components/locale';
import { Badge, Button, Card, Input, Label, Notice, PageHeader, Select } from '@/components/ui';
import { SafeLink } from '@/components/links';
import { PinGate } from '@/components/pin-gate';
import { useStore } from '@/lib/store';
import { platforms, platformName } from '@/lib/content';
import { deadlineState, formatDuration, formatHours } from '@/lib/deadline';
import { formatIST, fromLocalInput, nowIST, toLocalInput } from '@/lib/time';
import type { Report } from '@/lib/schemas';
import { reportStatuses } from '@/lib/constants';
import { cn, href, go } from '@/lib/utils';
import type { Key } from '@/lib/i18n';

function useNow(ms = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

function Countdown({ r, now }: { r: Report; now: Date }) {
  const { t, locale } = useLocale();
  const d = deadlineState(r, now);
  if (d.kind === 'not_started') return <p className="flex items-center gap-2 text-sm text-muted"><Clock className="h-4 w-4" aria-hidden />{t('case.dl.notStarted')}</p>;
  if (d.kind === 'running')
    return (
      <div className="rounded-xl bg-brand-soft/60 px-4 py-3">
        <p className="text-sm text-muted">{t('case.dl.running')}</p>
        <p className="text-2xl font-bold tabular-nums" data-testid="countdown">{formatDuration(d.msLeft)}</p>
        <p className="text-xs text-muted">{t('case.deadlineAt')}: {formatIST(d.deadline.toISOString(), locale)}</p>
      </div>
    );
  if (d.kind === 'overdue')
    return (
      <div className="rounded-xl border border-amber bg-amber-soft px-4 py-3" data-testid="overdue">
        <p className="flex items-center gap-2 font-bold"><AlertTriangle className="h-5 w-5 text-amber" aria-hidden />{t('case.dl.overdue')}</p>
        <p className="mt-0.5 text-sm tabular-nums">{t('case.dl.overdueBy', { t: formatDuration(d.msOver) })} · {t('case.deadlineAt')}: {formatIST(d.deadline.toISOString(), locale)}</p>
        <Button asChild variant="amber" size="sm" className="mt-3">
          <SafeLink to={`/draft/?t=grievance&p=${r.platform}`} data-testid="escalate">{t('case.escalate')}</SafeLink>
        </Button>
      </div>
    );
  if (d.kind === 'met') return <p className="flex items-center gap-2 rounded-xl bg-ok-soft px-4 py-3 font-semibold text-ok"><CheckCircle2 className="h-5 w-5" aria-hidden />{t('case.dl.met', { h: formatHours(d.hoursToRemove) })}</p>;
  return (
    <p className="flex items-start gap-2 rounded-xl border border-amber/60 bg-amber-soft/60 px-4 py-3 font-semibold" data-testid="removed-late">
      <AlarmClock className="mt-0.5 h-5 w-5 shrink-0 text-amber" aria-hidden />
      {t('case.dl.missedRemoved', { h: formatHours(d.hoursToRemove), late: formatHours(d.hoursLate) })}
    </p>
  );
}

function ReportCard({ r, now }: { r: Report; now: Date }) {
  const { t } = useLocale();
  const update = useStore((s) => s.updateReport);
  const remove = useStore((s) => s.removeReport);
  const log = useStore((s) => s.log);
  const id = r.id;
  const name = platformName(r.platform);
  const statusTone = r.status === 'removed' ? 'ok' : r.status === 'not_reported' ? 'neutral' : 'brand';
  return (
    <li className="rounded-2xl border border-line bg-surface p-4 sm:p-5" data-testid={`report-${r.platform}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{name}</h3>
          <Badge tone={statusTone}>{t(`case.status.${r.status}` as Key)}</Badge>
        </div>
        <button type="button" className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger" aria-label={`${t('case.remove')}: ${name}`} onClick={() => remove(id)}>
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="mt-4"><Countdown r={r} now={now} /></div>
      {r.status === 'not_reported' && (
        <Button className="mt-3" size="sm" data-testid="report-now" onClick={() => { update(id, { status: 'reported', reportedAt: nowIST() }); log({ en: `Reported on ${name}`, hi: `${name} पर रिपोर्ट की` }); }}>
          {t('case.reportNow')}
        </Button>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor={`st-${id}`}>{t('case.status')}</Label>
          <Select id={`st-${id}`} value={r.status} data-testid="status" onChange={(e) => {
            const status = e.target.value as Report['status'];
            const patch: Partial<Report> = { status };
            if (status === 'removed' && !r.resolvedAt) patch.resolvedAt = nowIST();
            if (status !== 'removed') patch.resolvedAt = null;
            if (status !== 'not_reported' && !r.reportedAt) patch.reportedAt = nowIST();
            update(id, patch);
            log({ en: `${name}: ${t(`case.status.${status}` as Key)}`, hi: `${name}: ${status}` });
          }}>
            {reportStatuses.map((s) => <option key={s} value={s}>{t(`case.status.${s}` as Key)}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor={`ra-${id}`}>{t('case.reportedAt')}</Label>
          <Input id={`ra-${id}`} type="datetime-local" data-testid="reported-at" value={toLocalInput(r.reportedAt)} onChange={(e) => {
            const v = fromLocalInput(e.target.value);
            update(id, { reportedAt: v, status: v && r.status === 'not_reported' ? 'reported' : r.status });
          }} />
        </div>
        <div>
          <Label htmlFor={`ref-${id}`}>{t('case.refId')}</Label>
          <Input id={`ref-${id}`} value={r.refId} onChange={(e) => update(id, { refId: e.target.value })} autoComplete="off" />
        </div>
        {r.status === 'removed' && (
          <div>
            <Label htmlFor={`rs-${id}`}>{t('case.resolvedAt')}</Label>
            <Input id={`rs-${id}`} type="datetime-local" value={toLocalInput(r.resolvedAt)} onChange={(e) => update(id, { resolvedAt: fromLocalInput(e.target.value) })} />
          </div>
        )}
      </div>
      {r.notes && <p className="mt-3 text-sm text-muted">{r.notes}</p>}
    </li>
  );
}

function CaseInner() {
  const { t, locale, pick } = useLocale();
  const router = useRouter();
  const c = useStore((s) => s.case);
  const startBlank = useStore((s) => s.startBlankCase);
  const loadDemo = useStore((s) => s.loadDemo);
  const addReport = useStore((s) => s.addReport);
  const wipe = useStore((s) => s.wipe);
  const endTour = useStore((s) => s.endTour);
  const [newPlat, setNewPlat] = useState(platforms[0].id);
  const now = useNow(1000);
  const hydrated = useStore((s) => s.hydrated);

  if (!hydrated) return <div className="min-h-[60vh]" aria-busy="true" />;
  if (!c) {
    return (
      <Card className="mx-auto max-w-xl text-center">
        <h1 className="text-2xl font-bold">{t('case.title')}</h1>
        <p className="mt-2 font-semibold">{t('case.empty')}</p>
        <p className="mt-1 text-muted">{t('case.emptyBody')}</p>
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild><SafeLink to="/help/">{t('plan.start')}</SafeLink></Button>
          <Button variant="secondary" onClick={startBlank} data-testid="start-blank">{t('case.startBlank')}</Button>
          <Button variant="ghost" onClick={loadDemo}>{t('case.loadDemo')}</Button>
        </div>
      </Card>
    );
  }
  const states = c.reports.map((r) => deadlineState(r, now).kind);
  const overdue = states.filter((k) => k === 'overdue').length;
  const removed = c.reports.filter((r) => r.status === 'removed').length;
  const timeline = [...c.timeline].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div>
      <PageHeader title={t('case.title')} sub={t('case.sub')} />
      {c.demo && (
        <Notice className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <span>{t('case.demoNote')}</span>
          <Button size="sm" variant="secondary" onClick={() => { endTour(); wipe(); go(router, href(locale, '/')); }}>{t('case.exitDemo')}</Button>
        </Notice>
      )}
      <dl className="mb-8 grid grid-cols-3 gap-3">
        {[
          { k: 'case.summary.total', v: c.reports.length, cls: '' },
          { k: 'case.summary.overdue', v: overdue, cls: overdue ? 'border-amber bg-amber-soft/60' : '' },
          { k: 'case.summary.removed', v: removed, cls: '' },
        ].map((x) => (
          <div key={x.k} className={cn('rounded-2xl border border-line bg-surface px-4 py-3', x.cls)}>
            <dt className="text-sm text-muted">{t(x.k as Key)}</dt>
            <dd className="text-3xl font-bold tabular-nums">{x.v}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section data-tour="case-reports" aria-labelledby="reports-h">
          <h2 id="reports-h" className="text-xl font-bold">{t('case.reports')}</h2>
          <ul className="mt-4 space-y-4">{c.reports.map((r) => <ReportCard key={r.id} r={r} now={now} />)}</ul>
          <form className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={(e) => { e.preventDefault(); addReport(newPlat); }}>
            <div className="flex-1">
              <Label htmlFor="new-plat">{t('case.platform')}</Label>
              <Select id="new-plat" value={newPlat} onChange={(e) => setNewPlat(e.target.value)}>
                {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </div>
            <Button type="submit" variant="secondary" data-testid="add-report"><Plus className="h-4 w-4" aria-hidden />{t('case.addReport')}</Button>
          </form>
        </section>
        <section aria-labelledby="tl-h">
          <div className="flex items-center justify-between">
            <h2 id="tl-h" className="text-xl font-bold">{t('case.timeline')}</h2>
            <SafeLink to="/plan/" className="text-sm font-semibold text-brand underline-offset-4 hover:underline">{t('case.planLink')}</SafeLink>
          </div>
          <ol className="mt-4 border-l-2 border-line pl-5">
            {timeline.map((ev, i) => (
              <li key={i} className="relative pb-5">
                <span aria-hidden className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-bg bg-brand" />
                <p className="text-xs text-muted">{formatIST(ev.at, locale)}</p>
                <p className="text-[15px]">{typeof ev.event === 'string' ? ev.event : pick(ev.event)}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

export default function CaseView() {
  return <PinGate><CaseInner /></PinGate>;
}
