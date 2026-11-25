'use client';
import { useState } from 'react';
import { Check, Copy, ExternalLink as ExtIcon, Mail, Send } from 'lucide-react';
import { useLocale } from '@/components/locale';
import { Button, Card } from '@/components/ui';
import { ExternalLink } from '@/components/links';
import { copyText } from '@/lib/pdf';
import sendStepsRaw from '@content/send-steps.json';
import { splitSubject, type TemplateId } from '@content/templates';
import type { Platform, SendSteps } from '@/lib/schemas';

// Loaded only on the drafter page, so other pages stay light.
const sendSteps = sendStepsRaw as unknown as SendSteps;

/** A copy button that shows a tick for two seconds after copying. */
export function CopyButton({ text, label, testId, variant = 'secondary', size, onDone }: {
  text: string; label: string; testId: string; variant?: 'primary' | 'secondary' | 'ghost'; size?: 'sm'; onDone?: (ok: boolean) => void;
}) {
  const { t } = useLocale();
  const [done, setDone] = useState(false);
  return (
    <Button type="button" variant={variant} size={size} data-testid={testId} disabled={!text.trim()}
      onClick={async () => {
        const ok = await copyText(text);
        onDone?.(ok);
        if (ok) { setDone(true); setTimeout(() => setDone(false), 2000); }
      }}>
      {done ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      {done ? t('common.copied') : label}
    </Button>
  );
}

function Contact({ plat, text, onDone }: { plat: Platform; text: string; onDone: (ok: boolean) => void }) {
  const { t, pick } = useLocale();
  const go = plat.grievanceOfficer;
  const { subject, body } = splitSubject(text);
  if (go.route === 'VERIFY') {
    return (
      <div className="rounded-xl border border-amber/50 bg-amber/10 p-4 text-sm" data-testid="send-contact">
        <p>{t('draft.send.verify', { platform: plat.name })}</p>
        {plat.webForm.url && (
          <p className="mt-2"><ExternalLink url={plat.webForm.url}>{t('draft.send.ownLink', { platform: plat.name })}</ExternalLink></p>
        )}
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-brand/40 bg-brand-soft/40 p-4" data-testid="send-contact">
      <p className="font-semibold">{t('draft.send.to', { platform: plat.name })}</p>
      {go.route === 'email' ? (
        <>
          <p className="mt-2 text-sm text-muted">{t('draft.send.email')}</p>
          <p className="break-all font-mono text-[15px] font-semibold" data-testid="send-email">{go.value}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton text={go.value} label={t('draft.send.copyEmail')} testId="copy-email" size="sm" onDone={onDone} />
            {subject && <CopyButton text={subject} label={t('draft.send.copySubject')} testId="copy-subject" size="sm" onDone={onDone} />}
            <CopyButton text={body} label={t('draft.send.copyBody')} testId="copy-body" size="sm" onDone={onDone} />
            <Button asChild variant="ghost" size="sm">
              <a href={`mailto:${go.value}?subject=${encodeURIComponent(subject)}`} data-testid="open-email"><Mail className="h-4 w-4" aria-hidden />{t('draft.send.openEmail')}</a>
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted">{t('draft.send.form')}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <a href={go.value} target="_blank" rel="noopener noreferrer" data-testid="open-form"><ExtIcon className="h-4 w-4" aria-hidden />{t('draft.send.openForm')}</a>
            </Button>
            <CopyButton text={text} label={t('draft.copy')} testId="copy-body" size="sm" onDone={onDone} />
          </div>
        </>
      )}
      {go.note && <p className="mt-3 text-sm">{pick(go.note)}</p>}
      <p className="mt-3 text-xs text-muted">
        <ExternalLink url={go.source}>{t('draft.send.contactSource')}</ExternalLink> · {t('draft.send.official', { date: plat.lastVerified })}
      </p>
    </div>
  );
}

export function SendGuide({ tpl, plat, text, onDone }: { tpl: TemplateId; plat?: Platform; text: string; onDone: (ok: boolean) => void }) {
  const { t, pick } = useLocale();
  const guide = sendSteps[tpl];
  const route = plat?.grievanceOfficer.route;
  const showContact = tpl === 'grievance' || tpl === 'followup';
  const steps = guide.steps.filter((s) => !s.route || (tpl === 'grievance' && s.route === route));
  return (
    <Card className="space-y-4" data-testid="send-guide">
      <h2 className="flex items-center gap-2 text-lg font-bold"><Send className="h-5 w-5 text-brand" aria-hidden />{t('draft.send.title')}</h2>
      {showContact && (plat ? <Contact plat={plat} text={text} onDone={onDone} /> : <p className="text-sm text-muted">{t('draft.send.pickPlatform')}</p>)}
      <ol className="space-y-2.5">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-[15px]">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-on-brand" aria-hidden>{i + 1}</span>
            <span className="min-w-0">{pick(s)}</span>
          </li>
        ))}
      </ol>
      <div className="border-t border-line pt-3 text-xs text-muted">
        <span className="font-semibold">{t('common.sources')}:</span>{' '}
        {guide.sources.map((s, i) => (
          <span key={s.url}>{i > 0 && ' · '}<ExternalLink url={s.url}>{s.label}</ExternalLink></span>
        ))}
      </div>
    </Card>
  );
}
