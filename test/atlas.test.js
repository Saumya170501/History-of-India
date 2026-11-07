import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  normalizeYear,
  recordsForYear,
  stateFromSearch,
  validateAtlas,
} from "../src/atlas.js";

const data = JSON.parse(
  readFileSync(new URL("../src/data/atlas.json", import.meta.url), "utf8"),
);

test("malformed citation fields produce validation errors instead of crashing", () => {
  const invalid = structuredClone(data);
  invalid.records[0].citations[0].locator = 42;
  invalid.records[1].citations[0].supports = {};
  assert.equal(validateAtlas(invalid).filter(error => error.includes("incomplete citation")).length, 2);
});

test("seed data meets the citation and point-only contract", () => {
  assert.deepEqual(validateAtlas(data), []);
});

test("century windows include their endpoints but do not leak to adjoining years", () => {
  assert.deepEqual(
    recordsForYear(data.records, 1).map((r) => r.id),
    ["sanchi-gateways"],
  );
  assert.equal(recordsForYear(data.records, 100).length, 1);
  assert.equal(recordsForYear(data.records, 101).length, 0);
  assert.equal(recordsForYear(data.records, 400).length, 0);
  assert.equal(recordsForYear(data.records, 401).length, 2);
  assert.equal(recordsForYear(data.records, 600).length, 2);
  assert.equal(recordsForYear(data.records, 601).length, 1);
  assert.equal(recordsForYear(data.records, 2026).length, 0);
});

test("battle aftermath appears only in its cited year", () => {
  assert.equal(recordsForYear(data.records, 1564, "battle").length, 0);
  assert.equal(
    recordsForYear(data.records, 1565, "battle")[0].id,
    "hampi-1565",
  );
  assert.equal(recordsForYear(data.records, 1566, "battle").length, 0);
});

test("type and case-insensitive search combine with the year filter", () => {
  assert.equal(
    recordsForYear(data.records, 500, "culture", " NALANDA ").length,
    1,
  );
  assert.equal(recordsForYear(data.records, 500, "site", "Nalanda").length, 0);
  assert.equal(recordsForYear(data.records, 1632, "ruler", "shah").length, 1);
  assert.equal(recordsForYear(data.records, 2026, "all", "Sanchi").length, 0);
});

test("year entry clamps and handles empty, malformed, infinite and decimal values", () => {
  assert.equal(normalizeYear(-50), 1);
  assert.equal(normalizeYear(3000), 2026);
  assert.equal(normalizeYear("500.6"), 501);
  for (const bad of ["", "  ", null, undefined, "abc", Infinity])
    assert.equal(normalizeYear(bad, 500), 500);
});

test("shareable URLs restore valid state and reject invalid categories", () => {
  assert.deepEqual(stateFromSearch("?year=500&type=culture&q=Nalanda"), {
    year: 500,
    type: "culture",
    query: "Nalanda",
  });
  assert.deepEqual(stateFromSearch("?year=NaN&type=constructor"), {
    year: 1,
    type: "all",
    query: "",
  });
  assert.equal(stateFromSearch("?year=9999").year, 2026);
});

test("missing evidence, unresolved location provenance and historical polygons fail validation", () => {
  const missing = structuredClone(data);
  missing.records[0].citations = [];
  missing.records[0].locationSourceId = "unknown";
  missing.records[0].geometry = {
    type: "Polygon",
    coordinates: [
      [
        [0, 0],
        [1, 1],
        [0, 0],
      ],
    ],
  };
  const errors = validateAtlas(missing);
  assert.ok(errors.some((error) => error.includes("citations required")));
  assert.ok(errors.some((error) => error.includes("location source required")));
  assert.ok(
    errors.some((error) =>
      error.includes("historical polygons are not enabled"),
    ),
  );
});

test("duplicate IDs, reversed dates, invalid coordinates and unsafe source URLs fail", () => {
  const invalid = structuredClone(data);
  invalid.records[1].id = invalid.records[0].id;
  invalid.records[0].startYear = 200;
  invalid.records[0].geometry.coordinates = [Infinity, 91];
  invalid.sources[0].url = "javascript:alert(1)";
  invalid.records[1].citations[0].sourceId = "unknown";
  const errors = validateAtlas(invalid);
  for (const term of [
    "Duplicate",
    "year window",
    "Points",
    "HTTPS",
    "incomplete citation",
  ])
    assert.ok(
      errors.some((error) => error.includes(term)),
      term,
    );
});

test("bundled Natural Earth background matches its documented upstream download", () => {
  const bytes = readFileSync(
    new URL("../public/data/land.geojson", import.meta.url),
  );
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    "9e0729ee253ca7d7a5c4ae9395fb1902264c5377c52e224d13dd85010e2835d9",
  );
  const land = JSON.parse(bytes);
  assert.equal(land.type, "FeatureCollection");
  assert.ok(land.features.length > 0);
  assert.ok(
    land.features.every((feature) =>
      ["Polygon", "MultiPolygon"].includes(feature.geometry.type),
    ),
  );
});
