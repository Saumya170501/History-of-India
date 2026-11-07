import { readFile } from "node:fs/promises";
import { validateAtlas } from "../src/atlas.js";
import { validateMapLayers } from "../src/map-layers.js";

const data = JSON.parse(
  await readFile(new URL("../src/data/atlas.json", import.meta.url), "utf8"),
);
const layers = JSON.parse(await readFile(new URL('../src/data/map-layers.json', import.meta.url), 'utf8'));
const errors = [...validateAtlas(data), ...validateMapLayers(layers, data)];
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Validated ${data.records.length} cited records, ${data.sources.length} sources, ${layers.regions.length} reviewed regional overlays and ${layers.references.length} map references.`,
  );
}
