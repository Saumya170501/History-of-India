import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { aboutPage, privacyPage, feedbackPage, sitemapXml } from '../src/site-pages.js';

const root = new URL('../', import.meta.url);
const traced = JSON.parse(await readFile(new URL('./public/data/traced/index.json', root), 'utf8'));
const atlas = JSON.parse(await readFile(new URL('./src/data/atlas.json', root), 'utf8'));
const origin = process.env.SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
  || 'https://history-of-india.vercel.app';

await writeFile(new URL('./about.html', root), aboutPage({ shapes: traced.shapes, sources: atlas.sources }));
await writeFile(new URL('./privacy.html', root), privacyPage());
await writeFile(new URL('./feedback.html', root), feedbackPage());
await mkdir(new URL('./public', root), { recursive: true });
await writeFile(new URL('./public/sitemap.xml', root), sitemapXml(origin));
await writeFile(new URL('./public/robots.txt', root), `User-agent: *\nAllow: /\nSitemap: ${origin.replace(/\/$/, '')}/sitemap.xml\n`);
console.log(`Wrote about, privacy, feedback, and sitemap for ${origin}`);
