import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  PALETTE, boundsOfFeatures, isResidualName, nearestSnapshot, polityColor, recordsForPolity,
  summarizeYear, validateBasemapCollection, validateBasemapIndex,
} from '../src/period-map.js';

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const atlas = read('../src/data/atlas.json');
const index = read('../src/data/basemap-index.json');
const links = read('../src/data/polity-links.json');
const sheet = (year) => read(`../public/data/basemaps/year-${year}.geojson`);
const record = (id) => atlas.records.find(item => item.id === id);

test('nearest snapshot never interpolates and ties keep the earlier sheet', () => {
  const snapshots = [{ year: 100 }, { year: 200 }, { year: 300 }];
  assert.equal(nearestSnapshot(300, snapshots).exact, true);
  assert.equal(nearestSnapshot(300, snapshots).gapYears, 0);
  const between = nearestSnapshot(160, snapshots);
  assert.equal(between.snapshot.year, 200);
  assert.equal(between.gapYears, 40);
  assert.equal(between.exact, false);
  assert.equal(nearestSnapshot(150, snapshots).snapshot.year, 100);
  assert.equal(nearestSnapshot(1, index.snapshots).snapshot.year, 100);
  assert.equal(nearestSnapshot(2026, index.snapshots).snapshot.year, 2010);
});

test('residual categories are not treated as single kingdoms', () => {
  assert.equal(isResidualName('Islamic and Hindu states'), true);
  assert.equal(isResidualName('Mahratta states'), true);
  assert.equal(isResidualName('Sinhalese kingdoms'), true);
  assert.equal(isResidualName('Kushan Principalities'), true);
  assert.equal(isResidualName('Mughal Empire'), false);
  assert.equal(isResidualName('Mysore (Indian princely state)'), false);
  assert.equal(isResidualName('British East India Company'), false);
});

test('polity colours are stable palette entries', () => {
  assert.equal(polityColor('Mughal Empire'), polityColor('Mughal Empire'));
  assert.ok(PALETTE.includes(polityColor('Chola Empire')));
  assert.notEqual(polityColor('Mughal Empire'), polityColor('Chola Empire'));
});

test('year lookup returns only linked records inside the selected year', () => {
  const in1600 = recordsForPolity('Mughal Empire', links.links, atlas.records, 1600).map(item => item.id);
  assert.ok(in1600.includes('akbar'));
  assert.equal(in1600.includes('aurangzeb'), false);
  assert.equal(recordsForPolity('Mughal Empire', links.links, atlas.records, 1500).some(item => item.id === 'akbar'), false);
  const gupta300 = recordsForPolity('Gupta Empire', links.links, atlas.records, 300).map(item => item.id);
  assert.deepEqual(gupta300, ['gupta-empire']);
  assert.equal(recordsForPolity('Not a polity', links.links, atlas.records, 1600).length, 0);
  const cholas = recordsForPolity('Chola Empire', links.links, atlas.records, 1000).map(item => item.id);
  assert.ok(cholas.includes('chola-dynasty'));
  assert.equal(cholas.includes('rajendra-reign'), false);
});

test('year summary names the gap and refuses interpolated borders', () => {
  const summary = summarizeYear({
    year: 1047, snapshotYear: 1000, gapYears: 47,
    features: [
      { properties: { name: 'Chola Empire', kind: 'named' } },
      { properties: { name: 'Chola Empire', kind: 'named' } },
      { properties: { name: 'Rajput kingdoms', kind: 'residual' } },
    ],
    records: atlas.records,
  });
  assert.deepEqual(summary.named, ['Chola Empire']);
  assert.deepEqual(summary.residual, ['Rajput kingdoms']);
  assert.match(summary.statement, /not interpolated/);
  assert.match(summary.statement, /not a verified political map/);
  assert.equal(summary.statement.includes('1047 CE sheet'), false);
  assert.ok(summary.kingdoms.includes('Imperial Chola chronology'));
});

test('map fit uses named areas and ignores a residual sheet that covers the frame', () => {
  const named = { properties: { kind: 'named', name: 'Mughal Empire' }, geometry: { type: 'Polygon', coordinates: [[[70, 20], [80, 20], [80, 30], [70, 30], [70, 20]]] } };
  const residual = { properties: { kind: 'residual', name: 'Islamic and Hindu states' }, geometry: { type: 'Polygon', coordinates: [[[56, 3], [101, 3], [101, 40], [56, 40], [56, 3]]] } };
  const box = boundsOfFeatures([residual, named]);
  assert.equal(box.west, 70);
  assert.equal(box.east, 80);
  assert.equal(box.south, 20);
  assert.equal(box.north, 30);
  assert.equal(boundsOfFeatures([]), null);
  const onlyResidual = boundsOfFeatures([residual], { namedOnly: false });
  assert.equal(onlyResidual.west, 56);
  assert.equal(onlyResidual.north, 40);
});

test('vendored snapshots stay inside the clip frame and keep sample polities', () => {
  assert.deepEqual(validateBasemapIndex(index), []);
  for (const year of [300, 1000, 1600, 1800]) {
    const collection = sheet(year);
    assert.deepEqual(validateBasemapCollection(collection, year), []);
    const names = collection.features.map(feature => feature.properties.name);
    if (year === 300) assert.ok(names.includes('Gupta Empire') && names.includes('Satavahanihara'));
    if (year === 1000) assert.ok(names.includes('Chola Empire') && names.includes('Chalukya Empire') && names.includes('Palas'));
    if (year === 1600) assert.ok(names.includes('Mughal Empire') && names.includes('Vijayanagara') && names.includes('Rajputana'));
    if (year === 1800) assert.ok(names.includes('Maratha Confederacy') && names.includes('Sikhs'));
  }
});

test('major periods have cited profiles rather than bare chronology lines', () => {
  for (const id of [
    'gupta-empire', 'vakataka-dynasty', 'chalukya-badami', 'chalukya-kalyani', 'chalukya-vengi',
    'pallava-dynasty', 'pala-dynasty', 'rashtrakuta-dynasty', 'delhi-sultanate', 'vijayanagara-empire',
    'bahmanid-dynasty', 'shivaji', 'maratha-confederacy', 'ranjit-singh', 'sikh-kingdom',
    'east-india-company', 'british-raj', 'princely-states', 'dominion-of-india',
  ]) {
    const item = record(id);
    assert.ok(item, id);
    assert.equal(item.reviewStatus, 'cited');
    assert.ok(item.details.length >= 4, id);
    assert.ok(item.details.some(section => section.heading === 'Capital'), id);
    assert.equal(item.geometry, null, id);
  }
  assert.equal(record('dominion-of-india').type, 'state');
  assert.match(record('bahmanid-dynasty').summary, /1528/);
  assert.match(record('bahmanid-dynasty').summary, /1518/);
  assert.match(record('chalukya-badami').dateNote, /755/);
});
