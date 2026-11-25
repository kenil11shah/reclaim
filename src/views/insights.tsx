'use client';
import { FlaskConical } from 'lucide-react';
import { useLocale } from '@/components/locale';
import { Card, Notice, PageHeader } from '@/components/ui';
import { generateSynthetic, insights } from '@/lib/synthetic';
import { platformName } from '@/lib/content';
import { cn } from '@/lib/utils';
import type { Key } from '@/lib/i18n';

const data = insights(generateSynthetic());

interface Row { label: string; value: number; display: string; tone?: 'brand' | 'amber' | 'ok' }
/** Horizontal bar chart in plain HTML: fast, readable by screen readers, no chart library. */
function Bars({ rows, max, marker }: { rows: Row[]; max: number; marker?: { at: number; label: string } }) {
  const tones = { brand: 'bg-brand', amber: 'bg-amber', ok: 'bg-ok' };
  return (
    <div className="relative mt-4">
      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li key={r.label} className="grid grid-cols-[104px_1fr_52px] items-center gap-2 text-[13px]">
            <span className="truncate text-right">{r.label}</span>
            <span className="relative h-5 rounded-r-md bg-line/40">
              <span className={cn('block h-full rounded-r-md', tones[r.tone ?? 'brand'])} style={{ width: `${Math.min(100, (r.value / max) * 100)}%` }} />
              {marker && <span aria-hidden className="absolute inset-y-[-4px] w-0 border-l-2 border-dashed border-ink/70" style={{ left: `${(marker.at / max) * 100}%` }} />}
            </span>
            <span className="tabular-nums text-muted">{r.display}</span>
          </li>
        ))}
      </ul>
      {marker && <p className="mt-2 pl-[112px] text-xs text-muted">┆ {marker.label}</p>}
    </div>
  );
}

function ChartCard({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  const { t } = useLocale();
  return (
    <Card>
      <h2 className="font-bold">{title}</h2>
      <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-amber-soft px-2.5 py-1 text-xs font-semibold"><FlaskConical className="h-3.5 w-3.5" aria-hidden />{t('insights.banner')}</p>
      {children}
      {note && <p className="mt-3 text-sm text-muted">{note}</p>}
    </Card>
  );
}

export default function Insights() {
  const { t } = useLocale();
  const plat = data.byPlatform.map((p) => ({ ...p, name: platformName(p.id) }));
  const maxCount = Math.max(...plat.map((p) => p.count));
  const maxHours = Math.ceil(Math.max(...plat.map((p) => p.medianHours)) / 10) * 10;
  const maxType = Math.max(...data.types.map((x) => x.count));
  return (
    <div>
      <PageHeader title={t('insights.title')} sub={t('insights.sub')} />
      <Notice tone="amber" className="mb-6 font-semibold">{t('insights.banner')} {t('insights.total', { n: data.total })}</Notice>
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title={t('insights.byPlatform')}>
          <Bars max={maxCount} rows={plat.map((p) => ({ label: p.name, value: p.count, display: String(p.count) }))} />
        </ChartCard>
        <ChartCard title={t('insights.median')} note={t('insights.medianNote')}>
          <Bars max={maxHours} marker={{ at: 2, label: '2 h' }} rows={plat.map((p) => ({ label: p.name, value: p.medianHours, display: `${p.medianHours} h`, tone: p.medianHours > 2 ? 'amber' : 'ok' }))} />
        </ChartCard>
        <ChartCard title={t('insights.missed')}>
          <Bars max={100} rows={plat.map((p) => ({ label: p.name, value: p.missedShare, display: `${p.missedShare}%`, tone: 'amber' }))} />
        </ChartCard>
        <ChartCard title={t('insights.types')}>
          <Bars max={maxType} rows={data.types.map((x) => ({ label: t(`insights.type.${x.type}` as Key), value: x.count, display: String(x.count) }))} />
        </ChartCard>
      </div>
      <Card className="mt-6 max-w-prose">
        <h2 className="text-lg font-bold">{t('insights.why')}</h2>
        <p className="mt-2">{t('insights.whyBody')}</p>
      </Card>
    </div>
  );
}
