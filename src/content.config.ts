import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Texto de un proyecto en un idioma. */
const texto = z.object({
  titulo: z.string().min(3).max(70),
  /** Una o dos frases; se muestra en la tarjeta. */
  resumen: z.string().min(20).max(180),
  problema: z.string().min(20),
  /** Pasos de cómo funciona, en orden. */
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
    /** Código de la ruta: P01, P02… */
    codigo: z.string().regex(/^P\d{2}$/),
    orden: z.number().int().positive(),
    /**
     * Solo se publica en producción cuando es true.
     * Un proyecto pasa a true cuando el autor aprueba el texto.
     */
    aprobado: z.boolean().default(false),
    fecha: z.coerce.date(),
    areas: z.array(areas).min(1),
    stack: z.array(z.string()).min(1),
    repo: z.url(),
    demo: z.url().optional(),
    /** Cifras reales, máximo 4. Sin cifras inventadas. */
    metricas: z
      .array(z.object({ valor: z.string(), es: z.string(), en: z.string() }))
      .max(4)
      .default([]),
    es: texto,
    en: texto,
  }),
});

export const collections = { proyectos };
