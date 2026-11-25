import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Locale } from './plan';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Locale-aware internal path. Keeps query strings and adds the trailing slash used by the static export. */
export function href(locale: Locale, path: string): string {
  const [p, q] = path.split('?');
  let clean = p.startsWith('/') ? p : `/${p}`;
  if (!clean.endsWith('/')) clean += '/';
  const full = locale === 'hi' ? (clean === '/' ? '/hi/' : `/hi${clean}`) : clean;
  return q ? `${full}?${q}` : full;
}

/** Strip the /hi prefix to get the locale-neutral path. */
export function neutralPath(pathname: string): string {
  const p = pathname.replace(/^\/hi(?=\/|$)/, '') || '/';
  return p.endsWith('/') ? p : `${p}/`;
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}
