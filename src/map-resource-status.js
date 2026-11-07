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
      return 'Some background or label resources could not load. Kingdom highlighting may still work. Retry the map to check again.';
    },
  };
}
