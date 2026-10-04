import { getCollection } from 'astro:content';

/**
 * Drafts (aprobado: false) are only shown in development
 * or when PUBLIC_SHOW_DRAFTS=true (for example, in previews).
 */
export const showDrafts = import.meta.env.DEV || import.meta.env.PUBLIC_SHOW_DRAFTS === 'true';

export async function getProjects() {
  const all = await getCollection('proyectos', (p) => showDrafts || p.data.aprobado);
  return all.sort((a, b) => a.data.orden - b.data.orden);
}
