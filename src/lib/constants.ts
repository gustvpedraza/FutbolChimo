/** Categorías principales para la ruta dinámica [category] */
export const CATEGORY_SLUGS = ['los-nuestros', 'selecciones', 'futve'] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export const CATEGORY_LABELS: Record<CategorySlug, string> = {
  'los-nuestros': 'Los Nuestros',
  selecciones: 'Selecciones',
  futve: 'Futve',
};

/** Tabla de posiciones Liga FUTVE (estilo futbolve-news-portal) */
export const STANDINGS = [
  { rank: 1, team: 'Puerto Cabello', points: 45, statusColor: 'bg-green-500' },
  { rank: 2, team: 'Táchira', points: 41, statusColor: 'bg-green-500' },
  { rank: 3, team: 'Caracas FC', points: 38, statusColor: 'bg-blue-500' },
  { rank: 4, team: 'Portuguesa', points: 35, statusColor: 'bg-blue-500' },
  { rank: 5, team: 'Carabobo', points: 32, statusColor: 'bg-transparent' },
] as const;
