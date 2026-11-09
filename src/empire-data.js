export const EMPTY_EMPIRES = { type: 'FeatureCollection', features: [] };
export function empireCategory(name) {
  const text = String(name || '').toLowerCase();
  return text.includes('mughal') || text.includes('mogul') ? 'Mughal' : text.includes('maratha') ? 'Maratha' : text.includes('rajput') ? 'Rajput' : 'Other';
}
export function filterEmpires(data, currentEra) {
  if (!Number.isInteger(currentEra)) throw new Error('Invalid historical year');
  if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw new Error('Expected empire FeatureCollection');
  return { type: 'FeatureCollection', features: data.features.filter(f =>
    ['Polygon', 'MultiPolygon'].includes(f.geometry?.type) && typeof f.properties?.entity_name === 'string' &&
    Number.isInteger(f.properties.start_year) && Number.isInteger(f.properties.end_year) &&
    f.properties.start_year <= currentEra && currentEra <= f.properties.end_year
  ).map(f => ({ ...f, properties: { ...f.properties, empire_category: empireCategory(f.properties.entity_name) } })) };
}
export async function fetchEmpires(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Empire data HTTP ${response.status}`);
  const data = await response.json();
  filterEmpires(data, 1500); // Validate the collection envelope.
  return data;
}
export const empireColor = ['match', ['get', 'empire_category'],
  'Mughal', '#658674', 'Maratha', '#cf8b42', 'Rajput', '#c3a34d', '#8a8d91'];
