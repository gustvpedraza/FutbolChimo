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

/** Stats para porteros (posición POR): Atajadas, Goles encajados, Penaltis parados, Despejes */
export interface LegionarioKeeperStats {
  atajadas: number;
  golesEncajados: number;
  penaltisParados: number;
  despejes: number;
}

/** Stats para defensas (DFC, LI, LD, MCD) cuando Goles y Asistencias son 0: Intercepciones, Duelos ganados */
export interface LegionarioDefensiveStats {
  intercepciones: number;
  /** Duelos ganados; se muestra tal cual desde ACF, ej. "1/5" */
  duelosGanados: string;
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
  /** Posición del jugador (ACF), ej. "Delantero", "Mediocampista", "POR" */
  posicion?: string;
  /** Stats de portero (solo si posicion es POR): Atajadas, Goles encajados, Penaltis parados */
  keeperStats?: LegionarioKeeperStats;
  /** Stats defensivos (solo si posicion es DFC, LI, LD, MCD): Intercepciones, Duelos ganados */
  defensiveStats?: LegionarioDefensiveStats;
  /** Duelos ganados para jugadores ofensivos (MCO, EI, ED, DC, SD); se muestra tal cual, ej. "1/5" */
  duelosGanados?: string;
  /** Precisión de pases (número 0-100); solo para jugadores que no son POR, SD ni DC; se muestra con % */
  precisionDePases?: number;
  /** Ocasiones de gol (solo para posiciones SD y DC); reemplaza Precisión de pases en el card */
  ocasionesDeGol?: number | string;
}
