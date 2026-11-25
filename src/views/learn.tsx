'use client';
import { BookOpen } from 'lucide-react';
import { useLocale } from '@/components/locale';
import { Badge, Card, PageHeader } from '@/components/ui';
import { SafeLink } from '@/components/links';

export interface ArticleMeta { slug: string; title: string; summary: string[]; minutes: number; order: number }

export default function LearnIndex({ articles }: { articles: ArticleMeta[] }) {
  const { t, locale } = useLocale();
  return (
    <div>
      <PageHeader title={t('learn.title')} sub={t('learn.sub')}>
        {locale === 'hi' && <Badge tone="amber" className="mt-3">{t('learn.review')}</Badge>}
      </PageHeader>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-tour="learn-list" data-testid="learn-list">
        {articles.map((a) => (
          <li key={a.slug}>
            <SafeLink to={`/learn/${a.slug}/`} className="group block h-full">
              <Card className="flex h-full flex-col transition-colors group-hover:border-brand/50">
                <span className="text-sm font-semibold text-muted">{String(a.order).padStart(2, '0')}</span>
                <h2 className="mt-1 text-lg font-bold leading-snug">{a.title}</h2>
                <p className="mt-2 flex-1 text-[15px] text-muted">{a.summary[0]}</p>
                <p className="mt-4 flex items-center gap-1.5 text-sm text-brand"><BookOpen className="h-4 w-4" aria-hidden />{t('learn.minutes', { n: a.minutes })}</p>
              </Card>
            </SafeLink>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function LearnArticle({ a, next }: { a: { title: string; summary: string[]; html: string; minutes: number }; next?: { slug: string; title: string } }) {
  const { t, locale } = useLocale();
  return (
    <article className="mx-auto max-w-[68ch]">
      <SafeLink to="/learn/" className="text-sm font-semibold text-brand underline-offset-4 hover:underline">← {t('learn.all')}</SafeLink>
      <h1 className="mt-3 text-[30px] font-bold leading-tight tracking-tight text-balance sm:text-[40px]">{a.title}</h1>
      <p className="mt-2 text-sm text-muted">{t('learn.minutes', { n: a.minutes })}{locale === 'hi' && <> · <Badge tone="amber">{t('learn.review')}</Badge></>}</p>
      <aside className="mt-6 rounded-2xl border border-brand/20 bg-brand-soft/50 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand">{t('learn.summary')}</h2>
        <ul className="mt-2 space-y-1.5">
          {a.summary.map((s, i) => <li key={i} className="flex gap-2"><span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{s}</li>)}
        </ul>
      </aside>
      <div className="prose-reclaim mt-6" dangerouslySetInnerHTML={{ __html: a.html }} />
      {next && (
        <p className="mt-10 border-t border-line pt-6">
          <SafeLink to={`/learn/${next.slug}/`} className="font-semibold text-brand underline underline-offset-4">{next.title} →</SafeLink>
        </p>
      )}
    </article>
  );
}
