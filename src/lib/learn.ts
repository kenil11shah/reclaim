import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import type { Locale } from './plan';

export interface Article {
  slug: string;
  order: number;
  title: string;
  summary: string[];
  html: string;
  words: number;
}

const DIR = path.join(process.cwd(), 'content', 'learn');

export function parseArticle(slug: string, raw: string): Article {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`Learn article ${slug} has no front matter`);
  const meta: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"(.*)"$/, '$1');
  }
  const body = m[2].trim();
  const html = (marked.parse(body, { async: false }) as string).replace(/<a href="(https?:[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener noreferrer"');
  return {
    slug,
    order: Number(meta.order),
    title: meta.title,
    summary: [meta.summary1, meta.summary2, meta.summary3].filter(Boolean),
    html,
    words: body.split(/\s+/).length,
  };
}

export function listArticles(locale: Locale): Article[] {
  const dir = path.join(DIR, locale);
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => parseArticle(f.replace(/\.md$/, ''), fs.readFileSync(path.join(dir, f), 'utf8')))
    .sort((a, b) => a.order - b.order);
}

export function getArticle(locale: Locale, slug: string): Article {
  return parseArticle(slug, fs.readFileSync(path.join(DIR, locale, `${slug}.md`), 'utf8'));
}
export function articleSlugs(): string[] {
  return listArticles('en').map((a) => a.slug);
}
