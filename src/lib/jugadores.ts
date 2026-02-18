/**
 * Mapeo de jugadores desde WordPress (CPT Vinotintos por el Mundo + ACF) al tipo Legionario.
 * Ajusta las claves acf.* según los nombres exactos de tus campos en WordPress.
 */
import type { WpJugador } from '../types/wordpress';
import type { Legionario, LegionarioDefensiveStats, LegionarioKeeperStats, LegionarioStatusType } from '../types/legionarios';

/** Extrae URL de un valor ACF: string, objeto { url }, o array de objetos { url }. */
function getUrlFromAcfValue(val: unknown): string | null {
  if (typeof val === 'string' && val.trim() !== '') return val.trim();
  if (val && typeof val === 'object') {
    if (Array.isArray(val)) {
      const first = val[0];
      if (first && typeof first === 'object' && first !== null && 'url' in first && typeof (first as { url: string }).url === 'string') {
        const u = (first as { url: string }).url;
        if (u.trim() !== '') return u.trim();
      }
      return null;
    }
    if ('url' in val && typeof (val as { url: string }).url === 'string') {
      const u = (val as { url: string }).url;
      if (u.trim() !== '') return u.trim();
    }
  }
  return null;
}

/** Devuelve la URL del escudo: primero escudo_url (REST desde PHP), luego ACF. */
function resolveTeamLogoUrl(wp: WpJugador): string {
  const fallback = 'https://picsum.photos/seed/club/64/64';
  if (typeof wp.escudo_url === 'string' && wp.escudo_url.trim() !== '') {
    return wp.escudo_url.trim();
  }
  const acf = (wp.acf ?? {}) as Record<string, unknown>;
  const val = acf.escudo_equipo_actual;
  const url = getUrlFromAcfValue(val);
  if (url) return url;
  const keys = ['escudo_equipo', 'logo_equipo_actual', 'logo_equipo', 'team_logo'];
  for (const key of keys) {
    const u = getUrlFromAcfValue(acf[key]);
    if (u) return u;
  }
  for (const [key, v] of Object.entries(acf)) {
    if (key.toLowerCase().includes('escudo')) {
      const u = getUrlFromAcfValue(v);
      if (u) return u;
    }
  }
  return fallback;
}

/** Formatea ISO (YYYY-MM-DD) o similar a texto legible. */
function formatFecha(iso: string): string {
  if (!iso || typeof iso !== 'string') return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const STATUS_TYPE_MAP: Record<string, LegionarioStatusType> = {
  available: 'available',
  disponible: 'available',
  starter: 'starter',
  titular: 'starter',
  highlight: 'highlight',
  destacado: 'highlight',
  suspended: 'suspended',
  suspendido: 'suspended',
  injured: 'injured',
  lesionado: 'injured',
  not_called: 'not_called',
  no_convocado: 'not_called',
};

export function wpJugadorToLegionario(wp: WpJugador): Legionario {
  const acf = wp.acf ?? {};
  const name =
    (acf.nombre as string) ??
    (acf.name as string) ??
    wp.title?.rendered?.replace(/<[^>]*>/g, '').trim() ??
    'Jugador';
  const team = (acf.equipo as string) ?? (acf.team as string) ?? '—';
  const league = (acf.liga as string) ?? (acf.league as string) ?? '—';
  const image =
    (acf.foto as string) ??
    (acf.image as string) ??
    wp._embedded?.['wp:featuredmedia']?.[0]?.source_url ??
    'https://picsum.photos/seed/jugador/200/200';
  const teamLogo = resolveTeamLogoUrl(wp);
  const minutesRaw = acf.minutos_jugados ?? acf.minutos ?? acf.minutes;
  const minutes =
    typeof minutesRaw === 'number'
      ? `${minutesRaw}'`
      : (typeof minutesRaw === 'string' && minutesRaw.trim() !== ''
          ? (minutesRaw.includes("'") ? minutesRaw : `${minutesRaw}'`)
          : "0'");
  const goals = Number(acf.goles ?? acf.goals ?? 0) || 0;
  const assists = Number(acf.asistencias ?? acf.assists ?? 0) || 0;
  const statusLabel =
    (acf.estado_label as string) ?? (acf.status_label as string) ?? 'Disponible';
  const statusTypeRaw = ((acf.estado_tipo as string) ?? (acf.status_type as string) ?? 'available').toLowerCase();
  const statusType: LegionarioStatusType =
    STATUS_TYPE_MAP[statusTypeRaw] ?? 'available';
  const matchday =
    (acf.jornada as string) ?? (acf.matchday as string) ?? '';
  const rival = (acf.rival as string) ?? (acf.opponent as string) ?? undefined;
  const actuacionRaw = acf.actuacion ?? acf.performance ?? '';
  const actuacion = typeof actuacionRaw === 'string' && actuacionRaw.trim() !== '' ? actuacionRaw.trim() : undefined;
  const urlRefRaw = acf.url_de_referencia ?? '';
  const urlDeReferencia = typeof urlRefRaw === 'string' && urlRefRaw.trim() !== '' ? urlRefRaw.trim() : undefined;
  const puntuacionRaw = acf.puntuacion;
  const puntuacion =
    puntuacionRaw !== undefined && puntuacionRaw !== null && puntuacionRaw !== ''
      ? (typeof puntuacionRaw === 'number' ? puntuacionRaw : String(puntuacionRaw).trim())
      : undefined;
  const posicionRaw = acf.posicion ?? acf.position ?? '';
  const posicion = (() => {
    // ACF puede devolver: string, array de strings, false, null, etc.
    if (Array.isArray(posicionRaw)) {
      const first = posicionRaw[0];
      const val = typeof first === 'string' ? first.trim() : typeof first === 'object' && first !== null && 'label' in first ? String((first as { label: string }).label).trim() : '';
      return val || undefined;
    }
    if (typeof posicionRaw === 'string' && posicionRaw.trim() !== '') {
      // Si vienen varias posiciones separadas por coma, tomar solo la primera
      const first = posicionRaw.split(',')[0].split('/')[0].split(' - ')[0].trim();
      return first || undefined;
    }
    return undefined;
  })();
  const fechaRaw =
    (acf.fecha as string) ??
    (acf.date_match as string) ??
    (acf.fecha_partido as string) ??
    (acf.fecha_del_partido as string) ??
    (acf.partido_fecha as string);
  const fecha =
    typeof fechaRaw === 'string' && fechaRaw.trim() !== ''
      ? formatFecha(fechaRaw)
      : wp.date
        ? formatFecha(wp.date)
        : undefined;

  const isPortero = (p: string | undefined): boolean => {
    if (!p || typeof p !== 'string') return false;
    const n = p.trim().toUpperCase();
    return n === 'POR' || n === 'PORTERO' || n.includes('POR');
  };

  const DEFENSIVE_POSITIONS = ['DFC', 'LI', 'LD', 'MCD'];
  const isDefensivo = (p: string | undefined): boolean => {
    if (!p || typeof p !== 'string') return false;
    const n = p.trim().toUpperCase();
    return DEFENSIVE_POSITIONS.some((pos) => n === pos || n.includes(pos));
  };

  const OFFENSIVE_POSITIONS = ['MCO', 'EI', 'ED', 'DC', 'SD'];
  const isOffensivo = (p: string | undefined): boolean => {
    if (!p || typeof p !== 'string') return false;
    const n = p.trim().toUpperCase();
    return OFFENSIVE_POSITIONS.some((pos) => n === pos || n.includes(pos));
  };

  const toNum = (v: number | string | undefined | null): number => {
    if (v === undefined || v === null) return 0;
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    const n = parseFloat(String(v).replace(',', '.'));
    return Number.isNaN(n) ? 0 : n;
  };

  const keeperStats: LegionarioKeeperStats | undefined =
    isPortero(posicion)
      ? {
          atajadas: toNum(acf.atajadas),
          golesEncajados: toNum(acf.goles_encajados),
          penaltisParados: toNum(acf.penaltis_parados),
          despejes: toNum(acf.despejes),
        }
      : undefined;

  const duelosGanadosRaw = acf.duelos_ganados;
  const duelosGanados =
    typeof duelosGanadosRaw === 'string' && duelosGanadosRaw.trim() !== ''
      ? duelosGanadosRaw.trim()
      : typeof duelosGanadosRaw === 'number' && !Number.isNaN(duelosGanadosRaw)
        ? String(duelosGanadosRaw)
        : '—';

  const defensiveStats: LegionarioDefensiveStats | undefined =
    isDefensivo(posicion)
      ? {
          intercepciones: toNum(acf.intercepciones),
          duelosGanados,
        }
      : undefined;

  const posUpper = posicion?.trim().toUpperCase() ?? '';
  const isSDorDC = posUpper === 'SD' || posUpper === 'DC';
  const showPrecisionDePases = !isPortero(posicion) && !isSDorDC;
  const precisionDePases = showPrecisionDePases ? toNum(acf.precision_de_pases) : undefined;

  const ocasionesDeGolRaw = acf.ocasiones_de_gol;
  const ocasionesDeGol =
    isSDorDC && ocasionesDeGolRaw !== undefined && ocasionesDeGolRaw !== null && ocasionesDeGolRaw !== ''
      ? typeof ocasionesDeGolRaw === 'number'
        ? ocasionesDeGolRaw
        : String(ocasionesDeGolRaw).trim()
      : undefined;

  return {
    id: String(wp.id),
    name,
    team,
    league,
    ...(rival && { rival }),
    image,
    teamLogo,
    stats: {
      minutes,
      goals,
      assists,
    },
    status: {
      type: statusType,
      label: statusLabel,
      ...(matchday && { subText: matchday }),
    },
    matchday,
    ...(fecha && { fecha }),
    ...(actuacion && { actuacion }),
    ...(urlDeReferencia && { urlDeReferencia }),
    ...(puntuacion !== undefined && puntuacion !== '' && { puntuacion }),
    ...(posicion && { posicion }),
    ...(keeperStats && { keeperStats }),
    ...(defensiveStats && { defensiveStats }),
    ...(isOffensivo(posicion) && duelosGanados !== '—' && { duelosGanados }),
    ...(showPrecisionDePases && { precisionDePases }),
    ...(isSDorDC && ocasionesDeGol !== undefined && ocasionesDeGol !== '' && { ocasionesDeGol }),
  };
}
