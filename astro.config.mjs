// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // SITE_URL (custom) or CF_PAGES_URL (set by Cloudflare Pages at build time)
  site: process.env.SITE_URL || process.env.CF_PAGES_URL || undefined,
  trailingSlash: 'ignore',
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: { prefixDefaultLocale: false },
  },
  build: {
    inlineStylesheets: 'never',
  },
  vite: {
    build: { assetsInlineLimit: 0 },
  },
});
