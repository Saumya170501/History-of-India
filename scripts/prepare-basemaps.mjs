// Rebuild clipped subcontinent snapshots from aourednik/historical-basemaps.
// Not part of the Vercel build. Run only when refreshing the vendored sheets.
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CORE, FRAME, RESIDUAL_COLOR, isResidualName, polityColor } from '../src/period-map.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public/data/basemaps');
const indexPath = join(root, 'src/data/basemap-index.json');
const upstream = 'https://cdn.jsdelivr.net/gh/aourednik/historical-basemaps@master/geojson';
const years = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1279, 1300,
  1400, 1492, 1500, 1530, 1600, 1650, 1700, 1715, 1783, 1800, 1815, 1880, 1900,
  1914, 1920, 1930, 1938, 1945, 1960, 1994, 2000, 2010,
];

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
    const point = [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
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
async function fetchYear(year) {
  const url = `${upstream}/world_${year}.geojson`;
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
function convert(collection, year) {
  const features = [];
  for (const feature of collection.features || []) {
    const name = feature.properties?.NAME;
    if (typeof name !== 'string' || !name.trim()) continue;
    const geometry = clipGeometry(feature.geometry);
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
const sheets = await pool(years, 4, async year => {
  const raw = await fetchYear(year);
  const collection = convert(raw, year);
  const file = `year-${year}.geojson`;
  await writeFile(join(outDir, file), JSON.stringify(collection));
  const named = collection.features.filter(feature => feature.properties.kind === 'named').map(feature => feature.properties.name);
  console.log(year, collection.features.length, named.join(' | '));
  return { year, file, featureCount: collection.features.length };
});
const index = {
  schemaVersion: 1,
  dataset: 'historical-basemaps',
  author: 'André Ourednik and contributors',
  repository: 'https://github.com/aourednik/historical-basemaps',
  license: 'GPL-3.0-only',
  licenseUrl: 'https://github.com/aourednik/historical-basemaps/blob/master/LICENSE',
  retrieved: '2026-11-11',
  modification: 'Each world sheet was clipped to longitude 56–101 and latitude 3–40, coordinates were rounded to 2 decimal degrees, unnamed features were dropped, and properties were reduced to name, part-of, subject-to, kind, year and colour. No borders were interpolated between sheets. Clipped edges are display cuts, not frontiers. Topology was not repaired.',
  warning: 'Coarse world-scale snapshots for orientation. Not an independently reviewed reconstruction of any year. Overlapping polygons and residual categories are retained and labelled. A name match with a research record is not proof of sovereignty or of the drawn extent.',
  frame: FRAME,
  core: CORE,
  snapshots: sheets,
};
await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`);
await copyFile('/tmp/gpl-3.0.txt', join(outDir, 'LICENSE-GPL-3.0.txt'));
await writeFile(join(outDir, 'NOTICE.txt'), `Historical basemap snapshots
Dataset: historical-basemaps
Author: André Ourednik and contributors
Source: https://github.com/aourednik/historical-basemaps
License: GNU General Public License v3.0 only. See LICENSE-GPL-3.0.txt in this directory.
Retrieved: 2026-11-11 from the jsDelivr mirror of the master branch.

This project modified the GeoJSON: clipped to the Indian subcontinent and immediate neighbours, rounded coordinates, dropped unnamed features, and removed properties other than those listed in src/data/basemap-index.json. The shapes are not verified historical borders.

The application code in this repository is not covered by this data license.
`);
console.log('wrote', sheets.length, 'snapshots');
