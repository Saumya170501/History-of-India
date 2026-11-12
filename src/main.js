import { createRecordCard, recordFactionColor } from './record-card.js';
import { groupRecords, storyOrder } from './catalogue.js';
import { sketchAvailable, SKETCH_NOTICE } from './local-boundary.js';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";
import "./layout.css";
import "./record-card.css";
import "./evidence-drawer.css";
import { mapReference } from './map-reference.js';
import { relatedArea } from './related-area.js';
const mapEngine = import('./ohm-map.js');
import mapLayers from './data/map-layers.json';
import { BATTLE_KINDS, battlesForYear, regionsForRecord, referencesForRecord, validateMapLayers } from './map-layers.js';
import {
  MIN_YEAR,
  MAX_YEAR,
  TYPES,
  formatYear,
  formatYearParts,
  normalizeYear,
  shiftYear,
  recordsForYear,
  searchAtlas,
  stateFromSearch,
  validateAtlas,
} from "./atlas.js";
import basemapIndex from "./data/basemap-index.json";
import polityLinks from "./data/polity-links.json";
import { FRAME, boundsOfFeatures, nearestSnapshot, polityColor, recordsForPolity, summarizeYear } from "./period-map.js";
import { applySheetReading, sheetIsSuppressed } from "./sheet-policy.js";
import { PLAY_SPEEDS, compareNames, nextPlaybackYear } from "./playback.js";
import { SUCCESSIONS, TOURS, resolveTour, successionLine } from "./guides.js";
import { fillPolityCard, fillYearList, fillYearSources, fillYearSummary } from "./year-panel.js";
import { shapesForYear, validateTracedIndex } from "./traced.js";

const catalogueResponse = await fetch(`${import.meta.env.BASE_URL}data/catalogue.json`);
if (!catalogueResponse.ok) throw new Error(`Catalogue failed to load (HTTP ${catalogueResponse.status}).`);
const data = await catalogueResponse.json();
const errors = [...validateAtlas(data), ...validateMapLayers(mapLayers, data)];
if (errors.length) throw new Error(errors.join("\n"));
const sources = new Map(data.sources.map((source) => [source.id, source]));
let state = stateFromSearch(location.search);
let selectedId = null;
const $ = (selector) => document.querySelector(selector);
const element = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};
const link = (text, url) => {
  const node = element("a", text);
  node.href = url;
  node.target = "_blank";
  node.rel = "noopener noreferrer";
  return node;
};

$("#app").innerHTML = `
  <a class="skip" href="#records-heading">Skip to historical records</a>
  <header class="masthead">
    <div class="brand"><span class="brand-mark" aria-hidden="true">✳</span><div><strong>HISTORY OF INDIA</strong><span>A source-led historical atlas</span></div></div>
    <div class="header-actions"><button id="toggle-evidence" class="quiet" aria-controls="evidence-drawer" aria-expanded="true">Evidence</button><button id="about-button" class="quiet">Sources & approach ↗</button></div>
  </header>
  <main>
    <section class="introduction" aria-labelledby="page-title">
      <div><p class="eyebrow">PLACE. TIME. EVIDENCE.</p><h1 id="page-title">A past worth exploring.</h1><p class="intro-copy">Travel through time. Follow the places, people and ideas behind the history.</p></div>
      <div class="scope"><strong>1 — 2026 <small>CE</small></strong><span>A growing atlas, one source at a time.</span></div>
    </section>
    <section class="timeline" aria-label="Choose a historical year">
      <div class="year-block"><span class="eyebrow">EXPLORING THE YEAR</span><div><output id="year-display" for="year-slider year-input">1</output><span class="ce">CE</span></div></div>
      <div class="slider-block"><label for="year-slider" class="sr-only">Historical year</label><input id="year-slider" type="range" min="-600" max="2026" step="1" value="1"><div class="ruler" aria-hidden="true"><span>600 BCE</span><span>1 CE</span><span>500</span><span>1000</span><span>1500</span><span>2026</span></div>      <div class="jumps"><span>Explore a window</span><button data-year="-500">500 BCE</button><button data-year="-300">300 BCE</button><button data-year="1">1 CE</button><button data-year="300">300</button><button data-year="500">500</button><button data-year="1000">1000</button><button data-year="1600">1600</button><button data-year="1800">1800</button><button data-year="1858">1858</button><button data-year="1947">1947</button><button id="play-toggle" type="button" aria-pressed="false">Play</button><label class="play-speed">Speed <select id="play-speed" aria-label="Playback speed"><option value="slow">Slow</option><option value="steady" selected>Steady</option><option value="fast">Fast</option></select></label><button id="compare-toggle" type="button" aria-pressed="false">Compare</button></div></div>
      <div class="year-entry"><label for="year-input">Go to year</label><div><button id="previous-year" aria-label="Previous year">−</button><input id="year-input" type="number" min="-600" max="2026" step="1" value="1"><button id="next-year" aria-label="Next year">+</button></div></div>
      <div id="year-summary" class="year-summary" role="status" aria-live="polite"></div>
    </section>
    <div class="workspace">
      <section class="map-panel" aria-label="Historical atlas map">
        <div class="map-heading"><div><span class="eyebrow">THE SUBCONTINENT</span><h2>This year</h2></div><button id="reset-map" class="quiet">Reset view ↺</button></div>
        <fieldset class="map-controls"><legend>Map layers</legend><label><input id="show-period" type="checkbox" checked> Period snapshot</label><label><input id="show-regions" type="checkbox" checked> Highlight selected area</label><label><input id="show-battles" type="checkbox" checked> Battles & aftermath in this year</label></fieldset>
        <div id="map" tabindex="-1" aria-label="Interactive geographic map; equivalent records are listed alongside"></div>
        <div id="map-error" role="alert" hidden></div><p id="map-selection-status" class="map-selection-status" role="status" aria-live="polite"></p>
        <div class="map-caption"><span><i class="legend-dot" aria-hidden="true"></i> Colours: approximate snapshot polities · Grey: residual category · Purple: selected OHM match<br>B: battle · S: siege · A: aftermath</span><span>Filled areas are approximate and low confidence · a coarse world sheet, softened at the coast · not a surveyed border · OHM context is 1 January · Internet required</span></div>
        <div id="map-context" class="map-context" aria-live="polite"></div>
        <section class="battle-context" aria-labelledby="battle-heading"><h3 id="battle-heading">Battles & aftermath in this year</h3><p>Across the atlas, independent of the record filters. A matching date window does not prove fighting throughout that year or involvement by the selected ruler.</p><div id="battle-list"></div></section>
      </section>
      <aside id="evidence-drawer" class="record-panel" aria-labelledby="records-heading">
        <div class="record-heading"><span class="eyebrow">THE LIVING ARCHIVE</span><h2 id="records-heading" tabindex="-1">Explore the evidence</h2><p id="record-count" role="status" aria-live="polite"></p></div>
        <div class="filters"><label for="record-type">Record type</label><select id="record-type"><option value="all">All records</option></select><label class="sr-only" for="search">Search records in this year</label><input id="search" type="search" placeholder="Search this year, or the whole atlas…" autocomplete="off"></div>
        <div class="browse"><details id="browse-menu"><summary>Jump to a record…</summary><div id="browse-groups" class="browse-groups"></div></details></div>
        <p class="window-note">Date windows may be approximate. A match is not proof of an event in this exact year. Mughal and Rajput coverage is incomplete; some profiles contain chronology only.</p>
        <div id="record-list"></div>

      </aside>
    </div>
    <section id="record-detail" class="detail-panel" aria-labelledby="detail-title" tabindex="-1"></section>
    <section class="research-note"><span class="research-symbol" aria-hidden="true">↗</span><div><h2>An atlas in the making.</h2><p>${data.records.length} cited records are a starting point, not a complete history. Empty years mean research is still needed. Regional overlays require dated map evidence and independent review. Published period maps are linked as context, not exact annual borders.</p></div><a href="https://github.com/Saumya170501/History-of-India/blob/codex/historical-atlas-prototype/docs/PROJECT_PLAN.md" target="_blank" rel="noopener noreferrer">Read the project plan ↗</a></section>
  </main>
  <footer><span>HISTORY OF INDIA <span class="footer-dot">·</span> Built around evidence.</span><button id="footer-sources" class="quiet">${data.sources.length} sources · ${data.records.length} records</button></footer>
  <dialog id="about-dialog" aria-labelledby="about-title"><div class="dialog-top"><p class="eyebrow">OUR APPROACH</p><button id="close-about" aria-label="Close sources and approach">×</button></div><h2 id="about-title">Every point has a source.</h2><p>This prototype connects historical claims to published evidence. Its records are cited, but still await independent historical review.</p><h3>Reading the timeline</h3><p>Dates are inclusive search windows. A century-dated event appears throughout that century to make it discoverable; this does not mean it happened every year. Read each record's date note.</p><h3>Reading the map</h3><p>Points locate sites or associations. They do not represent a ruler's movements, a kingdom's territory or a civilization's extent. OpenHistoricalMap provides the dated physical map. Colour-filled areas are clipped sheets from André Ourednik’s historical-basemaps (GPL-3.0). They are coarse external digitizations. A year between sheets uses the nearest sheet and says so; borders are not interpolated. A country sheet from 1960 or later is not drawn when the selected year is more than five years away, because that map is not the political geography of the earlier year. A sheet name that the cited research does not support for the selected year is left off the map. No replacement shape is invented. The archive says which name was left off and why. The colour stops at a modern Natural Earth coastline, which is not a historical shore. Long inland edges are lightly softened for display and are not a surveyed frontier. A straight edge on the frame is a display cut. Grey areas are residual categories in the source, not single kingdoms. Clicking a name opens cited research where a link exists. The link is not proof that the shape was that polity’s border.</p><h3>Starter bibliography</h3><ul id="source-list"></ul><p class="small">Source pages checked 7 November 2026. Summaries are paraphrased. Coordinate provenance and claim-specific sections appear in each record.</p><p class="small">Map data: <a href="https://www.openhistoricalmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenHistoricalMap contributors and source licences</a>. Period sheets: <a href="https://github.com/aourednik/historical-basemaps" target="_blank" rel="noopener noreferrer">historical-basemaps</a>, GPL-3.0-only, clipped and labelled as approximate. Internet and WebGL are required; no API key is needed.</p></dialog>
`;

// One scrolling surface. Tabs: this year, the selected polity, records, sources.
const drawer = $('#evidence-drawer');
const resizeHandle = element('button', undefined, 'drawer-resize');
resizeHandle.type = 'button';
resizeHandle.setAttribute('aria-label', 'Drag to resize the archive');
const switcher = element('div', undefined, 'drawer-switcher');
const tabButtons = {};
for (const [name, label] of [['year', 'This year'], ['polity', 'Polity'], ['records', 'Records'], ['sources', 'Sources']]) {
  const button = element('button', label, 'drawer-view-button');
  button.type = 'button';
  button.addEventListener('click', () => setDrawerView(name));
  tabButtons[name] = button;
  switcher.append(button);
}
const noticeButton = element('button', 'Map notice', 'drawer-notice-button');
noticeButton.hidden = true;
switcher.append(noticeButton);
const scroller = element('div', undefined, 'drawer-scroll');
const yearView = element('div'); yearView.id = 'drawer-year';
const yearSearch = element('input');
yearSearch.type = 'search';
yearSearch.placeholder = 'Find an area on this sheet…';
yearSearch.setAttribute('aria-label', 'Filter areas shown for this year');
const yearList = element('div'); yearList.id = 'year-polity-list';
const yearCited = element('div'); yearCited.id = 'year-cited-list';
const comparePanel = element('div', undefined, 'compare-panel');
comparePanel.id = 'compare-panel';
comparePanel.hidden = true;
const compareControls = element('div', undefined, 'compare-controls');
const compareLabel = element('label', 'Other year ');
const compareInput = element('input');
compareInput.id = 'compare-year';
compareInput.type = 'number';
compareInput.min = '1';
compareInput.max = '2026';
compareInput.value = '1600';
compareInput.setAttribute('aria-label', 'Year to compare with the map');
compareLabel.append(compareInput);
const compareSwap = element('button', 'Show the other year on the map', 'compare-swap');
compareSwap.type = 'button';
const compareResult = element('div');
compareResult.id = 'compare-result';
compareControls.append(compareLabel, compareSwap);
comparePanel.append(element('h3', 'What changed between the two years'), compareControls, compareResult);
const guideBlock = element('details', undefined, 'guide-block');
guideBlock.append(element('summary', 'Guided tours'));
const guideIntro = element('p', 'A tour walks through records that are already in the atlas. It does not add a new claim.');
guideBlock.append(guideIntro);
for (const tour of TOURS) {
  const stops = resolveTour(tour, data.records);
  const block = element('section', undefined, 'tour');
  block.append(element('h3', tour.title), element('p', tour.summary));
  stops.forEach((stop, index) => {
    const button = element('button', `${index + 1}. ${stop.title} · ${stop.year} CE`, 'tour-stop');
    button.type = 'button';
    button.addEventListener('click', () => {
      state.year = stop.year;
      state.type = 'all';
      state.query = '';
      selectedId = stop.record.id;
      update();
      selectRecord(stop.record, false);
      setDrawerView('selected');
    });
    block.append(button);
  });
  guideBlock.append(block);
}
const successionNote = 'Cited ruler records in date order. A later name is not always the child of the previous one. Competing claims stay in the list. Open the record before treating a link as kinship.';
const successionBlocks = SUCCESSIONS.map((line) => {
  const block = element('details', undefined, 'guide-block');
  block.append(element('summary', line.title), element('p', successionNote));
  for (const record of successionLine(data.records, line)) {
    const button = element('button', `${record.title} · ${record.dateLabel}`, 'tour-stop');
    button.type = 'button';
    button.addEventListener('click', () => {
      state.year = record.startYear;
      state.type = 'all';
      state.query = '';
      selectedId = record.id;
      update();
      selectRecord(record, false);
      setDrawerView('selected');
    });
    block.append(button);
  }
  return block;
});
yearView.append(comparePanel, guideBlock, ...successionBlocks, yearSearch, yearList, yearCited);
const polityView = element('div'); polityView.id = 'drawer-polity';
const recordsView = element('div'); recordsView.id = 'drawer-records';
const recordSwitcher = element('div', undefined, 'record-switcher');
const browseViewButton = element('button', 'Discover', 'drawer-view-button');
const detailViewButton = element('button', 'Story', 'drawer-view-button');
recordSwitcher.append(browseViewButton, detailViewButton);
const browseView = element('div'); browseView.id = 'drawer-discover';
const detailView = element('div'); detailView.id = 'drawer-selected';
for (const selector of ['.filters', '.browse', '#record-list']) browseView.append($(selector));
const readingNote = element('details', undefined, 'reading-note');
readingNote.append(element('summary', 'How to read these dates'), $('.window-note'));
browseView.append(readingNote);
const backButton = element('button', '← Back to the collection', 'collection-back');
const storyNav = element('div', undefined, 'story-nav');
detailView.append(backButton, storyNav, $('#map-selection-status'), $('#record-detail'));
const contextDetails = element('details', undefined, 'drawer-context');
contextDetails.append(element('summary', 'Map context, legend & battles'));
for (const selector of ['.map-caption', '#map-context', '.battle-context']) contextDetails.append($(selector));
detailView.append(contextDetails, $('#map-error'));
recordsView.append(recordSwitcher, browseView, detailView);
const sourcesView = element('div'); sourcesView.id = 'drawer-sources';
scroller.append(yearView, polityView, recordsView, sourcesView);
drawer.append(resizeHandle, switcher, scroller);
let archiveTab = 'year';
let yearQuery = '';
function showRecordMode(view) {
  const discovering = view !== 'selected';
  browseView.hidden = !discovering;
  detailView.hidden = discovering;
  browseViewButton.setAttribute('aria-pressed', String(discovering));
  detailViewButton.setAttribute('aria-pressed', String(!discovering));
}
function setDrawerView(view) {
  if (view === 'discover' || view === 'selected') {
    archiveTab = 'records';
    showRecordMode(view);
  } else archiveTab = view;
  yearView.hidden = archiveTab !== 'year';
  polityView.hidden = archiveTab !== 'polity';
  recordsView.hidden = archiveTab !== 'records';
  sourcesView.hidden = archiveTab !== 'sources';
  for (const [name, button] of Object.entries(tabButtons)) button.setAttribute('aria-pressed', String(name === archiveTab));
  scroller.scrollTop = 0;
}
browseViewButton.addEventListener('click', () => setDrawerView('discover'));
detailViewButton.addEventListener('click', () => setDrawerView('selected'));
backButton.addEventListener('click', () => { setDrawerView('discover'); browseViewButton.focus(); });
noticeButton.addEventListener('click', () => { setDrawerView('selected'); $('#map-error').scrollIntoView({ block: 'nearest' }); });
yearSearch.addEventListener('input', () => { yearQuery = yearSearch.value; refreshYearPanel(); });
setDrawerView('year');
showRecordMode('discover');
$('#about-dialog').append($('.research-note'), $('footer'));

function setDrawerWidth(px) {
  const max = Math.min(720, Math.round(window.innerWidth * 0.62));
  const width = Math.max(380, Math.min(max, Math.round(px)));
  document.documentElement.style.setProperty('--drawer-width', `${width}px`);
}
setDrawerWidth(480);
resizeHandle.addEventListener('pointerdown', event => {
  if (window.innerWidth <= 760) return;
  event.preventDefault();
  const startX = event.clientX;
  const startW = drawer.getBoundingClientRect().width;
  const move = next => setDrawerWidth(startW + (startX - next.clientX));
  const up = () => {
    resizeHandle.releasePointerCapture(event.pointerId);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    refitMap();
  };
  resizeHandle.setPointerCapture(event.pointerId);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
});
let mapReady = false;
function setEvidenceOpen(open, { refit = true } = {}) {
  const changed = drawer.hidden === open;
  drawer.hidden = !open;
  document.body.classList.toggle('evidence-closed', !open);
  $('#toggle-evidence').setAttribute('aria-expanded', String(open));
  if (refit && mapReady && changed) refitMap();
}
setEvidenceOpen(!window.matchMedia('(max-width: 760px)').matches);
$('#toggle-evidence').addEventListener('click', () => setEvidenceOpen(drawer.hidden));
drawer.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !event.defaultPrevented) {
    setEvidenceOpen(false);
    $('#toggle-evidence').focus();
  }
});
$('.skip').addEventListener('click', () => setEvidenceOpen(true));

for (const [value, label] of Object.entries(TYPES))
  $("#record-type").add(new Option(label, value));
const browseGroups = new Map([
  ['Mughals', []],
  ['Rajputs', []],
  ['Others', []],
]);
for (const record of data.records) {
  const group = record.type === 'ruler' && record.tags?.includes('Mughal')
    ? 'Mughals'
    : record.type === 'ruler' && record.tags?.includes('Rajput')
      ? 'Rajputs' : 'Others';
  browseGroups.get(group).push(record);
}
for (const [label, records] of browseGroups) {
  const group = element('details', undefined, 'browse-group');
  group.name = 'record-categories';
  group.append(element('summary', label));
  const entries = element('div', undefined, 'browse-entries');
  for (const record of records.sort((a, b) => a.startYear - b.startYear || a.title.localeCompare(b.title))) {
    const button = element('button', `${record.title} · ${record.dateLabel}`);
    button.type = 'button';
    button.value = record.id;
    button.addEventListener('click', browseRecord);
    entries.append(button);
  }
  group.append(entries);
  $('#browse-groups').append(group);
}
$('#browse-menu').addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.stopPropagation();
    $('#browse-menu').open = false;
    $('#browse-menu > summary').focus();
  }
});
document.addEventListener('click', (event) => {
  if (!$('#browse-menu').contains(event.target)) $('#browse-menu').open = false;
});
for (const source of data.sources) {
  const item = element("li");
  item.append(
    link(source.title, source.url),
    element("span", source.publisher, "source-publisher"),
  );
  $("#source-list").append(item);
}

const frameBounds = L.latLngBounds([FRAME.south, FRAME.west], [FRAME.north, FRAME.east]);
const map = L.map("map", {
  zoomControl: false,
  minZoom: 4,
  maxZoom: 8,
  scrollWheelZoom: false,
  maxBounds: frameBounds.pad(0.04),
  maxBoundsViscosity: 1,
}).setView([22.5, 80], 5);
L.control.zoom({ position: "topright" }).addTo(map);
const tracedCredit = element('p', '', 'traced-credit');
tracedCredit.id = 'traced-credit';
tracedCredit.hidden = true;
$('.map-panel').append(tracedCredit);
const creditsButton = element('button', 'Map credits', 'quiet');
creditsButton.id = 'credits-button';
creditsButton.type = 'button';
$('#about-button').before(creditsButton);
const creditsDialog = document.createElement('dialog');
creditsDialog.id = 'credits-dialog';
creditsDialog.setAttribute('aria-labelledby', 'credits-title');
document.body.append(creditsDialog);
$('#about-dialog').append(element('p', 'When a traced outline is loaded, it is approximate and credited on the map and on Map credits. The tracing is CC BY-SA 4.0 data. That is not a licence for the site code.'));
map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
const markerLayer = L.layerGroup().addTo(map);
const regionLayer = L.featureGroup().addTo(map);
const battleLayer = L.featureGroup().addTo(map);
const periodLayer = L.featureGroup().addTo(map);
const markersById = new Map();
const snapshotCache = new Map();
const tracedCache = new Map();
let tracedIndex = { shapes: [] };
let periodFeatures = [];
let periodSummary = null;
let openPolityName = null;
let shownSnapshot = null;
let yearTimer = 0;
let periodToken = 0;
const { attachHistoricalMap } = await mapEngine;
const historicalMap = attachHistoricalMap(map, {
  onStatus: message => { $('#map-selection-status').textContent = message; },
  onError: message => {
    const notice = $('#map-error');
    notice.hidden = !message;
    noticeButton.hidden = !message;
    notice.replaceChildren();
    if (message) {
      notice.append(element('span', message));
      const retry = element('button', 'Retry map', 'quiet');
      retry.addEventListener('click', () => historicalMap.retry());
      notice.append(retry);
    }
  },
});

function appendMapEvidence(container, item) {
  container.append(element('h4', item.title), element('p', item.dateLabel),
    element('p', item.dateNote), element('p', item.uncertaintyNote));
  if (item.url) container.append(link('Open published regional map ↗', item.url));
  if (item.kind) {
    container.append(element('p', item.kind === 'cultural'
      ? 'Cultural distribution — not a political border.'
      : 'Reconstructed political extent — not a surveyed border.'));
    const details = element('details');
    details.append(element('summary', 'Boundary provenance and review'));
    for (const key of ['author', 'edition', 'page', 'scale', 'rights', 'digitizationMethod', 'competingInterpretations'])
      details.append(element('p', `${key}: ${item.provenance[key]}`));
    const mapSource = sources.get(item.provenance.sourceId);
    details.append(link(mapSource.title, mapSource.url));
    details.append(element('p', `Reviewed by ${item.review.reviewer}, ${item.review.date}.`));
    container.append(details);
  }
  for (const citation of item.citations) {
    const source = sources.get(citation.sourceId);
    container.append(link(source.title, source.url),
      element('p', `${citation.locator}. ${citation.supports}`, 'citation-note'));
  }
}

function renderRegion(record) {
  regionLayer.clearLayers();
  const area = relatedArea(record);
  historicalMap.select(record, state.year, $('#show-regions').checked);
  const context = $('#map-context');
  context.replaceChildren(element('h3', record ? `Regional map · ${record.title}` : 'Regional map'));
  if (sketchAvailable(record, state.year)) context.append(element('p', SKETCH_NOTICE));
  const mapReferences = element('p');
  const reference = mapReference(record, state.year);
  mapReferences.append(link(`OpenHistoricalMap · ${state.year} CE ↗`, reference.sourceUrl));
  context.append(mapReferences, element('p',
    'OpenHistoricalMap supplies physical geography; provider labels and political context are hidden. Highlighting uses dated provider name matches, not independently reviewed territorial claims. Read the source before interpreting any extent.'));

  if (!record) {
    historicalMap.setRegions({ type: 'FeatureCollection', features: [] });
    context.append(element('p', 'Choose a record to inspect its regional evidence.'));
    return;
  }
  if (area) {
    const areaEvidence = element('div');
    areaEvidence.id = 'related-area-evidence';
    areaEvidence.append(element('h4', `Map orientation · ${area.label}`),
      element('p', 'This regional association sets the viewport only. No territory is inferred from its center or radius.'),
      element('p', area.basis));
    const source = sources.get(record.locationSourceId || record.citations[0].sourceId);
    areaEvidence.append(link(`Association evidence: ${source.title} ↗`, source.url));
    context.append(areaEvidence);
  }
  const regions = regionsForRecord(mapLayers, record.id, state.year);
  historicalMap.setRegions({ type: 'FeatureCollection', features: $('#show-regions').checked ? regions.map(region => ({ type: 'Feature', properties: { id: region.id }, geometry: region.geometry })) : [] });
  if (!regions.length) context.append(element('p',
    `No reviewed boundary is available for this record in ${state.year} CE. A place marker does not show its territory or cultural extent.`));
  else if (!$('#show-regions').checked) context.append(element('p', 'Regional overlays are hidden. Their evidence is listed below.'));
  for (const region of regions) {
    if ($('#show-regions').checked) {
      const shape = L.geoJSON(region.geometry, { style: {
        opacity: 0, fillOpacity: 0, // Leaflet hit target; MapLibre renders the polygon.
      }}).addTo(regionLayer);
      const popup = element('div', undefined, 'map-popup');
      appendMapEvidence(popup, region);
      shape.bindPopup(popup);
    }
    const evidence = element('details');
    evidence.append(element('summary', `${region.title} · ${region.dateLabel}`));
    appendMapEvidence(evidence, region);
    context.append(evidence);
  }
  for (const reference of referencesForRecord(mapLayers, record.id, state.year)) {
    context.append(link('Open published regional map ↗', reference.url),
      element('p', `${reference.dateLabel}. Period context only; not the selected ruler’s exact boundary.`));
  }
}

function renderBattles() {
  battleLayer.clearLayers();
  const list = $('#battle-list');
  const battles = battlesForYear(data.records, state.year);
  list.replaceChildren();
  if (!battles.length) list.append(element('p',
    `No battle or aftermath records are documented here for ${state.year} CE. This does not mean there was no conflict.`));
  if (!$('#show-battles').checked) list.append(element('p', 'Battle markers are hidden. Records remain listed below.'));
  for (const battle of battles) {
    const openBattle = () => {
      state.type = 'all'; state.query = ''; selectedId = battle.id;
      update(); selectRecord(battle, true);
    };
    const label = `${battle.title} · ${BATTLE_KINDS[battle.eventKind]} · ${battle.dateLabel}`;
    const button = element('button', label, 'battle-entry');
    button.addEventListener('click', openBattle);
    list.append(button, element('p', battle.geometry ? battle.locationNote : 'Location unverified · timeline only.'));
    if (!battle.geometry || !$('#show-battles').checked) continue;
    const [lon, lat] = battle.geometry.coordinates;
    const marker = L.marker([lat, lon], {
      title: label, keyboard: true,
      icon: L.divIcon({ className: 'history-marker',
        html: `<span class="pin battle-pin ${battle.datePrecision !== 'year' ? 'approximate' : ''}">${{battle:'B',siege:'S',aftermath:'A'}[battle.eventKind]}</span>`,
        iconSize: [30, 30], iconAnchor: [15, 15] }),
    }).addTo(battleLayer);
    const marks = markersById.get(battle.id) || [];
    marks.push(marker);
    markersById.set(battle.id, marks);
    const popup = element('div', undefined, 'map-popup');
    popup.append(element('strong', label), element('p', battle.dateNote), element('p', battle.locationNote));
    const read = element('button', 'Read event evidence');
    read.addEventListener('click', () => { openBattle(); map.closePopup(); });
    popup.append(read);
    marker.bindPopup(popup);
  }
}

function renderDetail(record) {
  renderRegion(record);
  const panel = $("#record-detail");
  const viewKey = `${record?.id || "empty"}:${state.year}`;
  if (panel.dataset.viewKey === viewKey) return;
  panel.dataset.viewKey = viewKey;
  panel.replaceChildren();
  if (!record) {
    const title = element("h2", "History leaves gaps.");
    title.id = "detail-title";
    panel.append(
      title,
      element(
        "p",
        "No record matches this selection. Try another year, clear your filters or browse the starter collection. Absence here is not evidence of historical absence.",
      ),
    );
    return;
  }
  const story = element("div", undefined, "detail-story");
  story.append(
    element("p", `${TYPES[record.type]} / ${record.place}`, "eyebrow"),
  );
  const title = element("h2", record.title);
  title.id = "detail-title";
  story.append(
    title,
    element("p", record.summary, "detail-summary"),
    element("span", "Cited · awaiting independent review", "review-badge"),
  );
  const showMap = element('button', 'View regional map & contemporary battles', 'view-map');
  showMap.addEventListener('click', () => {
    focusRecordMap(record);
    $('#map').scrollIntoView({ block: 'center' });
    $('#map').focus({ preventScroll: true });
  });
  story.append(showMap);
  const evidence = element("div", undefined, "detail-evidence");
  const tracedHere = shapesForYear(tracedIndex, state.year).filter(shape => shape.recordIds?.includes(record.id));
  evidence.append(
    element("h3", record.dateLabel),
    element("p", record.dateNote),
    element("h3", "Location and mapping status"),
    element("p", record.locationNote),
    element("p", tracedHere.length
      ? 'An approximate traced outline is drawn for this year. It is labelled approximate and is not a verified border. A cited point, where one is shown, is still only a place.'
      : record.geometry
      ? 'This point is the cited place. It is not a kingdom boundary. No reviewed territorial outline is attached to this record.'
      : 'No boundary source is available for this record, so no territory is drawn.'),
    element("h3", "Follow the evidence"),
  );
  if (tracedHere.length) {
    evidence.append(element('h3', 'Approximate outline'));
    for (const shape of tracedHere) {
      evidence.append(
        element('p', `${shape.title} is labelled approximate. Confidence is ${shape.confidence}. ${shape.changes}`),
        link(`${shape.author}, ${shape.licence} ↗`, shape.commonsUrl),
        element('p', `${shape.mapSource} ${shape.depicted} This tracing is CC BY-SA 4.0.`, 'citation-note'),
      );
    }
  }
  for (const citation of record.citations) {
    const source = sources.get(citation.sourceId);
    evidence.append(
      link(`${source.publisher}: ${source.title} ↗`, source.url),
      element(
        "p",
        `${citation.locator}. ${citation.supports}`,
        "citation-note",
      ),
    );
  }
  evidence.append(element('h3', 'Regional map evidence'));
  const regionalEvidence = [...regionsForRecord(mapLayers, record.id, state.year),
    ...referencesForRecord(mapLayers, record.id, state.year)];
  if (!regionalEvidence.length) evidence.append(element('p',
    'A dated, sourced regional map is not yet available for this selection. No boundary has been inferred from this record’s place or reign dates.'));
  for (const item of regionalEvidence) appendMapEvidence(evidence, item);
  if (record.hasProfile && !record.details) {
    story.append(element('p', 'The longer profile is loading.', 'profile-note'));
    scheduleProfile(record, () => {
      if (selectedId !== record.id) return;
      delete panel.dataset.viewKey;
      renderDetail(record);
    });
  }
  if (record.details?.length) {
    const biography = element('section', undefined, 'biography');
    biography.append(element('h3', 'Historical profile'), element('p',
      'These notes cover the record’s broader historical context, not only the selected year. Research depth varies; citations do not imply independent review.', 'profile-note'));
    for (const section of record.details) {
      const block = element('section');
      block.append(element('h4', section.heading), element('p', section.text));
      for (const citation of section.citations) {
        const source = sources.get(citation.sourceId);
        block.append(link(source.title, source.url),
          element('p', `${citation.locator}. ${citation.supports}`, 'citation-note'));
      }
      biography.append(block);
    }
    story.append(biography);
  }
  panel.append(story, evidence);
}

function focusRecordMap(record) {
  const reference = mapReference(record, state.year);
  if (regionLayer.getLayers().length) map.fitBounds(regionLayer.getBounds(), { maxZoom: 6, animate: false });
  else map.setView(reference.center, reference.zoom, { animate: false });
}

function scheduleProfile(record, after) {
  if (!record?.hasProfile || record.details || record.profileState === 'loading') return;
  record.profileState = 'loading';
  fetch(`${import.meta.env.BASE_URL}data/profiles/${record.id}.json`)
    .then(response => response.ok ? response.json() : null)
    .then(details => {
      record.profileState = 'ready';
      if (Array.isArray(details) && details.length) record.details = details;
      after?.();
    })
    .catch(() => { record.profileState = 'ready'; });
}
function selectRecord(record, focus = false, camera = 'record') {
  selectedId = record.id;
  for (const button of document.querySelectorAll('.catalogue-row'))
    button.setAttribute('aria-pressed', String(button.dataset.id === record.id));
  renderDetail(record);
  renderStoryNav();
  if (camera === 'story') focusStory(record);
  else focusRecordMap(record);
  pulseRecord(record);
  if (focus) {
    $('#map').scrollIntoView({ block: 'center' });
    $('#map').focus({ preventScroll: true });
  }
}
function focusStory(record) {
  const group = groupRecords([record], polityLinks.links)[0];
  const areas = (group?.highlight || []).flatMap(name => featuresByName(name));
  if (record.geometry?.type === 'Point') {
    const [lon, lat] = record.geometry.coordinates;
    map.setView([lat, lon], 6, { animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches });
  } else if (areas.length) fitFeatures(areas, 6);
  else focusRecordMap(record);
}
function pulseRecord(record) {
  document.querySelectorAll('.point-hit-target.pulse').forEach(node => node.classList.remove('pulse'));
  if (!record) { historicalMap.hoverPeriod(null); return; }
  for (const marker of markersById.get(record.id) || []) {
    marker.getElement()?.querySelector('.point-hit-target, .battle-pin')?.classList.add('pulse');
  }
  const group = groupRecords([record], polityLinks.links)[0];
  const feature = (group?.highlight || []).map(name => featureByName(name)).find(Boolean);
  historicalMap.hoverPeriod(feature ? feature.id : null);
}
function renderStoryNav() {
  const ordered = storyOrder(recordsForYear(data.records, state.year, state.type, state.query));
  const index = ordered.findIndex(item => item.id === selectedId);
  storyNav.replaceChildren();
  const go = (record) => {
    selectedId = record.id;
    update();
    setDrawerView('selected');
    focusStory(record);
  };
  const previous = element('button', 'Previous', 'story-step');
  previous.type = 'button';
  previous.disabled = index <= 0;
  previous.addEventListener('click', () => go(ordered[index - 1]));
  const next = element('button', 'Next', 'story-step');
  next.type = 'button';
  next.disabled = index < 0 || index >= ordered.length - 1;
  next.addEventListener('click', () => go(ordered[index + 1]));
  storyNav.append(previous, element('p', index >= 0 ? `${index + 1} of ${ordered.length} this year` : '', 'story-count'), next);
}

function featureByName(name) {
  return periodFeatures.find(feature => feature.properties.name === name) || null;
}
function featuresByName(name) {
  return periodFeatures.filter(feature => feature.properties.name === name);
}
function mapPadding() {
  const open = drawer && !drawer.hidden && window.innerWidth > 760;
  const right = open ? drawer.getBoundingClientRect().width + 28 : 24;
  return { paddingTopLeft: [24, 84], paddingBottomRight: [right, 28] };
}
function fitLatLngBounds(bounds, maxZoom) {
  if (!bounds?.isValid()) return;
  map.fitBounds(bounds, {
    ...mapPadding(), maxZoom,
    animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  });
}
function boundsToLeaflet(box) {
  if (!box) return null;
  return L.latLngBounds([box.south, box.west], [box.north, box.east]);
}
function fitYear(features) {
  fitLatLngBounds(boundsToLeaflet(boundsOfFeatures(features)) || frameBounds, 5.5);
}
function fitFeatures(features, maxZoom) {
  fitLatLngBounds(boundsToLeaflet(boundsOfFeatures(features, { namedOnly: false })) || frameBounds, maxZoom);
}
function tightenFrame() {
  map.invalidateSize({ animate: false });
  if (map.getSize().x < 50 || map.getSize().y < 50) return;
  const fitZoom = map.getBoundsZoom(frameBounds, false);
  if (Number.isFinite(fitZoom) && fitZoom > 0 && fitZoom < 12) map.setMinZoom(fitZoom);
  map.setMaxBounds(frameBounds.pad(0.06));
}
function refitMap() {
  if (openPolityName && featuresByName(openPolityName).length) fitFeatures(featuresByName(openPolityName), 6);
  else if (periodFeatures.length) fitYear(periodFeatures);
  else fitLatLngBounds(frameBounds, 5);
}
function refreshYearPanel() {
  fillYearList(yearList, {
    features: periodFeatures,
    query: yearQuery,
    selectedName: openPolityName,
    onPolity: name => showPolity(featureByName(name), { zoom: true, focus: true }),
  });
  yearCited.replaceChildren();
  if (!periodSummary) return;
  if (periodSummary.omitted?.length) {
    yearCited.append(element('h3', 'Not drawn for this year', 'year-group'));
    for (const item of periodSummary.omitted)
      yearCited.append(element('p', `${item.name}. ${item.note} No replacement boundary is available.`, 'year-empty'));
  }
  const cited = [...periodSummary.kingdoms, ...periodSummary.rulers];
  if (!cited.length) return;
  yearCited.append(element('h3', 'Cited research in this year', 'year-group'));
  yearCited.append(element('p', 'A date window that includes this year is not proof of rule throughout it.', 'year-empty'));
  const list = element('div', undefined, 'cited-list');
  for (const title of cited) {
    const record = data.records.find(item => item.title === title && state.year >= item.startYear && state.year <= item.endYear);
    const button = element('button', title, 'cited-row');
    button.type = 'button';
    if (!record) { button.disabled = true; list.append(button); continue; }
    button.addEventListener('click', () => { selectRecord(record, false); setDrawerView('selected'); });
    list.append(button);
  }
  yearCited.append(list);
}
function closePolity() {
  openPolityName = null;
  polityView.replaceChildren();
  historicalMap.hoverPeriod(null);
  refreshYearPanel();
  if (archiveTab === 'polity') setDrawerView('year');
  fitYear(periodFeatures);
}
function showPolity(feature, { zoom = true, focus = false } = {}) {
  if (!feature || !periodSummary) return closePolity();
  openPolityName = feature.properties.name;
  const linked = recordsForPolity(feature.properties.name, polityLinks.links, data.records, state.year);
  for (const record of linked) scheduleProfile(record, () => {
    if (openPolityName === feature.properties.name) showPolity(feature, { zoom: false, focus: false });
  });
  fillPolityCard(polityView, {
    feature, year: state.year, summary: periodSummary, links: polityLinks.links,
    records: data.records, sources, onClose: closePolity,
    onRecord: record => { selectRecord(record, false); setDrawerView('selected'); },
  });
  historicalMap.hoverPeriod(feature.id);
  refreshYearPanel();
  if (focus) {
    setEvidenceOpen(true, { refit: false });
    setDrawerView('polity');
  }
  if (zoom) fitFeatures(featuresByName(feature.properties.name), 6);
}
function drawPeriodHits(collection) {
  periodLayer.clearLayers();
  periodFeatures = collection?.features || [];
  if (!$('#show-period').checked) return;
  for (const feature of periodFeatures) {
    const shape = L.geoJSON(feature, {
      style: { opacity: 0, fillOpacity: 0, weight: 12 },
    }).addTo(periodLayer);
    const tip = feature.properties.kind === 'residual'
      ? `${feature.properties.name} · residual category, not a single kingdom`
      : feature.properties.kind === 'caution'
        ? `${feature.properties.name} · sheet label, disagrees with the research`
        : feature.properties.name;
    shape.bindTooltip(tip, { sticky: true, opacity: 0.92 });
    shape.on('mouseover', () => historicalMap.hoverPeriod(feature.id));
    shape.on('mouseout', () => historicalMap.hoverPeriod(null));
    shape.on('click', event => {
      L.DomEvent.stopPropagation(event);
      showPolity(feature, { zoom: true, focus: true });
    });
  }
}
async function syncPeriod() {
  const token = ++periodToken;
  const choice = nearestSnapshot(state.year, basemapIndex.snapshots);
  const summaryBox = $('#year-summary');
    if (!choice) {
    fillYearSummary(summaryBox, null, {});
    refreshYearPanel();
    return;
  }
  try {
    if (!snapshotCache.has(choice.snapshot.year)) {
      const response = await fetch(`${import.meta.env.BASE_URL}data/basemaps/${choice.snapshot.file}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const collection = await response.json();
      snapshotCache.set(choice.snapshot.year, collection);
    }
    if (token !== periodToken) return;
    const collection = snapshotCache.get(choice.snapshot.year);
    const suppressed = sheetIsSuppressed(state.year, choice);
    const interpreted = suppressed
      ? { features: [], omitted: [] }
      : applySheetReading(collection.features, state.year);
    const reading = { type: 'FeatureCollection', features: interpreted.features };
    periodSummary = summarizeYear({
      year: state.year,
      snapshotYear: choice.snapshot.year,
      gapYears: choice.gapYears,
      features: reading.features,
      records: data.records,
      suppressed,
      omitted: interpreted.omitted,
    });
    const visible = $('#show-period').checked && !suppressed;
    const signature = `${choice.snapshot.year}:${state.year}:${visible}:${suppressed}`;
    const sheetChanged = shownSnapshot !== signature;
    if (sheetChanged) {
      historicalMap.setPeriod(visible ? reading : { type: 'FeatureCollection', features: [] });
      drawPeriodHits(reading);
      shownSnapshot = signature;
    }
    fillYearSummary(summaryBox, periodSummary, {
      onOpenList: () => { setEvidenceOpen(true, { refit: false }); setDrawerView('year'); },
    });
    fillYearSources(sourcesView, { year: state.year, records: data.records, sources, traced: shapesForYear(tracedIndex, state.year) });
    const current = openPolityName ? featureByName(openPolityName) : null;
    if (current) showPolity(current, { zoom: sheetChanged, focus: false });
    else {
      if (openPolityName) { openPolityName = null; polityView.replaceChildren(); }
      refreshYearPanel();
      if (sheetChanged) fitYear(visible ? collection.features : []);
    }
  } catch (error) {
    if (token !== periodToken) return;
    summaryBox.replaceChildren();
    summaryBox.append(element('p', `Period snapshot unavailable: ${error.message}. Cited records are still listed.`, 'year-line'));
  }
}
function paintTracedCredit(active) {
  tracedCredit.replaceChildren();
  if (!active.length) { tracedCredit.hidden = true; return; }
  tracedCredit.hidden = false;
  tracedCredit.append(document.createTextNode('Approximate. '));
  active.forEach((shape, index) => {
    if (index) tracedCredit.append(document.createTextNode(' '));
    const anchor = link(`${shape.author}, ${shape.licence}`, shape.commonsUrl);
    tracedCredit.append(anchor);
  });
}
function syncTraced() {
  const active = shapesForYear(tracedIndex, state.year);
  paintTracedCredit(active);
  const pending = active.filter(shape => !tracedCache.has(shape.file));
  Promise.all(pending.map(async shape => {
    const response = await fetch(`${import.meta.env.BASE_URL}data/traced/${shape.file}`);
    tracedCache.set(shape.file, response.ok ? await response.json() : { type: 'FeatureCollection', features: [] });
  })).then(() => {
    if (shapesForYear(tracedIndex, state.year).map(shape => shape.file).join() !== active.map(shape => shape.file).join()) return;
    const features = [];
    active.forEach((shape, index) => {
      for (const feature of tracedCache.get(shape.file)?.features || []) {
        if (feature.properties?.id && feature.properties.id !== shape.id) continue;
        features.push({
          ...feature,
          properties: {
            ...feature.properties,
            confidence: shape.confidence,
            name: `${shape.title} (approximate)`,
            swatch: index % 5,
          },
        });
      }
    });
    historicalMap.setTraced({ type: 'FeatureCollection', features });
  }).catch(() => historicalMap.setTraced({ type: 'FeatureCollection', features: [] }));
}
function openMapCredits() {
  creditsDialog.replaceChildren();
  const top = element('div', undefined, 'dialog-top');
  top.append(element('p', 'MAP CREDITS', 'eyebrow'));
  const close = element('button', '×');
  close.type = 'button';
  close.setAttribute('aria-label', 'Close map credits');
  close.addEventListener('click', () => creditsDialog.close());
  top.append(close);
  const list = element('div');
  list.id = 'map-credits';
  list.append(element('h2', 'Approximate traced outlines'));
  list.append(element('p', 'Each shape is a trace of one reusable Commons map. The tracing is CC BY-SA 4.0 data. That licence does not cover the site code. A shape is skipped when the file’s licence is unclear or the map cannot be placed.'));
  if (!tracedIndex.shapes?.length) list.append(element('p', 'No traced outline is loaded.'));
  for (const shape of tracedIndex.shapes || []) {
    const card = element('article');
    card.append(
      element('h3', `${shape.title} (approximate)`),
      element('p', `${formatYear(shape.startYear)} – ${formatYear(shape.endYear)}. Confidence: ${shape.confidence}.`),
      element('p', shape.depicted),
      element('p', shape.changes),
      link(`${shape.author}, ${shape.licence} ↗`, shape.commonsUrl),
      element('p', shape.mapSource, 'citation-note'),
    );
    list.append(card);
  }
  creditsDialog.append(top, list);
  creditsDialog.showModal();
}
function render() {
  syncTraced();
  const matches = recordsForYear(
    data.records,
    state.year,
    state.type,
    state.query,
  );
  const allYear = recordsForYear(data.records, state.year);
  paintYear(state.year);
  $("#previous-year").disabled = state.year === MIN_YEAR;
  $("#next-year").disabled = state.year === MAX_YEAR;
  $("#record-type").value = state.type;
  $("#search").value = state.query;
  $("#record-count").textContent =
    `${matches.length} ${matches.length === 1 ? "record window includes" : "record windows include"} ${formatYear(state.year)}`;
  document
    .querySelectorAll("[data-year]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(Number(button.dataset.year) === state.year),
      ),
    );
  const list = $("#record-list");
  list.replaceChildren();
  markerLayer.clearLayers();
  markersById.clear();
  if (!matches.some((record) => record.id === selectedId))
    selectedId = storyOrder(matches)[0]?.id || null;
  const pointGroups = new Map();
  const catalogue = groupRecords(matches, polityLinks.links);
  let openBudget = 8;
  for (const group of catalogue) {
    const section = element('details', undefined, 'catalogue-group');
    const selectedHere = group.records.some(record => record.id === selectedId);
    if (selectedHere || openBudget > 0) {
      section.open = true;
      if (!selectedHere) openBudget -= group.records.length;
    }
    const summary = document.createElement('summary');
    const swatch = element('i', undefined, 'catalogue-swatch');
    swatch.style.background = group.kind === 'polity' ? polityColor(group.title) : '#8a7355';
    summary.append(swatch, element('span', group.title), element('span', String(group.records.length), 'catalogue-count'));
    section.append(summary);
    for (const record of group.records) {
      const button = createRecordCard({
        record,
        factionColor: sketchAvailable(record, state.year) ? '#8b5cf6' : recordFactionColor(record),
        selected: record.id === selectedId,
        handleCardClick: () => {
          selectRecord(record, false, 'story');
          setDrawerView('selected');
          $('#record-detail').focus({ preventScroll: true });
        },
        locationNote: !record.geometry ? (sketchAvailable(record, state.year)
          ? 'Unverified user sketch available' : 'Location pending · timeline only') : '',
      });
      const show = () => pulseRecord(record);
      const restore = () => pulseRecord(data.records.find(item => item.id === selectedId) || null);
      button.addEventListener('mouseenter', show);
      button.addEventListener('focus', show);
      button.addEventListener('mouseleave', restore);
      button.addEventListener('blur', restore);
      section.append(button);
      if (!record.geometry || record.type === 'battle') continue;
      const key = record.geometry.coordinates.join(',');
      if (!pointGroups.has(key)) pointGroups.set(key, []);
      pointGroups.get(key).push(record);
    }
    list.append(section);
  }
  if (state.query.trim()) {
    const others = searchAtlas(data.records, state.query)
      .filter(record => state.year < record.startYear || state.year > record.endYear)
      .slice(0, 12);
    if (others.length) {
      const block = element('div', undefined, 'other-years');
      block.append(element('h3', 'Other years'));
      for (const record of others) {
        const button = element('button', `${record.title} · ${record.dateLabel}`, 'tour-stop');
        button.type = 'button';
        button.addEventListener('click', () => {
          state.year = record.startYear;
          state.type = 'all';
          state.query = '';
          selectedId = record.id;
          update();
          selectRecord(record, false);
          setDrawerView('selected');
        });
        block.append(button);
      }
      list.append(block);
    }
  }
  const groups = pointGroups;
  if (!matches.length) {
    const empty = element("div", undefined, "empty");
    empty.append(
      element(
        "strong",
        allYear.length
          ? "No matches for these filters."
          : "This year is a research gap.",
      ),
      element(
        "p",
        allYear.length
          ? "Other records exist in this year. Clear the filters to see them."
          : "There are no starter records in this window yet. Try 1, 500, 1500, 1565 or 1632 CE.",
      ),
    );
    if (state.type !== "all" || state.query) {
      const clear = element("button", "Clear filters", "quiet");
      clear.addEventListener("click", () => {
        state.type = "all";
        state.query = "";
        update();
      });
      empty.append(clear);
    }
    list.append(empty);
  }
  historicalMap.setFeatures({ type: 'FeatureCollection', features: [...groups.values()].map(records => ({ type: 'Feature', properties: { entity_name: records[0].title }, geometry: records[0].geometry })) });
  for (const records of groups.values()) {
    const [lon, lat] = records[0].geometry.coordinates;
    const approximate = records.some(
      (record) => record.datePrecision !== "year",
    );
    const marker = L.marker([lat, lon], {
      title: records.map((record) => record.title).join("; "),
      keyboard: true,
      icon: L.divIcon({
        className: "history-marker",
        html: `<span class="point-hit-target"></span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
    }).addTo(markerLayer);
    for (const record of records) {
      const marks = markersById.get(record.id) || [];
      marks.push(marker);
      markersById.set(record.id, marks);
    }
    const popup = element("div", undefined, "map-popup");
    popup.append(element("strong", records[0].place));
    for (const record of records) {
      const button = element("button", record.title);
      button.addEventListener("click", () => {
        selectRecord(record, true);
        map.closePopup();
      });
      popup.append(button);
    }
    popup.append(
      element(
        "p",
        approximate
          ? "Includes approximate date windows."
          : "Year-dated record.",
      ),
    );
    marker.bindPopup(popup);
  }
  renderBattles();
  renderDetail(matches.find((record) => record.id === selectedId));
  renderStoryNav();
  pulseRecord(matches.find((record) => record.id === selectedId) || null);
  syncPeriod();
  refreshCompare();
}

function update() {
  const params = new URLSearchParams(location.search);
  params.set("year", String(state.year));
  if (state.type === "all") params.delete("type");
  else params.set("type", state.type);
  if (!state.query) params.delete("q");
  else params.set("q", state.query);
  history.replaceState(
    null,
    "",
    `${location.pathname}?${params}${location.hash}`,
  );
  render();
}
function paintYear(year) {
  const safe = year === 0 ? 1 : year;
  const parts = formatYearParts(safe);
  $("#year-slider").value = safe;
  $("#year-slider").setAttribute("aria-valuetext", formatYear(safe));
  $("#year-input").value = safe;
  $("#year-display").value = parts.number;
  const era = document.querySelector('.year-block .ce');
  if (era) era.textContent = parts.era;
}
let playTimer = 0;
let compareOn = false;
let compareYear = 1600;
let compareToken = 0;
function stopPlayback() {
  clearTimeout(playTimer);
  playTimer = 0;
  const button = $('#play-toggle');
  button.textContent = 'Play';
  button.setAttribute('aria-pressed', 'false');
}
async function sheetNames(year) {
  const choice = nearestSnapshot(year, basemapIndex.snapshots);
  if (!choice) return { names: [], note: 'No snapshot is published.' };
  if (sheetIsSuppressed(year, choice))
    return { names: [], note: `No close political sheet. Nearest is ${choice.snapshot.year}, ${choice.gapYears} years away, and it is not drawn.` };
  if (!snapshotCache.has(choice.snapshot.year)) {
    const response = await fetch(`${import.meta.env.BASE_URL}data/basemaps/${choice.snapshot.file}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    snapshotCache.set(choice.snapshot.year, await response.json());
  }
  const features = applySheetReading(snapshotCache.get(choice.snapshot.year).features, year).features;
  return {
    names: [...new Set(features.filter(feature => feature.properties.kind === 'named').map(feature => feature.properties.name))],
    note: choice.gapYears === 0
      ? `Sheet ${choice.snapshot.year}.`
      : `Nearest sheet ${choice.snapshot.year}, ${choice.gapYears} years away. Borders are not interpolated.`,
  };
}
async function refreshCompare() {
  if (!compareOn) return;
  const token = ++compareToken;
  compareResult.replaceChildren(element('p', 'Comparing the two sheets…'));
  try {
    const [left, right] = await Promise.all([sheetNames(state.year), sheetNames(compareYear)]);
    if (token !== compareToken) return;
    const diff = compareNames(left.names, right.names);
    compareResult.replaceChildren(
      element('p', `${state.year} CE on the map. ${left.note}`),
      element('p', `${compareYear} CE compared. ${right.note}`),
      element('p', `Only on the map’s year: ${diff.onlyLeft.join(', ') || 'none'}.`),
      element('p', `Only in ${compareYear}: ${diff.onlyRight.join(', ') || 'none'}.`),
      element('p', `Named on both sheets: ${diff.both.join(', ') || 'none'}.`),
    );
  } catch (error) {
    if (token === compareToken) compareResult.replaceChildren(element('p', `Comparison unavailable: ${error.message}`));
  }
}
function stepPlayback() {
  const speed = PLAY_SPEEDS[$('#play-speed').value] || PLAY_SPEEDS.steady;
  const move = nextPlaybackYear({
    year: state.year, maxYear: MAX_YEAR, step: speed.step, snapshots: basemapIndex.snapshots,
  });
  setYear(move.year, true, 'play');
  if (move.done) stopPlayback();
  return move;
}
function setYear(value, immediate = false, source = 'user') {
  if (source !== 'play') stopPlayback();
  const numeric = Number(value);
  const next = numeric === 0 ? (state.year > 0 ? -1 : 1) : normalizeYear(value, state.year);
  state.year = next;
  paintYear(state.year);
  clearTimeout(yearTimer);
  if (immediate) update();
  else yearTimer = setTimeout(update, 90);
}
function onYearWheel(event) {
  if (event.target.closest('#evidence-drawer, .polity-card, input, textarea, select, a, button')) return;
  event.preventDefault();
  const step = event.shiftKey ? 10 : 1;
  setYear(shiftYear(state.year, event.deltaY > 0 ? step : -step));
}
$("#year-slider").addEventListener("input", (event) =>
  setYear(event.target.value),
);
document.querySelector('#map').addEventListener('wheel', onYearWheel, { passive: false });
document.querySelector('.timeline').addEventListener('wheel', onYearWheel, { passive: false });
$("#year-input").addEventListener("change", (event) =>
  setYear(event.target.value, true),
);
$("#year-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    setYear(event.target.value, true);
    event.target.blur();
  }
});
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
$('#play-toggle').addEventListener('click', () => {
  if (playTimer) return stopPlayback();
  if (reducedMotion) return stepPlayback();
  $('#play-toggle').textContent = 'Pause';
  $('#play-toggle').setAttribute('aria-pressed', 'true');
  const tick = () => {
    const move = stepPlayback();
    if (move.pause || move.done || !playTimer) return;
    const speed = PLAY_SPEEDS[$('#play-speed').value] || PLAY_SPEEDS.steady;
    playTimer = window.setTimeout(tick, speed.everyMs);
  };
  const speed = PLAY_SPEEDS[$('#play-speed').value] || PLAY_SPEEDS.steady;
  playTimer = window.setTimeout(tick, speed.everyMs);
});
$('#compare-toggle').addEventListener('click', () => {
  compareOn = !compareOn;
  $('#compare-toggle').setAttribute('aria-pressed', String(compareOn));
  comparePanel.hidden = !compareOn;
  if (compareOn) {
    setEvidenceOpen(true, { refit: false });
    setDrawerView('year');
    refreshCompare();
  }
});
compareInput.addEventListener('change', () => {
  compareYear = normalizeYear(compareInput.value, compareYear);
  compareInput.value = String(compareYear);
  if (compareOn) refreshCompare();
});
compareSwap.addEventListener('click', () => {
  const shown = state.year;
  const other = compareYear;
  compareYear = shown;
  compareInput.value = String(shown);
  setYear(other, true);
});
$("#previous-year").addEventListener("click", () => setYear(shiftYear(state.year, -1), true));
$("#next-year").addEventListener("click", () => setYear(shiftYear(state.year, 1), true));
document
  .querySelectorAll("[data-year]")
  .forEach((button) =>
    button.addEventListener("click", () => setYear(button.dataset.year, true)),
  );
$('#record-list').addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
  const rows = [...$('#record-list').querySelectorAll('.catalogue-row')].filter(row => row.offsetParent);
  const index = rows.indexOf(document.activeElement);
  const next = rows[index + (event.key === 'ArrowDown' ? 1 : -1)];
  if (!next) return;
  event.preventDefault();
  next.focus();
});
detailView.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  if (event.target.closest('a, input, textarea, select, button')) return;
  const ordered = storyOrder(recordsForYear(data.records, state.year, state.type, state.query));
  const index = ordered.findIndex(item => item.id === selectedId);
  const record = ordered[index + (event.key === 'ArrowRight' ? 1 : -1)];
  if (!record) return;
  event.preventDefault();
  selectedId = record.id;
  update();
  setDrawerView('selected');
  focusStory(record);
});
$("#record-type").addEventListener("change", (event) => {
  state.type = event.target.value;
  update();
});
$("#search").addEventListener("input", (event) => {
  state.query = event.target.value;
  update();
});
function browseRecord(event) {
  const record = data.records.find((item) => item.id === event.target.value);
  if (!record) return;
  state = { year: record.startYear, type: "all", query: "" };
  selectedId = record.id;
  update();
  selectRecord(record, true);
  $('#browse-menu').open = false;
  for (const group of document.querySelectorAll('.browse-group')) group.open = false;
}
$("#reset-map").addEventListener("click", () => fitYear(periodFeatures));
$('#show-regions').addEventListener('change', () => renderRegion(data.records.find(record => record.id === selectedId)));
$('#show-period').addEventListener('change', () => {
  historicalMap.setPeriodVisible($('#show-period').checked);
  syncPeriod();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && openPolityName && archiveTab === 'polity' && !event.defaultPrevented) closePolity();
});
$('#show-battles').addEventListener('change', renderBattles);
for (const id of ["#about-button", "#footer-sources"])
  $(id).addEventListener("click", () => $("#about-dialog").showModal());
$("#close-about").addEventListener("click", () => $("#about-dialog").close());
$("#credits-button").addEventListener("click", openMapCredits);
fetch(`${import.meta.env.BASE_URL}data/traced/index.json`)
  .then(response => response.ok ? response.json() : null)
  .then(index => {
    if (!index || validateTracedIndex(index).length) return;
    tracedIndex = index;
    render();
  })
  .catch(() => {});
window.addEventListener("popstate", () => {
  state = stateFromSearch(location.search);
  render();
});
new ResizeObserver(() => { if (mapReady) tightenFrame(); }).observe($("#map"));
mapReady = true;
tightenFrame();
render();
