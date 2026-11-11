import { readFile } from "node:fs/promises";
import { validateAtlas } from "../src/atlas.js";
import { validateMapLayers } from "../src/map-layers.js";
import { validateBasemapCollection, validateBasemapIndex } from "../src/period-map.js";

const data = JSON.parse(
  await readFile(new URL("../src/data/atlas.json", import.meta.url), "utf8"),
);
const layers = JSON.parse(await readFile(new URL('../src/data/map-layers.json', import.meta.url), 'utf8'));
const basemaps = JSON.parse(await readFile(new URL('../src/data/basemap-index.json', import.meta.url), 'utf8'));
const errors = [...validateAtlas(data), ...validateMapLayers(layers, data), ...validateBasemapIndex(basemaps)];
for (const snapshot of basemaps.snapshots || []) {
  const collection = JSON.parse(await readFile(new URL(`../public/data/basemaps/${snapshot.file}`, import.meta.url), 'utf8'));
  if (collection.features.length !== snapshot.featureCount)
    errors.push(`${snapshot.file}: feature count does not match the index`);
  errors.push(...validateBasemapCollection(collection, snapshot.year));
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Validated ${data.records.length} cited records, ${data.sources.length} sources, ${layers.regions.length} reviewed regional overlays, ${layers.references.length} map references and ${basemaps.snapshots.length} period snapshots.`,
  );
}
