import type { WpPostEmbedded } from '../types/wordpress';

/** Obtiene la URL de la imagen destacada de un post con _embed */
export function getFeaturedImageUrl(post: WpPostEmbedded): string | null {
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  return media?.source_url ?? null;
}

/** Formatea fecha de WordPress (YYYY-MM-DDTHH:mm:ss) a locale es */
export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/** Strip HTML tags (simple) */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/** Primera categoría del post (desde _embedded) */
export function getFirstCategoryName(post: WpPostEmbedded): string | null {
  const terms = post._embedded?.['wp:term'];
  if (!terms?.[0]?.length) return null;
  const cat = (terms[0] as Array<{ name: string; taxonomy: string }>).find((t) => t.taxonomy === 'category');
  return cat?.name ?? (terms[0][0] as { name: string })?.name ?? null;
}
