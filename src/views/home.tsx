'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ListChecks, MessagesSquare, Timer, ArrowRight, Heart } from 'lucide-react';
import { useLocale } from '@/components/locale';
import { Button, Card, Notice } from '@/components/ui';
import { SafeLink, ExternalLink } from '@/components/links';
import { useStore } from '@/lib/store';
import { platforms } from '@/lib/content';
import { href } from '@/lib/utils';

const STAT_SOURCES = [
  'https://arxiv.org/pdf/2501.17805',
  'https://www.freshfields.com/en/our-thinking/blogs/technology-quotient/india-targets-deepfakes-and-ai-generated-content-key-changes-under-meitys-2026-102mjwn',
  'https://www.vice.com/en/article/nudify-deepfake-bots-telegram',
];

function HeroPicture() {
  // A phone showing a calm checklist and a countdown: the product itself, drawn simply.
  return (
    <svg viewBox="0 0 360 380" aria-hidden="true" focusable="false" className="h-full w-full">
      <defs>
        <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--brand-soft))" />
          <stop offset="1" stopColor="rgb(var(--bg))" />
        </linearGradient>
      </defs>
      <circle cx="190" cy="190" r="170" fill="url(#g1)" />
      <ellipse cx="185" cy="356" rx="100" ry="10" fill="rgb(var(--ink) / 0.08)" />
      <rect x="95" y="34" width="180" height="316" rx="28" fill="rgb(var(--ink))" />
      <rect x="105" y="46" width="160" height="292" rx="20" fill="rgb(var(--surface))" />
      <rect x="160" y="54" width="50" height="6" rx="3" fill="rgb(var(--line))" />
      <text x="120" y="88" fontSize="13" fontWeight="700" fill="rgb(var(--ink))">Your plan</text>
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(120 ${104 + i * 34})`}>
          <rect width="20" height="20" rx="6" fill={i < 3 ? 'rgb(var(--brand))' : 'none'} stroke="rgb(var(--brand))" strokeWidth="2" />
          {i < 3 && <path d="M5 10l4 4 7-8" fill="none" stroke="rgb(var(--on-brand))" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}
          <rect x="30" y="3" width={90 - i * 8} height="6" rx="3" fill="rgb(var(--ink) / 0.75)" />
          <rect x="30" y="13" width={60 + (i % 2) * 18} height="4" rx="2" fill="rgb(var(--muted) / 0.45)" />
        </g>
      ))}
      <g transform="translate(118 280)">
        <rect width="134" height="42" rx="12" fill="rgb(var(--amber-soft))" stroke="rgb(var(--amber))" />
        <circle cx="22" cy="21" r="10" fill="none" stroke="rgb(var(--amber))" strokeWidth="2.4" />
        <path d="M22 15v6l4 3" stroke="rgb(var(--amber))" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <text x="40" y="26" fontSize="14" fontWeight="700" fill="rgb(var(--ink))" style={{ fontVariantNumeric: 'tabular-nums' }}>01:42:10</text>
      </g>
      <g transform="translate(250 92)">
        <path d="M34 4l28 10v18c0 18-12 30-28 36C18 62 6 50 6 32V14z" fill="rgb(var(--brand))" />
        <path d="M22 34l8 8 14-16" fill="none" stroke="rgb(var(--on-brand))" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export default function Home() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const loadDemo = useStore((s) => s.loadDemo);
  const startTour = useStore((s) => s.startTour);
  const [deleted, setDeleted] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('deleted') === '1') {
      setDeleted(true);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);
  const stats = [1, 2, 3] as const;
  const how = [
    { i: MessagesSquare, n: 1 },
    { i: ListChecks, n: 2 },
    { i: Timer, n: 3 },
  ] as const;
  return (
    <div className="space-y-16 sm:space-y-20">
      {deleted && <Notice tone="ok">{t('delete.done')}</Notice>}
      <section className="grid items-center gap-8 md:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand">
            <Heart className="h-4 w-4" aria-hidden /> {t('home.notFault')}
          </p>
          <h1 className="text-[34px] font-bold leading-[1.08] tracking-tight text-balance sm:text-[50px]">{t('home.hero')}</h1>
          <p className="mt-5 max-w-[58ch] text-[17px] text-muted sm:text-lg">{t('home.sub')}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row" data-tour="hero-actions">
            <Button asChild size="lg">
              <SafeLink to="/help/" data-testid="cta-help">{t('home.ctaHelp')} <ArrowRight className="h-5 w-5" aria-hidden /></SafeLink>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              data-testid="cta-demo"
              onClick={() => {
                loadDemo();
                startTour();
                router.replace(href(locale, '/'));
              }}
            >
              {t('home.ctaDemo')}
            </Button>
          </div>
        </div>
        <div className="mx-auto aspect-[360/380] w-full max-w-[380px]">
          <HeroPicture />
        </div>
      </section>

      <section aria-label="Key facts" className="grid gap-4 md:grid-cols-3">
        {stats.map((n, i) => (
          <Card key={n} className="flex flex-col">
            <p className="text-[40px] font-bold leading-none tracking-tight text-brand">{t(`home.stat${n}.value`)}</p>
            <p className="mt-3 flex-1 text-[15px]">{t(`home.stat${n}.label`)}</p>
            <p className="mt-4 text-[13px] text-muted">
              <ExternalLink url={STAT_SOURCES[i]} className="font-normal">{t(`home.stat${n}.source`)}</ExternalLink>
            </p>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-bold sm:text-3xl">{t('home.how.title')}</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {how.map(({ i: Icon, n }) => (
            <li key={n} className="rounded-2xl border border-line bg-surface p-5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand"><Icon className="h-5 w-5" aria-hidden /></span>
              <h3 className="mt-4 text-lg font-bold">{t(`home.how.${n}.title`)}</h3>
              <p className="mt-1 text-muted">{t(`home.how.${n}.body`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl bg-brand px-5 py-8 text-on-brand sm:px-10 sm:py-10">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">{t('home.platforms.title')}</h2>
            <p className="mt-2 max-w-[56ch] opacity-90">{t('home.platforms.body')}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {platforms.map((p) => (
                <li key={p.id}>
                  <SafeLink to={`/tracker/${p.id}/`} className="inline-block rounded-full border border-on-brand/40 px-3 py-1.5 text-sm font-semibold hover:bg-on-brand/10">
                    {p.name}
                  </SafeLink>
                </li>
              ))}
            </ul>
          </div>
          <Button asChild variant="secondary" size="lg" className="border-0 bg-on-brand text-brand hover:bg-on-brand/90">
            <SafeLink to="/tracker/">{t('home.platforms.cta')}</SafeLink>
          </Button>
        </div>
      </section>

      <section className="grid items-start gap-4 sm:grid-cols-[auto_1fr]">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-ok-soft text-ok"><Lock className="h-6 w-6" aria-hidden /></span>
        <div>
          <h2 className="text-2xl font-bold">{t('home.privacy.title')}</h2>
          <p className="mt-2 max-w-[64ch] text-muted">{t('home.privacy.body')}</p>
        </div>
      </section>
    </div>
  );
}
