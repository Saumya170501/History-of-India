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

export function summarizeYear({ year, snapshotYear, gapYears, features, records }) {
  if (!Number.isInteger(year) || !Number.isInteger(snapshotYear) || !Number.isInteger(gapYears))
    throw new Error('Year summary needs integer years');
  const named = [];
  const residual = [];
  for (const feature of features || []) {
    const name = feature?.properties?.name;
    if (!name) continue;
    (feature.properties.kind === 'residual' || isResidualName(name) ? residual : named).push(name);
  }
  const cited = (records || []).filter(record =>
    POLITY_TYPES.includes(record.type) && year >= record.startYear && year <= record.endYear);
  const gap = gapYears === 0
    ? `The ${snapshotYear} CE snapshot is the published sheet for this year.`
    : `No sheet is published for ${year} CE. The nearest sheet is ${snapshotYear} CE, ${gapYears} years away. Borders are not interpolated.`;
  const namedList = unique(named);
  const residualList = unique(residual);
  const statement = [
    gap,
    `Named areas on this approximate sheet: ${namedList.length ? namedList.join(', ') : 'none'}.`,
    residualList.length ? `Residual source categories, not single kingdoms: ${residualList.join(', ')}.` : '',
    'These shapes are a coarse external digitization, clipped to the map frame. A straight edge at the frame is a display cut, not a frontier. They are not a verified political map.',
  ].filter(Boolean).join(' ');
  return {
    year,
    snapshotYear,
    gapYears,
    exact: gapYears === 0,
    named: namedList,
    residual: residualList,
    kingdoms: cited.filter(record => record.type !== 'ruler').map(record => record.title),
    rulers: cited.filter(record => record.type === 'ruler').map(record => record.title),
    statement,
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
  let previous = 0;
  const years = new Set();
  for (const snapshot of index?.snapshots || []) {
    if (!Number.isInteger(snapshot?.year) || snapshot.year < 1 || years.has(snapshot.year) || snapshot.year < previous)
      errors.push(`Basemap snapshot year out of order: ${snapshot?.year}`);
    previous = snapshot?.year || previous;
    years.add(snapshot?.year);
    if (typeof snapshot?.file !== 'string' || !/^year-\d+\.geojson$/.test(snapshot.file))
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
