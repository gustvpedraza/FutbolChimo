/**
 * Tabla de posiciones de la eliminatoria en curso (Conmebol u otra).
 * Actualiza este archivo manualmente con los resultados que quieras mostrar.
 */

export type EliminatoriaRow = {
  rank: number;
  team: string;
  points: number;
  /** Opcional: bg-green-500 (puestos directos), bg-blue-500 (repechaje), bg-transparent */
  statusColor?: string;
};

/** Título de la eliminatoria (ej. "Eliminatorias Mundial 2026") */
export const ELIMINATORIA_TITLE = 'Eliminatorias Conmebol';

/** Tabla de posiciones — edita aquí los equipos y puntos */
export const ELIMINATORIA_STANDINGS: EliminatoriaRow[] = [
  { rank: 1, team: 'Argentina', points: 18, statusColor: 'bg-green-500' },
  { rank: 2, team: 'Uruguay', points: 15, statusColor: 'bg-green-500' },
  { rank: 3, team: 'Colombia', points: 14, statusColor: 'bg-green-500' },
  { rank: 4, team: 'Venezuela', points: 13, statusColor: 'bg-green-500' },
  { rank: 5, team: 'Ecuador', points: 11, statusColor: 'bg-blue-500' },
  { rank: 6, team: 'Brasil', points: 10, statusColor: 'bg-blue-500' },
  { rank: 7, team: 'Chile', points: 8, statusColor: 'bg-transparent' },
  { rank: 8, team: 'Paraguay', points: 6, statusColor: 'bg-transparent' },
  { rank: 9, team: 'Perú', points: 4, statusColor: 'bg-transparent' },
  { rank: 10, team: 'Bolivia', points: 2, statusColor: 'bg-transparent' },
];
