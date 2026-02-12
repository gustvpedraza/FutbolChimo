/**
 * Obtiene la tabla Liga FUTVE desde API-Football y la guarda en JSON.
 * Se ejecuta antes del build para que la app lea datos reales sin depender de fetch en build.
 * Uso: node scripts/fetch-standings.js
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  try {
    const content = readFileSync(join(root, '.env'), 'utf-8');
    const line = content
      .split('\n')
      .find((l) => l.startsWith('PUBLIC_API_FOOTBALL_KEY=') || l.startsWith('API_FOOTBALL_KEY='));
    return line ? line.split('=')[1]?.trim() : null;
  } catch {
    return null;
  }
}

const key = loadEnv();
if (!key) {
  console.warn('[fetch-standings] No API key in .env, skipping. Create .env with PUBLIC_API_FOOTBALL_KEY=...');
  process.exit(0);
}

const API_BASE = 'https://v3.football.api-sports.io';
const LEAGUE_ID = 299;
const SEASON = 2024;

async function fetchStandings() {
  const res = await fetch(`${API_BASE}/standings?league=${LEAGUE_ID}&season=${SEASON}`, {
    headers: { 'x-apisports-key': key },
  });
  if (!res.ok) {
    console.warn('[fetch-standings] API error:', res.status);
    return null;
  }
  const data = await res.json();
  if (data.errors && (Array.isArray(data.errors) ? data.errors.length : Object.keys(data.errors).length) > 0) {
    console.warn('[fetch-standings] API errors:', data.errors);
    return null;
  }
  const standings = data.response?.[0]?.league?.standings?.[0];
  if (!Array.isArray(standings) || standings.length === 0) return null;
  return standings.slice(0, 12).map((row) => ({
    rank: row.rank,
    team: row.team?.name ?? '—',
    points: row.points ?? 0,
    statusColor: row.rank <= 2 ? 'bg-green-500' : row.rank <= 4 ? 'bg-blue-500' : 'bg-transparent',
  }));
}

fetchStandings().then((rows) => {
  const outDir = join(root, 'src', 'data');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'standings.json');
  if (rows && rows.length > 0) {
    writeFileSync(outPath, JSON.stringify(rows, null, 0), 'utf-8');
    console.log('[fetch-standings] OK:', rows.length, 'teams →', outPath);
  } else {
    writeFileSync(outPath, '[]', 'utf-8');
    console.warn('[fetch-standings] No data, wrote empty array');
  }
}).catch((e) => {
  console.error('[fetch-standings]', e);
  process.exit(1);
});
