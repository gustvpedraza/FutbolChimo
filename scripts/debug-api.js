/**
 * Script para ver qué devuelve la API-Football.
 * Ejecutar: node scripts/debug-api.js
 * Requiere: archivo .env con API_FOOTBALL_KEY
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env');

function loadEnv() {
  try {
    const content = readFileSync(envPath, 'utf-8');
    const key = content
      .split('\n')
      .find((line) => line.startsWith('API_FOOTBALL_KEY='));
    return key ? key.replace('API_FOOTBALL_KEY=', '').trim() : null;
  } catch {
    return null;
  }
}

const key = loadEnv();
if (!key) {
  console.error('No se encontró API_FOOTBALL_KEY en .env');
  process.exit(1);
}

const BASE = 'https://v3.football.api-sports.io';
const headers = { 'x-apisports-key': key };

async function main() {
  console.log('--- GET /leagues?id=299 ---\n');
  const leaguesRes = await fetch(`${BASE}/leagues?id=299`, { headers });
  const leagues = await leaguesRes.json();
  console.log(JSON.stringify(leagues, null, 2));

  console.log('\n--- GET /standings?league=299&season=2024 ---\n');
  const standingsRes = await fetch(`${BASE}/standings?league=299&season=2024`, { headers });
  const standings = await standingsRes.json();
  console.log(JSON.stringify(standings, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
