import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTerritoryCandidate, readyForEditorialReview } from '../src/territory-evidence.js';

const example = () => ({
  id: 'synthetic-test-only', entityId: 'synthetic-polity', title: 'TEST ONLY — not historical',
  validFrom: 100, validTo: 101, authorityType: 'direct', dateConfidence: 'low',
  boundaryConfidence: 'low', uncertaintyNote: 'Artificial unit-test geometry.',
  citations: [{sourceId:'test-source',locator:'test-only',supports:'Only tests schema validation'}],
  provenance: {author:'Test',edition:'Test',page:'1',scale:'1:1000',
    rights:'Synthetic test only',digitizationMethod:'Synthetic',interpretation:'Not a real place'},
  geometry: {type:'Polygon', coordinates:[[[70,20],[71,20],[70,21],[70,20]]]},
  review: {status:'candidate'}
});
const sources = new Set(['test-source']);
test('synthetic candidate is structurally valid but is NOT approved', () => {
  const item=example();
  assert.deepEqual(validateTerritoryCandidate(item,sources),[]);
  assert.equal(readyForEditorialReview(item,sources),true);
  assert.equal(item.review.status,'candidate');
});
test('rejects invented exactness, unproven source and malformed geometry', () => {
  const item=example();
  item.citations[0].sourceId='unlisted';
  item.validTo=99;
  item.geometry.coordinates[0][0]=[999,20];
  const problems=validateTerritoryCandidate(item,sources).join('; ');
  assert.match(problems,/source references/);
  assert.match(problems,/chronological interval/);
  assert.match(problems,/longitude\/latitude/);
});
test('reviewed state requires explicit reviewer date and notes', () => {
  const item=example();
  item.review={status:'reviewed'};
  assert.match(validateTerritoryCandidate(item,sources).join('; '),/review approval/);
});
