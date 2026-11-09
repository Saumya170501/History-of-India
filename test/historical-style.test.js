import test from 'node:test';
import assert from 'node:assert/strict';
import { hideBasemapContext, influenceLayers, pointLayer } from '../src/historical-style.js';
test('basemap sanitization hides labels and political fills but preserves physical geography', () => {
  const hidden = [];
  hideBasemapContext({ getStyle: () => ({ layers: [
    { id: 'city', type: 'symbol' }, { id: 'country_label', type: 'line' },
    { id: 'admin_country_lines_z10', type: 'line' }, { id: 'military', type: 'fill' },
    { id: 'land', type: 'fill' }, { id: 'water_lines_river', type: 'line' },
    { id: 'ohm_landcover_hillshade', type: 'raster' },
  ] }), setLayoutProperty: id => hidden.push(id) });
  assert.deepEqual(hidden, ['city', 'country_label', 'admin_country_lines_z10', 'military']);
});
test('point and polygon styles separate geometry without dashed territory lines', () => {
  assert.deepEqual(pointLayer('records').filter, ['==', ['geometry-type'], 'Point']);
  const layers = influenceLayers('regions', 'empire');
  for (const layer of layers) assert.deepEqual(layer.filter, ['==', ['geometry-type'], 'Polygon']);
  assert.ok(layers[0].paint['line-blur']);
  assert.equal(layers[0].paint['line-dasharray'], undefined);
  assert.equal(layers[1].paint['fill-blur'], undefined);
});
