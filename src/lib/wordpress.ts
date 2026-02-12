/**
 * Cliente para WordPress REST API (Headless)
 * Configura WP_URL en .env (ej: https://futbolchimo.local)
 */

import type {
  WpPost,
  WpPostEmbedded,
  WpCategory,
  WpTag,
  WpProspecto,
  WpJugador,
  WpEquipoFutVE,
} from '../types/wordpress';

/** Equipo dentro de un partido (JSON de datos_partidos_json). */
export interface EquipoPartido {
  nombre: string;
  color?: string;
  iniciales?: string;
}

/** Equipo dentro de una fila de posiciones (JSON de datos_posiciones_json). */
export interface EquipoPosicion {
  nombre: string;
  color?: string;
  iniciales?: string;
}

/** Estructura de cada fila de posiciones en datos_posiciones_json (ACF). */
export interface PosicionLigaFutve {
  posicion: number;
  equipo: EquipoPosicion;
  pj: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
  ultimos_5?: Array<'ganado' | 'perdido' | 'empate' | null>;
  [key: string]: unknown;
}

/** Estructura de cada partido en el JSON de datos_partidos_json (ACF). */
export interface PartidoLigaFutve {
  liga?: string;
  estado?: string;
  local: EquipoPartido;
  visitante: EquipoPartido;
  /** "vs" si aún no se juega, o "X - Y" con el marcador */
  marcador?: string;
  jornada?: string;
  fecha?: string;
  [key: string]: unknown;
}

// URL base de WordPress. Puedes sobreescribirla con PUBLIC_WP_URL en .env
// Ejemplo en local: PUBLIC_WP_URL=http://futbolchimo.local
const WP_URL = import.meta.env.PUBLIC_WP_URL || 'http://futbolchimo.local';
const base = `${WP_URL.replace(/\/$/, '')}/wp-json/wp/v2`;

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') search.set(k, String(v));
  }
  return search.toString();
}

export const wpApi = {
  base,

  async getPosts(params?: { per_page?: number; page?: number; categories?: number; _embed?: boolean }) {
    const q = buildQuery({
      per_page: params?.per_page ?? 10,
      page: params?.page ?? 1,
      categories: params?.categories,
      _embed: params?._embed ? '1' : undefined,
    });
    const res = await fetch(`${base}/posts?${q}`);
    if (!res.ok) throw new Error(`WP API error: ${res.status}`);
    return res.json() as Promise<WpPost[]>;
  },

  async getPostsByTagSlug(tagSlug: string, perPage = 1) {
    const tagsRes = await fetch(`${base}/tags?slug=${encodeURIComponent(tagSlug)}`);
    if (!tagsRes.ok) throw new Error(`WP API error: ${tagsRes.status}`);
    const tags = (await tagsRes.json()) as WpTag[];
    const tagId = tags[0]?.id;
    if (!tagId) return [] as WpPostEmbedded[];
    const q = buildQuery({ tags: tagId, per_page: perPage, _embed: '1' });
    const res = await fetch(`${base}/posts?${q}`);
    if (!res.ok) throw new Error(`WP API error: ${res.status}`);
    return res.json() as Promise<WpPostEmbedded[]>;
  },

  async getPost(slug: string) {
    const res = await fetch(`${base}/posts?slug=${encodeURIComponent(slug)}&_embed=1`);
    if (!res.ok) throw new Error(`WP API error: ${res.status}`);
    const data = (await res.json()) as WpPostEmbedded[];
    return data[0] ?? null;
  },

  async getCategories() {
    const res = await fetch(`${base}/categories`);
    if (!res.ok) throw new Error(`WP API error: ${res.status}`);
    return res.json() as Promise<WpCategory[]>;
  },

  async getCategoryBySlug(slug: string) {
    const res = await fetch(`${base}/categories?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error(`WP API error: ${res.status}`);
    const data = (await res.json()) as WpCategory[];
    return data[0] ?? null;
  },

  async getPostsByCategorySlug(categorySlug: string, params?: { per_page?: number; page?: number }) {
    const cat = await this.getCategoryBySlug(categorySlug);
    if (!cat) return { posts: [] as WpPostEmbedded[], total: 0, totalPages: 0 };
    const perPage = params?.per_page ?? 10;
    const page = params?.page ?? 1;
    const q = buildQuery({ categories: cat.id, per_page: perPage, page, _embed: '1' });
    const res = await fetch(`${base}/posts?${q}`);
    if (!res.ok) throw new Error(`WP API error: ${res.status}`);
    const total = Number(res.headers.get('X-WP-Total')) || 0;
    const totalPages = Number(res.headers.get('X-WP-TotalPages')) || 1;
    const posts = (await res.json()) as WpPostEmbedded[];
    return { posts, total, totalPages };
  },

  /** CPT prospectos (cosecha) */
  async getProspectos(params?: { per_page?: number; page?: number }) {
    const q = buildQuery({ per_page: params?.per_page ?? 12, page: params?.page ?? 1, _embed: '1' });
    const res = await fetch(`${base}/prospectos?${q}`);
    if (!res.ok) throw new Error(`WP API error: ${res.status} (¿CPT prospectos registrado?)`);
    return res.json() as Promise<WpProspecto[]>;
  },

  async getProspecto(slug: string) {
    const res = await fetch(`${base}/prospectos?slug=${encodeURIComponent(slug)}&_embed=1`);
    if (!res.ok) throw new Error(`WP API error: ${res.status}`);
    const data = (await res.json()) as WpProspecto[];
    return data[0] ?? null;
  },

  /** CPT Jugadores (Los Nuestros). API: GET /wp-json/wp/v2/los-nuestros */
  async getJugadores(params?: { per_page?: number; page?: number }) {
    const q = buildQuery({
      per_page: params?.per_page ?? 50,
      page: params?.page ?? 1,
      _embed: '1',
    });
    const res = await fetch(`${base}/los-nuestros?${q}`);
    if (!res.ok) throw new Error(`WP API error: ${res.status} (¿CPT Los nuestros registrado?)`);
    return res.json() as Promise<WpJugador[]>;
  },

  /** CPT EquiposFutVE. API: GET /wp-json/wp/v2/equipos-fut-ve */
  async getEquiposFutVE(params?: { per_page?: number; page?: number; _embed?: boolean }) {
    const q = buildQuery({
      per_page: params?.per_page ?? 50,
      page: params?.page ?? 1,
      _embed: params?._embed ? '1' : undefined,
    });
    const res = await fetch(`${base}/equipos-fut-ve?${q}`);
    if (!res.ok) throw new Error(`WP API error: ${res.status} (¿CPT EquiposFutVE registrado?)`);
    return res.json() as Promise<WpEquipoFutVE[]>;
  },

  /** Página por slug (wp/v2/pages?slug=...). Devuelve ACF y contenido. */
  async getPageBySlug(slug: string) {
    const res = await fetch(`${base}/pages?slug=${encodeURIComponent(slug)}&_fields=id,slug,title,acf,datos_partidos_json,datos_posiciones_json,vinotinto_mayor_datos_partidos_json,vinotinto_mayor_datos_posiciones_json`);
    if (!res.ok) throw new Error(`WP API error: ${res.status}`);
    const data = (await res.json()) as Array<{ id: number; slug: string; title: { rendered: string }; acf?: Record<string, unknown> }>;
    return data[0] ?? null;
  },

  /** Resultados Liga FUTVE: página "resultados-liga-futve" → acf.datos_partidos_json (JSON string o array) */
  async getResultadosLigaFutve(): Promise<PartidoLigaFutve[]> {
    const page = await this.getPageBySlug('resultados-liga-futve') as Record<string, unknown> | null;
    if (!page) return [];
    // El campo puede venir en acf.datos_partidos_json o en la raíz (register_rest_field)
    const raw = (page as any).datos_partidos_json
      ?? (page as any).acf?.datos_partidos_json
      ?? null;
    if (!raw) return [];
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  /** Posiciones Liga FUTVE: página "resultados-liga-futve" → acf.datos_posiciones_json */
  async getPosicionesLigaFutve(): Promise<PosicionLigaFutve[]> {
    const page = await this.getPageBySlug('resultados-liga-futve') as Record<string, unknown> | null;
    if (!page) return [];
    const raw = (page as any).datos_posiciones_json
      ?? (page as any).acf?.datos_posiciones_json
      ?? null;
    if (!raw) return [];
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  /** Helper genérico: extraer un campo JSON de una página */
  _extractJsonField(page: Record<string, unknown> | null, field: string): unknown[] {
    if (!page) return [];
    const raw = (page as any)[field] ?? (page as any).acf?.[field] ?? null;
    if (!raw) return [];
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  /** Partidos Vinotinto Mayor desde página "resultados-vinotinto" */
  async getVinotintoMayorPartidos(): Promise<PartidoLigaFutve[]> {
    const page = await this.getPageBySlug('resultados-vinotinto') as Record<string, unknown> | null;
    return this._extractJsonField(page, 'vinotinto_mayor_datos_partidos_json') as PartidoLigaFutve[];
  },

  /** Posiciones Vinotinto Mayor desde página "resultados-vinotinto" */
  async getVinotintoMayorPosiciones(): Promise<PosicionLigaFutve[]> {
    const page = await this.getPageBySlug('resultados-vinotinto') as Record<string, unknown> | null;
    return this._extractJsonField(page, 'vinotinto_mayor_datos_posiciones_json') as PosicionLigaFutve[];
  },

  /**
   * Posts más vistos (Post Views Counter). Requiere endpoint personalizado en el tema:
   * GET /wp-json/futbolchimo/v1/most-viewed?per_page=N
   */
  async getMostViewedPosts(perPage = 6) {
    const wpOrigin = WP_URL.replace(/\/$/, '');
    const res = await fetch(`${wpOrigin}/wp-json/futbolchimo/v1/most-viewed?per_page=${perPage}`);
    if (!res.ok) throw new Error(`Most viewed API error: ${res.status}`);
    return res.json() as Promise<Array<{ id: number; slug: string; title: { rendered: string }; date?: string; link?: string }>>;
  },
};
