import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { relatedArea } from '../src/related-area.js';
const data = JSON.parse(readFileSync(new URL('../src/data/atlas.json', import.meta.url)));
const record = id => data.records.find(item => item.id === id);

test('every catalogue record has explicit, labelled geographic context without changing historical geometry', () => {
  const before = JSON.stringify(data);
  for (const item of data.records) {
    const area = relatedArea(item);
    assert.ok(area, item.id);
    assert.ok(area.label && area.basis, item.id);
    assert.equal(area.center.length, 2);
    assert.ok(area.center.every(Number.isFinite));
    assert.ok(Math.abs(area.center[0]) <= 90 && Math.abs(area.center[1]) <= 180);
    assert.ok(area.radiusKm > 0 && area.radiusKm <= 1200);
    assert.match(area.basis, /not/);
  }
  assert.equal(JSON.stringify(data), before);
});

test('context follows regional associations and preserves aftermath location semantics', () => {
  assert.match(relatedArea(record('early-huvishka')).label, /Northwestern/);
  assert.match(relatedArea(record('early-nagarjuna')).label, /vicinity/);
  assert.match(relatedArea(record('hoysala-dynasty')).label, /Southern/);
  assert.notDeepEqual(relatedArea(record('rajput-pratap')).center, relatedArea(record('rajput-jodha')).center);
  assert.match(relatedArea(record('kam-bakhsh')).label, /Deccan/);
  const aftermath = record('hampi-1565');
  assert.deepEqual(relatedArea(aftermath).center, [...aftermath.geometry.coordinates].reverse());
  assert.match(relatedArea(aftermath).label, /affected city/);
  assert.equal(relatedArea({ place: 'Unresearched geography' }), null);
});
