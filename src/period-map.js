import { MIN_YEAR, formatYear } from './atlas.js';
import { MAX_DISPLAY_GAP } from './sheet-policy.js';

// Year → polity lookup for coarse external snapshots.
// These shapes are not reviewed regional overlays and are never catalogue geometry.

export const FRAME = Object.freeze({ west: 56, south: 3, east: 101, north: 40 });
export const CORE = Object.freeze({ west: 64, south: 6, east: 98, north: 37 });
export const POLITY_TYPES = ['ruler', 'kingdom', 'state'];
export const RESIDUAL_COLOR = '#b7b2a6';
export const PALETTE = Object.freeze([
  '#2f6b54', '#b86b3a', '#3f5f8a', '#8a4f6a', '#5f7340', '#a6843a',
  '#3f7474', '#8a5636', '#5a4e86', '#3a6e86', '#8a3e4e', '#4e6840',
  '#7a5e32', '#3d5a62', '#6d4a38', '#3f6458',
]);
// Undifferentiated labels in the source snapshots. A plural or combined
// category is not treated as one kingdom.
const RESIDUAL_NAMES = new Set([
  'hindu kingdoms',
  'rajput kingdoms',
  'islamic and hindu states',
  'burmese kingdoms',
  'shan states',
  'malaysian islamic states',
  'central asian khanates',
]);

export function isResidualName(name) {
  const n = String(name || '').trim().toLowerCase();
  if (!n) return true;
  if (RESIDUAL_NAMES.has(n)) return true;
  if (/\band\b/.test(n) && /\b(states|kingdoms|khanates|peoples)\b/.test(n)) return true;
  // Plural catch-alls such as "Sinhalese kingdoms" or "Mahratta states".
  // Singular "princely state" stays a named snapshot label.
  if (/\b(kingdoms|states|khanates|principalities|warlords)\b/.test(n)) return true;
  if (/\bminor\b/.test(n)) return true;
  return false;
}

export function polityColor(name) {
  const text = String(name || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 33 + text.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function nearestSnapshot(year, snapshots) {
  if (!Number.isInteger(year)) throw new Error('Invalid historical year');
  if (!Array.isArray(snapshots) || !snapshots.length) return null;
  let best = null;
  let bestGap = Infinity;
  for (const snapshot of snapshots) {
    if (!Number.isInteger(snapshot?.year)) throw new Error('Snapshot year missing');
    const gap = Math.abs(year - snapshot.year);
    // Ties keep the earlier sheet so a later map is not applied backwards.
    if (gap < bestGap || (gap === bestGap && snapshot.year < best.year)) {
      best = snapshot;
      bestGap = gap;
    }
  }
  return { snapshot: best, gapYears: bestGap, exact: bestGap === 0 };
}

function linkMatches(record, link) {
  if (link.recordIds?.includes(record.id)) return true;
  if (link.tag && record.tags?.includes(link.tag)) return true;
  if (link.placeIncludes && record.place?.includes(link.placeIncludes)) return true;
  return false;
}

export function recordsForPolity(name, links, records, year) {
  if (!Number.isInteger(year)) throw new Error('Invalid historical year');
  const wanted = String(name || '').trim().toLowerCase();
  const link = (links || []).find(item => String(item?.name || '').trim().toLowerCase() === wanted);
  if (!link) return [];
  return records.filter(record =>
    POLITY_TYPES.includes(record.type) &&
    year >= record.startYear &&
    year <= record.endYear &&
    linkMatches(record, link));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function summarizeYear({ year, snapshotYear, gapYears, features, records, suppressed = false, omitted = [] }) {
  if (!Number.isInteger(year) || !Number.isInteger(snapshotYear) || !Number.isInteger(gapYears))
    throw new Error('Year summary needs integer years');
  const cited = (records || []).filter(record =>
    POLITY_TYPES.includes(record.type) && year >= record.startYear && year <= record.endYear);
  const kingdoms = cited.filter(record => record.type !== 'ruler').map(record => record.title);
  const rulers = cited.filter(record => record.type === 'ruler').map(record => record.title);
  if (suppressed) {
    const lead = gapYears > MAX_DISPLAY_GAP
      ? `No close political sheet for ${formatYear(year)}. The nearest sheet is ${formatYear(snapshotYear)}, ${gapYears} years away, so it is not drawn.`
      : `No close political sheet for ${formatYear(year)}. The nearest sheet is ${formatYear(snapshotYear)}, ${gapYears} years away, and it is a later country map, so it is not drawn.`;
    return {
      year, snapshotYear, gapYears, exact: false, suppressed: true,
      named: [], residual: [], cautions: [], omitted: [], kingdoms, rulers, lead,
      statement: `${lead} Cited records for this year are still listed. Borders are not interpolated.`,
    };
  }
  const named = [];
  const residual = [];
  const cautions = [];
  for (const feature of features || []) {
    const name = feature?.properties?.name;
    if (!name) continue;
    if (feature.properties.kind === 'caution') {
      cautions.push({ name, note: feature.properties.caution || '' });
      continue;
    }
    (feature.properties.kind === 'residual' || isResidualName(name) ? residual : named).push(name);
  }
  const namedList = unique(named);
  const residualList = unique(residual);
  const cautionList = [];
  const seenCaution = new Set();
  for (const item of cautions) {
    if (seenCaution.has(item.name)) continue;
    seenCaution.add(item.name);
    cautionList.push(item);
  }
  const gap = gapYears === 0
    ? `The ${formatYear(snapshotYear)} snapshot is the published sheet for this year. The fill is approximate and low confidence: a coarse world sheet, not a surveyed border.`
    : `No sheet is published for ${formatYear(year)}. The nearest sheet is ${formatYear(snapshotYear)}, ${gapYears} years away. Borders are not interpolated. The fill is approximate and low confidence.`;
  const lead = gapYears === 0
    ? `Who was mapped in ${formatYear(year)} · snapshot ${formatYear(snapshotYear)} · approximate`
    : `Who was mapped near ${formatYear(year)} · nearest snapshot ${formatYear(snapshotYear)} · ${gapYears} years away · borders are not interpolated`;
  const statement = [
    gap,
    `Named areas on this approximate sheet: ${namedList.length ? namedList.join(', ') : 'none'}.`,
    residualList.length ? `Residual source categories, not single kingdoms: ${residualList.join(', ')}.` : '',
    cautionList.length
      ? `Sheet labels that disagree with the cited research: ${cautionList.map(item => item.name).join(', ')}.`
      : '',
    omitted.length
      ? `Not drawn for ${formatYear(year)}, because the cited dates do not support the sheet name: ${omitted.map(item => item.name).join(', ')}. No replacement boundary has been added.`
      : '',
    'The coast follows a modern land mask so the colour stops at the sea. Inland edges are the coarse sheet, lightly softened for display, not a surveyed frontier. A straight edge on the frame is a display cut. They are not a verified political map.',
  ].filter(Boolean).join(' ');
  return {
    year,
    snapshotYear,
    gapYears,
    exact: gapYears === 0,
    suppressed: false,
    named: namedList,
    residual: residualList,
    cautions: cautionList,
    omitted,
    kingdoms,
    rulers,
    lead,
    statement,
  };
}

function ringCentroid(ring) {
  let area = 0;
  let x = 0;
  let y = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    const cross = x1 * y2 - x2 * y1;
    area += cross;
    x += (x1 + x2) * cross;
    y += (y1 + y2) * cross;
  }
  if (Math.abs(area) < 1e-12) return { area: 0, point: ring[0] };
  return { area: area / 2, point: [x / (3 * area), y / (3 * area)] };
}

// One label point per name. A polygon label was repeating once the shape crossed a tile edge.
export function labelPoints(features) {
  const best = new Map();
  for (const feature of features || []) {
    const name = feature?.properties?.name;
    const kind = feature?.properties?.kind;
    if (!name || (kind !== 'named' && kind !== 'caution')) continue;
    const polygons = feature.geometry?.type === 'Polygon' ? [feature.geometry.coordinates]
      : feature.geometry?.type === 'MultiPolygon' ? feature.geometry.coordinates : [];
    for (const polygon of polygons) {
      const ring = polygon?.[0];
      if (!ring || ring.length < 4) continue;
      const { area, point } = ringCentroid(ring);
      const size = Math.abs(area);
      const previous = best.get(name);
      if (!previous || size > previous.size) {
        best.set(name, {
          size, point, kind,
          color: feature.properties.color || '',
          caution: feature.properties.caution || '',
        });
      }
    }
  }
  return {
    type: 'FeatureCollection',
    features: [...best.entries()].map(([name, item]) => ({
      type: 'Feature',
      properties: { name, kind: item.kind, color: item.color, caution: item.caution },
      geometry: { type: 'Point', coordinates: item.point.map(value => Math.round(value * 1000) / 1000) },
    })),
  };
}

function walkPositions(coords, visit) {
  if (!Array.isArray(coords)) return;
  if (typeof coords[0] === 'number') visit(coords);
  else for (const part of coords) walkPositions(part, visit);
}

// Bounds of the shapes actually drawn. Named polities define the frame when any exist,
// so a residual category that covers the whole clip does not pull the view out to empty ocean.
export function boundsOfFeatures(features, { namedOnly = true } = {}) {
  const list = Array.isArray(features) ? features : [];
  const named = list.filter(feature => feature?.properties?.kind !== 'residual');
  const chosen = namedOnly && named.length ? named : list;
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const feature of chosen) {
    walkPositions(feature?.geometry?.coordinates, ([lon, lat]) => {
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;
      west = Math.min(west, lon);
      east = Math.max(east, lon);
      south = Math.min(south, lat);
      north = Math.max(north, lat);
    });
  }
  if (![west, south, east, north].every(Number.isFinite) || east - west < 0.05 || north - south < 0.05) return null;
  return { west, south, east, north };
}

export function validateBasemapIndex(index) {
  const errors = [];
  if (index?.schemaVersion !== 1) errors.push('Basemap index schemaVersion must be 1.');
  for (const key of ['dataset', 'author', 'repository', 'license', 'licenseUrl', 'retrieved', 'modification', 'warning'])
    if (typeof index?.[key] !== 'string' || !index[key].trim()) errors.push(`Basemap index missing ${key}.`);
  if (index?.license !== 'GPL-3.0-only') errors.push('Basemap license must stay GPL-3.0-only.');
  if (!Array.isArray(index?.snapshots) || !index.snapshots.length) errors.push('Basemap index has no snapshots.');
  let previous = Number.NEGATIVE_INFINITY;
  const years = new Set();
  for (const snapshot of index?.snapshots || []) {
    if (!Number.isInteger(snapshot?.year) || snapshot.year === 0 || snapshot.year < MIN_YEAR || years.has(snapshot.year) || snapshot.year < previous)
      errors.push(`Basemap snapshot year out of order: ${snapshot?.year}`);
    previous = snapshot?.year || previous;
    years.add(snapshot?.year);
    if (typeof snapshot?.file !== 'string' || !/^year--?\d+\.geojson$/.test(snapshot.file))
      errors.push(`Basemap file name invalid: ${snapshot?.file}`);
    if (!Number.isInteger(snapshot?.featureCount) || snapshot.featureCount < 1)
      errors.push(`Basemap feature count invalid for ${snapshot?.year}`);
  }
  for (const key of ['west', 'south', 'east', 'north'])
    if (index?.frame?.[key] !== FRAME[key]) errors.push(`Basemap frame ${key} does not match the clip constants.`);
  return errors;
}

export function validateBasemapCollection(collection, year) {
  const errors = [];
  if (collection?.type !== 'FeatureCollection' || !Array.isArray(collection.features))
    return [`${year}: expected a FeatureCollection.`];
  const ids = new Set();
  for (const feature of collection.features) {
    if (!['Polygon', 'MultiPolygon'].includes(feature?.geometry?.type))
      errors.push(`${year}: geometry must be a polygon`);
    const props = feature?.properties || {};
    if (typeof props.name !== 'string' || !props.name.trim()) errors.push(`${year}: missing polity name`);
    if (!['named', 'residual'].includes(props.kind)) errors.push(`${year}: kind must be named or residual`);
    if (props.kind === 'residual' && !isResidualName(props.name))
      errors.push(`${year}: ${props.name} is marked residual without a residual name`);
    if (props.kind === 'named' && isResidualName(props.name))
      errors.push(`${year}: residual name ${props.name} was marked named`);
    if (props.snapshotYear !== year) errors.push(`${year}: feature snapshot year mismatch`);
    const allowed = props.kind === 'residual' ? props.color === RESIDUAL_COLOR : PALETTE.includes(props.color);
    if (!allowed) errors.push(`${year}: ${props.name} color is outside the palette`);
    if (!Number.isInteger(feature.id) || ids.has(feature.id)) errors.push(`${year}: feature id missing or duplicated`);
    ids.add(feature.id);
    walkPositions(feature.geometry?.coordinates, position => {
      const [lon, lat] = position;
      if (!Number.isFinite(lon) || !Number.isFinite(lat) ||
        lon < FRAME.west - 0.001 || lon > FRAME.east + 0.001 ||
        lat < FRAME.south - 0.001 || lat > FRAME.north + 0.001)
        errors.push(`${year}: ${props.name} coordinate outside the display frame`);
    });
  }
  return errors;
}
