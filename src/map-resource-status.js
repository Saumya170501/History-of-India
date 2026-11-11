// Keep failures scoped to their source/tile; one recovered tile must not hide others.
export function createResourceStatus() {
  const failures = new Map();
  const key = event => `${event.sourceId || 'other'}:${event.tile?.tileID?.key ?? event.coord?.key ?? 'source'}`;
  return {
    fail(event) {
      if (event.error?.name === 'AbortError') return;
      failures.set(key(event), event.sourceId || 'other');
    },
    recover(event) {
      if (event.tile?.state === 'loaded' || (!event.tile && event.sourceDataType === 'metadata')) failures.delete(key(event));
    },
    reset() { failures.clear(); },
    boundaryFailed() { return [...failures.values()].includes('ohm-selected-boundaries'); },
    message() {
      const sources = new Set(failures.values());
      if (!sources.size) return '';
      if (sources.has('ohm-selected-boundaries')) return 'The kingdom boundary layer could not load. Other map layers may still be visible. Retry the map to check again.';
      if (sources.size === 1 && sources.has('ohm_landcover_hillshade')) return 'The optional OHM terrain shading could not load. Land and historical overlays may still work. Try Retry map, or check your connection to static-tiles.openhistoricalmap.org.';
      const names = [...sources].map(id => ({ ohm: 'OHM geography', ne: 'water background', osm_land: 'land background', ohm_landcover_hillshade: 'terrain shading', other: 'map resource' })[id] || id).join(', ');
      return `Could not load: ${names}. Local historical data may still work. Retry the map; if this persists, check browser Network errors for blocked or unavailable OHM tile requests.`;
    },
  };
}
