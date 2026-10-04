import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** A project's copy in one language. */
const texto = z.object({
  titulo: z.string().min(3).max(70),
  /** One or two sentences; shown on the card. */
  resumen: z.string().min(20).max(180),
  problema: z.string().min(20),
  /** How it works, step by step. */
  solucion: z.array(z.string().min(5)).min(1),
  resultados: z.string().min(10),
  limitaciones: z.array(z.string().min(5)).default([]),
  aprendizajes: z.array(z.string().min(5)).default([]),
});

const areas = z.enum([
  'ciberseguridad',
  'mecatronica',
  'ot',
  'ia',
  'ml',
  'llm',
  'programacion',
]);

const proyectos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/proyectos' }),
  schema: z.object({
    /** Learning path code: P01, P02… */
    codigo: z.string().regex(/^P\d{2}$/),
    orden: z.number().int().positive(),
    /**
     * Only published in production when true.
     * A project becomes true once the author approves its copy.
     */
    aprobado: z.boolean().default(false),
    fecha: z.coerce.date(),
    areas: z.array(areas).min(1),
    stack: z.array(z.string()).min(1),
    repo: z.url(),
    demo: z.url().optional(),
    /** Real figures, 4 at most. No invented numbers. */
    metricas: z
      .array(z.object({ valor: z.string(), es: z.string(), en: z.string() }))
      .max(4)
      .default([]),
    es: texto,
    en: texto,
  }),
});

export const collections = { proyectos };
