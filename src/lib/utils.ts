import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Locale } from './plan';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Preview builds (NEXT_PUBLIC_PREVIEW=1) are hosted under an unknown sub-path, so links are
 * resolved against the site root found from the loaded script, and every navigation is a full page load.
 */
export const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW === '1';
function previewRoot(): string {
  if (typeof document === 'undefined') return '/';
  const s = document.querySelector<HTMLScriptElement>('script[src*="static/chunks/webpack-"]');
  return s ? s.src.replace(/nx\/static\/chunks\/webpack-[^/]+$/, '') : '/';
}

/** Locale-aware internal path. Keeps query strings and adds the trailing slash used by the static export. */
export function href(locale: Locale, path: string): string {
  const [p, q] = path.split('?');
  let clean = p.startsWith('/') ? p : `/${p}`;
  if (!clean.endsWith('/')) clean += '/';
  let full = locale === 'hi' ? (clean === '/' ? '/hi/' : `/hi${clean}`) : clean;
  if (PREVIEW && typeof document !== 'undefined') full = previewRoot() + full.slice(1) + 'index.html';
  return q ? `${full}?${q}` : full;
}

/** Replace the current page (keeps the app to one history entry). */
export function go(router: { replace: (u: string) => void }, url: string) {
  if (PREVIEW) window.location.replace(url);
  else router.replace(url);
}

/** Strip the /hi prefix to get the locale-neutral path. */
export function neutralPath(pathname: string): string {
  let path = pathname;
  if (PREVIEW && typeof document !== 'undefined') {
    const root = new URL(previewRoot()).pathname;
    if (path.startsWith(root)) path = '/' + path.slice(root.length);
    path = path.replace(/index\.html$/, '');
  }
  const p = path.replace(/^\/hi(?=\/|$)/, '') || '/';
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
