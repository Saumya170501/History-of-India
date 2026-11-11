// Pinned OHM 0.9.22 physical geography only. Never classify every fill as land.
// OHM static-tiles hillshade returns 404 for tiles in the India viewport.
// Omit that optional raster and its source before any requests start; keep vector geography.
const physicalIds = new Set([
  'background', 'land', 'landuse_areas_earth',
  'water_areas', 'water_areas_ne', 'water_lines_river',
  'water_lines_stream_no_name', 'water_lines_stream_name',
  'landuse_areas_z12_glacier-outline',
]);
// Remove unused dependencies BEFORE MapLibre starts fetching them.
export function physicalBasemapStyle(original) {
  const style = structuredClone(original);
  style.layers = style.layers.filter(layer => physicalIds.has(layer.id) && layer.type !== 'symbol');
  const sources = new Set(style.layers.map(layer => layer.source).filter(Boolean));
  style.sources = Object.fromEntries(Object.entries(style.sources).filter(([id]) => sources.has(id)));
  delete style.sprite;
  delete style.glyphs;
  return style;
}
export function hideBasemapContext(map) {
  // Call before installing application layers on each style.load.
  for (const layer of map.getStyle().layers || []) {
    if (layer.type === 'symbol' || /text|label/i.test(layer.id) || !physicalIds.has(layer.id))
      map.setLayoutProperty(layer.id, 'visibility', 'none');
  }
}
export const polygonFilter = ['==', ['geometry-type'], 'Polygon']; // Includes MultiPolygon.
export function influenceLayers(source, prefix, sourceLayer) {
  const common = { source, filter: polygonFilter, ...(sourceLayer ? { 'source-layer': sourceLayer } : {}) };
  return [
    { ...common, id: `${prefix}-halo`, type: 'line', layout: { 'line-join': 'round' }, paint: {
      'line-color': '#9063bd', 'line-opacity': 0.25,
      'line-width': ['interpolate', ['linear'], ['zoom'], 3, 12, 6, 24, 10, 36],
      'line-blur': ['interpolate', ['linear'], ['zoom'], 3, 10, 6, 20, 10, 30],
    } },
    { ...common, id: `${prefix}-fill`, type: 'fill', paint: {
      'fill-color': '#9063bd', 'fill-opacity': 0.22, 'fill-antialias': false,
      'fill-opacity-transition': { duration: 250 },
    } },
  ];
}
export function pointLayer(source) {
  return { id: 'historical-points', type: 'circle', source,
    filter: ['==', ['geometry-type'], 'Point'], paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 3, 6, 5, 10, 8],
      'circle-color': '#a35b3c', 'circle-opacity': 1,
      'circle-stroke-color': '#fffaf0', 'circle-stroke-width': 1.25,
    } };
}
// Colour-coded snapshot polygons. Residual categories stay faint and unlabelled.
// Labels use an external glyph source set by the map, not the hidden OHM symbol layers.
export function periodLayers(source) {
  return [
    { id: 'period-fill', type: 'fill', source, filter: polygonFilter, paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': ['case',
        ['boolean', ['feature-state', 'hover'], false], 0.62,
        ['==', ['get', 'kind'], 'residual'], 0.08,
        ['==', ['get', 'kind'], 'caution'], 0.14,
        0.33],
      'fill-antialias': true,
    } },
    { id: 'period-line', type: 'line', source, filter: polygonFilter, layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: {
      'line-color': ['case',
        ['==', ['get', 'kind'], 'residual'], '#8d887c',
        ['==', ['get', 'kind'], 'caution'], '#8a5a32',
        ['get', 'color']],
      'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.6, 6, 1.4],
      'line-blur': ['interpolate', ['linear'], ['zoom'], 3, 1.1, 6, 2.2],
      'line-opacity': ['case', ['==', ['get', 'kind'], 'caution'], 0.9, 0.45],
    } },
    { id: 'period-label', type: 'symbol', source, filter: ['==', ['get', 'kind'], 'named'], layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Open Sans Semibold'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 3, 10, 6, 13, 8, 16],
      'text-max-width': 8,
      'text-padding': 4,
      'text-allow-overlap': false,
      'symbol-sort-key': ['get', 'labelRank'],
    }, paint: {
      'text-color': '#1c2420',
      'text-halo-color': '#fbfaf5',
      'text-halo-width': 1.3,
    } },
    { id: 'period-caution-label', type: 'symbol', source, filter: ['==', ['get', 'kind'], 'caution'], layout: {
      'text-field': ['concat', ['get', 'name'], ' · sheet label'],
      'text-font': ['Open Sans Semibold'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 3, 10, 6, 13],
      'text-max-width': 10,
      'text-padding': 4,
      'text-allow-overlap': false,
    }, paint: {
      'text-color': '#6a3e22',
      'text-halo-color': '#fbfaf5',
      'text-halo-width': 1.3,
    } },
  ];
}
