import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { photos as configured } from '../data/site';
import type { Lang } from '../i18n/ui';

export interface Photo {
  src: string;
  alt: Record<Lang, string> | null;
}

const IMAGE = /\.(jpe?g|png|webp|avif)$/i;

/**
 * Passport photos, resolved at build time.
 * Explicit `src` entries in src/data/site.ts win; otherwise every image in
 * public/fotos/ is used, sorted by file name. The carousel counter total is
 * always the real number of photos found here.
 */
export function getPhotos(): Photo[] {
  const explicit = configured.filter((p): p is { src: string; alt: Record<Lang, string> } => Boolean(p.src));
  if (explicit.length) return explicit.map((p) => ({ src: p.src, alt: p.alt }));

  let files: string[] = [];
  try {
    files = readdirSync(join(process.cwd(), 'public', 'fotos'))
      .filter((f) => IMAGE.test(f))
      .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  } catch {
    files = [];
  }
  return files.map((f, i) => ({ src: `/fotos/${f}`, alt: configured[i]?.alt ?? null }));
}
