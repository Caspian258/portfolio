# beautiful engineering

Portafolio personal de Mariano Villagómez: mecatrónica, ciberseguridad, OT, IA, ML y LLMs.

Sitio estático con [Astro](https://astro.build) y TypeScript. Las animaciones usan GSAP
(con ScrollTrigger) y Lenis para el scroll suave. Bilingüe: español en `/` e inglés en `/en/`.

## Comandos

| Comando           | Qué hace                                             |
| ----------------- | ---------------------------------------------------- |
| `npm install`     | Instala las dependencias (Node 22)                   |
| `npm run dev`     | Servidor local en `http://localhost:4321`            |
| `npm run check`   | Revisa tipos y valida el contenido contra el esquema |
| `npm run build`   | Genera el sitio en `dist/` y el archivo `_headers`   |
| `npm run preview` | Sirve `dist/` para revisarlo                         |

## Estructura

```
src/
  styles/tokens.css        Design tokens: color, tipografía, espacio, movimiento
  styles/global.css        Base y utilidades
  content.config.ts        Esquema de los proyectos (zod)
  content/proyectos/       Un archivo Markdown por proyecto
  data/site.ts             Textos de sobre mí, ruta, certificaciones, habilidades y fotos
  i18n/ui.ts               Textos de la interfaz en español e inglés
  components/              Secciones de la página
  scripts/main.ts          Movimiento de la portada
  scripts/ui.ts            Menú, desplegables, diálogos y fotos
scripts/headers.mjs        Genera dist/_headers con la política de seguridad
public/fotos/              Fotos tipo pasaporte (ver LEEME.md)
```

## Agregar un proyecto

1. Crea `src/content/proyectos/pXX-nombre.md` copiando la estructura de `p01-analizador-logs.md`.
2. Llena los campos en español (`es`) y en inglés (`en`). Usa solo cifras reales.
3. Deja `aprobado: false` mientras el texto está en revisión. Los borradores se ven en
   `npm run dev`, pero no se publican.
4. Cuando el texto esté aprobado, cambia a `aprobado: true`.

`npm run check` falla si falta un campo o si un valor no cumple el esquema.

## Movimiento y accesibilidad

- Con `prefers-reduced-motion: reduce` no hay pantalla de carga, scroll suave ni animaciones;
  todo el contenido queda visible.
- El cursor que empuja letras solo se activa con mouse; en pantallas táctiles, un toque
  hace una ola sobre el título.
- Los detalles se abren con elementos `<details>` y `<dialog>` nativos, así que funcionan
  con teclado.

## Despliegue

Cloudflare Pages, preset Astro: comando `npm run build`, carpeta de salida `dist`.

Variables de entorno opcionales:

- `SITE_URL`: dominio final (por ejemplo `https://tu-dominio.com`), para las URL canónicas.
- `PUBLIC_SHOW_DRAFTS=true`: muestra los borradores. Úsala solo en las vistas previas.

## CI

GitHub Actions corre en cada pull request: build, `astro check`, enlaces rotos (lychee),
Lighthouse con mínimo 90 en rendimiento y accesibilidad, y búsqueda de secretos (gitleaks).
