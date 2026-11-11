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

test('physical style removes glyph and sprite downloads before initialization without mutating input', async () => {
  const { physicalBasemapStyle } = await import('../src/historical-style.js');
  const original = { version: 8, sprite: 'https://example.com/sprite', glyphs: 'https://example.com/{fontstack}/{range}.pbf', sources: { land: {type:'vector'}, labels: {type:'vector'} }, layers: [{id:'land',type:'fill',source:'land'}, {id:'city-label',type:'symbol',source:'labels'}] };
  const cleaned = physicalBasemapStyle(original);
  assert.equal(cleaned.sprite, undefined);
  assert.equal(cleaned.glyphs, undefined);
  assert.deepEqual(Object.keys(cleaned.sources), ['land']);
  assert.equal(original.layers.length, 2);
});
