// Keep failures scoped to their source/tile; one recovered tile must not hide others.
// A warning is for a failure that is still there after the map has settled, not for a tile that retries.
export function createResourceStatus() {
  const failures = new Map();
  const loadedSources = new Set();
  let shown = false;
  const key = event => `${event.sourceId || 'other'}:${event.tile?.tileID?.key ?? event.coord?.key ?? 'source'}`;
  const ignorable = event => {
    if (event.error?.name === 'AbortError') return true;
    const text = `${event.error?.message || ''} ${event.error || ''}`;
    return /glyph|sprite|font|pbf/i.test(text);
  };
  return {
    fail(event) {
      if (ignorable(event)) return;
      failures.set(key(event), event.sourceId || 'other');
    },
    recover(event) {
      const id = event.sourceId || 'other';
      const loadedTile = event.tile?.state === 'loaded';
      const metadata = !event.tile && event.sourceDataType === 'metadata';
      if (!loadedTile && !metadata) return;
      loadedSources.add(id);
      failures.delete(key(event));
    },
    // A source that loaded some tiles is up. Drop its stray tile errors.
    prunePartial() {
      for (const [id, source] of [...failures]) {
        const tileKey = id.slice(id.indexOf(':') + 1);
        if (tileKey !== 'source' && loadedSources.has(source)) failures.delete(id);
      }
    },
    reset() {
      failures.clear();
      loadedSources.clear();
      shown = false;
    },
    boundaryFailed() { return [...failures.values()].includes('ohm-selected-boundaries'); },
    message() {
      const sources = new Set(failures.values());
      if (!sources.size) return '';
      if (sources.has('ohm-selected-boundaries')) return 'The kingdom boundary layer could not load. Other map layers may still be visible. Retry the map to check again.';
      if (sources.size === 1 && sources.has('ohm_landcover_hillshade')) return 'The optional OHM terrain shading could not load. Land and historical overlays may still work. Try Retry map, or check your connection to static-tiles.openhistoricalmap.org.';
      const names = [...sources].map(id => ({ ohm: 'OHM geography', ne: 'water background', osm_land: 'land background', ohm_landcover_hillshade: 'terrain shading', empires: 'imported empire file', other: 'map resource' })[id] || id).join(', ');
      return `Could not load: ${names}. Local historical data may still work. Retry the map; if this persists, check browser Network errors for blocked or unavailable OHM tile requests.`;
    },
    // Empty until the caller says the failure has lasted (idle, or the settle delay).
    notice({ persistent = false } = {}) {
      const text = this.message();
      if (!text) {
        shown = false;
        return '';
      }
      if (!persistent && !shown) return '';
      shown = true;
      return text;
    },
  };
}
