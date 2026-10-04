// Genera dist/_headers (Cloudflare Pages) con una CSP estricta.
// Calcula el hash de cada <script> en línea que Astro dejó en el HTML,
// así no hace falta 'unsafe-inline' para scripts.
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(p);
    else if (entry.name.endsWith('.html')) yield p;
  }
}

const hashes = new Set();
for await (const file of htmlFiles(dist)) {
  const html = await readFile(file, 'utf8');
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    if (!m[1].trim()) continue;
    hashes.add(`'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
  }
}

const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].join(' ')}`.trim(),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const headers = `/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()
  Cross-Origin-Opener-Policy: same-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains

/_astro/*
  Cache-Control: public, max-age=31536000, immutable
`;

await writeFile(join(dist, '_headers'), headers);
console.log(`_headers escrito (${hashes.size} script(s) en línea con hash)`);
