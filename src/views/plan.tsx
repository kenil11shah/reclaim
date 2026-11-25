'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, Printer } from 'lucide-react';
import { useLocale } from '@/components/locale';
import { Badge, Button, Card, Notice, PageHeader } from '@/components/ui';
import { SafeLink } from '@/components/links';
import { PinGate } from '@/components/pin-gate';
import { useStore } from '@/lib/store';
import { buildPlan, isBlocked } from '@/lib/plan';
import { href, cn, go } from '@/lib/utils';

export default function Plan() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const answers = useStore((s) => s.answers);
  const c = useStore((s) => s.case);
  const saveCase = useStore((s) => s.saveCase);
  const toggle = useStore((s) => s.togglePlanStep);
  const [saved, setSaved] = useState(false);

  const effective = answers.about || answers.what?.length || answers.where?.length ? answers : c?.answers ?? answers;
  const steps = useMemo(() => buildPlan(effective, locale), [effective, locale]);
  const hasAnswers = Boolean(effective.about || effective.what?.length || effective.where?.length || effective.safety);

  useEffect(() => {
    if (hydrated && isBlocked(effective) === 'minor') go(router, href(locale, '/under-18/'));
  }, [hydrated, effective, locale, router]);

  if (!hydrated) return <p className="text-muted">{t('common.loading')}</p>;
  if (!hasAnswers) {
    return (
      <Card className="mx-auto max-w-xl text-center">
        <h1 className="text-2xl font-bold">{t('plan.title')}</h1>
        <p className="mt-2 text-muted">{t('plan.empty')}</p>
        <Button asChild className="mt-5"><SafeLink to="/help/">{t('plan.start')}</SafeLink></Button>
      </Card>
    );
  }
  const doneSet = new Set(c?.plan.filter((p) => p.done).map((p) => p.stepId));
  const doneCount = steps.filter((s) => doneSet.has(s.key)).length;
  const keys = steps.map((s) => s.key);

  return (
    <PinGate>
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t('plan.title')} sub={t('plan.sub')}>
          <p className="mt-3 text-sm font-semibold text-brand" aria-live="polite">{t('plan.progress', { done: doneCount, total: steps.length })}</p>
        </PageHeader>
        <ol className="space-y-3" data-tour="plan-list" data-testid="plan-list">
          {steps.map((s, i) => {
            const done = doneSet.has(s.key);
            return (
              <li key={s.key} data-step={s.key} className={cn('rounded-2xl border bg-surface p-4 sm:p-5', done ? 'border-ok/40' : 'border-line')}>
                <div className="flex gap-4">
                  <button
                    type="button"
                    aria-pressed={done}
                    aria-label={`${t('plan.markDone')}: ${s.title}`}
                    onClick={() => {
                      if (!c) saveCase(keys);
                      toggle(s.key);
                    }}
                    className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 transition-colors', done ? 'border-ok bg-ok text-white' : 'border-muted/50 hover:border-brand')}
                  >
                    {done ? <Check className="h-5 w-5" aria-hidden /> : <span className="text-sm font-bold text-muted">{i + 1}</span>}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className={cn('text-[17px] font-bold leading-snug', done && 'text-muted line-through decoration-1')}>{s.title}</h2>
                      {s.optional && <Badge>{t('plan.optional')}</Badge>}
                    </div>
                    <p className="mt-1 text-[15px] text-muted">{s.body}</p>
                    {s.cta && (
                      <SafeLink to={s.cta.href} className="mt-2 inline-flex items-center gap-1 text-[15px] font-semibold text-brand underline-offset-4 hover:underline">
                        {s.cta.label} <ArrowRight className="h-4 w-4" aria-hidden />
                      </SafeLink>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {c && !c.demo ? (
            <Button asChild><SafeLink to="/case/">{t('plan.openCase')}</SafeLink></Button>
          ) : !c ? (
            <Button data-testid="save-case" onClick={() => { saveCase(keys); setSaved(true); }}>{t('plan.save')}</Button>
          ) : (
            <Button asChild><SafeLink to="/case/">{t('plan.openCase')}</SafeLink></Button>
          )}
          <Button asChild variant="secondary"><SafeLink to="/help/">{t('plan.redo')}</SafeLink></Button>
          <Button variant="ghost" className="no-print" onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden />{t('plan.print')}</Button>
        </div>
        {saved && <Notice tone="ok" className="mt-4">{t('plan.saved')} <SafeLink to="/case/" className="font-semibold underline">{t('plan.openCase')}</SafeLink></Notice>}
      </div>
    </PinGate>
  );
}
