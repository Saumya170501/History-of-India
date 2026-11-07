import { readFile } from "node:fs/promises";
import { validateAtlas } from "../src/atlas.js";

const data = JSON.parse(
  await readFile(new URL("../src/data/atlas.json", import.meta.url), "utf8"),
);
const errors = validateAtlas(data);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Validated ${data.records.length} cited records and ${data.sources.length} sources. Historical boundary geometry is disabled.`,
  );
}
