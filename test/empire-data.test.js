import test from 'node:test';
import assert from 'node:assert/strict';
import { compile, parseDate } from '../scripts/ingest-ohm.mjs';
import { filterEmpires, empireCategory } from '../src/empire-data.js';
// Synthetic geometry for testing only, never published as historical territory.
const nodes = [[70,20],[80,20],[80,30],[70,30],[72,22],[74,22],[74,24],[72,24]].map(([lon,lat],i)=>({type:'node',id:i+1,lon,lat}));
function fixture() { return { elements: [...nodes,
  {type:'way',id:20,nodes:[1,2,3,4,1]}, {type:'way',id:21,nodes:[5,6,7,8,5]},
  {type:'relation',id:30,tags:{type:'multipolygon',boundary:'administrative',name:'Mughal Empire',start_date:'~1556',end_date:'1605-01-01'},members:[{type:'way',ref:20,role:'outer'},{type:'way',ref:21,role:'inner'}]},
] }; }
test('OHM conversion retains holes, uncertainty, source identity and unknown ruler', () => {
  const {collection} = compile(fixture(), '2026-11-09');
  assert.equal(collection.features.length,1);
  const f=collection.features[0];
  assert.equal(f.geometry.coordinates.length,2);
  assert.equal(f.properties.ruler,null);
  assert.equal(f.properties.end_year,1604);
  assert.equal(f.properties.date_uncertain,true);
  assert.match(f.properties.source_url,/relation\/30$/);
  assert.equal(filterEmpires(collection,1555).features.length,0);
  assert.equal(filterEmpires(collection,1556).features.length,1);
  assert.equal(filterEmpires(collection,1605).features.length,0);
});
test('missing dates and partial Overpass errors are not assigned guessed ranges', () => {
  const raw=fixture();delete raw.elements.at(-1).tags.end_date;
  assert.equal(compile(raw).collection.features.length,0);
  assert.equal(parseDate('before 1600'),null);
  assert.equal(parseDate('1600-13-01'),null);
  assert.throws(()=>compile({elements:[],remark:'timeout'}),/timeout/);
});
test('substring categories use deterministic match keys', () => {
  assert.equal(empireCategory('Late Mughal Empire'),'Mughal');
  assert.equal(empireCategory('Maratha Confederacy'),'Maratha');
  assert.equal(empireCategory('Rajputana'),'Rajput');
  assert.equal(empireCategory('Other polity'),'Other');
});
