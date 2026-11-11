import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recordsForYear, validateAtlas } from '../src/atlas.js';
import { battlesForYear, validateMapLayers } from '../src/map-layers.js';
const data = JSON.parse(readFileSync(new URL('../src/data/atlas.json', import.meta.url)));
const layers = JSON.parse(readFileSync(new URL('../src/data/map-layers.json', import.meta.url)));
const byId = id => data.records.find(record => record.id === id);

test('Mughal and Rajput profiles retain claim-level citations', () => {
  assert.deepEqual(validateAtlas(data), []);
  assert.deepEqual(validateMapLayers(layers, data), []);
  for (const id of ['babur','akbar','rajput-pratap','rajput-man-singh-amber','rajput-jai-singh-ii'])
    assert.ok(byId(id).details.every(section => section.citations.length));
  const invalid = structuredClone(data);
  invalid.records.find(record => record.id === 'akbar').details[0].citations[0].sourceId = 'missing';
  assert.ok(validateAtlas(invalid).some(error => error.includes('biography')));
});

test('discontinuous reigns, aliases and conflicting source years remain explicit', () => {
  assert.ok(!recordsForYear(data.records, 1545).some(record => record.id.startsWith('humayun-')));
  assert.equal(byId('rafi-darajat').startYear, 1719);
  assert.match(byId('rafi-darajat').dateNote, /1713–1719/);
  assert.match(byId('shah-jahan-ii').dateNote, /not counted as separate rulers/);
  assert.match(byId('bahadur-shah-ii').dateNote, /September 1857/);
  assert.match(byId('rajput-anup-bikaner').dateNote, /1674–1698/);
  assert.match(byId('rajput-udai-singh-ii').dateNote, /1536–1572/);
  assert.match(byId('rajput-man-singh-amber').dateNote, /not accession dates/);
});

test('separate battles and sieges do not leak into adjoining years', () => {
  for (const [id, start, end] of [['tarain-1191',1191,1191],['tarain-1192',1192,1192],['haldighati-1576',1576,1576],['chittor-1567-1568',1567,1568]]) {
    assert.ok(battlesForYear(data.records,start).some(record => record.id === id));
    assert.ok(battlesForYear(data.records,end).some(record => record.id === id));
    assert.ok(!battlesForYear(data.records,start-1).some(record => record.id === id));
    assert.ok(!battlesForYear(data.records,end+1).some(record => record.id === id));
    assert.equal(byId(id).geometry,null);
  }
});

test('profile text is searchable and a sourced city point is not borrowed for a reign', () => {
  assert.ok(recordsForYear(data.records, 1576, 'ruler', 'Chakrapani').some(record => record.id === 'rajput-pratap'));
  assert.ok(recordsForYear(data.records, 1576, 'ruler', 'Rajput').some(record => record.id === 'rajput-man-singh-amber'));
  assert.equal(byId('jaipur-foundation').locationSourceId, 'unesco-jaipur');
  assert.equal(byId('rajput-jai-singh-ii').geometry, null);
  assert.ok(Math.abs(byId('jaipur-foundation').geometry.coordinates[1]-26.924278)<0.000001);
});
