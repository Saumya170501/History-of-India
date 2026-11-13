import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compareNames, nextPlaybackYear, PLAY_SPEEDS } from '../src/playback.js';

const snapshots = JSON.parse(readFileSync(new URL('../src/data/basemap-index.json', import.meta.url))).snapshots;

test('playback keeps the nearest sheet labelled and skips a distant country map', () => {
  const inside = nextPlaybackYear({ year: 300, maxYear: 2026, step: 5, snapshots });
  assert.equal(inside.year, 305);
  assert.equal(inside.pause, false);
  assert.match(inside.label, /Nearest sheet 300/);
  const crossed = nextPlaybackYear({ year: 140, maxYear: 2026, step: 20, snapshots });
  assert.equal(crossed.year, 170);
  assert.equal(crossed.pause, false);
  assert.equal(crossed.skipped, true);
  assert.equal(crossed.snapshotYear, 200);
  assert.match(crossed.label, /Nearest sheet 200/);
  const end = nextPlaybackYear({ year: 2020, maxYear: 2026, step: 25, snapshots });
  assert.equal(end.done, true);
  assert.equal(end.pause, false);
  assert.equal(PLAY_SPEEDS.steady.step, 5);
});

test('compare lists only the names that differ', () => {
  const diff = compareNames(
    ['Mughal Empire', 'Vijayanagara', 'Mughal Empire'],
    ['Mughal Empire', 'Bijapur'],
  );
  assert.deepEqual(diff.onlyLeft, ['Vijayanagara']);
  assert.deepEqual(diff.onlyRight, ['Bijapur']);
  assert.deepEqual(diff.both, ['Mughal Empire']);
});
