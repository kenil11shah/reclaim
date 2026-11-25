/** Deterministic synthetic reports for the Insights page. Same seed, same numbers, every load. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SyntheticReport {
  id: string;
  platform: string;
  contentType: 'real' | 'fake' | 'threat' | 'filmed';
  hoursToRemoval: number | null; // null = never removed
}

// Assumed mixes for illustration only. These are not measurements.
const PLATFORM_WEIGHTS: [string, number, number][] = [
  // id, share of reports, median hours to removal (log-normal centre)
  ['instagram', 0.22, 6],
  ['x', 0.16, 14],
  ['telegram', 0.18, 40],
  ['whatsapp', 0.12, 30],
  ['facebook', 0.1, 7],
  ['youtube', 0.07, 9],
  ['reddit', 0.07, 5],
  ['google-search', 0.08, 20],
];
const TYPES: [SyntheticReport['contentType'], number][] = [
  ['fake', 0.45], ['real', 0.3], ['threat', 0.17], ['filmed', 0.08],
];

function pick<T>(r: () => number, items: [T, number, ...unknown[]][]): [T, number, ...unknown[]] {
  let x = r();
  for (const it of items) { if ((x -= it[1]) <= 0) return it; }
  return items[items.length - 1];
}

export function generateSynthetic(n = 200, seed = 20261125): SyntheticReport[] {
  const r = mulberry32(seed);
  const out: SyntheticReport[] = [];
  for (let i = 0; i < n; i++) {
    const [platform, , median] = pick(r, PLATFORM_WEIGHTS) as [string, number, number];
    const [contentType] = pick(r, TYPES) as [SyntheticReport['contentType'], number];
    const neverRemoved = r() < 0.12;
    // Box-Muller normal, then log-normal around the median.
    const z = Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
    const hours = Math.max(0.3, Math.round(median * Math.exp(0.9 * z) * 10) / 10);
    out.push({ id: `SYN-${String(i + 1).padStart(3, '0')}`, platform, contentType, hoursToRemoval: neverRemoved ? null : hours });
  }
  return out;
}

export function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function insights(reports: SyntheticReport[]) {
  const byPlatform = PLATFORM_WEIGHTS.map(([id]) => {
    const rs = reports.filter((r) => r.platform === id);
    const removed = rs.filter((r) => r.hoursToRemoval !== null).map((r) => r.hoursToRemoval as number);
    const missed = rs.filter((r) => r.hoursToRemoval === null || (r.hoursToRemoval as number) > 2).length;
    return {
      id,
      count: rs.length,
      medianHours: Math.round(median(removed) * 10) / 10,
      missedShare: rs.length ? Math.round((missed / rs.length) * 100) : 0,
    };
  });
  const types = TYPES.map(([t]) => ({ type: t, count: reports.filter((r) => r.contentType === t).length }));
  const allMissed = reports.filter((r) => r.hoursToRemoval === null || r.hoursToRemoval > 2).length;
  return { byPlatform, types, total: reports.length, missedShare: Math.round((allMissed / reports.length) * 100) };
}
