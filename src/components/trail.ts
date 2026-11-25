'use client';
/** Pages visited in this tab, kept in sessionStorage so the in-app Back button works without browser history. */
export const TRAIL = 'reclaim:trail';
export const TRAIL_BACK = 'reclaim:trail-back';

export function readTrail(): string[] {
  try {
    const v = JSON.parse(sessionStorage.getItem(TRAIL) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.startsWith('/')) : [];
  } catch {
    return [];
  }
}

export function writeTrail(t: string[]) {
  try { sessionStorage.setItem(TRAIL, JSON.stringify(t)); } catch { /* ignore */ }
}

/** "/tracker/x/" -> "/tracker/", "/draft/" -> "/". Used when there is no earlier page in the trail. */
export function parentPath(path: string): string {
  const parts = path.split('?')[0].split('/').filter(Boolean);
  parts.pop();
  return parts.length ? `/${parts.join('/')}/` : '/';
}
