# beautiful engineering

Personal portfolio of Mariano Villagómez: mechatronics, cybersecurity, OT, AI, ML and LLMs.

Static site built with [Astro](https://astro.build) and TypeScript. Animations use GSAP
(with ScrollTrigger) and Lenis for smooth scrolling. Bilingual: Spanish at `/` and English at `/en/`.

## Commands

| Command           | What it does                                          |
| ----------------- | ----------------------------------------------------- |
| `npm install`     | Installs dependencies (Node 22)                       |
| `npm run dev`     | Local server at `http://localhost:4321`               |
| `npm run check`   | Type-checks and validates content against the schema  |
| `npm run build`   | Generates the site in `dist/` and the `_headers` file |
| `npm run preview` | Serves `dist/` for review                             |

## Structure

```
src/
  styles/tokens.css        Design tokens: color, typography, spacing, motion
  styles/global.css        Base styles and utilities
  content.config.ts        Project schema (zod)
  content/proyectos/       One Markdown file per project
  data/site.ts             About, roadmap, certifications, skills and photos copy
  i18n/ui.ts               UI strings in Spanish and English
  components/              Page sections
  scripts/main.ts          Hero motion
  scripts/ui.ts            Menu, disclosures, dialogs and photos
scripts/headers.mjs        Generates dist/_headers with the security policy
public/fotos/              Passport-style photos (see LEEME.md)
```

## Adding a project

1. Create `src/content/proyectos/pXX-name.md` by copying the structure of `p01-analizador-logs.md`.
2. Fill in the fields in Spanish (`es`) and English (`en`). Use real figures only.
3. Keep `aprobado: false` while the text is under review. Drafts show up in
   `npm run dev` but are not published.
4. Once the text is approved, change it to `aprobado: true`.

`npm run check` fails if a field is missing or a value does not match the schema.

## Motion and accessibility

- With `prefers-reduced-motion: reduce` there is no loading screen, smooth scrolling or
  animation; all content stays visible.
- The letter-pushing cursor effect only activates with a mouse; on touch screens, a tap
  makes a wave across the title.
- Details open with native `<details>` and `<dialog>` elements, so they work with a
  keyboard.

## Deployment

Cloudflare Pages, Astro preset: build command `npm run build`, output directory `dist`.

Optional environment variables:

- `SITE_URL`: final domain (for example `https://your-domain.com`), used for canonical URLs.
- `PUBLIC_SHOW_DRAFTS=true`: shows drafts. Use it only on previews.

## CI

GitHub Actions runs on every pull request: build, `astro check`, broken links (lychee),
Lighthouse with a minimum score of 90 for performance and accessibility, and secret
scanning (gitleaks).
