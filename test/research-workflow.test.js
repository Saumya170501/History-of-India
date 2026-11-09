import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateAnnualResearch, researchProgress } from '../src/research-workflow.js';

const first = JSON.parse(readFileSync(new URL('../research/years/0001/status.json', import.meta.url)));
test('1 CE is explicitly research in progress, not historically complete', () => {
  assert.equal(first.year, 1);
  assert.equal(first.status, 'researching');
  assert.deepEqual(validateAnnualResearch(first), []);
  assert.equal(researchProgress([first]).reviewedYears, 0);
});
test('an asserted claim requires evidence and date/location context', () => {
  const candidate = structuredClone(first);
  candidate.claims.push({id:'claim-test',statement:'Synthetic claim',confidence:'confirmed',
    dateNote:'Only a test',locationNote:'No map assertion',sources:[]});
  assert.match(validateAnnualResearch(candidate).join('; '),/need citations/);
});
test('a year cannot be marked reviewed by validation alone', () => {
  const item = {...first,status:'reviewed'};
  assert.match(validateAnnualResearch(item).join('; '),/independent named reviewer/);
});
