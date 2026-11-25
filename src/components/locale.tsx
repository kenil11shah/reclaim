'use client';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Locale } from '@/lib/plan';
import { format, type Dict, type Key } from '@/lib/i18n';
import type { Bi } from '@/lib/schemas';

interface Ctx { locale: Locale; t: (k: Key, vars?: Record<string, string | number>) => string; pick: (b: Bi) => string }
const LocaleCtx = createContext<Ctx | null>(null);

export function LocaleProvider({ locale, dict, children }: { locale: Locale; dict: Dict; children: ReactNode }) {
  const value = useMemo<Ctx>(
    () => ({ locale, t: (k, vars) => format(dict[k] ?? k, vars), pick: (b) => b[locale] ?? b.en }),
    [locale, dict],
  );
  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}
export function useLocale(): Ctx {
  const c = useContext(LocaleCtx);
  if (!c) throw new Error('useLocale outside LocaleProvider');
  return c;
}
