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
