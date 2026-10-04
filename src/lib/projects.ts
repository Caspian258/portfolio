import { getCollection } from 'astro:content';

/**
 * Los borradores (aprobado: false) solo se muestran en desarrollo
 * o cuando PUBLIC_SHOW_DRAFTS=true (por ejemplo, en vistas previas).
 */
export const showDrafts = import.meta.env.DEV || import.meta.env.PUBLIC_SHOW_DRAFTS === 'true';

export async function getProjects() {
  const all = await getCollection('proyectos', (p) => showDrafts || p.data.aprobado);
  return all.sort((a, b) => a.data.orden - b.data.orden);
}
