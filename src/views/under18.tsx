'use client';
import { Phone, AlertOctagon, ShieldCheck } from 'lucide-react';
import { useLocale } from '@/components/locale';
import { Button, Card, PageHeader } from '@/components/ui';
import { ExternalLink, SafeLink, SourceLine } from '@/components/links';
import { helplineById } from '@/lib/content';

export default function Under18() {
  const { t, pick } = useLocale();
  const ncrp = helplineById['ncrp'];
  const routes = [
    { h: helplineById['ncrp'], text: t('u18.ncrp'), action: <ExternalLink url="https://cybercrime.gov.in/">cybercrime.gov.in</ExternalLink> },
    { h: helplineById['1930'], text: t('u18.1930'), action: <Button asChild size="sm"><a href="tel:1930"><Phone className="h-4 w-4" aria-hidden />1930</a></Button> },
    { h: helplineById['1098'], text: t('u18.1098'), action: <Button asChild size="sm"><a href="tel:1098"><Phone className="h-4 w-4" aria-hidden />1098</a></Button> },
    { h: helplineById['takeitdown'], text: t('u18.tid'), action: <ExternalLink url="https://takeitdown.ncmec.org/">takeitdown.ncmec.org</ExternalLink> },
  ];
  return (
    <div className="mx-auto max-w-2xl" data-testid="under-18">
      <PageHeader title={t('u18.title')} sub={t('u18.lead')} />
      <Card className="border-danger/40 bg-danger/5">
        <div className="flex gap-3">
          <AlertOctagon className="mt-0.5 h-6 w-6 shrink-0 text-danger" aria-hidden />
          <div>
            <h2 className="text-lg font-bold">{t('u18.dont.title')}</h2>
            <p className="mt-1">{t('u18.dont.body')}</p>
          </div>
        </div>
      </Card>
      <h2 className="mt-10 text-xl font-bold">{t('u18.routes')}</h2>
      <ul className="mt-4 space-y-3">
        {routes.map(({ h, text, action }) => (
          <li key={h.id}>
            <Card className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-bold">{pick(h.name)}</p>
                  <p className="mt-1 text-[15px] text-muted">{text}</p>
                </div>
                <div className="shrink-0">{action}</div>
              </div>
              <SourceLine label={h.sourceLabel} url={h.sourceUrl} date={h.lastVerified} className="mt-3" />
            </Card>
          </li>
        ))}
      </ul>
      <Card className="mt-6 flex gap-3 bg-brand-soft/40">
        <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-brand" aria-hidden />
        <p>{t('u18.adult')}</p>
      </Card>
      <p className="mt-8 text-sm text-muted">{ncrp ? '' : ''}<SafeLink to="/" className="font-semibold text-brand underline">{t('u18.back')}</SafeLink></p>
    </div>
  );
}
