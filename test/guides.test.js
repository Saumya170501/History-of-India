import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { searchAtlas } from '../src/atlas.js';
import { TOURS, resolveTour, successionLine } from '../src/guides.js';

const atlas = JSON.parse(readFileSync(new URL('../src/data/atlas.json', import.meta.url)));

test('atlas search ignores the selected year and stays in date order', () => {
  const hits = searchAtlas(atlas.records, 'Pulakeshin');
  assert.ok(hits.some((record) => record.id === 'harsha'));
  for (let i = 1; i < hits.length; i += 1) assert.ok(hits[i].startYear >= hits[i - 1].startYear);
  const slim = [{ id: 'harsha', title: 'Harsha', startYear: 606, searchText: 'stopped by Pulakeshin' }];
  assert.equal(searchAtlas(slim, 'pulakeshin')[0].id, 'harsha');
  assert.equal(searchAtlas(atlas.records, '').length, 0);
});

test('tours only stop on cited records inside their own date windows', () => {
  assert.equal(TOURS.length, 3);
  for (const tour of TOURS) {
    const stops = resolveTour(tour, atlas.records);
    assert.equal(stops.length, tour.stops.length);
    assert.ok(stops.every((stop) => stop.title));
  }
});

test('the Mughal succession is the cited ruler records in date order', () => {
  const line = successionLine(atlas.records);
  assert.equal(line[0].id, 'babur');
  assert.ok(line.some((record) => record.id === 'akbar'));
  assert.equal(line.some((record) => record.id === 'east-india-company'), false);
  for (let i = 1; i < line.length; i += 1) assert.ok(line[i].startYear >= line[i - 1].startYear);
  const cholas = successionLine(atlas.records, { ids: ['rajendra-reign', 'rajaraja-ii'] });
  assert.deepEqual(cholas.map((record) => record.id), ['rajendra-reign', 'rajaraja-ii']);
});
