import en from '@content/i18n/en.json';
import hi from '@content/i18n/hi.json';
import type { Locale } from './plan';

export type Dict = typeof en;
export type Key = keyof Dict;
export const dictionaries: Record<Locale, Dict> = { en, hi: hi as Dict };

export function format(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
export function translate(locale: Locale, key: Key, vars?: Record<string, string | number>): string {
  return format(dictionaries[locale][key] ?? dictionaries.en[key] ?? key, vars);
}
