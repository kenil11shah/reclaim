'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useLocale } from './locale';
import { Button, Input } from './ui';
import { deleteEverything, hashPin, useStore } from '@/lib/store';
import { href } from '@/lib/utils';

function Shell({ open, onOpenChange, title, children }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; children: ReactNode }) {
  const { t } = useLocale();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-surface p-6 shadow-xl focus:outline-none">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="text-xl font-bold">{title}</Dialog.Title>
            <Dialog.Close className="-m-2 rounded-lg p-2 hover:bg-brand-soft" aria-label={t('delete.cancel')}>
              <X className="h-5 w-5" aria-hidden />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function DeleteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t, locale } = useLocale();
  return (
    <Shell open={open} onOpenChange={onOpenChange} title={t('delete.title')}>
      <Dialog.Description className="mt-3 text-muted">{t('delete.body')}</Dialog.Description>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Dialog.Close asChild>
          <Button variant="secondary">{t('delete.cancel')}</Button>
        </Dialog.Close>
        <Button
          variant="danger"
          data-testid="confirm-delete"
          onClick={() => {
            deleteEverything();
            onOpenChange(false);
            window.location.replace(href(locale, '/') + '?deleted=1');
          }}
        >
          {t('delete.confirm')}
        </Button>
      </div>
    </Shell>
  );
}

export function PrivacyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useLocale();
  const settings = useStore((s) => s.settings);
  const setNeutral = useStore((s) => s.setNeutralTitle);
  const setPin = useStore((s) => s.setPin);
  const clearPin = useStore((s) => s.clearPin);
  const [pin, setPinValue] = useState('');
  const [msg, setMsg] = useState('');
  return (
    <Shell open={open} onOpenChange={onOpenChange} title={t('privacy.title')}>
      <Dialog.Description className="sr-only">{t('privacy.neutralHelp')}</Dialog.Description>
      <div className="mt-5 space-y-6">
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" className="mt-1 h-5 w-5 accent-[rgb(var(--brand))]" checked={settings.neutralTitle} onChange={(e) => setNeutral(e.target.checked)} />
          <span>
            <span className="block font-semibold">{t('privacy.neutral')}</span>
            <span className="block text-sm text-muted">{t('privacy.neutralHelp')}</span>
          </span>
        </label>
        <div>
          <p className="font-semibold">{t('privacy.pin')}</p>
          <p className="text-sm text-muted">{t('privacy.pinHelp')}</p>
          {settings.pinHash ? (
            <Button variant="secondary" className="mt-3" onClick={() => { clearPin(); setMsg(t('privacy.pinRemoved')); }}>
              {t('privacy.pinRemove')}
            </Button>
          ) : (
            <form
              className="mt-3 flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!/^\d{4}$/.test(pin)) return setMsg(t('privacy.pinInvalid'));
                const salt = Array.from(crypto.getRandomValues(new Uint8Array(8))).map((b) => b.toString(16).padStart(2, '0')).join('');
                setPin(await hashPin(pin, salt), salt);
                try { sessionStorage.setItem('reclaim:unlocked', '1'); } catch { /* ignore */ }
                setPinValue('');
                setMsg(t('privacy.pinSaved'));
              }}
            >
              <Input inputMode="numeric" autoComplete="off" maxLength={4} placeholder={t('privacy.pinPlaceholder')} aria-label={t('privacy.pin')} value={pin} onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))} className="w-32" />
              <Button type="submit">{t('privacy.pinSet')}</Button>
            </form>
          )}
          {msg && <p role="status" className="mt-2 text-sm text-ok">{msg}</p>}
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Dialog.Close asChild>
          <Button>{t('privacy.close')}</Button>
        </Dialog.Close>
      </div>
    </Shell>
  );
}
