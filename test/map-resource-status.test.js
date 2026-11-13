import test from 'node:test';
import assert from 'node:assert/strict';
import { createResourceStatus } from '../src/map-resource-status.js';

test('background failures do not invalidate boundary matches, and recovered tiles clear only their own errors', () => {
  const status = createResourceStatus();
  const tile = (key, state) => ({ tileID: { key }, state });
  status.fail({ sourceId: 'ohm_landcover_hillshade', tile: tile(1, 'errored') });
  assert.equal(status.boundaryFailed(), false);
  status.fail({ sourceId: 'ohm-selected-boundaries', tile: tile(2, 'errored') });
  status.recover({ sourceId: 'ohm_landcover_hillshade', tile: tile(1, 'loaded') });
  assert.equal(status.boundaryFailed(), true);
  status.recover({ sourceId: 'ohm-selected-boundaries', tile: tile(3, 'loaded') });
  assert.equal(status.boundaryFailed(), true);
  status.recover({ sourceId: 'ohm-selected-boundaries', tile: tile(2, 'loaded') });
  assert.equal(status.message(), '');
});

test('a warning waits until the failure persists, and a recovered source clears it', () => {
  const status = createResourceStatus();
  status.fail({ sourceId: 'ohm', error: { message: 'glyph range failed' } });
  assert.equal(status.message(), '');
  status.fail({ sourceId: 'ohm', tile: { tileID: { key: 'a' }, state: 'errored' }, error: { message: 'tile' } });
  assert.equal(status.notice({ persistent: false }), '');
  assert.match(status.notice({ persistent: true }), /OHM geography/);
  status.recover({ sourceId: 'ohm', tile: { tileID: { key: 'a' }, state: 'loaded' } });
  assert.equal(status.notice({ persistent: true }), '');
});

test('one failed tile does not keep a warning after the same source has loaded', () => {
  const status = createResourceStatus();
  const tile = (key, state) => ({ tileID: { key }, state });
  status.fail({ sourceId: 'ohm', tile: tile('bad', 'errored'), error: { message: 'missing' } });
  status.recover({ sourceId: 'ohm', tile: tile('good', 'loaded') });
  status.prunePartial();
  assert.equal(status.message(), '');
});

test('retry resets failures and cancellation is not a map outage', () => {
  const status = createResourceStatus();
  status.fail({ error: { name: 'AbortError' } });
  assert.equal(status.message(), '');
  status.fail({ sourceId: 'ohm-selected-boundaries' });
  assert.equal(status.boundaryFailed(), true);
  status.reset();
  assert.equal(status.message(), '');
  status.fail({ sourceId: 'ohm-selected-boundaries' });
  status.recover({ sourceId: 'ohm-selected-boundaries', sourceDataType: 'metadata' });
  assert.equal(status.message(), '');
});
