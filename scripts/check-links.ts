/* Fetches every external URL in the content files and fails on a dead link. Runs weekly in GitHub Actions. */
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(process.cwd(), 'content');
const files: string[] = [];
(function walk(d: string) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(json|md|ts)$/.test(f)) files.push(p);
  }
})(root);

const urls = new Set<string>();
for (const f of files) for (const m of fs.readFileSync(f, 'utf8').matchAll(/https?:\/\/[^\s"')\]<>]+/g)) urls.add(m[0].replace(/[.,]$/, ''));
// Placeholders and demo data are not real links.
const skip = /example\.com|t\.me\/demo_/;

async function check(u: string): Promise<[string, number | string]> {
  for (const method of ['HEAD', 'GET']) {
    try {
      const r = await fetch(u, { method, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (link check for Reclaim)' }, signal: AbortSignal.timeout(20000) });
      if (r.status < 400 || r.status === 403 || r.status === 429) return [u, r.status];
      if (method === 'GET') return [u, r.status];
    } catch (e) {
      if (method === 'GET') return [u, (e as Error).message];
    }
  }
  return [u, 'unknown'];
}

const list = [...urls].filter((u) => !skip.test(u));
const results = await Promise.all(list.map(check));
const dead = results.filter(([, s]) => typeof s !== 'number' || s >= 400 && s !== 403 && s !== 429);
for (const [u, s] of results) console.log(`${dead.some((d) => d[0] === u) ? 'DEAD' : 'ok  '} ${s} ${u}`);
console.log(`\n${list.length} links checked, ${dead.length} dead`);
process.exit(dead.length ? 1 : 0);
