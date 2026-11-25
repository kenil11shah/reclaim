'use client';
import Link from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { ExternalLink as ExtIcon } from 'lucide-react';
import { href, PREVIEW } from '@/lib/utils';
import { useLocale } from './locale';
import { cn } from '@/lib/utils';

/**
 * Internal link that replaces the history entry instead of adding one.
 * The whole app then occupies a single history entry, so after "Leave now"
 * the Back button cannot return to Reclaim.
 */
export function SafeLink({ to, className, children, ...rest }: { to: string; className?: string; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const { locale } = useLocale();
  if (PREVIEW) {
    return (
      <a href={href(locale, to)} className={className} {...rest} onClick={(e) => { e.preventDefault(); window.location.replace(href(locale, to)); }}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href(locale, to)} replace scroll className={className} {...rest}>
      {children}
    </Link>
  );
}

export function ExternalLink({ url, children, className }: { url: string; children: ReactNode; className?: string }) {
  const { t } = useLocale();
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={cn('inline-flex items-center gap-1 font-medium text-brand underline underline-offset-4 decoration-brand/30 hover:decoration-brand break-words', className)}>
      {children}
      <ExtIcon aria-hidden className="h-3.5 w-3.5 shrink-0" />
      <span className="sr-only">({t('common.external')})</span>
    </a>
  );
}

export function SourceLine({ label, url, date, className }: { label: string; url: string; date?: string | null; className?: string }) {
  const { t, locale } = useLocale();
  const d = date ? new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(`${date}T12:00:00+05:30`)) : null;
  return (
    <p className={cn('text-[13px] text-muted', className)}>
      {t('common.source')}: <ExternalLink url={url} className="font-normal">{label}</ExternalLink>
      {d && <> · {t('common.lastVerified')}: {d}</>}
    </p>
  );
}
