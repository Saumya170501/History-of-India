import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import { filterByDate, constrainStyleToDateRange } from '@openhistoricalmap/maplibre-gl-dates';
import style from '@openhistoricalmap/map-styles/dist/historical/historical.json';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createResourceStatus } from './map-resource-status.js';
import { kingdomNames, selectionFilter } from './ohm-selection.js';

export function attachHistoricalMap(map, { onStatus, onError }) {
  let gl, ready = false, selection = null, year = 1, enabled = true;
  const resources = createResourceStatus();
  const layerIds = ['selected-ohm-fill', 'selected-ohm-outline'];
  function updateStatus() {
    if (!ready) return;
    const names = kingdomNames(selection);
    if (!selection) return onStatus('Select a record to highlight its associated place or kingdom.');
    if (!enabled) return onStatus('Kingdom highlighting is hidden. Neighbouring kingdoms remain visible.');
    if (!names.length) return onStatus(selection.geometry
      ? `Selected place: ${selection.title}. Its marker is an associated location, not a territory.`
      : `Showing approximate related geography for ${selection.title}; no OHM kingdom association is established.`);
    if (!gl.isSourceLoaded('ohm-selected-boundaries')) return onStatus(`Loading OHM boundary matches for ${names[0]}…`);
    const matches = gl.querySourceFeatures('ohm-selected-boundaries', { sourceLayer: 'boundaries', filter: selectionFilter(selection, year) });
    if (!matches.length && resources.boundaryFailed()) return onStatus(`Boundary matching for ${names[0]} could not be confirmed because OHM resources failed to load. Try the direct OHM link below.`);
    onStatus(matches.length
      ? `Highlighted OHM name match: ${names[0]} · 1 January ${year} CE. This is provider data, not an independently verified extent of ${selection.title}.`
      : `No dated OHM boundary matching ${names[0]} is available in this view for ${year} CE. Use the labelled related-area circle for geographic context; neighbouring features remain visible.`);
  }
  function sync() {
    if (!ready) return;
    filterByDate(gl, `${String(year).padStart(4, '0')}-01-01`);
    for (const id of layerIds) {
      gl.setFilter(id, selectionFilter(selection, year));
      gl.setLayoutProperty(id, 'visibility', enabled && kingdomNames(selection).length ? 'visible' : 'none');
    }
    updateStatus();
  }
  try {
    const layer = maplibreGL({ style: structuredClone(style), attributionControl: { customAttribution: '<a href="https://www.openhistoricalmap.org/copyright">OpenHistoricalMap contributors & licences</a>' }, interactive: false }).addTo(map);
    gl = layer.getMaplibreMap();
    gl.on('error', event => {
      resources.fail(event); onError(resources.message()); updateStatus();
    });
    gl.on('sourcedata', event => {
      resources.recover(event); onError(resources.message());
    });
    gl.on('style.load', () => {
      // A replacement style needs new date constraints even when global date state survives.
      if (Object.hasOwn(gl.getGlobalState(), 'maplibre_gl_dates__startISODate')) constrainStyleToDateRange(gl);
      // Constrain the provider's neighbouring features before showing its canvas.
      filterByDate(gl, `${String(year).padStart(4, '0')}-01-01`);
      gl.addSource('ohm-selected-boundaries', {
        type: 'vector', url: 'https://vtiles.openhistoricalmap.org/maps/ohm_admin.json',
      });
      const before = gl.getStyle().layers.find(item => item.type === 'symbol')?.id;
      gl.addLayer({ id: layerIds[0], type: 'fill', source: 'ohm-selected-boundaries', 'source-layer': 'boundaries',
        filter: selectionFilter(selection, year), paint: { 'fill-color': '#df9c28', 'fill-opacity': 0.28 } }, before);
      gl.addLayer({ id: layerIds[1], type: 'line', source: 'ohm-selected-boundaries', 'source-layer': 'boundaries',
        filter: selectionFilter(selection, year), paint: { 'line-color': '#a94b16', 'line-width': 3, 'line-dasharray': [3, 2] } }, before);
      ready = true;
      gl.getCanvas().style.visibility = 'visible';
      sync();
    });
    gl.getCanvas().style.visibility = 'hidden';
    gl.on('idle', updateStatus);
  } catch {
    onError('OpenHistoricalMap needs WebGL and internet access. Open the OHM link below if this browser cannot display the map.');
  }
  return {
    retry() {
      if (!gl) { onError('This browser could not initialize WebGL. Try another browser or open the direct OHM link.'); return; }
      ready = false;
      resources.reset(); onError(''); onStatus('Retrying OpenHistoricalMap…');
      gl.getCanvas().style.visibility = 'hidden';
      gl.setStyle(structuredClone(style), { diff: false });
    },
    select(record, selectedYear, show = true) {
      selection = record; year = selectedYear; enabled = show;
      if (!ready) onStatus('Loading OpenHistoricalMap…');
      sync();
    },
  };
}
