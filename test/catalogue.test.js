import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { groupRecords, storyOrder } from '../src/catalogue.js';

const links = JSON.parse(readFileSync(new URL('../src/data/polity-links.json', import.meta.url))).links;
const row = (partial) => ({ tags: [], place: '', startYear: 1, endYear: 1, title: partial.id, ...partial });

test('records group under one polity label and stay in date order', () => {
  const groups = groupRecords([
    row({ id: 'akbar', type: 'ruler', tags: ['Mughal'], place: 'Mughal', startYear: 1556, endYear: 1605, title: 'Akbar' }),
    row({ id: 'babur', type: 'ruler', tags: ['Mughal'], place: 'Mughal', startYear: 1526, endYear: 1530, title: 'Babur' }),
    row({ id: 'rajput-pratap', type: 'ruler', tags: ['Rajput'], place: 'Mewar', startYear: 1572, endYear: 1597, title: 'Pratap' }),
    row({ id: 'rajput-jodha', type: 'ruler', tags: ['Rajput'], place: 'Marwar', startYear: 1438, endYear: 1489, title: 'Jodha' }),
    row({ id: 'ajanta-later-caves', type: 'site', place: 'Ajanta', startYear: 401, endYear: 600, title: 'Ajanta' }),
    row({ id: 'early-sangam', type: 'culture', place: 'Tamilakam', startYear: 1, endYear: 300, title: 'Sangam' }),
  ], links);
  assert.deepEqual(groups.map(group => group.title), ['Rajput states', 'Mughal Empire', 'Monuments', 'Culture & learning']);
  assert.deepEqual(groups[0].records.map(record => record.id), ['rajput-jodha', 'rajput-pratap']);
  assert.deepEqual(groups[1].records.map(record => record.id), ['babur', 'akbar']);
  assert.ok(groups[0].highlight.includes('Rajputana'));
  assert.equal(groups[0].highlight.filter(name => name === 'Rajputana').length, 1);
  assert.equal(groups[2].kind, 'category');
});

test('alias sheets collapse and explicit company or princely records stay distinct', () => {
  const groups = groupRecords([
    row({ id: 'chola-dynasty', type: 'kingdom', place: 'Tamil region', startYear: 880, endYear: 1279, title: 'Chola' }),
    row({ id: 'east-india-company', type: 'state', tags: ['Company', 'British'], place: 'Company presidencies', startYear: 1757, endYear: 1858, title: 'Company' }),
    row({ id: 'princely-states', type: 'state', tags: ['Princely', 'British'], place: 'Princely states', startYear: 1858, endYear: 1947, title: 'Princes' }),
    row({ id: 'aybak', type: 'ruler', place: 'Delhi Sultanate', startYear: 1206, endYear: 1210, title: 'Aybak' }),
  ], links);
  assert.deepEqual(groups.map(group => group.title), ['Chola', 'Delhi Sultanate', 'East India Company', 'Princely states']);
  assert.equal(groups.filter(group => /chola/i.test(group.title)).length, 1);
});

test('story order follows chronology across groups', () => {
  const records = [
    row({ id: 'late', type: 'site', startYear: 1600, title: 'Late' }),
    row({ id: 'early', type: 'ruler', tags: ['Mughal'], startYear: 1500, title: 'Early' }),
    row({ id: 'same', type: 'culture', startYear: 1500, title: 'Also early' }),
  ];
  assert.deepEqual(storyOrder(records).map(record => record.id), ['same', 'early', 'late']);
  assert.deepEqual(groupRecords(records, links).map(group => group.kind), ['polity', 'category', 'category']);
});
