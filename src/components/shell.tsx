'use client';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useLocale } from './locale';
import { SafeLink } from './links';
import { leaveNow } from './safety';
import dynamic from 'next/dynamic';
import { TourCard } from './tour';
import { useStore } from '@/lib/store';
import { cn, neutralPath, href, go, PREVIEW } from '@/lib/utils';
import { readTrail, writeTrail, parentPath, TRAIL_BACK } from './trail';
import type { Key } from '@/lib/i18n';

const DeleteDialog = dynamic(() => import('./dialogs').then((m) => m.DeleteDialog), { ssr: false });
const PrivacyDialog = dynamic(() => import('./dialogs').then((m) => m.PrivacyDialog), { ssr: false });

const NAV: { to: string; key: Key }[] = [
  { to: '/help/', key: 'nav.help' },
  { to: '/case/', key: 'nav.case' },
  { to: '/draft/', key: 'nav.draft' },
  { to: '/evidence/', key: 'nav.evidence' },
  { to: '/platforms/', key: 'nav.platforms' },
  { to: '/tracker/', key: 'nav.tracker' },
  { to: '/learn/', key: 'nav.learn' },
  { to: '/support/', key: 'nav.support' },
];
export const REPO_URL = 'https://github.com/kenil11shah/reclaim';

function useNeutralTitle(on: boolean) {
  useEffect(() => {
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const original = icon?.getAttribute('href') ?? '/favicon.svg';
    if (!on) {
      icon?.setAttribute('href', '/favicon.svg');
      return;
    }
    const apply = () => {
      if (document.title !== 'Notes') document.title = 'Notes';
      icon?.setAttribute('href', '/notes.svg');
    };
    apply();
    const titleEl = document.querySelector('title');
    const mo = new MutationObserver(apply);
    if (titleEl) mo.observe(titleEl, { childList: true, characterData: true, subtree: true });
    return () => { mo.disconnect(); icon?.setAttribute('href', original); };
  }, [on]);
}

export function Shell({ children }: { children: ReactNode }) {
  const { t, locale } = useLocale();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [del, setDel] = useState(false);
  const [priv, setPriv] = useState(false);
  const neutral = useStore((s) => s.settings.neutralTitle);
  const touring = useStore((s) => s.tour.active);
  const setHydrated = useStore((s) => s.setHydrated);
  useNeutralTitle(neutral);

  useEffect(() => {
    Promise.resolve(useStore.persist.rehydrate()).then(() => setHydrated());
  }, [setHydrated]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (document.querySelector('[role="dialog"]')) return; // let Esc close dialogs first
      if (menu) return setMenu(false);
      leaveNow();
    };
    window.addEventListener('keydown', onKey);
    document.documentElement.dataset.escReady = '1';
    return () => window.removeEventListener('keydown', onKey);
  }, [menu]);

  useEffect(() => setMenu(false), [pathname]);

  // In-app trail for the Back button. The browser history stays at one entry on purpose,
  // so that after "Leave now" the browser's Back button cannot return to Reclaim.
  const router = useRouter();
  useEffect(() => {
    const cur = neutralPath(pathname) + window.location.search;
    const trail = readTrail();
    let back = false;
    try { back = sessionStorage.getItem(TRAIL_BACK) === '1'; sessionStorage.removeItem(TRAIL_BACK); } catch { /* ignore */ }
    if (!back && trail[trail.length - 1] !== cur) trail.push(cur);
    writeTrail(trail.slice(-30));
  }, [pathname]);
  const goBack = () => {
    const trail = readTrail();
    trail.pop();
    const prev = trail[trail.length - 1] ?? parentPath(here);
    writeTrail(trail);
    try { sessionStorage.setItem(TRAIL_BACK, '1'); } catch { /* ignore */ }
    go(router, href(locale, prev));
  };

  const here = neutralPath(pathname);
  const otherLocale = locale === 'en' ? 'hi' : 'en';
  const search = typeof window !== 'undefined' ? window.location.search : '';

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow">
        {t('nav.skip')}
      </a>
      <div className="bg-ink text-bg">
        <p className="mx-auto max-w-content px-4 py-1.5 text-center text-[13px]" data-testid="demo-banner">{t('banner.demo')}</p>
      </div>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-content items-center gap-2 px-4 py-2.5 sm:gap-3">
          <SafeLink to="/" className="flex items-center gap-2 rounded-lg py-1 font-bold tracking-tight text-ink">
            <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-on-brand">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12a8 8 0 1 0 2.3-5.6" /><path d="M4 4v4h4" /></svg>
            </span>
            <span className="text-lg">Reclaim</span>
          </SafeLink>
          <nav aria-label="Main" className="ml-4 hidden items-center gap-1 xl:flex">
            {NAV.map((n) => (
              <SafeLink key={n.to} to={n.to} aria-current={here.startsWith(n.to) ? 'page' : undefined}
                className={cn('rounded-lg px-2.5 py-2 text-[14px] font-medium text-muted hover:bg-brand-soft/60 hover:text-ink', here.startsWith(n.to) && 'bg-brand-soft text-brand')}>
                {t(n.key)}
              </SafeLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link
              href={href(otherLocale, here) + search}
              replace
              prefetch={PREVIEW ? false : undefined}
              onClick={PREVIEW ? (e) => { e.preventDefault(); window.location.replace(href(otherLocale, here) + window.location.search); } : undefined}
              lang={otherLocale}
              className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold text-brand hover:bg-brand-soft/60"
              data-testid="lang-switch"
            >
              {t('lang.switch')}
              <span className="sr-only"> ({t('lang.switchLabel')})</span>
            </Link>
            <button
              type="button"
              onClick={leaveNow}
              title={t('leave.hint')}
              data-testid="leave-now"
              className="inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-xl bg-ink px-3 text-sm font-bold text-bg sm:px-3.5 hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
            >
              <ShieldAlert className="hidden h-4 w-4 sm:block" aria-hidden />
              {t('leave.button')}
            </button>
            <button type="button" className="grid h-11 w-11 place-items-center rounded-xl hover:bg-brand-soft/60 xl:hidden" aria-expanded={menu} aria-controls="mobile-nav" aria-label={menu ? t('nav.close') : t('nav.menu')} onClick={() => setMenu((m) => !m)}>
              {menu ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
            </button>
          </div>
        </div>
        {menu && (
          <nav id="mobile-nav" aria-label="Main" className="border-t border-line bg-bg px-4 pb-4 xl:hidden">
            <ul className="mx-auto grid max-w-content grid-cols-2 gap-1 pt-2">
              {NAV.map((n) => (
                <li key={n.to}>
                  <SafeLink to={n.to} className={cn('block rounded-xl px-3 py-3 font-medium hover:bg-brand-soft/60', here.startsWith(n.to) && 'bg-brand-soft text-brand')}>
                    {t(n.key)}
                  </SafeLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
      <main id="main" className="mx-auto w-full max-w-content flex-1 px-4 pb-16 pt-6 sm:pt-8">
        {here !== '/' && (
          <button type="button" onClick={goBack} data-testid="back"
            className="mb-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-brand hover:bg-brand-soft/60 sm:mb-6">
            <ArrowLeft className="h-4 w-4" aria-hidden />{t('common.back')}
          </button>
        )}
        {children}
      </main>
      <footer className={cn('border-t border-line bg-surface', touring && 'pb-44 sm:pb-40')}>
        <div className="mx-auto grid max-w-content gap-6 px-4 py-8 sm:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="font-bold">Reclaim</p>
            <p className="mt-1 text-sm text-muted">{t('footer.note')}</p>
            <p className="mt-1 text-sm text-muted">{t('footer.notAdvice')}</p>
          </div>
          <div className="flex flex-wrap content-start gap-x-5 gap-y-2 text-sm sm:justify-end">
            <button type="button" className="font-semibold text-danger underline-offset-4 hover:underline" onClick={() => setDel(true)} data-testid="delete-everything">
              {t('footer.delete')}
            </button>
            <button type="button" className="font-medium text-brand underline-offset-4 hover:underline" onClick={() => setPriv(true)} data-testid="privacy-settings">
              {t('footer.privacy')}
            </button>
            <SafeLink to="/about/" className="font-medium text-brand underline-offset-4 hover:underline">{t('footer.about')}</SafeLink>
            <SafeLink to="/insights/" className="font-medium text-brand underline-offset-4 hover:underline">{t('insights.title')}</SafeLink>
            <a href={`${REPO_URL}/issues/new`} target="_blank" rel="noopener noreferrer" className="font-medium text-brand underline-offset-4 hover:underline">
              {t('footer.corrections')}
            </a>
          </div>
        </div>
      </footer>
      {del && <DeleteDialog open={del} onOpenChange={setDel} />}
      {priv && <PrivacyDialog open={priv} onOpenChange={setPriv} />}
      <TourCard />
    </>
  );
}
