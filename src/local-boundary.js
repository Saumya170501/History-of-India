// User-supplied illustration, never promoted to the reviewed boundary dataset.
export const EMPTY_BOUNDARY = { type: 'FeatureCollection', features: [] };
export const SKETCH_NOTICE = 'User-supplied rough sketch: Mughal Empire / Akbar. Unverified geometry; 1556–1605 is a display window, not evidence of unchanged territory. Not an OHM or reviewed boundary.';
let cached;
export function sketchAvailable(record, year) {
  return record?.id === 'akbar' && Number.isInteger(year) && year >= 1556 && year <= 1605;
}
export function matchSketch(data, year) {
  if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw new Error('Expected a GeoJSON FeatureCollection.');
  const features = data.features.filter(f => f?.properties?.entity_name === 'Mughal Empire' &&
    f.properties.ruler === 'Akbar' && Number.isInteger(f.properties.start_year) &&
    Number.isInteger(f.properties.end_year) && f.properties.start_year <= year && year <= f.properties.end_year);
  if (!features.length) throw new Error('No exact Mughal Empire / Akbar match for this year.');
  const matched = { type: 'FeatureCollection', features };
  boundaryBounds(matched); // Validate before handing coordinates to the renderer.
  return matched;
}
export function boundaryBounds(data) {
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
  for (const feature of data.features) {
    const geometry = feature.geometry;
    if (!['Polygon', 'MultiPolygon'].includes(geometry?.type)) throw new Error('Boundary must be Polygon or MultiPolygon.');
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    if (!Array.isArray(polygons) || !polygons.length) throw new Error('Empty boundary.');
    for (const polygon of polygons) {
      if (!Array.isArray(polygon) || !polygon.length) throw new Error('Empty polygon.');
      for (const ring of polygon) {
        if (!Array.isArray(ring) || ring.length < 4) throw new Error('Invalid polygon ring.');
        for (const point of ring) {
          if (!Array.isArray(point) || point.length < 2) throw new Error('Invalid coordinate.');
          const [lon, lat] = point;
          if (!Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lon) > 180 || Math.abs(lat) > 90) throw new Error('Invalid coordinate range.');
          west = Math.min(west, lon); south = Math.min(south, lat);
          east = Math.max(east, lon); north = Math.max(north, lat);
        }
        if (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1]) throw new Error('Polygon ring is not closed.');
      }
    }
  }
  if (![west, south, east, north].every(Number.isFinite) || west === east || south === north) throw new Error('Empty or degenerate boundary.');
  return [[west, south], [east, north]];
}
export async function fetchAkbarSketch(year, signal) {
  signal.throwIfAborted();
  // Reuse the same file for 1600–1605; do not truncate a cross-century window.
  if (!cached) {
    const response = await fetch(`${import.meta.env.BASE_URL}data/1500s.geojson`, { signal });
    if (!response.ok) throw new Error(`Boundary download failed (${response.status}).`);
    const data = await response.json();
    signal.throwIfAborted();
    matchSketch(data, year);
    cached = data;
  }
  signal.throwIfAborted();
  return matchSketch(cached, year);
}
