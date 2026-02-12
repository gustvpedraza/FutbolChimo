/**
 * Tipos para WordPress REST API (Headless)
 * https://developer.wordpress.org/rest-api/reference/posts/
 */

export interface WpPost {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string; protected: boolean };
  excerpt: { rendered: string; protected: boolean };
  author: number;
  featured_media: number;
  comment_status: string;
  ping_status: string;
  sticky: boolean;
  template: string;
  format: string;
  meta: Record<string, unknown>;
  categories: number[];
  tags: number[];
  _links: Record<string, unknown>;
}

export interface WpMedia {
  id: number;
  source_url: string;
  alt_text: string;
  media_details?: {
    width: number;
    height: number;
    sizes?: Record<string, { source_url: string; width: number; height: number }>;
  };
}

export interface WpCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface WpTag {
  id: number;
  name: string;
  slug: string;
  count: number;
}

/** Post con _embed y ACF (ej. enlace_x para X/Twitter) */
export interface WpPostEmbedded extends WpPost {
  acf?: {
    /** URL del post en X (Twitter). ACF "x_post_url" expuesto en REST API. */
    x_post_url?: string;
    [key: string]: unknown;
  };
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
      alt_text: string;
      media_details?: { width: number; height: number; sizes?: Record<string, { source_url: string }> };
    }>;
    'wp:term'?: Array<WpCategory[] | WpTag[]>;
    author?: Array<{ name: string; avatar_urls?: Record<string, string> }>;
  };
}

/** Custom Post Type: Jugadores (Los Nuestros). ACF según campos que expongas en REST. */
export interface WpJugador {
  id: number;
  date: string;
  slug: string;
  title: { rendered: string };
  content?: { rendered: string; protected: boolean };
  excerpt?: { rendered: string; protected: boolean };
  featured_media: number;
  /** URL del escudo (expuesta por el tema vía register_rest_field desde ACF escudo_equipo_actual) */
  escudo_url?: string;
  acf?: {
    nombre?: string;
    equipo?: string;
    team?: string;
    liga?: string;
    league?: string;
    foto?: string;
    image?: string;
    /** ACF: Escudo equipo actual (array de imágenes, objeto imagen o URL) */
    escudo_equipo_actual?: string | { url: string } | Array<{ url: string }>;
    logo_equipo?: string;
    team_logo?: string;
    /** ACF: minutos jugados (número o string, ej. 90 o "90'") */
    minutos_jugados?: number | string;
    minutos?: string;
    minutes?: string;
    goles?: number;
    goals?: number;
    asistencias?: number;
    assists?: number;
    tarjetas?: string;
    cards?: string;
    tarjetas_amarillas?: number;
    /** true = Expulsado; número > 0 = mostrar ese valor */
    tarjetas_rojas?: boolean | number;
    condicion?: string;
    condition?: string;
    estado_label?: string;
    status_label?: string;
    estado_tipo?: string;
    status_type?: string;
    jornada?: string;
    matchday?: string;
    /** Fecha del partido (ACF) */
    fecha?: string;
    date_match?: string;
    /** Rival del último partido (ACF) */
    rival?: string;
    opponent?: string;
    /** Actuación en el partido (ACF) */
    actuacion?: string;
    performance?: string;
    /** URL de referencia (enlace al hacer clic en el card) */
    url_de_referencia?: string;
    /** Puntuación (ACF) */
    puntuacion?: number | string;
    [key: string]: unknown;
  };
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string; alt_text?: string }>;
  };
}

/** Custom Post Type: Prospectos (cosecha) */
export interface WpProspecto {
  id: number;
  date: string;
  slug: string;
  title: { rendered: string };
  content: { rendered: string; protected: boolean };
  excerpt: { rendered: string; protected: boolean };
  featured_media: number;
  acf?: {
    nombre_completo?: string;
    club?: string;
    posicion?: string;
    edad?: number;
    fecha_nacimiento?: string;
    foto_url?: string;
    estadisticas?: string;
    scouting_report?: string;
    [key: string]: unknown;
  };
  meta?: Record<string, unknown>;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string; alt_text: string }>;
  };
}

/** Custom Post Type: EquiposFutVE (equiposfutve). */
export interface WpEquipoFutVE {
  id: number;
  date: string;
  slug: string;
  title: { rendered: string };
  content?: { rendered: string; protected: boolean };
  excerpt?: { rendered: string; protected: boolean };
  featured_media: number;
  /** Puntos del equipo (expuesto vía register_rest_field). */
  puntos?: number;
  /** Diferencia de goles (expuesto vía register_rest_field). */
  diferencia_de_goles?: number;
  /** URL del escudo (expuesto vía register_rest_field). */
  escudo_url?: string;
  acf?: {
    /** Nombre del equipo (si difiere del título). */
    nombre_equipo?: string;
    /** Ciudad o región del equipo. */
    ciudad?: string;
    /** Liga o categoría donde compite. */
    liga?: string;
    /** URL del escudo del equipo (si no se usa thumbnail). */
    escudo_url?: string;
    /** Puntos del equipo en la tabla de posiciones. */
    puntos?: number | string;
    [key: string]: unknown;
  };
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string; alt_text?: string }>;
  };
}

