/**
 * Datos estáticos para la página de Selecciones (estructura tipo futbolve-data-hub).
 */

export interface MatchDetails {
  home: string;
  away: string;
  venue: string;
  time: string;
  /** Fecha corta para mostrar junto al título (ej. "5 mar 2025") */
  date?: string;
  label: string;
}

export interface ScoutItem {
  id: string;
  text: string;
  /** Clase Tailwind para el punto: bg-gold, bg-primary, etc. */
  colorClass: string;
}

export const NEXT_MATCH: MatchDetails = {
  home: 'VEN',
  away: 'ARG',
  venue: 'Estadio Olímpico',
  time: '19:00',
  date: '5 mar 2025',
  label: 'Próximo partido',
};

export const SCOUT_ITEMS: ScoutItem[] = [
  { id: 's1', text: 'Scouting nacional detecta talento en las ligas regionales', colorClass: 'bg-gold' },
  { id: 's2', text: 'Gira internacional para fortalecer el sistema defensivo juvenil', colorClass: 'bg-primary' },
];

export const FUTSAL_HUB = {
  categoryLabel: 'Histórico',
  title: 'Venezuela reafirma su dominio continental en Futsal',
  excerpt: 'Tras la destacada participación en el último mundial, la selección de futsal se prepara para la Copa América con una base sólida de jugadores locales y una estrategia renovada por el cuerpo técnico.',
  cronicaLabels: { primary: 'Crónica', secondary: 'Calendario' },
};
