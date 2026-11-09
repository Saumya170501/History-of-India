import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { boundaryBounds, matchSketch, sketchAvailable } from '../src/local-boundary.js';
const data = JSON.parse(fs.readFileSync(new URL('../public/data/1500s.geojson', import.meta.url)));
test('supplied sketch preserves cross-century dates and fits longitude/latitude bounds', () => {
  assert.deepEqual(boundaryBounds(matchSketch(data, 1605)), [[68, 20.5], [89, 34]]);
  assert.equal(sketchAvailable({id:'akbar'}, 1556), true);
  assert.equal(sketchAvailable({id:'akbar-ii'}, 1556), false);
  assert.equal(sketchAvailable({id:'akbar'}, 1606), false);
  assert.throws(() => matchSketch(data, 1555), /No exact/);
});
test('entity mismatch and invalid coordinates cannot create a displayed sketch', () => {
  const altered = structuredClone(data);
  altered.features[0].properties.entity_name = 'mughal empire';
  assert.throws(() => matchSketch(altered, 1586), /No exact/);
  altered.features[0].properties.entity_name = 'Mughal Empire';
  altered.features[0].geometry.coordinates[0][0][0] = NaN;
  assert.throws(() => matchSketch(altered, 1586), /coordinate/);
  assert.throws(() => boundaryBounds({features:[]}), /Empty/);
});
