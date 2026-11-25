import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

export const IST = 'Asia/Kolkata';

/** Current time as an ISO string with the +05:30 offset. */
export function nowIST(now: Date = new Date()): string {
  return formatInTimeZone(now, IST, "yyyy-MM-dd'T'HH:mm:ssxxx");
}
export function toIST(d: Date): string {
  return formatInTimeZone(d, IST, "yyyy-MM-dd'T'HH:mm:ssxxx");
}
/** "2026-11-18T10:40" from a datetime-local input, read as IST. */
export function fromLocalInput(v: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  return toIST(fromZonedTime(v, IST));
}
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  return formatInTimeZone(new Date(iso), IST, "yyyy-MM-dd'T'HH:mm");
}
export function formatIST(iso: string | null, locale: 'en' | 'hi' = 'en', withTime = true): string {
  if (!iso) return '';
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = { timeZone: IST, day: 'numeric', month: 'short', year: 'numeric' };
  if (withTime) Object.assign(opts, { hour: 'numeric', minute: '2-digit', hour12: true });
  return new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', opts).format(d) + (withTime ? ' IST' : '');
}
export function formatDay(ymd: string, locale: 'en' | 'hi' = 'en'): string {
  return formatIST(`${ymd}T12:00:00+05:30`, locale, false);
}
