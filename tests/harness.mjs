// Test helpers: a tiny static server for the repo and a headless Chromium page on it.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

function serve() {
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    try {
      const body = await readFile(join(ROOT, path));
      res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  return new Promise((ok) => server.listen(0, () => ok(server)));
}

// Opens `page` (e.g. dev.html) and passes a Playwright page to `fn`. Console errors and
// page errors are collected on page.errors. `file:index.html` opens the file straight from
// disk instead of over HTTP, the way double-clicking it would.
export async function withPage(file, fn, viewport = { width: 1366, height: 768 }) {
  const { chromium } = await import('playwright');
  const server = await serve();
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  try {
    const page = await browser.newPage({ viewport });
    page.errors = [];
    page.on('console', (m) => m.type() === 'error' && page.errors.push(m.text()));
    page.on('pageerror', (e) => page.errors.push(e.message));
    const url = file.startsWith('file:') ? `file://${join(ROOT, file.slice(5))}` : `http://localhost:${server.address().port}/${file}`;
    await page.goto(url);
    await page.waitForFunction(() => window.accessDenied && !document.getElementById('boot'), null, { timeout: 15000 });
    await fn(page);
  } finally {
    await browser.close();
    server.close();
  }
}

export function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
