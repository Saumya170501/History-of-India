import test from 'node:test';
import assert from 'node:assert/strict';
import { hideBasemapContext, influenceLayers, periodLayers, pointLayer } from '../src/historical-style.js';
test('basemap sanitization hides labels and political fills but preserves physical geography', () => {
  const hidden = [];
  hideBasemapContext({ getStyle: () => ({ layers: [
    { id: 'city', type: 'symbol' }, { id: 'country_label', type: 'line' },
    { id: 'admin_country_lines_z10', type: 'line' }, { id: 'military', type: 'fill' },
    { id: 'land', type: 'fill' }, { id: 'water_lines_river', type: 'line' },
    { id: 'ohm_landcover_hillshade', type: 'raster' },
  ] }), setLayoutProperty: id => hidden.push(id) });
  assert.deepEqual(hidden, ['city', 'country_label', 'admin_country_lines_z10', 'military', 'ohm_landcover_hillshade']);
});
test('point and polygon styles separate geometry without dashed territory lines', () => {
  assert.deepEqual(pointLayer('records').filter, ['==', ['geometry-type'], 'Point']);
  const layers = influenceLayers('regions', 'empire');
  for (const layer of layers) assert.deepEqual(layer.filter, ['==', ['geometry-type'], 'Polygon']);
  assert.ok(layers[0].paint['line-blur']);
  assert.equal(layers[0].paint['line-dasharray'], undefined);
  assert.equal(layers[1].paint['fill-blur'], undefined);
  const period = periodLayers('period-polities');
  assert.equal(period[0].paint['fill-color'][1], 'color');
  assert.equal(period[2].filter[2], 'named');
  assert.equal(period[1].paint['line-dasharray'], undefined);
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


test('pinned OHM style never requests unavailable hillshade but retains vector land and water', async () => {
  const { readFile } = await import('node:fs/promises');
  const { physicalBasemapStyle } = await import('../src/historical-style.js');
  const original = JSON.parse(await readFile(new URL('../node_modules/@openhistoricalmap/map-styles/dist/historical/historical.json', import.meta.url)));
  for (const cleaned of [physicalBasemapStyle(original), physicalBasemapStyle(original)]) {
    assert.equal(cleaned.sources.ohm_landcover_hillshade, undefined);
    assert.equal(cleaned.layers.some(layer => layer.type === 'raster'), false);
    assert.equal(JSON.stringify(cleaned).includes('static-tiles.openhistoricalmap.org'), false);
    for (const id of ['land', 'water_areas', 'water_lines_river']) assert.ok(cleaned.layers.some(layer => layer.id === id));
    for (const layer of cleaned.layers) if (layer.source) assert.ok(cleaned.sources[layer.source]);
  }
  assert.ok(original.sources.ohm_landcover_hillshade);
});
