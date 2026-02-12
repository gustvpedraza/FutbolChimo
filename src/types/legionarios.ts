/**
 * Tipos para la sección Legionarios: jugadores venezolanos en ligas extranjeras.
 * Escalable para conectar con API en el futuro.
 */

export type LegionarioStatusType =
  | 'available'
  | 'starter'
  | 'highlight'
  | 'suspended'
  | 'injured'
  | 'not_called';

export interface LegionarioStats {
  minutes: string;
  goals: number;
  assists: number;
}

export interface LegionarioStatus {
  type: LegionarioStatusType;
  label: string;
  subText?: string;
}

export interface Legionario {
  id: string;
  name: string;
  team: string;
  league: string;
  /** Rival del último partido (ej. para mostrar "VS Brasil") */
  rival?: string;
  /** URL foto del jugador */
  image: string;
  /** URL logo del club */
  teamLogo: string;
  stats: LegionarioStats;
  status: LegionarioStatus;
  /** Ej: "Jornada 12" */
  matchday: string;
  /** Fecha del partido (viene de la consulta/ACF) */
  fecha?: string;
  /** Actuación en el partido (ACF): valor tal cual viene en la API, ej. "Titular", "Suplente", "Actuación Destacada", "MVP" */
  actuacion?: string;
  /** URL de referencia (enlace al hacer clic en el card, abre en nueva pestaña) */
  urlDeReferencia?: string;
  /** Puntuación (ACF, número o string) */
  puntuacion?: number | string;
}
