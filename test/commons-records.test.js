import assert from 'node:assert/strict';
import test from 'node:test';
import atlas from '../src/data/atlas.json' with { type: 'json' };
import { recordsForYear } from '../src/atlas.js';

const ids = [
  'bindusara', 'kanva-dynasty', 'kharavela', 'indo-greek-kingdom',
  'chera-sangam', 'chola-sangam', 'pandya-sangam', 'kakatiya-dynasty',
  'paramara-dynasty', 'karkota-dynasty', 'gujarat-sultanate', 'ghurid-empire',
  'peshwa-office', 'baji-rao-i', 'partition-of-india', 'princely-integration',
  'states-reorganisation-1956', 'chhattisgarh-state', 'telangana-state',
];

test('the Wikipedia-cited gaps are records, not invented outlines', () => {
  const byId = new Map(atlas.records.map(record => [record.id, record]));
  assert.equal(ids.length, 19);
  for (const id of ids) {
    const record = byId.get(id);
    assert.ok(record, id);
    assert.equal(record.researchBatch, 'commons-2026');
    const pointed = new Set([
      'bindusara', 'kakatiya-dynasty', 'indo-greek-kingdom', 'peshwa-office', 'baji-rao-i',
      'kanva-dynasty', 'chera-sangam', 'chola-sangam', 'pandya-sangam', 'ghurid-empire',
      'partition-of-india', 'princely-integration', 'states-reorganisation-1956',
      'chhattisgarh-state', 'telangana-state',
    ]);
    assert.equal(record.geometry?.type, pointed.has(id) ? 'Point' : undefined);
    if (record.geometry) assert.equal(record.geometry.type, 'Point');
    const source = atlas.sources.find(item => item.id === record.citations[0].sourceId);
    assert.match(source.url, /^https:\/\/en\.wikipedia\.org\/wiki\//);
  }
  assert.ok(recordsForYear(atlas.records, -280).some(record => record.id === 'bindusara'));
  assert.ok(recordsForYear(atlas.records, 1956).some(record => record.id === 'states-reorganisation-1956'));
  assert.equal(recordsForYear(atlas.records, -150).some(record => record.id === 'indo-greek-kingdom'), false);
});
