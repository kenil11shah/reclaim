'use client';
import { useLayoutEffect, useState, type ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { hashPin, STORAGE_KEY } from '@/lib/store';
import { useLocale } from './locale';
import { Button, Card, Input } from './ui';

function readPin(): { hash: string; salt: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const s = raw ? JSON.parse(raw)?.state?.settings : null;
    return s?.pinHash ? { hash: s.pinHash, salt: s.pinSalt ?? '' } : null;
  } catch {
    return null;
  }
}

/**
 * Hides case data behind the optional 4-digit PIN. It asks each time the page opens.
 * The check runs in a layout effect, before the first paint and before the store
 * loads saved data, so private details never flash on screen.
 */
export function PinGate({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  const [pinInfo, setPinInfo] = useState<{ hash: string; salt: string } | null>(null);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  // Asks every time a protected page is opened. Unlocking lasts only while you stay on this page.
  useLayoutEffect(() => { setPinInfo(readPin()); }, []);
  if (!pinInfo) return <>{children}</>;
  return (
    <Card className="mx-auto max-w-sm text-center">
      <Lock className="mx-auto h-8 w-8 text-brand" aria-hidden />
      <h2 className="mt-3 text-xl font-bold">{t('lock.title')}</h2>
      <p className="mt-2 text-muted">{t('lock.body')}</p>
      <form
        className="mt-5 flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if ((await hashPin(pin, pinInfo.salt)) === pinInfo.hash) {
            setPinInfo(null);
          } else {
            setErr(t('lock.wrong'));
            setPin('');
          }
        }}
      >
        <Input inputMode="numeric" autoComplete="off" maxLength={4} aria-label={t('privacy.pinPlaceholder')} className="text-center text-2xl tracking-[0.5em]" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
        <Button type="submit">{t('lock.unlock')}</Button>
        {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      </form>
      <p className="mt-4 text-xs text-muted">{t('lock.forgot')}</p>
    </Card>
  );
}
