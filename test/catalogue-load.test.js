import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recordsForYear } from '../src/atlas.js';
import { slimCatalogue, slimRecord } from '../src/catalogue-load.js';

const atlas = JSON.parse(readFileSync(new URL('../src/data/atlas.json', import.meta.url)));

test('the loaded catalogue keeps search text and leaves biographies for a later file', () => {
  const slim = slimCatalogue(atlas);
  const harsha = slim.records.find(record => record.id === 'harsha');
  assert.equal(harsha.details, undefined);
  assert.equal(harsha.hasProfile, true);
  assert.match(harsha.searchText, /Pulakeshin/);
  assert.equal(slimRecord(atlas.records.find(record => record.id === 'rudra-singh')).hasProfile, undefined);
  assert.equal(recordsForYear(slim.records, 620, 'ruler', 'Pulakeshin').some(record => record.id === 'harsha'), true);
  const ellora = atlas.records.find(record => record.id === 'ellora-caves');
  assert.deepEqual(ellora.geometry.coordinates, [75.17917, 20.02639]);
  assert.deepEqual(atlas.records.find(record => record.id === 'harsha').geometry.coordinates, [79.913971, 27.051019]);
  assert.equal(atlas.records.find(record => record.id === 'ashoka').geometry, null);
  assert.ok(recordsForYear(atlas.records, -300).some(record => record.id === 'chandragupta-maurya'));
  assert.equal(atlas.records.find(record => record.id === 'republic-of-india').geometry, null);
  assert.ok(recordsForYear(atlas.records, 1950).some(record => record.id === 'republic-of-india'));
  assert.ok(recordsForYear(atlas.records, 1942).some(record => record.id === 'quit-india'));
  assert.equal(recordsForYear(atlas.records, 1941).some(record => record.id === 'quit-india'), false);
  assert.ok(recordsForYear(atlas.records, 700).some(record => record.id === 'mahabalipuram-monuments'));
  assert.ok(recordsForYear(atlas.records, 1700).some(record => record.id === 'rudra-singh'));
});
