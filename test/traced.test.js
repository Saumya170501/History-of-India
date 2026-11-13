import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import atlas from '../src/data/atlas.json' with { type: 'json' };
import { shapesForYear, validateTracedIndex } from '../src/traced.js';

const index = JSON.parse(readFileSync(new URL('../public/data/traced/index.json', import.meta.url)));
const licence = readFileSync(new URL('../public/data/traced/LICENSE-DATA', import.meta.url), 'utf8');

test('traced dataset is share-alike data and keeps a reusable upstream licence', () => {
  assert.deepEqual(validateTracedIndex(index), []);
  assert.match(licence, /CC BY-SA 4\.0/);
  assert.match(licence, /not a licence for the application code/i);
  assert.ok(index.shapes.length >= 20);
});

test('traced shapes follow the year the file is used for', () => {
  const titles = year => shapesForYear(index, year).map(shape => shape.id);
  assert.deepEqual(titles(-300), ['traced-maurya-core']);
  assert.ok(titles(-150).includes('traced-shunga'));
  assert.equal(titles(-150).includes('traced-maurya-core'), false);
  assert.ok(titles(400).includes('traced-vakataka'));
  assert.ok(titles(640).includes('traced-karkota'));
  assert.ok(titles(780).includes('traced-rashtrakuta'));
  assert.ok(titles(1030).includes('traced-pala'));
  assert.ok(titles(1300).includes('traced-delhi'));
  assert.ok(titles(1600).includes('traced-bijapur'));
  const maurya = index.shapes.find(shape => shape.id === 'traced-maurya-core');
  assert.equal(maurya.confidence, 'low');
  const pala = index.shapes.find(shape => shape.id === 'traced-pala');
  assert.equal(pala.confidence, 'higher');
  assert.match(pala.changes, /0\.2 degree/);
  assert.equal(index.shapes.find(shape => shape.id === 'traced-later-pandya').recordIds.includes('pandya-sangam'), false);
  const ids = new Set(atlas.records.map(record => record.id));
  for (const shape of index.shapes) {
    for (const id of shape.recordIds) assert.ok(ids.has(id), `${shape.id} → ${id}`);
  }
});

test('traced coordinates stay inside the atlas frame', () => {
  const files = ['maurya-core.geojson', 'era-bce.geojson', 'era-to-750.geojson', 'era-to-1200.geojson', 'era-after-1200.geojson'];
  for (const file of files) {
    const collection = JSON.parse(readFileSync(new URL(`../public/data/traced/${file}`, import.meta.url)));
    const points = [];
    const walk = value => {
      if (Array.isArray(value) && value.length >= 2 && value.every(item => typeof item === 'number')) points.push(value);
      else if (Array.isArray(value)) value.forEach(walk);
    };
    for (const feature of collection.features) walk(feature.geometry.coordinates);
    assert.ok(points.length > 20, file);
    for (const [lon, lat] of points) {
      assert.ok(lon >= 56 && lon <= 101, `${file} longitude ${lon}`);
      assert.ok(lat >= 3 && lat <= 40, `${file} latitude ${lat}`);
    }
    assert.equal(collection.features[0].properties.approximate, true);
  }
});
