import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";
import data from "./data/atlas.json";
import { mapReference } from './map-reference.js';
import { attachHistoricalMap } from './ohm-map.js';
import mapLayers from './data/map-layers.json';
import { BATTLE_KINDS, battlesForYear, regionsForRecord, referencesForRecord, validateMapLayers } from './map-layers.js';
import {
  MIN_YEAR,
  MAX_YEAR,
  TYPES,
  normalizeYear,
  recordsForYear,
  stateFromSearch,
  validateAtlas,
} from "./atlas.js";

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
    <div class="header-actions"><span class="edition">RESEARCH EDITION · 01</span><button id="about-button" class="quiet">Sources & approach ↗</button></div>
  </header>
  <main>
    <section class="introduction" aria-labelledby="page-title">
      <div><p class="eyebrow">PLACE. TIME. EVIDENCE.</p><h1 id="page-title">A past worth exploring.</h1><p class="intro-copy">Travel through time. Follow the places, people and ideas behind the history.</p></div>
      <div class="scope"><strong>1 — 2026 <small>CE</small></strong><span>A growing atlas, one source at a time.</span></div>
    </section>
    <section class="timeline" aria-label="Choose a historical year">
      <div class="year-block"><span class="eyebrow">EXPLORING THE YEAR</span><div><output id="year-display" for="year-slider year-input">1</output><span class="ce">CE</span></div></div>
      <div class="slider-block"><label for="year-slider" class="sr-only">Historical year</label><input id="year-slider" type="range" min="1" max="2026" step="1" value="1"><div class="ruler" aria-hidden="true"><span>1 CE</span><span>500</span><span>1000</span><span>1500</span><span>2026 CE</span></div><div class="jumps"><span>Explore a window</span><button data-year="1">1 CE</button><button data-year="150">150</button><button data-year="250">250</button><button data-year="500">500</button><button data-year="1500">1500</button><button data-year="1565">1565</button><button data-year="1632">1632</button><button data-year="2026">2026</button></div></div>
      <div class="year-entry"><label for="year-input">Go to year</label><div><button id="previous-year" aria-label="Previous year">−</button><input id="year-input" type="number" min="1" max="2026" step="1" value="1"><button id="next-year" aria-label="Next year">+</button></div></div>
    </section>
    <div class="workspace">
      <section class="map-panel" aria-label="Historical atlas map">
        <div class="map-heading"><div><span class="eyebrow">THE SUBCONTINENT</span><h2>OpenHistoricalMap</h2></div><button id="reset-map" class="quiet">Reset view ↺</button></div>
        <fieldset class="map-controls"><legend>Map layers</legend><label><input id="show-regions" type="checkbox" checked> Highlight selected kingdom</label><label><input id="show-battles" type="checkbox" checked> Battles & aftermath in this year</label></fieldset>
        <div id="map" tabindex="-1" aria-label="Interactive geographic map; equivalent records are listed alongside"></div>
        <div id="map-error" role="alert" hidden></div><p id="map-selection-status" class="map-selection-status" role="status" aria-live="polite"></p>
        <div class="map-caption"><span><i class="legend-dot" aria-hidden="true"></i> Gold / dashed outline: selected OHM kingdom match · Ring: selected place<br>B: battle · S: siege · A: aftermath</span><span>OHM context · 1 January of selected year · Internet required</span></div>
        <div id="map-context" class="map-context" aria-live="polite"></div>
        <section class="battle-context" aria-labelledby="battle-heading"><h3 id="battle-heading">Battles & aftermath in this year</h3><p>Across the atlas, independent of the record filters. A matching date window does not prove fighting throughout that year or involvement by the selected ruler.</p><div id="battle-list"></div></section>
      </section>
      <aside class="record-panel" aria-labelledby="records-heading">
        <div class="record-heading"><span class="eyebrow">IN THE RECORD</span><h2 id="records-heading" tabindex="-1">Explore the evidence</h2><p id="record-count" role="status" aria-live="polite"></p></div>
        <div class="filters"><label for="record-type">Record type</label><select id="record-type"><option value="all">All records</option></select><label class="sr-only" for="search">Search records in this year</label><input id="search" type="search" placeholder="Search people, places, Mughal, Rajput…" autocomplete="off"></div>
        <p class="window-note">Date windows may be approximate. A match is not proof of an event in this exact year. Mughal and Rajput coverage is incomplete; some profiles contain chronology only.</p>
        <div id="record-list"></div>
        <div class="browse"><details id="browse-menu"><summary>Jump to a record…</summary><div id="browse-groups" class="browse-groups"></div></details></div>
      </aside>
    </div>
    <section id="record-detail" class="detail-panel" aria-labelledby="detail-title" tabindex="-1"></section>
    <section class="research-note"><span class="research-symbol" aria-hidden="true">↗</span><div><h2>An atlas in the making.</h2><p>${data.records.length} cited records are a starting point, not a complete history. Empty years mean research is still needed. Regional overlays require dated map evidence and independent review. Published period maps are linked as context, not exact annual borders.</p></div><a href="https://github.com/Saumya170501/History-of-India/blob/codex/historical-atlas-prototype/docs/PROJECT_PLAN.md" target="_blank" rel="noopener noreferrer">Read the project plan ↗</a></section>
  </main>
  <footer><span>HISTORY OF INDIA <span class="footer-dot">·</span> Built around evidence.</span><button id="footer-sources" class="quiet">${data.sources.length} sources · ${data.records.length} records</button></footer>
  <dialog id="about-dialog" aria-labelledby="about-title"><div class="dialog-top"><p class="eyebrow">OUR APPROACH</p><button id="close-about" aria-label="Close sources and approach">×</button></div><h2 id="about-title">Every point has a source.</h2><p>This prototype connects historical claims to published evidence. Its records are cited, but still await independent historical review.</p><h3>Reading the timeline</h3><p>Dates are inclusive search windows. A century-dated event appears throughout that century to make it discoverable; this does not mean it happened every year. Read each record's date note.</p><h3>Reading the map</h3><p>Points locate sites or associations. They do not represent a ruler's movements, a kingdom's territory or a civilization's extent. OpenHistoricalMap provides the dated map context. Highlighted matches are provider features, not independently verified territorial reconstructions. A ruler’s name may not have a matching boundary in the provider.</p><h3>Starter bibliography</h3><ul id="source-list"></ul><p class="small">Source pages checked 7 November 2026. Summaries are paraphrased. Coordinate provenance and claim-specific sections appear in each record.</p><p class="small">Map data: <a href="https://www.openhistoricalmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenHistoricalMap contributors and source licences</a>. Internet and WebGL are required; no API key is needed.</p></dialog>
`;

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

const map = L.map("map", {
  zoomControl: false,
  minZoom: 3,
  maxZoom: 8,
  scrollWheelZoom: false,
  maxBounds: [
    [-20, 35],
    [60, 125],
  ],
  maxBoundsViscosity: 0.8,
}).setView([22, 80], 4);
L.control.zoom({ position: "topright" }).addTo(map);
map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
const markerLayer = L.layerGroup().addTo(map);
const regionLayer = L.featureGroup().addTo(map);
const battleLayer = L.featureGroup().addTo(map);
const selectedPlaceLayer = L.layerGroup().addTo(map);
const historicalMap = attachHistoricalMap(map, {
  onStatus: message => { $('#map-selection-status').textContent = message; },
  onError: message => { $('#map-error').hidden = false; $('#map-error').textContent = message; },
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
  selectedPlaceLayer.clearLayers();
  historicalMap.select(record, state.year, $('#show-regions').checked);
  if (record?.geometry) {
    const [lon, lat] = record.geometry.coordinates;
    const selected = L.circleMarker([lat, lon], { radius: 18, color: '#a94b16', weight: 3, fillColor: '#df9c28', fillOpacity: 0.25 }).addTo(selectedPlaceLayer);
    selected.bindTooltip(`${record.title} — associated place, not territory`);
  }
  const context = $('#map-context');
  context.replaceChildren(element('h3', record ? `Regional map · ${record.title}` : 'Regional map'));
  const mapReferences = element('p');
  const reference = mapReference(record, state.year);
  mapReferences.append(link(`OpenHistoricalMap · ${state.year} CE ↗`, reference.sourceUrl));
  context.append(mapReferences, element('p',
    'OpenHistoricalMap is the main map. Neighbouring kingdoms remain visible. Highlighting uses dated provider name matches, not independently reviewed territorial claims. Read the source before interpreting any extent.'));

  if (!record) {
    context.append(element('p', 'Choose a record to inspect its regional evidence.'));
    return;
  }
  const regions = regionsForRecord(mapLayers, record.id, state.year);
  if (!regions.length) context.append(element('p',
    `No reviewed boundary is available for this record in ${state.year} CE. A place marker does not show its territory or cultural extent.`));
  else if (!$('#show-regions').checked) context.append(element('p', 'Regional overlays are hidden. Their evidence is listed below.'));
  for (const region of regions) {
    if ($('#show-regions').checked) {
      const shape = L.geoJSON(region.geometry, { style: {
        color: region.kind === 'cultural' ? '#76568e' : '#315f82',
        weight: 2, dashArray: '6 5', fillOpacity: 0.16,
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
  evidence.append(
    element("h3", record.dateLabel),
    element("p", record.dateNote),
    element("h3", "Location and mapping status"),
    element("p", record.locationNote),
    element("h3", "Follow the evidence"),
  );
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

function selectRecord(record, focus = false) {
  selectedId = record.id;
  for (const button of document.querySelectorAll(".record-card"))
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.id === record.id),
    );
  renderDetail(record);
  focusRecordMap(record);
  if (focus) {
    $('#map').scrollIntoView({ block: 'center' });
    $('#map').focus({ preventScroll: true });
  }
}

function render() {
  const matches = recordsForYear(
    data.records,
    state.year,
    state.type,
    state.query,
  );
  const allYear = recordsForYear(data.records, state.year);
  $("#year-slider").value = state.year;
  $("#year-slider").setAttribute("aria-valuetext", `${state.year} CE`);
  $("#year-input").value = state.year;
  $("#year-display").value = state.year.toLocaleString("en");
  $("#previous-year").disabled = state.year === MIN_YEAR;
  $("#next-year").disabled = state.year === MAX_YEAR;
  $("#record-type").value = state.type;
  $("#search").value = state.query;
  $("#record-count").textContent =
    `${matches.length} ${matches.length === 1 ? "record window includes" : "record windows include"} ${state.year} CE`;
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
  if (!matches.some((record) => record.id === selectedId))
    selectedId = matches[0]?.id || null;
  const groups = new Map();
  for (const record of matches) {
    const button = element("button", undefined, "record-card");
    button.type = "button";
    button.dataset.id = record.id;
    button.setAttribute("aria-pressed", String(record.id === selectedId));
    button.append(
      element("span", TYPES[record.type], "card-type"),
      element("strong", record.title),
      element("span", record.dateLabel, "card-date"),
      element("span", "View map & evidence ↘", "card-action"),
    );
    button.addEventListener("click", () => selectRecord(record, true));
    list.append(button);
    if (!record.geometry) {
      button.append(element('span', 'Location pending · timeline only', 'card-date'));
      continue;
    }
    // Battle symbols belong to their own layer, including when catalogue filters hide them.
    if (record.type === 'battle') continue;
    const key = record.geometry.coordinates.join(",");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
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
        html: `<span class="pin ${approximate ? "approximate" : ""}">${records.length > 1 ? records.length : "•"}</span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
    }).addTo(markerLayer);
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
function setYear(value) {
  state.year = normalizeYear(value, state.year);
  update();
}
$("#year-slider").addEventListener("input", (event) =>
  setYear(event.target.value),
);
$("#year-input").addEventListener("change", (event) =>
  setYear(event.target.value),
);
$("#year-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    setYear(event.target.value);
    event.target.blur();
  }
});
$("#previous-year").addEventListener("click", () => setYear(state.year - 1));
$("#next-year").addEventListener("click", () => setYear(state.year + 1));
document
  .querySelectorAll("[data-year]")
  .forEach((button) =>
    button.addEventListener("click", () => setYear(button.dataset.year)),
  );
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
$("#reset-map").addEventListener("click", () => map.setView([22, 80], 4));
$('#show-regions').addEventListener('change', () => renderRegion(data.records.find(record => record.id === selectedId)));
$('#show-battles').addEventListener('change', renderBattles);
for (const id of ["#about-button", "#footer-sources"])
  $(id).addEventListener("click", () => $("#about-dialog").showModal());
$("#close-about").addEventListener("click", () => $("#about-dialog").close());
window.addEventListener("popstate", () => {
  state = stateFromSearch(location.search);
  render();
});
new ResizeObserver(() => map.invalidateSize()).observe($("#map"));
render();
