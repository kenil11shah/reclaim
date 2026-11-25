'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { href, neutralPath, go as navigate } from '@/lib/utils';
import { useLocale } from './locale';
import { Button } from './ui';
import type { Key } from '@/lib/i18n';

export const TOUR: { route: string; target?: string }[] = [
  { route: '/', target: 'hero-actions' },
  { route: '/help/', target: 'help-review' },
  { route: '/plan/', target: 'plan-list' },
  { route: '/platforms/telegram/', target: 'platform-steps' },
  { route: '/draft/?t=ncrp', target: 'draft-output' },
  { route: '/case/', target: 'case-reports' },
  { route: '/tracker/', target: 'tracker-board' },
  { route: '/learn/', target: 'learn-list' },
];

export function TourCard() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const tour = useStore((s) => s.tour);
  const setStep = useStore((s) => s.setTourStep);
  const endTour = useStore((s) => s.endTour);
  const loadDemo = useStore((s) => s.loadDemo);
  const wipe = useStore((s) => s.wipe);
  const step = TOUR[tour.step];

  useEffect(() => {
    if (!tour.active || !step?.target) return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!el) return;
    el.classList.add('tour-highlight');
    return () => el.classList.remove('tour-highlight');
  }, [tour.active, step, pathname]);

  if (!tour.active || !step) return null;
  const go = (n: number) => {
    setStep(n);
    navigate(router, href(locale, TOUR[n].route));
  };
  const onRoute = neutralPath(pathname) === step.route.split('?')[0];
  const last = tour.step === TOUR.length - 1;
  return (
    <section
      aria-label={t('tour.label')}
      data-testid="tour"
      className="fixed inset-x-2 bottom-2 z-40 mx-auto max-w-lg rounded-2xl border border-brand/30 bg-surface p-3 shadow-2xl sm:bottom-6 sm:p-4"
    >
      <p className="text-xs font-semibold text-brand">{t('tour.step', { n: tour.step + 1, total: TOUR.length })}</p>
      <p className="mt-1 text-[14px] leading-snug sm:text-[15px]" aria-live="polite">{t(`tour.${tour.step + 1}` as Key)}</p>
      <div className="mt-2 flex items-center gap-1.5 sm:mt-3 sm:gap-2">
        {tour.step > 0 && (
          <Button size="sm" variant="secondary" onClick={() => go(tour.step - 1)}>{t('tour.back')}</Button>
        )}
        {!onRoute ? (
          <Button size="sm" onClick={() => go(tour.step)}>{t('common.continue')}</Button>
        ) : last ? (
          <Button size="sm" onClick={() => { endTour(); }}>{t('tour.finish')}</Button>
        ) : (
          <Button size="sm" data-testid="tour-next" onClick={() => go(tour.step + 1)}>{t('tour.next')}</Button>
        )}
        <span className="flex-1" />
        <Button size="sm" variant="ghost" className="px-2 text-[13px]" onClick={() => { loadDemo(); go(0); }}>{t('tour.reset')}</Button>
        <Button size="sm" variant="ghost" className="px-2 text-[13px]" data-testid="tour-exit" onClick={() => { endTour(); wipe(); navigate(router, href(locale, '/')); }}>{t('tour.exit')}</Button>
      </div>
    </section>
  );
}
