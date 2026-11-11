import { EMPTY_EMPIRES, fetchEmpires, filterEmpires, empireColor } from './empire-data.js';
import { EMPTY_BOUNDARY, SKETCH_NOTICE, sketchAvailable, fetchAkbarSketch, boundaryBounds } from './local-boundary.js';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import { filterByDate, constrainStyleToDateRange } from '@openhistoricalmap/maplibre-gl-dates';
import style from '@openhistoricalmap/map-styles/dist/historical/historical.json';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createResourceStatus } from './map-resource-status.js';
import { physicalBasemapStyle, hideBasemapContext, influenceLayers, pointLayer } from './historical-style.js';
import { kingdomNames, selectionFilter } from './ohm-selection.js';

export function attachHistoricalMap(map, { onStatus, onError, onBoundaryChange = () => {} }) {
  let gl, ready = false, selection = null, year = 1, enabled = true, hasBoundary = false;
  let sketch = EMPTY_BOUNDARY, sketchMessage = '', request = null, sketchKey = '';
  let empireData = EMPTY_EMPIRES;
  const resources = createResourceStatus();
  const layerIds = ['selected-ohm-halo', 'selected-ohm-fill'];
  let features = { type: 'FeatureCollection', features: [] };
  let regions = { type: 'FeatureCollection', features: [] };
  function updateStatus() {
    if (!ready) return;
    const names = kingdomNames(selection);
    if (!selection) return onStatus('Select a record to highlight its associated place or kingdom.');
    if (!enabled) return onStatus('Kingdom highlighting is hidden.');
    if (sketchMessage) return onStatus(sketchMessage);
    if (!names.length) return onStatus(selection.geometry
      ? `Selected place: ${selection.title}. Its marker is an associated location, not a territory.`
      : `No mapped location or kingdom boundary is established for ${selection.title}.`);
    if (!gl.isSourceLoaded('ohm-selected-boundaries')) return onStatus(`Loading OHM boundary matches for ${names[0]}…`);
    const matches = gl.querySourceFeatures('ohm-selected-boundaries', { sourceLayer: 'boundaries', filter: selectionFilter(selection, year) });
    if (matches.length && !hasBoundary) {
      hasBoundary = true;
      onBoundaryChange(true);
    }
    if (!matches.length && hasBoundary) return onStatus(`A dated boundary was found for ${names[0]}. Pan back to its area to see the highlight.`);
    if (!matches.length && resources.boundaryFailed()) return onStatus(`Boundary matching for ${names[0]} could not be confirmed because OHM resources failed to load. Try the direct OHM link below.`);
    onStatus(matches.length
      ? `Highlighted OHM name match: ${names[0]} · 1 January ${year} CE. This is provider data, not an independently verified extent of ${selection.title}.`
      : `No dated OHM boundary matching ${names[0]} is available in this view for ${year} CE. No substitute territory is drawn.`);
  }
  function sync() {
    if (!ready) return;
    gl.getSource('imported-empires').setData(filterEmpires(empireData, year));
    for (const id of ['imported-empires-halo', 'imported-empires-fill']) gl.setLayoutProperty(id, 'visibility', enabled ? 'visible' : 'none');
    filterByDate(gl, `${String(year).padStart(4, '0')}-01-01`);
    for (const id of layerIds) {
      gl.setFilter(id, ['all', ['==', ['geometry-type'], 'Polygon'], selectionFilter(selection, year)]);
      gl.setLayoutProperty(id, 'visibility', enabled && !sketch.features.length && kingdomNames(selection).length ? 'visible' : 'none');
    }
    for (const id of ['local-sketch-halo', 'local-sketch-fill']) gl.setLayoutProperty(id, 'visibility', enabled ? 'visible' : 'none');
    updateStatus();
  }
  async function loadSketch() {
    const key = `${selection?.id}:${year}:${enabled}`;
    if (key === sketchKey) return;
    sketchKey = key;
    request?.abort();
    sketch = EMPTY_BOUNDARY; sketchMessage = '';
    if (ready) gl.getSource('historical-boundaries').setData(sketch);
    if (!enabled || !sketchAvailable(selection, year)) return;
    const controller = new AbortController(); request = controller;
    sketchMessage = 'Loading user-supplied, unverified Akbar sketch…';
    try {
      const matched = await fetchAkbarSketch(year, controller.signal);
      if (controller.signal.aborted) return;
      sketch = matched; sketchMessage = SKETCH_NOTICE;
      if (ready) gl.getSource('historical-boundaries').setData(sketch);
      const [[west, south], [east, north]] = boundaryBounds(sketch);
      // Leaflet owns the camera in this app; its bridge synchronizes MapLibre.
      const drawer = document.querySelector('#evidence-drawer');
      const right = drawer && !drawer.hidden && innerWidth > 760 ? drawer.getBoundingClientRect().width + 50 : 40;
      map.fitBounds([[south, west], [north, east]], {
        paddingTopLeft: [40, 190], paddingBottomRight: [right, 170], maxZoom: 6,
        animate: !matchMedia('(prefers-reduced-motion: reduce)').matches, duration: 1.2,
      });
      sync();
    } catch (error) {
      if (controller.signal.aborted) return;
      sketchMessage = `Local sketch unavailable: ${error.message}`;
      updateStatus();
    }
  }
  try {
    const layer = maplibreGL({ style: physicalBasemapStyle(style), attributionControl: { customAttribution: '<a href="https://www.openhistoricalmap.org/copyright">OpenHistoricalMap contributors & licences</a>' }, interactive: false }).addTo(map);
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
      hideBasemapContext(gl);
      for (const spec of influenceLayers('ohm-selected-boundaries', 'selected-ohm', 'boundaries')) {
        spec.filter = ['all', spec.filter, selectionFilter(selection, year)];
        gl.addLayer(spec);
      }
      gl.addSource('imported-empires', { type: 'geojson', data: filterEmpires(empireData, year) });
      for (const spec of influenceLayers('imported-empires', 'imported-empires')) {
        spec.paint[spec.type === 'fill' ? 'fill-color' : 'line-color'] = empireColor;
        gl.addLayer(spec);
      }
      gl.addSource('historical-regions', { type: 'geojson', data: regions });
      for (const spec of influenceLayers('historical-regions', 'reviewed-region')) gl.addLayer(spec);
      gl.addSource('historical-boundaries', { type: 'geojson', data: sketch });
      for (const spec of influenceLayers('historical-boundaries', 'local-sketch')) {
        spec.paint[spec.type === 'fill' ? 'fill-color' : 'line-color'] = '#8b5cf6';
        gl.addLayer(spec);
      }
      gl.addSource('historical-records', { type: 'geojson', data: features });
      gl.addLayer(pointLayer('historical-records'));
      ready = true;
      gl.getCanvas().style.visibility = 'visible';
      sync();
    });
    gl.getCanvas().style.visibility = 'hidden';
    gl.on('idle', updateStatus);
    fetchEmpires(`${import.meta.env.BASE_URL}data/historical_empires.geojson`, AbortSignal.timeout(15000))
      .then(data => { empireData = data; sync(); })
      .catch(error => onError(`Imported empire polygons unavailable: ${error.message}. Existing record layers remain available.`));
  } catch {
    onError('OpenHistoricalMap needs WebGL and internet access. Open the OHM link below if this browser cannot display the map.');
  }
  return {
    setFeatures(next) {
      features = next;
      if (ready) gl.getSource('historical-records').setData(features);
    },
    setRegions(next) {
      regions = next;
      if (ready) gl.getSource('historical-regions').setData(regions);
    },
    retry() {
      if (!gl) { onError('This browser could not initialize WebGL. Try another browser or open the direct OHM link.'); return; }
      ready = false;
      resources.reset(); onError(''); onStatus('Retrying OpenHistoricalMap…');
      gl.getCanvas().style.visibility = 'hidden';
      gl.setStyle(physicalBasemapStyle(style), { diff: false });
    },
    select(record, selectedYear, show = true) {
      if (selection?.id !== record?.id || year !== selectedYear) hasBoundary = false;
      selection = record; year = selectedYear; enabled = show;
      loadSketch();
      onBoundaryChange(hasBoundary);
      if (!ready) onStatus('Loading OpenHistoricalMap…');
      sync();
    },
  };
}
