import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slimCatalogue, slimRecord } from '../src/catalogue-load.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const data = JSON.parse(await readFile(join(root, 'src/data/atlas.json'), 'utf8'));
const slim = slimCatalogue(data);
const outDir = join(root, 'public/data');
const profileDir = join(outDir, 'profiles');
await mkdir(profileDir, { recursive: true });
await rm(profileDir, { recursive: true, force: true });
await mkdir(profileDir, { recursive: true });
await writeFile(join(outDir, 'catalogue.json'), JSON.stringify(slim));
let profiles = 0;
for (const record of data.records) {
  if (!slimRecord(record).hasProfile) continue;
  await writeFile(join(profileDir, `${record.id}.json`), JSON.stringify(record.details));
  profiles += 1;
}
console.log(`Wrote catalogue index and ${profiles} profiles.`);
