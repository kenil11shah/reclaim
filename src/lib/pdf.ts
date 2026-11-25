'use client';
import type { PDFFont } from 'pdf-lib';

// Map common typographic characters to ones the built-in Helvetica can encode.
function sanitize(text: string, font: PDFFont): string {
  const map: Record<string, string> = { '₹': 'Rs ', '→': '->', '←': '<-', '✓': 'v', ' ': ' ' };
  let out = '';
  for (const ch of text) {
    const c = map[ch] ?? ch;
    try { font.encodeText(c); out += c; } catch { out += '?'; }
  }
  return out;
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    if (!para.trim()) { lines.push(''); continue; }
    let line = '';
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) <= width) line = test;
      else {
        if (line) lines.push(line);
        // Break very long words such as URLs.
        let w = word;
        while (font.widthOfTextAtSize(w, size) > width) {
          let i = w.length;
          while (i > 1 && font.widthOfTextAtSize(w.slice(0, i), size) > width) i--;
          lines.push(w.slice(0, i));
          w = w.slice(i);
        }
        line = w;
      }
    }
    lines.push(line);
  }
  return lines;
}

/** English-only PDF built in the browser with pdf-lib. Hindi uses the print dialog instead. */
export async function textToPdf(title: string, body: string): Promise<Uint8Array> {
  // Loaded only when someone asks for a PDF, to keep page loads small.
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  doc.setProducer('Reclaim');
  doc.setCreator('Reclaim');
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const size = 11;
  const lh = 16;
  const margin = 56;
  const W = 595.28;
  const H = 841.89;
  const lines = wrap(sanitize(body, font), font, size, W - margin * 2);
  let page = doc.addPage([W, H]);
  let y = H - margin;
  page.drawText(sanitize(title, bold), { x: margin, y, size: 14, font: bold, color: rgb(0.12, 0.1, 0.18) });
  y -= 28;
  for (const line of lines) {
    if (y < margin) { page = doc.addPage([W, H]); y = H - margin; }
    page.drawText(line, { x: margin, y, size, font, color: rgb(0.1, 0.1, 0.12) });
    y -= lh;
  }
  return doc.save();
}

export function downloadBlob(data: BlobPart, filename: string, type: string) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text: string, fallbackEl?: HTMLTextAreaElement | null): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (!fallbackEl) return false;
    fallbackEl.select();
    try { return document.execCommand('copy'); } catch { return false; }
  }
}
