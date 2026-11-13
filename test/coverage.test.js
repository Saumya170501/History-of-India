import assert from 'node:assert/strict';
import test from 'node:test';
import atlas from '../src/data/atlas.json' with { type: 'json' };
import coverage from '../src/data/coverage.json' with { type: 'json' };
import index from '../public/data/traced/index.json' with { type: 'json' };

test('the coverage checklist names every record once', () => {
  const ids = coverage.records.map(row => row.id);
  assert.deepEqual(ids, atlas.records.map(record => record.id));
  assert.equal(coverage.summary.outline + coverage.summary.point + coverage.summary.missing, ids.length);
  const linked = new Set(index.shapes.flatMap(shape => shape.recordIds));
  for (const row of coverage.records) {
    assert.ok(['outline', 'point', 'missing'].includes(row.status));
    assert.ok(row.why.trim());
    if (row.status === 'outline') assert.ok(row.outlines.every(id => linked.has(row.id) || index.shapes.some(shape => shape.id === id && shape.recordIds.includes(row.id))));
    if (row.status === 'point') {
      const record = atlas.records.find(item => item.id === row.id);
      assert.equal(record.geometry.type, 'Point');
      assert.equal(row.outlines.length, 0);
    }
    if (row.status === 'missing') assert.equal(row.point, false);
  }
});
