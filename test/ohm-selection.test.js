import test from 'node:test';
import assert from 'node:assert/strict';
import { createExpression } from '@maplibre/maplibre-gl-style-spec';
import { kingdomNames, selectionFilter } from '../src/ohm-selection.js';
import { readFileSync } from 'node:fs';
const atlas = JSON.parse(readFileSync(new URL('../src/data/atlas.json', import.meta.url)));
const record = id => atlas.records.find(item => item.id === id);
const accepts = (id, year, properties) => {
  const expression = createExpression(selectionFilter(record(id), year));
  assert.equal(expression.result, 'success');
  return expression.value.evaluate({}, { type: 3, properties });
};

test('OHM highlighting matches the selected kingdom and snapshot, not its neighbours or other centuries', () => {
  const feature = { type: 'administrative', admin_level: 2, name_en: 'Mughal Empire', start_decdate: 1556, end_decdate: 1605 };
  assert.equal(accepts('akbar', 1586, feature), true);
  assert.equal(accepts('akbar', 1555, feature), false);
  assert.equal(accepts('akbar', 1605, feature), false);
  assert.equal(accepts('akbar', 1586, { ...feature, name_en: 'Mewar' }), false);
  assert.equal(accepts('akbar', 1586, { ...feature, name_en: 'Mughal Empire railway' }), false);
  assert.equal(accepts('akbar', 1586, { ...feature, start_decdate: undefined }), false);
  assert.equal(accepts('akbar', 1586, { ...feature, type: 'railway' }), false);
});

test('Rajput states stay separate and rival claimants are not assigned the whole Mughal empire', () => {
  assert.ok(kingdomNames(record('rajput-pratap')).includes('Mewar'));
  assert.ok(kingdomNames(record('rajput-jodha')).includes('Marwar'));
  assert.ok(!kingdomNames(record('rajput-pratap')).includes('Marwar'));
  assert.deepEqual(kingdomNames(record('azam-shah')), []);
  assert.deepEqual(kingdomNames(record('haldighati-1576')), []);
  assert.deepEqual(kingdomNames(null), []);
});

test('switching to an unmapped selection cannot retain a previous boundary highlight', () => {
  const feature = { type: 'administrative', admin_level: 2, name: 'Mewar', start_decdate: 1500, end_decdate: 1600 };
  assert.equal(accepts('rajput-pratap', 1576, feature), true);
  assert.equal(accepts('rajput-jodha', 1576, feature), false);
  assert.equal(accepts('haldighati-1576', 1576, feature), false);
});

test('Huvishka and cited Kushan rulers resolve to Kushan boundaries without mapping cultural records as kingdoms', () => {
  const feature = { type: 'administrative', admin_level: 2, name_en: 'Kushan Empire', start_decdate: 100, end_decdate: 200 };
  assert.equal(accepts('early-huvishka', 150, feature), true);
  assert.equal(accepts('early-huvishka', 250, feature), false);
  assert.ok(kingdomNames(record('early-kanishka-i')).includes('Kushan Empire'));
  assert.deepEqual(kingdomNames(record('early-kushan-icons')), []);
});
