import { useEffect, useRef, useState } from 'react';
import { fetchEmpires, filterEmpires, EMPTY_EMPIRES, empireColor } from '../../src/empire-data.js';
import { influenceLayers } from '../../src/historical-style.js';

// One instance per map. Call from a React component with a stable MapLibre map.
export function useHistoricalEmpires(map, currentEra) {
  const [data, setData] = useState(EMPTY_EMPIRES);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const latest = useRef({ data, currentEra });
  useEffect(() => {
    const controller = new AbortController();
    fetchEmpires(`${import.meta.env.BASE_URL}data/historical_empires.geojson`, controller.signal)
      .then(setData)
      .catch(e => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    latest.current = { data, currentEra };
    if (map?.getSource('historical-empires')) {
      map.getSource('historical-empires').setData(filterEmpires(data, currentEra));
    }
  }, [map, data, currentEra]);
  useEffect(() => {
    if (!map) return;
    const sourceId = 'historical-empires';
    const layers = influenceLayers(sourceId, sourceId);
    function install() {
      const next = filterEmpires(latest.current.data, latest.current.currentEra);
      if (!map.getSource(sourceId)) map.addSource(sourceId, { type: 'geojson', data: next });
      else map.getSource(sourceId).setData(next);
      for (const spec of layers) {
        spec.paint[spec.type === 'fill' ? 'fill-color' : 'line-color'] = empireColor;
        if (!map.getLayer(spec.id)) map.addLayer(spec);
      }
    }
    map.on('style.load', install);
    if (map.isStyleLoaded()) install();
    return () => {
      map.off('style.load', install);
      for (const {id} of [...layers].reverse()) if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map]);
  return { loading, error, featureCount: filterEmpires(data, currentEra).features.length };
}
