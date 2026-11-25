'use client';
import { Phone, Globe, HeartHandshake, Scale } from 'lucide-react';
import { useLocale } from '@/components/locale';
import { Button, Card, PageHeader } from '@/components/ui';
import { ExternalLink, SourceLine } from '@/components/links';
import { helplines } from '@/lib/content';

export default function Support() {
  const { t, pick } = useLocale();
  return (
    <div>
      <PageHeader title={t('support.title')} sub={t('support.sub')} />
      <ul className="grid gap-4 md:grid-cols-2" data-testid="helplines">
        {helplines.map((h) => (
          <li key={h.id}>
            <Card className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">{pick(h.name)}</h2>
                  <p className="mt-1 text-[15px] text-muted">{pick(h.purpose)}</p>
                </div>
                {h.kind === 'phone' && <span className="text-2xl font-bold tabular-nums text-brand">{h.contact}</span>}
              </div>
              <p className="mt-2 text-sm text-muted">{t('support.hours')}: {pick(h.hours)}{h.altContact && <> · {h.altContact}</>}</p>
              <div className="mt-3 flex-1">
                {h.kind === 'phone' && <Button asChild size="sm"><a href={`tel:${h.contact}`}><Phone className="h-4 w-4" aria-hidden />{t('support.call')} {h.contact}</a></Button>}
                {h.kind === 'web' && h.url && <span className="inline-flex items-center gap-2"><Globe className="h-4 w-4 text-muted" aria-hidden /><ExternalLink url={h.url}>{h.contact}</ExternalLink></span>}
                {h.kind === 'info' && <p className="text-[15px] font-medium">{h.contact}</p>}
              </div>
              <SourceLine label={h.sourceLabel} url={h.sourceUrl} date={h.lastVerified} className="mt-4" />
            </Card>
          </li>
        ))}
      </ul>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <Card className="bg-brand-soft/40">
          <HeartHandshake className="h-6 w-6 text-brand" aria-hidden />
          <h2 className="mt-2 text-lg font-bold">{t('support.emotional')}</h2>
          <p className="mt-1">{t('support.emotionalBody')}</p>
        </Card>
        <Card className="bg-brand-soft/40">
          <Scale className="h-6 w-6 text-brand" aria-hidden />
          <h2 className="mt-2 text-lg font-bold">{t('support.legal')}</h2>
          <p className="mt-1">{t('support.legalBody')}</p>
        </Card>
      </div>
      <p className="mt-6 text-sm text-muted">{t('support.notCrisis')}</p>
    </div>
  );
}
