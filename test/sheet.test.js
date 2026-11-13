import test from 'node:test';
import assert from 'node:assert/strict';
import { nearestSnap, nextSnap, sheetHeights } from '../src/sheet.js';

test('peek and half leave room for the map and the year bar', () => {
  const heights = sheetHeights(844, { header: 56, timeline: 236, peek: 88 });
  assert.equal(heights.peek, 88);
  assert.equal(heights.full, 844 - 56 - 236);
  assert.ok(heights.half > heights.peek);
  assert.ok(heights.half < heights.full);
  assert.ok(heights.peek + 236 < 844);
});

test('a drag settles on the nearest snap', () => {
  const heights = { peek: 88, half: 280, full: 560 };
  assert.equal(nearestSnap(100, heights), 'peek');
  assert.equal(nearestSnap(260, heights), 'half');
  assert.equal(nearestSnap(500, heights), 'full');
  assert.equal(nextSnap('peek', 1), 'half');
  assert.equal(nextSnap('half', 1), 'full');
  assert.equal(nextSnap('full', 1), 'full');
  assert.equal(nextSnap('half', -1), 'peek');
});
