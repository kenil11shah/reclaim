// Tiny static server for the exported site. Applies the same security headers as vercel.json,
// so local tests run under the production Content-Security-Policy.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = path.resolve('out');
const port = Number(process.env.PORT || 4321);
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const headers = Object.fromEntries(vercel.headers[0].headers.map((h) => [h.key, h.value.replace('; upgrade-insecure-requests', '')]));
delete headers['Strict-Transport-Security'];
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon' };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let p = path.join(root, decodeURIComponent(url.pathname));
  if (!p.startsWith(root)) { res.writeHead(400); return res.end(); }
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
    if (!url.pathname.endsWith('/')) { res.writeHead(308, { Location: url.pathname + '/' + url.search }); return res.end(); }
    p = path.join(p, 'index.html');
  }
  let status = 200;
  if (!fs.existsSync(p)) { p = path.join(root, '404.html'); status = 404; }
  const type = types[path.extname(p)] || 'application/octet-stream';
  const compress = /text|javascript|json|svg/.test(type) && /br/.test(req.headers['accept-encoding'] || '');
  const cache = url.pathname.startsWith('/_next/static/') ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate';
  res.writeHead(status, { ...headers, 'Content-Type': type, 'Cache-Control': cache, ...(compress ? { 'Content-Encoding': 'br' } : {}) });
  const stream = fs.createReadStream(p);
  // Vercel compresses responses; do the same so local Lighthouse numbers are realistic.
  (compress ? stream.pipe(zlib.createBrotliCompress()) : stream).pipe(res);
}).listen(port, () => console.log(`serving out/ on http://localhost:${port}`));
