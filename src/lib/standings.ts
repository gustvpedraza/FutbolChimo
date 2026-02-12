/**
 * Clasificación Liga FUTVE desde API-Football (api-sports.io).
 * Gratis: https://www.api-football.com/ → registro y API key en el dashboard.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export type StandingRow = {
  rank: number;
  team: string;
  points: number;
  statusColor: string;
};

/** Base URL API-Football (api-sports.io) */
const API_BASE = 'https://v3.football.api-sports.io';
/** Liga FUTVE = Venezuela Primera División — ID 299 en API-Football */
const LIGA_FUTVE_LEAGUE_ID = 299;
const CURRENT_YEAR = new Date().getFullYear();
const SEASON = CURRENT_YEAR;
const FALLBACK_SEASON = CURRENT_YEAR - 1;

function statusColorForRank(rank: number): string {
  if (rank <= 2) return 'bg-green-500';
  if (rank <= 4) return 'bg-blue-500';
  return 'bg-transparent';
}

/** Lee la API key desde .env (process.cwd() = raíz del proyecto al hacer npm run build) */
function getApiKeyFromEnvFile(): string | null {
  if (typeof process === 'undefined') return null;
  try {
    const cwd = process.cwd();
    const envPath = join(cwd, '.env');
    if (!existsSync(envPath)) return null;
    const content = readFileSync(envPath, 'utf-8');
    const line = content
      .split('\n')
      .find(
        (l) =>
          l.startsWith('PUBLIC_API_FOOTBALL_KEY=') || l.startsWith('API_FOOTBALL_KEY=')
      );
    if (!line) return null;
    const value = line.split('=')[1]?.trim();
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

/** Respuesta típica de GET /standings (API-Football) */
type ApiStandingEntry = {
  rank: number;
  team: { name: string };
  points: number;
};
type ApiResponse = {
  response?: Array<{
    league?: {
      standings?: ApiStandingEntry[][];
    };
  }>;
  errors?: Record<string, unknown> | unknown[];
};

/**
 * Lee standings desde src/data/standings.json si existe (generado por scripts/fetch-standings.js).
 */
function readStandingsFromFile(): StandingRow[] | null {
  if (typeof process === 'undefined') return null;
  try {
    const path = join(process.cwd(), 'src', 'data', 'standings.json');
    if (!existsSync(path)) return null;
    const raw = readFileSync(path, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed as StandingRow[];
  } catch {
    return null;
  }
}

/**
 * Obtiene la tabla de posiciones de Liga FUTVE.
 * 1) Lee src/data/standings.json si existe (generado por npm run standings).
 * 2) Si no, llama a la API con la key de .env.
 */
export async function fetchLigaFutveStandings(): Promise<StandingRow[] | null> {
  const fromFile = readStandingsFromFile();
  if (fromFile && fromFile.length > 0) return fromFile;

  const key =
    getApiKeyFromEnvFile() ??
    (typeof process !== 'undefined' && process.env?.PUBLIC_API_FOOTBALL_KEY) ??
    (typeof process !== 'undefined' && process.env?.API_FOOTBALL_KEY) ??
    (typeof import.meta.env !== 'undefined' && import.meta.env?.PUBLIC_API_FOOTBALL_KEY) ??
    (typeof import.meta.env !== 'undefined' && import.meta.env?.API_FOOTBALL_KEY);
  const leagueId = LIGA_FUTVE_LEAGUE_ID;

  if (!key || typeof key !== 'string') return null;

  const headers = { 'x-apisports-key': key };

  /** Parsea la respuesta de standings y devuelve array de filas o null */
  function parseStandings(data: ApiResponse): StandingRow[] | null {
    const errs = data.errors;
    if (Array.isArray(errs) && errs.length > 0) return null;
    if (errs && typeof errs === 'object' && Object.keys(errs).length > 0) return null;
    const standings = data.response?.[0]?.league?.standings?.[0];
    if (!Array.isArray(standings) || standings.length === 0) return null;
    return standings.slice(0, 12).map((row) => ({
      rank: row.rank,
      team: row.team?.name ?? '—',
      points: row.points ?? 0,
      statusColor: statusColorForRank(row.rank),
    }));
  }

  // Probar 2024 primero (suele tener datos); luego año actual
  for (const season of [FALLBACK_SEASON, SEASON]) {
    try {
      const res = await fetch(`${API_BASE}/standings?league=${leagueId}&season=${season}`, { headers });
      if (!res.ok) continue;
      const data = (await res.json()) as ApiResponse;
      const rows = parseStandings(data);
      if (rows && rows.length > 0) return rows;
    } catch {
      // intentar siguiente temporada
    }
  }
  return null;
}
