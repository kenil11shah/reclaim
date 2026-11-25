'use client';
import { useEffect, useMemo, useState } from 'react';
import { useLocale } from '@/components/locale';
import { Badge, Card, Select } from '@/components/ui';
import { ExternalLink, SafeLink } from '@/components/links';
import { criteria, incidents, platforms, platformById, scores } from '@/lib/content';
import { summarize, type ScoreSummary } from '@/lib/score';
import { criterionIds } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { formatDay } from '@/lib/time';
import { REPO_URL } from '@/components/shell';
import type { Key } from '@/lib/i18n';

function ScoreChart({ data }: { data: { name: string; pct: number; graded: boolean }[] }) {
  // Plain HTML bars: readable by screen readers and no chart library on this page.
  return (
    <ul className="mt-4 space-y-2.5">
      {data.map((c) => (
        <li key={c.name} className="grid grid-cols-[96px_1fr_40px] items-center gap-2 text-[13px]">
          <span className="truncate text-right">{c.name}</span>
          <span className="h-5 overflow-hidden rounded-r-md bg-line/50">
            <span className={cn('block h-full rounded-r-md', c.graded ? 'bg-brand' : 'bg-muted/40')} style={{ width: `${c.pct}%` }} />
          </span>
          <span className="tabular-nums text-muted">{c.pct}%</span>
        </li>
      ))}
    </ul>
  );
}

export const summaries: ScoreSummary[] = scores.map((s) => summarize(s, criteria));
const byId = Object.fromEntries(summaries.map((s) => [s.platform, s]));

export function TrackerNav({ active }: { active: 'board' | 'compare' | 'methodology' | 'incidents' }) {
  const { t } = useLocale();
  const tabs = [
    { id: 'board', to: '/tracker/', k: 'tracker.leaderboard' },
    { id: 'compare', to: '/tracker/compare/', k: 'tracker.compare' },
    { id: 'methodology', to: '/tracker/methodology/', k: 'tracker.methodology' },
    { id: 'incidents', to: '/tracker/incidents/', k: 'tracker.incidents' },
  ] as const;
  return (
    <nav aria-label={t('tracker.title')} className="mb-8 flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((tab) => (
        <SafeLink key={tab.id} to={tab.to} aria-current={active === tab.id ? 'page' : undefined}
          className={cn('-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-[15px] font-semibold', active === tab.id ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink')}>
          {t(tab.k)}
        </SafeLink>
      ))}
    </nav>
  );
}

export function TrackerHeader() {
  const { t } = useLocale();
  return (
    <header className="mb-6 max-w-prose">
      <Badge tone="amber" className="mb-3">{t('tracker.label')}</Badge>
      <h1 className="text-[30px] font-bold leading-tight tracking-tight sm:text-[40px]">{t('tracker.title')}</h1>
      <p className="mt-3 text-[17px] text-muted">{t('tracker.sub')}</p>
    </header>
  );
}

export function GradePill({ s, large }: { s: ScoreSummary; large?: boolean }) {
  const { t } = useLocale();
  const color = s.grade === 'A' || s.grade === 'B' ? 'bg-ok text-white' : s.grade === 'C' ? 'bg-brand text-on-brand' : s.grade === 'D' ? 'bg-amber text-[#1f1300]' : s.grade === 'F' ? 'bg-danger text-white' : 'bg-line text-muted';
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-xl font-bold', large ? 'h-16 w-16 text-3xl' : 'h-11 w-11 text-xl', color)} aria-label={s.grade ? `${t('tracker.grade')} ${s.grade}` : t('tracker.noGrade')}>
      {s.grade ?? '–'}
    </span>
  );
}

export function CriterionBars({ s }: { s: ScoreSummary }) {
  const { t, pick } = useLocale();
  return (
    <div className="grid grid-cols-8 gap-1" aria-hidden>
      {criterionIds.map((id) => {
        const c = s.perCriterion[id];
        const pct = c.points === null ? 0 : (c.points / c.max) * 100;
        const cr = criteria.find((x) => x.id === id)!;
        return (
          <div key={id} title={`${id} ${pick(cr.name)}: ${c.points === null ? t('common.notAssessed') : `${c.points}/${c.max}`}`}>
            <div className={cn('relative h-8 overflow-hidden rounded-md', c.points === null ? 'border border-dashed border-muted/40 bg-transparent' : 'bg-line/70')}>
              {c.points !== null && <div className="absolute inset-x-0 bottom-0 bg-brand" style={{ height: `${Math.max(pct, 4)}%` }} />}
            </div>
            <p className="mt-0.5 text-center text-[10px] text-muted">{id}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function TrackerBoard() {
  const { t, locale } = useLocale();
  const [sort, setSort] = useState<'score' | 'name' | 'coverage'>('score');
  const [filter, setFilter] = useState<'all' | 'social' | 'messaging' | 'search'>('all');
  const rows = useMemo(() => {
    const cat = (id: string) => platformById[id].category;
    const f = summaries.filter((s) => filter === 'all' || (filter === 'social' ? ['social', 'video', 'forum'].includes(cat(s.platform)) : cat(s.platform) === filter));
    return [...f].sort((a, b) =>
      sort === 'name' ? platformById[a.platform].name.localeCompare(platformById[b.platform].name)
        : sort === 'coverage' ? b.assessedCount - a.assessedCount
          : (b.percent ?? -1) - (a.percent ?? -1) || b.assessedCount - a.assessedCount,
    );
  }, [sort, filter]);
  const chart = rows.map((s) => ({ name: platformById[s.platform].name, pct: s.percent ?? 0, graded: Boolean(s.grade) }));
  const reviewed = scores.map((s) => s.reviewed).sort().at(-1)!;

  return (
    <div>
      <TrackerHeader />
      <TrackerNav active="board" />
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="tr-sort" className="mb-1 block text-sm font-semibold">{t('tracker.sort')}</label>
          <Select id="tr-sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="w-44">
            <option value="score">{t('tracker.sort.score')}</option>
            <option value="name">{t('tracker.sort.name')}</option>
            <option value="coverage">{t('tracker.sort.coverage')}</option>
          </Select>
        </div>
        <div>
          <label htmlFor="tr-filter" className="mb-1 block text-sm font-semibold">{t('tracker.filter')}</label>
          <Select id="tr-filter" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="w-48">
            <option value="all">{t('tracker.filter.all')}</option>
            <option value="social">{t('tracker.filter.social')}</option>
            <option value="messaging">{t('tracker.filter.messaging')}</option>
            <option value="search">{t('tracker.filter.search')}</option>
          </Select>
        </div>
        <p className="ml-auto text-sm text-muted">{t('tracker.reviewed')}: {formatDay(reviewed, locale)}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <ol className="space-y-3" data-tour="tracker-board" data-testid="leaderboard">
          {rows.map((s, i) => {
            const p = platformById[s.platform];
            return (
              <li key={s.platform}>
                <SafeLink to={`/tracker/${s.platform}/`} className="group block">
                  <Card className="p-4 transition-colors group-hover:border-brand/50">
                    <div className="flex items-center gap-4">
                      <span className="w-5 text-right text-sm font-semibold text-muted">{i + 1}</span>
                      <GradePill s={s} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <h2 className="text-lg font-bold">{p.name}</h2>
                          {s.percent !== null && <span className="text-sm font-semibold tabular-nums">{s.percent}%</span>}
                        </div>
                        <p className="text-[13px] text-muted">
                          {t('tracker.points', { earned: s.earned, max: s.assessedMax })} · {t('tracker.coverage', { n: s.assessedCount })}
                          {s.provisional && s.grade && <> · {t('tracker.provisional')}</>}
                          {!s.grade && <> · {t('tracker.noGrade')}</>}
                        </p>
                      </div>
                      <div className="hidden w-48 sm:block"><CriterionBars s={s} /></div>
                    </div>
                  </Card>
                </SafeLink>
              </li>
            );
          })}
        </ol>
        <Card className="self-start">
          <h2 className="font-bold">{t('tracker.chart')}</h2>
          <ScoreChart data={chart} />
          <p className="mt-3 text-sm text-muted">{t('tracker.method.gradesBody')}</p>
          <p className="mt-3 text-sm"><ExternalLink url={`${REPO_URL}/issues/new`}>{t('tracker.corrections')}</ExternalLink></p>
        </Card>
      </div>
    </div>
  );
}

export function TrackerDetail({ id }: { id: string }) {
  const { t, pick, locale } = useLocale();
  const p = platformById[id];
  const s = byId[id];
  const sc = scores.find((x) => x.platform === id)!;
  const inc = incidents.filter((i) => i.platforms.includes(id));
  return (
    <div>
      <SafeLink to="/tracker/" className="text-sm font-semibold text-brand underline-offset-4 hover:underline">← {t('tracker.leaderboard')}</SafeLink>
      <header className="mt-3 flex flex-wrap items-center gap-4">
        <GradePill s={s} large />
        <div>
          <h1 className="text-[32px] font-bold tracking-tight sm:text-[40px]">{p.name}</h1>
          <p className="text-muted">
            {s.percent !== null && <strong className="text-ink">{s.percent}% · </strong>}
            {t('tracker.points', { earned: s.earned, max: s.assessedMax })} · {t('tracker.coverage', { n: s.assessedCount })}
            {s.provisional && s.grade ? ` · ${t('tracker.provisional')}` : ''}{!s.grade ? ` · ${t('tracker.noGrade')}` : ''}
          </p>
          <p className="text-sm text-muted">{t('tracker.reviewed')}: {formatDay(sc.reviewed, locale)} · <Badge tone="amber">{t('tracker.label')}</Badge></p>
        </div>
      </header>
      <section className="mt-8">
        <h2 className="text-xl font-bold">{t('tracker.breakdown')}</h2>
        {locale === 'hi' && <p className="mt-1 text-sm text-muted">{t('tracker.evidenceEnglish')}</p>}
        <ul className="mt-4 space-y-3" data-testid="breakdown">
          {criteria.map((cr) => {
            const c = sc.criteria[cr.id];
            return (
              <li key={cr.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-bold"><span className="text-muted">{cr.id}</span> {pick(cr.name)}</h3>
                  {c.points === null ? <Badge>{t('common.notAssessed')}</Badge> : <Badge tone="brand" className="tabular-nums">{c.points} / {cr.max}</Badge>}
                </div>
                {c.points !== null && (
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand" style={{ width: `${(c.points / cr.max) * 100}%` }} /></div>
                )}
                <p className="mt-2 text-[15px]" lang="en">{c.evidence}</p>
                {c.source && (
                  <p className="mt-1 text-[13px] text-muted">
                    {t('common.source')}: <ExternalLink url={c.source} className="font-normal">{new URL(c.source).hostname.replace(/^www\./, '')}</ExternalLink>
                    {c.checked && <> · {t('common.checked')}: {formatDay(c.checked, locale)}</>}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-bold">{t('tracker.timeline')}</h2>
        {inc.length === 0 ? <p className="mt-2 text-muted">{t('tracker.noIncidents')}</p> : <IncidentList items={inc} />}
      </section>
      <div className="mt-8 flex flex-wrap gap-4">
        <SafeLink to={`/platforms/${id}/`} className="font-semibold text-brand underline underline-offset-4">{t('tracker.howToReport', { name: p.name })}</SafeLink>
        <ExternalLink url={`${REPO_URL}/issues/new`}>{t('tracker.corrections')}</ExternalLink>
      </div>
    </div>
  );
}

function IncidentList({ items }: { items: typeof incidents }) {
  const { t, locale } = useLocale();
  return (
    <ol className="mt-4 space-y-3" lang="en">
      {items.map((i) => (
        <li key={i.id} className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2">
            <time className="text-sm font-semibold text-muted" dateTime={i.date}>{formatDay(i.date, locale)}</time>
            <Badge tone={i.scored ? 'amber' : 'neutral'}>{i.scored ? t('tracker.inc.scored') : t('tracker.inc.notScored')}</Badge>
            {i.platforms.map((p) => <Badge key={p} tone="brand">{platformById[p]?.name ?? p}</Badge>)}
          </div>
          <h3 className="mt-2 font-bold">{i.title}</h3>
          <p className="mt-1 text-[15px] text-muted">{i.summary}</p>
          <p className="mt-1 text-[13px] text-muted">{i.note} · {t('common.source')}: <ExternalLink url={i.source} className="font-normal">{i.sourceLabel}</ExternalLink></p>
        </li>
      ))}
    </ol>
  );
}

export function TrackerIncidents() {
  const { t, locale } = useLocale();
  return (
    <div>
      <TrackerHeader />
      <TrackerNav active="incidents" />
      <p className="max-w-prose text-muted">{t('tracker.inc.window')}</p>
      {locale === 'hi' && <p className="mt-1 text-sm text-muted">{t('tracker.evidenceEnglish')}</p>}
      <IncidentList items={incidents} />
    </div>
  );
}

export function TrackerMethodology() {
  const { t, pick } = useLocale();
  return (
    <div>
      <TrackerHeader />
      <TrackerNav active="methodology" />
      <h2 className="text-xl font-bold">{t('tracker.method.how')}</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface" tabIndex={0} role="region" aria-label={t('tracker.method.how')}>
        <table className="w-full min-w-[560px] text-left text-[15px]">
          <thead className="border-b border-line text-sm text-muted">
            <tr><th className="px-4 py-3">#</th><th className="px-4 py-3">{t('tracker.criterion')}</th><th className="px-4 py-3 text-right">{t('tracker.score')}</th><th className="px-4 py-3">{t('tracker.method.how')}</th></tr>
          </thead>
          <tbody>
            {criteria.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0 align-top">
                <td className="px-4 py-3 font-semibold">{c.id}</td>
                <td className="px-4 py-3 font-semibold">{pick(c.name)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{c.max}</td>
                <td className="px-4 py-3 text-muted">{pick(c.how)}</td>
              </tr>
            ))}
            <tr><td /><td className="px-4 py-3 font-bold">Total</td><td className="px-4 py-3 text-right font-bold tabular-nums">{criteria.reduce((a, c) => a + c.max, 0)}</td><td /></tr>
          </tbody>
        </table>
      </div>
      {(['grades', 'evidence', 'limits'] as const).map((k) => (
        <section key={k} className="mt-8 max-w-prose">
          <h2 className="text-xl font-bold">{t(`tracker.method.${k}` as Key)}</h2>
          <p className="mt-2 text-[16px] leading-relaxed">{t(`tracker.method.${k}Body` as Key)}</p>
        </section>
      ))}
      <p className="mt-8"><ExternalLink url={`${REPO_URL}/issues/new`}>{t('tracker.corrections')}</ExternalLink></p>
    </div>
  );
}

function CompareInner() {
  const { t, pick } = useLocale();
  const [picked, setPicked] = useState<string[]>(['instagram', 'x', 'telegram']);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('p');
    if (q) setPicked(q.split(',').filter((x) => platformById[x]).slice(0, 3));
  }, []);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]));
  const cols = picked.map((id) => ({ id, s: byId[id], sc: scores.find((x) => x.platform === id)! }));
  return (
    <div>
      <TrackerHeader />
      <TrackerNav active="compare" />
      <fieldset>
        <legend className="mb-2 font-semibold">{t('tracker.pick')}</legend>
        <div className="flex flex-wrap gap-2">
          {platforms.map((p) => {
            const on = picked.includes(p.id);
            return (
              <button key={p.id} type="button" aria-pressed={on} disabled={!on && picked.length >= 3} onClick={() => toggle(p.id)}
                className={cn('min-h-[44px] rounded-full border-2 px-4 text-sm font-semibold disabled:opacity-40', on ? 'border-brand bg-brand text-on-brand' : 'border-line bg-surface hover:border-brand/50')}>
                {p.name}
              </button>
            );
          })}
        </div>
      </fieldset>
      {cols.length < 2 ? (
        <p className="mt-6 text-muted">{t('tracker.pickMore')}</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface" tabIndex={0} role="region" aria-label={t('tracker.compare')}>
          <table className="w-full min-w-[520px] text-left text-[15px]" data-testid="compare-table">
            <thead className="border-b border-line">
              <tr>
                <th className="px-4 py-3 text-sm text-muted">{t('tracker.criterion')}</th>
                {cols.map((c) => (
                  <th key={c.id} className="px-4 py-3">
                    <div className="flex items-center gap-2"><GradePill s={c.s} /><span className="font-bold">{platformById[c.id].name}</span></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <td className="px-4 py-3 font-semibold">{t('tracker.score')}</td>
                {cols.map((c) => <td key={c.id} className="px-4 py-3 tabular-nums">{c.s.percent !== null ? `${c.s.percent}%` : '–'} <span className="text-sm text-muted">({t('tracker.coverage', { n: c.s.assessedCount })})</span></td>)}
              </tr>
              {criteria.map((cr) => (
                <tr key={cr.id} className="border-b border-line last:border-0 align-top">
                  <td className="px-4 py-3"><span className="text-muted">{cr.id}</span> {pick(cr.name)}</td>
                  {cols.map((c) => {
                    const v = c.sc.criteria[cr.id];
                    return <td key={c.id} className="px-4 py-3 tabular-nums">{v.points === null ? <span className="text-muted">{t('common.notAssessed')}</span> : `${v.points} / ${cr.max}`}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
export function TrackerCompare() {
  return <CompareInner />;
}
