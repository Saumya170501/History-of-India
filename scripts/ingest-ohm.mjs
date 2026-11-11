import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import osmtogeojson from 'osmtogeojson';
import { boundaryBounds } from '../src/local-boundary.js';

export const ENDPOINT = 'https://overpass-api.openhistoricalmap.org/api/interpreter';
const names = ['Mughal Empire', 'Mogul Empire', 'Maratha Empire', 'Maratha Confederacy', 'Rajputana'];
export const QUERY = `[out:json][timeout:120];(\n${['name', 'name:en', 'official_name'].map(tag => `relation["boundary"="administrative"]["${tag}"~"^(${names.join('|')})$",i];`).join('\n')}\n);out body;>;out skel qt;`;

export function parseDate(raw) {
  if (typeof raw !== 'string') return null;
  const match = raw.trim().match(/^(?:(~|c\.?|circa)\s*)?(\d{1,4})(?:-(\d{2})(?:-(\d{2}))?)?$/i);
  if (!match) return null;
  const year = Number(match[2]), month = Number(match[3]), day = Number(match[4]);
  if (year < 1 || year > 2026 || (match[3] && (month < 1 || month > 12)) || (match[4] && (day < 1 || day > new Date(Date.UTC(year < 100 ? 2000 + year : year, month, 0)).getUTCDate()))) return null;
  return { year, approximate: Boolean(match[1]), precision: match[4] ? 'day' : match[3] ? 'month' : 'year' };
}
export function compile(raw, retrievedAt = new Date().toISOString()) {
  if (!Array.isArray(raw?.elements) || raw.remark) throw new Error(raw.remark || 'Invalid Overpass response');
  const converted = osmtogeojson(raw, { flatProperties: false });
  const features = [], skipped = [];
  for (const f of converted.features) {
    const p = f.properties, tags = p.tags || {};
    if (p.type !== 'relation') continue;
    const entity = [tags['name:en'], tags.name, tags.official_name].find(n => names.some(x => x.toLowerCase() === n?.toLowerCase()));
    if (!entity) continue;
    try {
      if (p.tainted) throw new Error('Incomplete relation geometry');
      const start = parseDate(tags.start_date), end = parseDate(tags.end_date);
      if (!start || !end) throw new Error('Missing or unsupported dates; not assigned invented endpoints');
      // Annual overlap window: an exact Jan 1 end excludes that calendar year.
      const endYear = end.year - (!end.approximate && /-01-01$/.test(tags.end_date) ? 1 : 0);
      if (start.year > endYear) throw new Error('Reversed or empty date window');
      boundaryBounds({ features: [f] });
      features.push({ type: 'Feature', id: `ohm/relation/${p.id}`, geometry: f.geometry, properties: {
        entity_name: entity, ruler: tags.ruler || tags['ruler:name'] || null,
        start_year: start.year, end_year: endYear,
        start_date: tags.start_date, end_date: tags.end_date,
        date_uncertain: start.approximate || end.approximate,
        date_note: 'Annual overlap/discovery window from OHM tags; not evidence of unchanged control throughout this interval.',
        source_url: `https://www.openhistoricalmap.org/relation/${p.id}`,
        source: tags.source || null, license: tags.license || tags.licence || null,
        retrieved_at: retrievedAt, review_status: 'unreviewed_provider_data', ohm_tags: tags,
      } });
    } catch (error) { skipped.push({ id: f.id, entity_name: entity, reason: error.message }); }
  }
  return { collection: { type: 'FeatureCollection', features }, report: { endpoint: ENDPOINT, query: QUERY, retrieved_at: retrievedAt, imported: features.length, skipped, requested_names: names } };
}
async function download() {
  // curl respects the environment proxy and CA trust on Linux and Windows.
  return new Promise((resolve, reject) => {
    const child = execFile('curl', ['--fail-with-body', '--silent', '--show-error', '--max-time', '150', '--data-urlencode', 'data@-', ENDPOINT], { maxBuffer: 64 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) reject(new Error(`OHM request failed: ${stderr || stdout || error.message}`));
      else { try { resolve(JSON.parse(stdout)); } catch { reject(new Error('OHM returned non-JSON data')); } }
    });
    child.stdin.on('error', () => {});
    child.stdin.end(QUERY);
  });
}
async function main() {
  // Offline imports use an OHM Overpass JSON export, not a GeoJSON conversion.
  const raw = process.argv[2] ? JSON.parse(await fs.readFile(process.argv[2], 'utf8')) : await download();
  const { collection, report } = compile(raw);
  await fs.mkdir('artifacts', { recursive: true });
  await fs.writeFile('artifacts/ohm-ingestion-report.json', JSON.stringify(report, null, 2));
  if (!collection.features.length) throw new Error('No usable polygons. Existing public data preserved; inspect artifacts/ohm-ingestion-report.json.');
  const destination = 'public/data/historical_empires.geojson';
  await fs.writeFile(`${destination}.tmp`, JSON.stringify(collection));
  await fs.rename(`${destination}.tmp`, destination);
  console.log(`Saved ${collection.features.length} unreviewed OHM polygons to ${destination}; skipped ${report.skipped.length}. Check feature sources and reuse terms before redistribution.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
