'use client';
import { useState } from 'react';
import { Check, Clock, Mail, FileText, ShieldCheck, X as XIcon, Timer } from 'lucide-react';
import { useLocale } from '@/components/locale';
import { Badge, Button, Card, Notice } from '@/components/ui';
import { ExternalLink, SafeLink, SourceLine } from '@/components/links';
import { platformById } from '@/lib/content';
import { useStore } from '@/lib/store';
import { nowIST } from '@/lib/time';
import { GradeBadge } from './platforms';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[200px_1fr] sm:gap-4">
      <dt className="text-sm font-semibold text-muted">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

export default function PlatformDetail({ id }: { id: string }) {
  const { t, pick } = useLocale();
  const p = platformById[id];
  const addReport = useStore((s) => s.addReport);
  const updateReport = useStore((s) => s.updateReport);
  const log = useStore((s) => s.log);
  const [logged, setLogged] = useState(false);

  const startTimer = () => {
    const st = useStore.getState();
    const existing = st.case?.reports.find((r) => r.platform === id && r.status === 'not_reported');
    let rid = existing?.id;
    if (!rid) {
      addReport(id);
      const reps = useStore.getState().case!.reports;
      rid = reps[reps.length - 1].id;
    }
    updateReport(rid, { status: 'reported', reportedAt: nowIST() });
    log({ en: `Reported on ${p.name}`, hi: `${p.name} पर रिपोर्ट की` });
    setLogged(true);
  };

  const g = p.grievanceOfficer;
  return (
    <article className="mx-auto max-w-3xl">
      <SafeLink to="/platforms/" className="text-sm font-semibold text-brand underline-offset-4 hover:underline">← {t('platforms.title')}</SafeLink>
      <header className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[34px] font-bold tracking-tight sm:text-[42px]">{p.name}</h1>
        <SafeLink to={`/tracker/${p.id}/`} className="mb-2"><GradeBadge platform={p.id} /></SafeLink>
      </header>

      <Card className="mt-6 border-amber/50 bg-amber-soft/60">
        <div className="flex gap-3">
          <Clock className="mt-0.5 h-6 w-6 shrink-0 text-amber" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-muted">{t('platforms.deadline')}</p>
            <p className="text-xl font-bold">{t('platforms.deadlineValue')}</p>
            <p className="mt-1 text-[15px]">{t('platforms.deadlineNote')}</p>
          </div>
        </div>
      </Card>

      <section className="mt-8" data-tour="platform-steps">
        <h2 className="text-xl font-bold">{t('platforms.steps')}</h2>
        <ol className="mt-4 space-y-3">
          {p.reportSteps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-on-brand">{i + 1}</span>
              <p className="pt-1">{pick(s)}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button onClick={startTimer} data-testid="log-report"><Timer className="h-4 w-4" aria-hidden />{t('platforms.logReport')}</Button>
          <Button asChild variant="secondary"><SafeLink to={`/draft/?t=grievance&p=${p.id}`}><FileText className="h-4 w-4" aria-hidden />{t('platforms.draftGrievance')}</SafeLink></Button>
        </div>
        {logged && <Notice tone="ok" className="mt-4">{t('platforms.logged')} <SafeLink to="/case/" className="font-semibold underline">{t('nav.case')}</SafeLink></Notice>}
      </section>

      <section className="mt-10">
        <dl className="divide-y divide-line rounded-2xl border border-line bg-surface px-5">
          <Row label={t('platforms.webForm')}>
            {p.webForm.url ? <ExternalLink url={p.webForm.url}>{pick(p.webForm.label)}</ExternalLink> : <span>{t('platforms.noWebForm')}. {pick(p.webForm.label)}</span>}
            <p className="mt-1 text-sm text-muted">{t('platforms.needsAccount')}: {p.webForm.needsAccount === 'unknown' ? t('common.unknown') : p.webForm.needsAccount === 'yes' ? t('common.yes') : t('common.no')}</p>
          </Row>
          {p.email && (
            <Row label={t('platforms.email')}>
              <span className="inline-flex items-center gap-2 font-mono text-[15px]"><Mail className="h-4 w-4 text-muted" aria-hidden />{p.email}</span>
            </Row>
          )}
          <Row label={t('platforms.grievance')}>
            {g.route === 'VERIFY' ? (
              <span className="text-muted">{t('common.notAssessed')}. {t('platforms.verify')}</span>
            ) : g.route === 'form' ? (
              <ExternalLink url={g.value}>{t('platforms.grievanceForm')}</ExternalLink>
            ) : (
              <span className="break-all font-mono text-[15px]">{g.value}</span>
            )}
            {g.note && <p className="mt-1 text-sm text-muted">{pick(g.note)}</p>}
          </Row>
          <Row label={t('platforms.policy')}><p>{pick(p.policySummary)}</p></Row>
          <Row label={t('platforms.aiCovered')}>
            {p.aiContentCovered === 'yes' ? <Badge tone="ok"><Check className="h-3.5 w-3.5" aria-hidden />{t('common.yes')}</Badge> : p.aiContentCovered === 'no' ? <Badge tone="danger"><XIcon className="h-3.5 w-3.5" aria-hidden />{t('common.no')}</Badge> : <Badge tone="amber">{t('common.unknown')}</Badge>}
          </Row>
          <Row label={t('platforms.stopncii')}>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-muted" aria-hidden />{t(`platforms.stopncii.${p.stopnciiPartner}`)}</span>
          </Row>
        </dl>
      </section>

      {p.tips.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold">{t('platforms.tips')}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">{p.tips.map((tip, i) => <li key={i}>{pick(tip)}</li>)}</ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-bold">{t('common.sources')}</h2>
        <ul className="mt-2 space-y-1.5 text-[15px]">
          {p.sources.map((s) => <li key={s.url}><ExternalLink url={s.url} className="font-normal">{s.label}</ExternalLink></li>)}
        </ul>
        <SourceLine label={p.sources[0].label} url={p.sources[0].url} date={p.lastVerified} className="mt-3" />
      </section>
    </article>
  );
}
