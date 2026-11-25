// Turns a preview build (NEXT_PUBLIC_PREVIEW=1 npm run build) into a folder that works when
// hosted under an unknown sub-path: the asset folder is renamed and every path becomes relative.
// Usage: node scripts/make-preview.mjs out preview
import fs from 'node:fs';
import path from 'node:path';

const [src = 'out', dest = 'preview'] = process.argv.slice(2);
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
fs.renameSync(path.join(dest, '_next'), path.join(dest, 'nx'));

const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
})(dest);

const RUNTIME_ROOT = `(function(){var s=document.querySelector('script[src*="static/chunks/webpack-"]');return s?s.src.replace(/static\\/chunks\\/webpack-[^/]+$/,''):"nx/"})()`;

for (const file of files) {
  const rel = path.relative(dest, file);
  if (rel.endsWith('.html')) {
    const depth = rel.split(path.sep).length - 1;
    const up = depth ? '../'.repeat(depth) : './';
    let html = fs.readFileSync(file, 'utf8');
    html = html.replaceAll('/_next/', `${up}nx/`);
    html = html.replace(/(href|src)="\/(?!\/)([^"]*)"/g, (_, attr, target) => {
      const [p, q] = target.split('?');
      let out = p;
      if (!/\.[a-z0-9]+$/i.test(p)) out = (p === '' || p.endsWith('/') ? p : `${p}/`) + 'index.html';
      return `${attr}="${up}${out}${q ? `?${q}` : ''}"`;
    });
    fs.writeFileSync(file, html);
  } else if (rel.endsWith('.css')) {
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replaceAll('/_next/static/', '../'));
  } else if (/webpack-[^/]+\.js$/.test(rel)) {
    const js = fs.readFileSync(file, 'utf8').replace('r.p="/_next/"', `r.p=${RUNTIME_ROOT}`);
    fs.writeFileSync(file, js);
  }
}
const left = files.filter((f) => f.endsWith('.html') && fs.readFileSync(f, 'utf8').includes('/_next/'));
console.log(`preview ready in ${dest}/ (${files.length} files, ${left.length} pages still pointing at /_next/)`);
