import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { battlesForYear, regionsForRecord, referencesForRecord, validateMapLayers } from '../src/map-layers.js';
import { validateAtlas } from '../src/atlas.js';

const atlas = JSON.parse(readFileSync(new URL('../src/data/atlas.json', import.meta.url)));
const layers = JSON.parse(readFileSync(new URL('../src/data/map-layers.json', import.meta.url)));

// Synthetic test geometry, never shipped as historical evidence.
function fixture() {
  return { schemaVersion: 1, references: [], regions: [{
    id: 'test-only-region', title: 'Synthetic test region', recordIds: ['early-kanishka-i'],
    startYear: 127, endYear: 150, datePrecision: 'approximate', dateLabel: 'Test interval',
    dateNote: 'Synthetic dates', uncertaintyNote: 'Synthetic geometry', kind: 'political',
    citations: [{ sourceId: 'harvard-early', locator: 'Test locator', supports: 'Test claim' }],
    provenance: { sourceId: 'harvard-early', author: 'Test author', edition: 'Test edition',
      page: 'Test page', scale: 'Test scale', rights: 'Test rights', digitizationMethod: 'Test method', competingInterpretations: 'Test alternatives' },
    review: { reviewer: 'Test reviewer', status: 'reviewed', date: '2026-11-07' },
    geometry: { type: 'Polygon', coordinates: [[[0,0],[1,0],[0,1],[0,0]]] },
  }] };
}

test('published map references validate without inventing historical shapes', () => {
  assert.deepEqual(validateMapLayers(layers, atlas), []);
  assert.equal(layers.regions.length, 0);
  assert.equal(referencesForRecord(layers, 'early-kanishka-i', 150).length, 1);
  assert.equal(referencesForRecord(layers, 'early-rudrapurushadatta', 301).length, 0);
  assert.equal(referencesForRecord(layers, 'hampi-1565', 1565).length, 0);
});

test('boundary windows include endpoints without interpolation or association leakage', () => {
  const data = fixture();
  assert.deepEqual(validateMapLayers(data, atlas), []);
  for (const year of [127,150]) assert.equal(regionsForRecord(data, 'early-kanishka-i', year).length, 1);
  for (const year of [126,151]) assert.equal(regionsForRecord(data, 'early-kanishka-i', year).length, 0);
  assert.equal(regionsForRecord(data, 'early-huvishka', 150).length, 0);
});

test('boundaries need review, reuse rights, uncertainty and supported associations', () => {
  const data = fixture();
  delete data.regions[0].review;
  delete data.regions[0].provenance.rights;
  data.regions[0].uncertaintyNote = '';
  data.regions[0].recordIds = ['unknown'];
  const errors = validateMapLayers(data, atlas).join('\n');
  for (const term of ['review', 'rights', 'uncertaintyNote', 'association']) assert.ok(errors.includes(term), term);
});

test('malformed boundaries and unsafe reference URLs are rejected', () => {
  for (const coordinates of [null, [], [[[0,0],[1,0],[0,1]]], [[[0,0],[1,1],[2,2],[0,0]]], [[[0,0],[181,0],[0,1],[0,0]]]]) {
    const data = fixture(); data.regions[0].geometry.coordinates = coordinates;
    assert.ok(validateMapLayers(data, atlas).some(error => error.includes('Polygon')));
  }
  const data = structuredClone(layers); data.references[0].url = 'javascript:alert(1)';
  assert.ok(validateMapLayers(data, atlas).some(error => error.includes('HTTPS')));
  assert.ok(validateMapLayers({schemaVersion:1,regions:[null],references:[]}, atlas).length);
});

test('battle context retains aftermath semantics and only the cited date window', () => {
  assert.equal(battlesForYear(atlas.records, 1564).length, 0);
  assert.equal(battlesForYear(atlas.records, 1566).length, 0);
  const battle = battlesForYear(atlas.records, 1565)[0];
  assert.equal(battle.eventKind, 'aftermath');
  assert.match(battle.locationNote, /not at the battlefield/);
  const invalid = structuredClone(atlas);
  delete invalid.records.find(record => record.id === battle.id).eventKind;
  assert.ok(validateAtlas(invalid).some(error => error.includes('eventKind')));
});
