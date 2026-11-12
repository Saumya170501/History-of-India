import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { shapesForYear, validateTracedIndex } from '../src/traced.js';

const index = JSON.parse(readFileSync(new URL('../public/data/traced/index.json', import.meta.url)));
const licence = readFileSync(new URL('../public/data/traced/LICENSE-DATA', import.meta.url), 'utf8');

test('traced dataset is share-alike data and keeps a reusable upstream licence', () => {
  assert.deepEqual(validateTracedIndex(index), []);
  assert.match(licence, /CC BY-SA 4\.0/);
  assert.match(licence, /not a licence for the application code/i);
  assert.equal(index.shapes.length, 1);
});

test('the Mauryan trace is visible only inside the window the file is used for', () => {
  assert.equal(shapesForYear(index, -300).length, 1);
  assert.equal(shapesForYear(index, -150).length, 0);
  assert.equal(shapesForYear(index, 400).length, 0);
  const shape = index.shapes[0];
  assert.equal(shape.confidence, 'low');
  assert.match(shape.author, /MaxxL/);
  assert.match(shape.mapSource, /Atlas/);
});

test('traced coordinates stay inside the atlas frame', () => {
  const collection = JSON.parse(readFileSync(new URL('../public/data/traced/maurya-core.geojson', import.meta.url)));
  const points = [];
  const walk = value => {
    if (Array.isArray(value) && value.length >= 2 && value.every(item => typeof item === 'number')) points.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
  };
  walk(collection.features[0].geometry.coordinates);
  assert.ok(points.length > 20);
  for (const [lon, lat] of points) {
    assert.ok(lon >= 56 && lon <= 101, `longitude ${lon}`);
    assert.ok(lat >= 3 && lat <= 40, `latitude ${lat}`);
  }
  assert.equal(collection.features[0].properties.approximate, true);
  assert.equal(collection.features[0].properties.confidence, 'low');
});
