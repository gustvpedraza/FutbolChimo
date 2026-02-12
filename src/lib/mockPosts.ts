/**
 * Noticias de ejemplo (lorem ipsum) para previsualizar el diseño sin WordPress.
 * Se usan cuando la API no devuelve posts.
 */

import type { WpPostEmbedded } from '../types/wordpress';

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const TITLES = [
  'La Vinotinto se prepara para las Eliminatorias con miras al Mundial',
  'Rondón marca de cabeza y acerca a Venezuela al repechaje',
  'Yangel Herrera: el motor del mediocampo venezolano en Europa',
  'Cosecha de talentos: los juveniles que apuntan a la Sub-20',
  'Tomás Rincón cumple 100 partidos con la vinotinto',
  'Resumen: Venezuela 2-1 Ecuador en amistoso internacional',
  'Savarino y Machís, claves en el ataque para el próximo ciclo',
  'Wilker Ángel renueva con su club en la Superliga turca',
  'Análisis táctico: cómo juega Venezuela bajo el nuevo DT',
  'Futve: Caracas y Metropolitanos lideran la tabla de posiciones',
  'Los Nuestros: el resumen de la semana en las ligas europeas',
];

const CATEGORIES = [
  { name: 'Selecciones', slug: 'selecciones' },
  { name: 'Los Nuestros', slug: 'los-nuestros' },
  { name: 'Futve', slug: 'futve' },
  { name: 'Eliminatorias', slug: 'eliminatorias' },
  { name: 'Cosecha', slug: 'cosecha' },
];

/** Genera un post mock con imagen placeholder (picsum.photos) */
function createMockPost(
  index: number,
  options?: { isFeatured?: boolean }
): WpPostEmbedded {
  const title = TITLES[index % TITLES.length];
  const slug = `noticia-ejemplo-${index + 1}`;
  const category = CATEGORIES[index % CATEGORIES.length];
  const date = new Date();
  date.setDate(date.getDate() - index);
  const dateStr = date.toISOString();

  return {
    id: index + 1,
    date: dateStr,
    date_gmt: dateStr,
    modified: dateStr,
    slug,
    status: 'publish',
    type: 'post',
    link: `/${slug}`,
    title: { rendered: title },
    content: {
      rendered: `<p>${LOREM}</p><p>${LOREM}</p>`,
      protected: false,
    },
    excerpt: {
      rendered: `<p>${LOREM} Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>`,
      protected: false,
    },
    author: 1,
    featured_media: index + 1,
    comment_status: 'open',
    ping_status: 'open',
    sticky: false,
    template: '',
    format: 'standard',
    meta: {},
    categories: [category.slug.length],
    tags: [],
    _links: {},
    _embedded: {
      'wp:featuredmedia': [
        {
          source_url: `https://picsum.photos/seed/futbolchimo${index}/800/450`,
          alt_text: title,
          media_details: { width: 800, height: 450, sizes: {} },
        },
      ],
      'wp:term': [
        [{ id: 1, name: category.name, slug: category.slug, count: 1 }],
      ],
    },
  };
}

/** Lista de 12 posts mock para el home */
export const MOCK_POSTS: WpPostEmbedded[] = Array.from({ length: 12 }, (_, i) =>
  createMockPost(i)
);

/** Primer post como "destacado" (tag destacado) para el hero */
export const MOCK_FEATURED = createMockPost(0, { isFeatured: true });
