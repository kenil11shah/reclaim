'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Phone, ShieldAlert } from 'lucide-react';
import { useLocale } from '@/components/locale';
import { Button, Card } from '@/components/ui';
import { flow } from '@/lib/content';
import { useStore } from '@/lib/store';
import { href, cn, go } from '@/lib/utils';
import type { Answers } from '@/lib/schemas';

type Screen = { kind: 'q'; i: number } | { kind: 'danger' } | { kind: 'sextortion' } | { kind: 'review' };
const Q = flow.questions;

export default function Help() {
  const { t, locale, pick } = useLocale();
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const answers = useStore((s) => s.answers);
  const setAnswer = useStore((s) => s.setAnswer);
  const resetAnswers = useStore((s) => s.resetAnswers);
  const tour = useStore((s) => s.tour);
  const [screen, setScreen] = useState<Screen>({ kind: 'q', i: 0 });
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (hydrated && tour.active) setScreen({ kind: 'review' });
  }, [hydrated, tour.active]);
  useEffect(() => {
    headingRef.current?.focus();
  }, [screen]);

  const goNext = (from: number) => setScreen(from + 1 < Q.length ? { kind: 'q', i: from + 1 } : { kind: 'review' });
  const goBack = () => {
    if (screen.kind === 'q' && screen.i > 0) setScreen({ kind: 'q', i: screen.i - 1 });
    else if (screen.kind === 'review') setScreen({ kind: 'q', i: Q.length - 1 });
    else if (screen.kind === 'sextortion') setScreen({ kind: 'q', i: Q.findIndex((q) => q.id === 'threat') });
    else if (screen.kind === 'danger') setScreen({ kind: 'q', i: 0 });
  };

  const chooseSingle = (qid: keyof Answers, value: string, i: number) => {
    setAnswer(qid, value as never);
    if (qid === 'safety' && value === 'yes') return setScreen({ kind: 'danger' });
    if (qid === 'about' && value === 'minor') {
      resetAnswers();
      return go(router, href(locale, '/under-18/'));
    }
    if (qid === 'threat' && value === 'yes') return setScreen({ kind: 'sextortion' });
    goNext(i);
  };

  const progress = screen.kind === 'q' ? screen.i + 1 : Q.length;
  const pct = Math.round((progress / Q.length) * 100);

  const summary = useMemo(
    () =>
      Q.map((q, i) => {
        const v = answers[q.id as keyof Answers];
        const vals = Array.isArray(v) ? v : v ? [v] : [];
        const labels = vals.map((x) => q.options.find((o) => o.value === x)).filter(Boolean).map((o) => pick(o!.label));
        return { q, i, labels };
      }),
    [answers, pick],
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={Q.length} aria-valuenow={progress} aria-label={t('help.progress', { n: progress, total: Q.length })}>
          <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
        <span className="whitespace-nowrap text-sm text-muted">{t('help.progress', { n: progress, total: Q.length })}</span>
      </div>

      {screen.kind === 'q' && (() => {
        const q = Q[screen.i];
        const current = answers[q.id as keyof Answers];
        const multi = q.type === 'multi';
        const selected: string[] = Array.isArray(current) ? current : current ? [current] : [];
        return (
          <section aria-labelledby="q-title" data-testid={`q-${q.id}`}>
            <h1 id="q-title" ref={headingRef} tabIndex={-1} className="text-[28px] font-bold leading-tight tracking-tight text-balance focus:outline-none sm:text-[36px]">{pick(q.title)}</h1>
            <p className="mt-2 text-muted">{pick(q.help)}</p>
            {multi && <p className="mt-1 text-sm font-medium text-brand">{t('help.selectHint')}</p>}
            <div className={cn('mt-6 grid gap-3', q.options.length > 5 && 'sm:grid-cols-2')} role="group" aria-labelledby="q-title">
              {q.options.map((o) => {
                const on = selected.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={on}
                    data-value={o.value}
                    onClick={() => {
                      if (multi) {
                        const next = on ? selected.filter((x) => x !== o.value) : [...selected, o.value];
                        setAnswer(q.id as 'what', next);
                      } else chooseSingle(q.id as keyof Answers, o.value, screen.i);
                    }}
                    className={cn(
                      'flex min-h-[56px] w-full items-center gap-3 rounded-xl border-2 bg-surface px-4 py-3 text-left text-[16px] font-medium transition-colors hover:border-brand/60',
                      on ? 'border-brand bg-brand-soft/60' : 'border-line',
                      q.id === 'about' && o.value === 'minor' && 'border-dashed',
                    )}
                  >
                    <span aria-hidden className={cn('grid h-6 w-6 shrink-0 place-items-center border-2', multi ? 'rounded-md' : 'rounded-full', on ? 'border-brand bg-brand text-on-brand' : 'border-muted/50')}>
                      {on && <Check className="h-4 w-4" />}
                    </span>
                    <span>{pick(o.label)}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex items-center gap-3">
              {screen.i > 0 && <Button variant="secondary" onClick={goBack}>{t('common.back')}</Button>}
              {multi && (
                <Button onClick={() => goNext(screen.i)} data-testid="q-next">{t('common.next')}</Button>
              )}
              <button type="button" className="ml-auto px-2 py-3 text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline" onClick={() => goNext(screen.i)} data-testid="q-skip">
                {t('common.skip')}
              </button>
            </div>
          </section>
        );
      })()}

      {screen.kind === 'danger' && (
        <Card className="border-danger/40" data-testid="danger">
          <ShieldAlert className="h-8 w-8 text-danger" aria-hidden />
          <h1 ref={headingRef} tabIndex={-1} className="mt-3 text-[28px] font-bold focus:outline-none">{t('help.danger.title')}</h1>
          <p className="mt-2 text-muted">{t('help.danger.body')}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="danger" size="lg"><a href="tel:112"><Phone className="h-5 w-5" aria-hidden />{t('help.danger.call')} · 112</a></Button>
            <Button variant="secondary" size="lg" onClick={() => { setAnswer('safety', 'no'); setScreen({ kind: 'q', i: 1 }); }}>{t('help.danger.safe')}</Button>
          </div>
        </Card>
      )}

      {screen.kind === 'sextortion' && (
        <Card className="border-amber" data-testid="sextortion">
          <h1 ref={headingRef} tabIndex={-1} className="text-[26px] font-bold focus:outline-none">{pick(flow.sextortionCard.title)}</h1>
          <ul className="mt-4 space-y-3">
            {flow.sextortionCard.points.map((p, i) => (
              <li key={i} className="flex gap-3"><span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber" /><span>{pick(p)}</span></li>
            ))}
          </ul>
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" onClick={goBack}>{t('common.back')}</Button>
            <Button onClick={() => goNext(Q.findIndex((q) => q.id === 'threat'))}>{t('help.sextortion.continue')}</Button>
          </div>
        </Card>
      )}

      {screen.kind === 'review' && (
        <section data-tour="help-review" data-testid="review">
          <h1 ref={headingRef} tabIndex={-1} className="text-[28px] font-bold focus:outline-none sm:text-[36px]">{t('help.review.title')}</h1>
          <p className="mt-2 text-muted">{t('help.review.body')}</p>
          <dl className="mt-6 divide-y divide-line rounded-2xl border border-line bg-surface">
            {summary.map(({ q, i, labels }) => (
              <div key={q.id} className="flex items-start gap-4 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <dt className="text-sm text-muted">{pick(q.title)}</dt>
                  <dd className="mt-0.5 font-medium">{labels.length ? labels.join(', ') : <span className="text-muted">{t('help.review.none')}</span>}</dd>
                </div>
                <button type="button" className="shrink-0 rounded-lg px-2 py-1.5 text-sm font-semibold text-brand hover:bg-brand-soft" onClick={() => setScreen({ kind: 'q', i })}>
                  {t('help.review.change')}
                </button>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" onClick={goBack}>{t('common.back')}</Button>
            <Button size="lg" data-testid="build-plan" onClick={() => {
              const lang = answers.lang === 'hi' || answers.lang === 'en' ? answers.lang : locale;
              go(router, href(lang, '/plan/'));
            }}>
              {t('help.review.build')}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
