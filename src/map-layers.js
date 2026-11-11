import { MIN_YEAR, MAX_YEAR, recordsForYear } from './atlas.js';

export const BATTLE_KINDS = {
  battle: 'Battlefield',
  siege: 'Siege location',
  aftermath: 'Aftermath · affected place',
};

// Context is intentionally independent of the catalogue's search/type filters.
export function battlesForYear(records, year) {
  return recordsForYear(records, year, 'battle');
}

export function regionsForRecord(layers, recordId, year) {
  return layers.regions.filter(region => region.recordIds.includes(recordId)
    && year >= region.startYear && year <= region.endYear);
}

export function referencesForRecord(layers, recordId, year) {
  return layers.references.filter(reference => reference.recordIds.includes(recordId)
    && year >= reference.startYear && year <= reference.endYear);
}

const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const validPoint = point => Array.isArray(point) && point.length === 2
  && point.every(Number.isFinite) && Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90;
const validRing = ring => Array.isArray(ring) && ring.length >= 4
  && ring.every(validPoint)
  && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1]
  && new Set(ring.slice(0, -1).map(point => point.join(','))).size >= 3
  && Math.abs(ring.slice(0, -1).reduce((area, point, index) =>
    area + point[0] * ring[index + 1][1] - ring[index + 1][0] * point[1], 0)) > 0;
const validPolygon = polygon => Array.isArray(polygon) && polygon.length > 0 && polygon.every(validRing);

export function validateMapLayers(layers, atlas) {
  const errors = [];
  if (layers?.schemaVersion !== 1 || !Array.isArray(layers.regions) || !Array.isArray(layers.references))
    return ['Expected map layers schemaVersion 1 with regions and references arrays.'];
  const records = new Map(atlas.records.map(record => [record.id, record]));
  const sources = new Set(atlas.sources.map(source => source.id));
  const ids = new Set();
  for (const item of [...layers.regions, ...layers.references]) {
    if (!item || typeof item !== 'object') { errors.push('Invalid map layer object.'); continue; }
    const fail = message => errors.push(`${item.id || 'Map layer'}: ${message}`);
    if (!nonempty(item.id) || ids.has(item.id)) fail('duplicate or missing ID');
    ids.add(item.id);
    for (const key of ['title', 'dateLabel', 'dateNote', 'uncertaintyNote'])
      if (!nonempty(item[key])) fail(`missing ${key}`);
    if (!Number.isInteger(item.startYear) || !Number.isInteger(item.endYear)
      || item.startYear < MIN_YEAR || item.endYear > MAX_YEAR || item.endYear < item.startYear)
      fail('invalid year window');
    if (!['year', 'century', 'approximate'].includes(item.datePrecision)) fail('invalid date precision');
    if (!Array.isArray(item.recordIds) || !item.recordIds.length
      || item.recordIds.some(id => !records.has(id))) fail('unresolved record association');
    else if (item.recordIds.some(id => {
      const record = records.get(id);
      return record.endYear < item.startYear || record.startYear > item.endYear;
    })) fail('record and map date windows do not overlap');
    if (!Array.isArray(item.citations) || !item.citations.length
      || item.citations.some(citation => !sources.has(citation?.sourceId)
        || !nonempty(citation?.locator) || !nonempty(citation?.supports))) fail('incomplete map citation');
  }
  for (const region of layers.regions) {
    if (!region || typeof region !== 'object') continue;
    const fail = message => errors.push(`${region.id}: ${message}`);
    if (!['political', 'cultural'].includes(region.kind)) fail('invalid region kind');
    for (const key of ['author', 'edition', 'page', 'scale', 'rights', 'digitizationMethod', 'competingInterpretations'])
      if (!nonempty(region.provenance?.[key])) fail(`missing boundary provenance ${key}`);
    if (!sources.has(region.provenance?.sourceId)) fail('unresolved boundary source');
    if (!nonempty(region.review?.reviewer) || region.review?.status !== 'reviewed'
      || !/^\d{4}-\d{2}-\d{2}$/.test(region.review?.date || '')
      || !Number.isFinite(Date.parse(region.review?.date))) fail('independent boundary review required');
    const geometry = region.geometry;
    if (!(geometry?.type === 'Polygon' && validPolygon(geometry.coordinates))
      && !(geometry?.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)
        && geometry.coordinates.length && geometry.coordinates.every(validPolygon)))
      fail('invalid boundary Polygon or MultiPolygon');
  }
  for (const reference of layers.references) {
    if (!reference || typeof reference !== 'object') continue;
    try {
      if (new URL(reference.url).protocol !== 'https:') throw new Error();
    } catch { errors.push(`${reference.id}: map reference must use HTTPS`); }
  }
  return errors;
}
