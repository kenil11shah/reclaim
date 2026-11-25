'use client';
import { useLocale } from '@/components/locale';
import { PageHeader } from '@/components/ui';
import { ExternalLink } from '@/components/links';
import { REPO_URL } from '@/components/shell';
import type { Key } from '@/lib/i18n';

export default function About() {
  const { t } = useLocale();
  const sections = ['why', 'privacy', 'limits', 'demo', 'built', 'contact'] as const;
  return (
    <div className="max-w-prose">
      <PageHeader title={t('about.title')} sub={t('about.lead')} />
      {sections.map((s) => (
        <section key={s} id={s} className="mt-8">
          <h2 className="text-xl font-bold">{t(`about.${s}` as Key)}</h2>
          <p className="mt-2 text-[16px] leading-relaxed">{t(`about.${s}Body` as Key)}</p>
          {s === 'contact' && <p className="mt-2"><ExternalLink url={REPO_URL}>github.com/kenil11shah/reclaim</ExternalLink></p>}
        </section>
      ))}
      <p className="mt-10 text-sm text-muted">{t('about.byline')}</p>
    </div>
  );
}
