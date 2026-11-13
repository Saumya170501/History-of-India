// Rebuild clipped subcontinent snapshots from aourednik/historical-basemaps.
// Not part of the Vercel build. Run only when refreshing the vendored sheets.
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import polygonClipping from 'polygon-clipping';
import { CORE, FRAME, RESIDUAL_COLOR, isResidualName, polityColor } from '../src/period-map.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public/data/basemaps');
const indexPath = join(root, 'src/data/basemap-index.json');
const upstream = 'https://cdn.jsdelivr.net/gh/aourednik/historical-basemaps@master/geojson';
const defaultYears = [
  -500, -400, -323, -300, -200, -100, -1,
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1279, 1300,
  1400, 1492, 1500, 1530, 1600, 1650, 1700, 1715, 1783, 1800, 1815, 1880, 1900,
  1914, 1920, 1930, 1938, 1945, 1960, 1994, 2000, 2010,
];
const years = process.env.BASEMAP_YEARS
  ? process.env.BASEMAP_YEARS.split(',').map(item => Number(item.trim()))
  : defaultYears;

function inside(point, edge) {
  if (edge === 'left') return point[0] >= FRAME.west;
  if (edge === 'right') return point[0] <= FRAME.east;
  if (edge === 'bottom') return point[1] >= FRAME.south;
  return point[1] <= FRAME.north;
}
function cross(a, b, edge) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (edge === 'left' || edge === 'right') {
    const x = edge === 'left' ? FRAME.west : FRAME.east;
    const t = dx === 0 ? 0 : (x - a[0]) / dx;
    return [x, a[1] + t * dy];
  }
  const y = edge === 'bottom' ? FRAME.south : FRAME.north;
  const t = dy === 0 ? 0 : (y - a[1]) / dy;
  return [a[0] + t * dx, y];
}
function clipRing(ring) {
  let output = ring.slice(0, -1);
  if (output.length < 3) output = ring.slice();
  for (const edge of ['left', 'right', 'bottom', 'top']) {
    const input = output;
    output = [];
    if (!input.length) break;
    let previous = input.at(-1);
    for (const current of input) {
      const now = inside(current, edge);
      const was = inside(previous, edge);
      if (now) {
        if (!was) output.push(cross(previous, current, edge));
        output.push(current);
      } else if (was) output.push(cross(previous, current, edge));
      previous = current;
    }
  }
  const rounded = [];
  for (const [x, y] of output) {
    const point = [Math.round(x * 10000) / 10000, Math.round(y * 10000) / 10000];
    const last = rounded.at(-1);
    if (!last || last[0] !== point[0] || last[1] !== point[1]) rounded.push(point);
  }
  if (rounded.length >= 3) {
    const first = rounded[0];
    const last = rounded.at(-1);
    if (first[0] !== last[0] || first[1] !== last[1]) rounded.push([first[0], first[1]]);
  }
  return rounded.length >= 4 ? rounded : null;
}
function ringArea(ring) {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(area) / 2;
}
function clipPolygon(polygon) {
  const rings = [];
  for (const ring of polygon) {
    const clipped = clipRing(ring);
    if (clipped) rings.push(clipped);
  }
  if (!rings.length || ringArea(rings[0]) < 0.05) return null;
  return rings;
}
function clipGeometry(geometry) {
  if (geometry?.type === 'Polygon') {
    const polygon = clipPolygon(geometry.coordinates);
    return polygon ? { type: 'Polygon', coordinates: polygon } : null;
  }
  if (geometry?.type === 'MultiPolygon') {
    const polygons = geometry.coordinates.map(clipPolygon).filter(Boolean);
    if (!polygons.length) return null;
    if (polygons.length === 1) return { type: 'Polygon', coordinates: polygons[0] };
    return { type: 'MultiPolygon', coordinates: polygons };
  }
  return null;
}
function areaOf(geometry) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  return polygons.reduce((sum, rings) => sum + ringArea(rings[0]), 0);
}
function inCore(geometry) {
  const box = { ...CORE };
  // Reuse the frame clipper by temporarily... core is smaller, so test vertices and bbox.
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const visit = coords => {
    if (typeof coords[0] === 'number') {
      minX = Math.min(minX, coords[0]); minY = Math.min(minY, coords[1]);
      maxX = Math.max(maxX, coords[0]); maxY = Math.max(maxY, coords[1]);
      return;
    }
    for (const part of coords) visit(part);
  };
  visit(geometry.coordinates);
  return maxX >= box.west && minX <= box.east && maxY >= box.south && minY <= box.north;
}
function upstreamFile(year) {
  return year < 0 ? `world_bc${-year}.geojson` : `world_${year}.geojson`;
}
function snapshotFile(year) {
  return year < 0 ? `year--${-year}.geojson` : `year-${year}.geojson`;
}
async function fetchYear(year) {
  const url = `${upstream}/${upstreamFile(year)}`;
  let last;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      last = error;
      await new Promise(resolve => setTimeout(resolve, 400 * attempt));
    }
  }
  throw new Error(`${year}: ${last.message}`);
}
function asMulti(geometry) {
  if (geometry?.type === 'Polygon') return [geometry.coordinates];
  if (geometry?.type === 'MultiPolygon') return geometry.coordinates;
  return [];
}
function fromMulti(multi) {
  const clean = (multi || []).filter(poly => poly?.[0]?.length >= 4);
  if (!clean.length) return null;
  if (clean.length === 1) return { type: 'Polygon', coordinates: clean[0] };
  return { type: 'MultiPolygon', coordinates: clean };
}
function ringBBoxHitsFrame(ring) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of ring) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  return maxX >= FRAME.west && minX <= FRAME.east && maxY >= FRAME.south && minY <= FRAME.north;
}
function wobble(x, y) {
  let h = Math.imul(Math.round(x * 1000) | 0, 374761393) ^ Math.imul(Math.round(y * 1000) | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((((h ^ (h >>> 16)) >>> 0) % 9) - 4) / 4;
}
// Long ruler-straight segments of the coarse sheet are bent a little so the
// stroke is not a polygon drawn with a ruler. The offset is display only.
function softenRing(ring) {
  const open = ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1]
    ? ring.slice(0, -1) : ring.slice();
  if (open.length < 3) return null;
  const dense = [];
  for (let i = 0; i < open.length; i += 1) {
    const a = open[i];
    const b = open[(i + 1) % open.length];
    dense.push(a);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    if (len < 0.35) continue;
    const steps = Math.min(6, Math.max(1, Math.floor(len / 0.5)));
    const nx = -dy / len;
    const ny = dx / len;
    for (let step = 1; step <= steps; step += 1) {
      const t = step / (steps + 1);
      const amp = 0.09 * Math.sin(Math.PI * t) * wobble(a[0] + dx * t, a[1] + dy * t);
      dense.push([a[0] + dx * t + nx * amp, a[1] + dy * t + ny * amp]);
    }
  }
  const curved = [];
  for (let i = 0; i < dense.length; i += 1) {
    const p = dense[i];
    const q = dense[(i + 1) % dense.length];
    curved.push([0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]]);
    curved.push([0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]]);
  }
  curved.push(curved[0]);
  return curved;
}
function softenGeometry(geometry) {
  if (geometry?.type === 'Polygon') {
    const rings = geometry.coordinates.map(softenRing).filter(Boolean);
    return rings.length ? { type: 'Polygon', coordinates: rings } : null;
  }
  if (geometry?.type === 'MultiPolygon') {
    const polygons = geometry.coordinates
      .map(poly => poly.map(softenRing).filter(Boolean))
      .filter(poly => poly.length);
    return polygons.length ? { type: 'MultiPolygon', coordinates: polygons } : null;
  }
  return null;
}
let landMulti = null;
async function loadLand() {
  const response = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_land.geojson');
  if (!response.ok) throw new Error(`Natural Earth land HTTP ${response.status}`);
  const fc = await response.json();
  const parts = [];
  for (const feature of fc.features || []) {
    const polys = feature.geometry?.type === 'Polygon' ? [feature.geometry.coordinates]
      : feature.geometry?.type === 'MultiPolygon' ? feature.geometry.coordinates : [];
    for (const poly of polys) if (ringBBoxHitsFrame(poly[0])) parts.push(poly);
  }
  landMulti = parts.length ? polygonClipping.union(...parts) : [];
  if (!landMulti.length) throw new Error('Natural Earth land mask is empty in the display frame');
}
function dressGeometry(geometry) {
  const clipped = clipGeometry(geometry);
  if (!clipped) return null;
  let cut;
  try { cut = polygonClipping.intersection(asMulti(clipped), landMulti); }
  catch { return clipped; }
  const onLand = fromMulti(cut);
  if (!onLand) return null;
  return clipGeometry(softenGeometry(onLand) || onLand);
}
function convert(collection, year) {
  const features = [];
  for (const feature of collection.features || []) {
    const name = feature.properties?.NAME;
    if (typeof name !== 'string' || !name.trim()) continue;
    const geometry = dressGeometry(feature.geometry);
    if (!geometry || !inCore(geometry)) continue;
    const area = areaOf(geometry);
    if (area < 0.15) continue;
    const kind = isResidualName(name) ? 'residual' : 'named';
    features.push({
      type: 'Feature',
      id: 0,
      properties: {
        name: name.trim(),
        partOf: feature.properties.PARTOF && feature.properties.PARTOF !== name ? feature.properties.PARTOF : undefined,
        subjectTo: feature.properties.SUBJECTO && feature.properties.SUBJECTO !== name ? feature.properties.SUBJECTO : undefined,
        kind,
        snapshotYear: year,
        uncertainty: Number(feature.properties?.BORDERPRECISION) >= 3 ? 'higher'
          : Number(feature.properties?.BORDERPRECISION) === 2 ? 'moderate' : 'low',
        color: kind === 'residual' ? RESIDUAL_COLOR : polityColor(name.trim()),
        area: Math.round(area * 100) / 100,
        labelRank: -Math.round(area * 10),
      },
      geometry,
    });
  }
  features.sort((a, b) => (a.properties.kind === 'residual' ? 0 : 1) - (b.properties.kind === 'residual' ? 0 : 1)
    || b.properties.area - a.properties.area);
  features.forEach((feature, index) => { feature.id = index + 1; });
  return { type: 'FeatureCollection', features };
}
async function pool(items, limit, task) {
  const results = [];
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await task(items[index]);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

await mkdir(outDir, { recursive: true });
await loadLand();
const sheets = await pool(years, 4, async year => {
  const raw = await fetchYear(year);
  const collection = convert(raw, year);
  const file = snapshotFile(year);
  await writeFile(join(outDir, file), JSON.stringify(collection));
  const named = collection.features.filter(feature => feature.properties.kind === 'named').map(feature => feature.properties.name);
  console.log(year, collection.features.length, named.join(' | '));
  return { year, file, featureCount: collection.features.length };
});
let snapshots = sheets.filter(sheet => sheet.featureCount > 0);
if (process.env.BASEMAP_YEARS) {
  const previous = JSON.parse(await readFile(indexPath, 'utf8'));
  const byYear = new Map((previous.snapshots || []).map(item => [item.year, item]));
  for (const sheet of snapshots) byYear.set(sheet.year, sheet);
  snapshots = [...byYear.values()].sort((a, b) => a.year - b.year);
}
const index = {
  schemaVersion: 1,
  dataset: 'historical-basemaps',
  author: 'André Ourednik and contributors',
  repository: 'https://github.com/aourednik/historical-basemaps',
  license: 'GPL-3.0-only',
  licenseUrl: 'https://github.com/aourednik/historical-basemaps/blob/master/LICENSE',
  retrieved: '2026-11-11',
  modification: 'Each world sheet was clipped to longitude 56–101 and latitude 3–40, then cut to Natural Earth 50m land (public domain, v5.1.2) so the colour stops at the modern coastline instead of crossing the sea. Long straight inland segments of the coarse sheet were given a small display wobble and one smoothing pass so they are not drawn with a ruler. That wobble is not a historical frontier. Coordinates are rounded to 4 decimal degrees. Unnamed features were dropped. No borders were interpolated between sheets. A straight edge on the frame is still a display cut.',
  warning: 'Approximate sheets, not surveyed borders and not an independently reviewed reconstruction. The coastline is a modern physical mask, not a historical shore. Inland edges remain the coarse historical-basemaps line, only softened for display. Overlapping polygons and residual categories are retained and labelled. A name match with a research record is not proof of sovereignty or of the drawn extent.',
  coastline: {
    dataset: 'Natural Earth 1:50 million land',
    version: 'v5.1.2',
    url: 'https://www.naturalearthdata.com/downloads/50m-physical-vectors/',
    license: 'public domain',
  },
  frame: FRAME,
  core: CORE,
  snapshots,
};
await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`);
await copyFile('/tmp/gpl-3.0.txt', join(outDir, 'LICENSE-GPL-3.0.txt'));
await writeFile(join(outDir, 'NOTICE.txt'), `Historical basemap snapshots
Dataset: historical-basemaps
Author: André Ourednik and contributors
Source: https://github.com/aourednik/historical-basemaps
License: GNU General Public License v3.0 only. See LICENSE-GPL-3.0.txt in this directory.
Retrieved: 2026-11-11 from the jsDelivr mirror of the master branch.

This project modified the GeoJSON. Shapes are cut to Natural Earth 50m land (public domain, v5.1.2) so they follow the modern coast, and long inland segments are lightly irregularised for display. That irregularity is not a claimed frontier. See src/data/basemap-index.json. The shapes are not verified historical borders.

The application code in this repository is not covered by this data license.
`);
console.log('wrote', sheets.length, 'snapshots');
