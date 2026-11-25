'use client';
import { ArrowRight } from 'lucide-react';
import { useLocale } from '@/components/locale';
import { Badge, Card, PageHeader } from '@/components/ui';
import { SafeLink } from '@/components/links';
import { platforms, scores, criteria } from '@/lib/content';
import { summarize } from '@/lib/score';

export function GradeBadge({ platform }: { platform: string }) {
  const { t } = useLocale();
  const s = scores.find((x) => x.platform === platform);
  if (!s) return null;
  const sum = summarize(s, criteria);
  const tone = sum.grade === 'A' || sum.grade === 'B' ? 'ok' : sum.grade === 'C' ? 'brand' : sum.grade ? 'amber' : 'neutral';
  return (
    <Badge tone={tone} title={t('tracker.coverage', { n: sum.assessedCount })}>
      {sum.grade ? `${t('tracker.grade')} ${sum.grade}` : t('tracker.noGrade')}
      {sum.percent !== null && sum.grade && <span className="font-normal">· {sum.percent}%</span>}
    </Badge>
  );
}

export default function Platforms() {
  const { t, pick } = useLocale();
  return (
    <div>
      <PageHeader title={t('platforms.title')} sub={t('platforms.sub')} />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {platforms.map((p) => (
          <li key={p.id}>
            <SafeLink to={`/platforms/${p.id}/`} className="group block h-full">
              <Card className="flex h-full flex-col transition-colors group-hover:border-brand/50">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-bold">{p.name}</h2>
                  <ArrowRight className="h-5 w-5 text-brand transition-transform group-hover:translate-x-0.5" aria-hidden />
                </div>
                <p className="mt-2 line-clamp-3 flex-1 text-[14px] text-muted">{pick(p.policySummary)}</p>
                <div className="mt-4"><GradeBadge platform={p.id} /></div>
              </Card>
            </SafeLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
