import test from 'node:test';
import assert from 'node:assert/strict';
import { mapReference } from '../src/map-reference.js';

test('research links preserve early years, selected dates and the full browsing range', () => {
  for (const year of [1, 99, 1586, 2026]) {
    const result = mapReference({ geometry: null }, year);
    const date = `${String(year).padStart(4, '0')}-01-01`;
    assert.ok(result.embedUrl.includes(`date=${date}&layer=O`));
    assert.ok(result.sourceUrl.includes(`date=${date}&daterange=0001-01-01,2026-12-31`));
  }
});

test('switching from a located record to a ruler without geometry resets the viewport', () => {
  const record = { geometry: { type: 'Point', coordinates: [75.821861, 26.924278] } };
  const located = mapReference(record, 1730);
  assert.deepEqual(located.center, [26.924278, 75.821861]);
  assert.match(located.embedUrl, /map=6\/26.924278\/75.821861/);
  const unlocated = mapReference({ geometry: null }, 1576);
  assert.deepEqual(unlocated.center, [22, 80]);
  assert.equal(unlocated.zoom, 4);
  assert.match(unlocated.scope, /no verified map location or boundary/);
  assert.deepEqual(record.geometry.coordinates, [75.821861, 26.924278]);
});
