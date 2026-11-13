import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { aboutPage, feedbackMailto, privacyPage, sitemapXml } from '../src/site-pages.js';

const traced = JSON.parse(readFileSync(new URL('../public/data/traced/index.json', import.meta.url)));
const atlas = JSON.parse(readFileSync(new URL('../src/data/atlas.json', import.meta.url)));

test('the about page credits the maps and every traced file', () => {
  const html = aboutPage({ shapes: traced.shapes, sources: atlas.sources });
  assert.match(html, /OpenHistoricalMap/);
  assert.match(html, /historical-basemaps/);
  assert.match(html, /GPL-3\.0-only/);
  assert.match(html, /Natural Earth/);
  assert.match(html, /not a licence for the site code/);
  assert.match(html, /approximate/);
  for (const shape of traced.shapes) {
    assert.ok(html.includes(shape.author), shape.id);
    assert.ok(html.includes(shape.licence), shape.id);
    assert.ok(html.includes(shape.commonsUrl), shape.id);
  }
  assert.ok(html.includes(atlas.sources[0].url));
  assert.match(html, /href="\.\/feedback"/);
  assert.match(html, /href="\.\/privacy"/);
});

test('the privacy page says the form is not stored and that there is no tracking', () => {
  const html = privacyPage();
  assert.match(html, /no cookies/i);
  assert.match(html, /does not run analytics/i);
  assert.match(html, /does not store the form/i);
  assert.match(html, /optional/i);
});

test('feedback opens a mailto to the author with the year and page', () => {
  const href = feedbackMailto({
    name: 'A Reader',
    email: 'reader@example.com',
    message: 'The Saka label overlaps.',
    page: '/?year=228',
    year: '228',
  });
  assert.match(href, /^mailto:saumyapatel170501@gmail\.com\?/);
  const url = new URL(href);
  assert.match(url.searchParams.get('subject'), /228/);
  assert.match(url.searchParams.get('body'), /Saka label overlaps/);
  assert.match(url.searchParams.get('body'), /Page: \/\?year=228/);
  assert.match(url.searchParams.get('body'), /Year: 228/);
  assert.match(url.searchParams.get('body'), /reader@example\.com/);
});

test('the sitemap lists the atlas, about, feedback and privacy', () => {
  const xml = sitemapXml('https://atlas.example');
  for (const path of ['/', '/about', '/feedback', '/privacy']) {
    assert.ok(xml.includes(`https://atlas.example${path}`), path);
  }
});
