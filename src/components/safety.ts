'use client';
export const NEUTRAL_SITE = 'https://www.google.com/search?q=weather';

/** Quick exit: blank the page and replace this history entry with a neutral site. */
export function leaveNow() {
  try {
    for (const k of Object.keys(sessionStorage)) if (k.startsWith('reclaim')) sessionStorage.removeItem(k);
  } catch { /* ignore */ }
  try {
    document.title = 'Weather';
    document.body.style.visibility = 'hidden';
  } catch { /* ignore */ }
  window.location.replace(NEUTRAL_SITE);
}
