import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";
import data from "./data/atlas.json";
import {
  MIN_YEAR,
  MAX_YEAR,
  TYPES,
  normalizeYear,
  recordsForYear,
  stateFromSearch,
  validateAtlas,
} from "./atlas.js";

const errors = validateAtlas(data);
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
      <div class="slider-block"><label for="year-slider" class="sr-only">Historical year</label><input id="year-slider" type="range" min="1" max="2026" step="1" value="1"><div class="ruler" aria-hidden="true"><span>1 CE</span><span>500</span><span>1000</span><span>1500</span><span>2026 CE</span></div><div class="jumps"><span>Explore a window</span><button data-year="1">1 CE</button><button data-year="500">500</button><button data-year="1500">1500</button><button data-year="1565">1565</button><button data-year="1632">1632</button><button data-year="2026">2026</button></div></div>
      <div class="year-entry"><label for="year-input">Go to year</label><div><button id="previous-year" aria-label="Previous year">−</button><input id="year-input" type="number" min="1" max="2026" step="1" value="1"><button id="next-year" aria-label="Next year">+</button></div></div>
    </section>
    <div class="workspace">
      <section class="map-panel" aria-label="Historical atlas map">
        <div class="map-heading"><div><span class="eyebrow">THE SUBCONTINENT</span><h2>History, in place.</h2></div><button id="reset-map" class="quiet">Reset view ↺</button></div>
        <div id="map" aria-label="Interactive geographic map; equivalent records are listed alongside"></div>
        <div id="map-error" role="alert" hidden></div>
        <div class="map-caption"><span><i class="legend-dot" aria-hidden="true"></i> Point = sourced location · Dashed = approximate dates</span><span>Modern coastline · No historical borders</span></div>
      </section>
      <aside class="record-panel" aria-labelledby="records-heading">
        <div class="record-heading"><span class="eyebrow">IN THE RECORD</span><h2 id="records-heading" tabindex="-1">Explore the evidence</h2><p id="record-count" role="status" aria-live="polite"></p></div>
        <div class="filters"><label for="record-type">Record type</label><select id="record-type"><option value="all">All records</option></select><label class="sr-only" for="search">Search records in this year</label><input id="search" type="search" placeholder="Search places, people, ideas…" autocomplete="off"></div>
        <p class="window-note">Date windows may be approximate. A match is not proof of an event in this exact year.</p>
        <div id="record-list"></div>
        <div class="browse"><label for="browse-records">Browse all ${data.records.length} starter records</label><select id="browse-records"><option value="">Jump to a record…</option></select></div>
      </aside>
    </div>
    <section id="record-detail" class="detail-panel" aria-labelledby="detail-title" tabindex="-1"></section>
    <section class="research-note"><span class="research-symbol" aria-hidden="true">↗</span><div><h2>An atlas in the making.</h2><p>${data.records.length} cited records are a starting point, not a complete history. Empty years mean research is still needed. Historical boundaries require separate evidence and are not drawn.</p></div><a href="https://github.com/Saumya170501/History-of-India/blob/codex/historical-atlas-prototype/docs/PROJECT_PLAN.md" target="_blank" rel="noopener noreferrer">Read the project plan ↗</a></section>
  </main>
  <footer><span>HISTORY OF INDIA <span class="footer-dot">·</span> Built around evidence.</span><button id="footer-sources" class="quiet">${data.sources.length} sources · ${data.records.length} records</button></footer>
  <dialog id="about-dialog" aria-labelledby="about-title"><div class="dialog-top"><p class="eyebrow">OUR APPROACH</p><button id="close-about" aria-label="Close sources and approach">×</button></div><h2 id="about-title">Every point has a source.</h2><p>This prototype connects historical claims to published evidence. Its records are cited, but still await independent historical review.</p><h3>Reading the timeline</h3><p>Dates are inclusive search windows. A century-dated event appears throughout that century to make it discoverable; this does not mean it happened every year. Read each record's date note.</p><h3>Reading the map</h3><p>Points locate sites or associations. They do not represent a ruler's movements, a kingdom's territory or a civilization's extent. Natural Earth's present-day land outline is geographic context, not a reconstruction of ancient coastlines.</p><h3>Starter bibliography</h3><ul id="source-list"></ul><p class="small">Source pages checked 7 November 2026. Summaries are paraphrased. Coordinate provenance and claim-specific sections appear in each record.</p><p class="small">Map data: <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener noreferrer">Natural Earth, public domain</a>. No remote map tiles or API key required.</p></dialog>
`;

for (const [value, label] of Object.entries(TYPES))
  $("#record-type").add(new Option(label, value));
for (const record of data.records)
  $("#browse-records").add(
    new Option(`${record.title} · ${record.dateLabel}`, record.id),
  );
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
map.attributionControl.addAttribution(
  '<a href="https://www.naturalearthdata.com">Natural Earth</a> · modern land',
);
const markerLayer = L.layerGroup().addTo(map);
const geographicLabels = [
  ["ARABIAN SEA", [15, 64]],
  ["BAY OF BENGAL", [14, 89]],
  ["INDIAN OCEAN", [2, 77]],
];
for (const [name, position] of geographicLabels)
  L.marker(position, {
    interactive: false,
    keyboard: false,
    icon: L.divIcon({
      className: "geographic-label",
      html: name,
      iconSize: [150, 20],
      iconAnchor: [75, 10],
    }),
  }).addTo(map);

fetch(`${import.meta.env.BASE_URL}data/land.geojson`)
  .then((response) => {
    if (!response.ok) throw new Error(`Map HTTP ${response.status}`);
    return response.json();
  })
  .then((land) =>
    L.geoJSON(land, {
      interactive: false,
      style: {
        color: "#a9b6a6",
        weight: 1,
        fillColor: "#ebe9da",
        fillOpacity: 1,
      },
    })
      .addTo(map)
      .bringToBack(),
  )
  .catch(() => {
    $("#map-error").hidden = false;
    $("#map-error").textContent =
      "The geographic background could not load. Historical records and source links remain available. Refresh to try again.";
  });

function renderDetail(record) {
  const panel = $("#record-detail");
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
  panel.append(story, evidence);
}

function selectRecord(record, focus = false) {
  selectedId = record.id;
  for (const button of document.querySelectorAll(".record-card"))
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.id === record.id),
    );
  renderDetail(record);
  if (record.geometry) {
  const [lon, lat] = record.geometry.coordinates;
  map.panTo([lat, lon], {
    animate: !matchMedia("(prefers-reduced-motion: reduce)").matches,
  });
  }
  if (focus) $("#record-detail").focus({ preventScroll: false });
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
      element("span", "Read evidence ↘", "card-action"),
    );
    button.addEventListener("click", () => selectRecord(record, true));
    list.append(button);
    if (!record.geometry) {
      button.append(element('span', 'Location pending · timeline only', 'card-date'));
      continue;
    }
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
$("#browse-records").addEventListener("change", (event) => {
  const record = data.records.find((item) => item.id === event.target.value);
  if (!record) return;
  state = { year: record.startYear, type: "all", query: "" };
  selectedId = record.id;
  update();
  selectRecord(record, true);
  event.target.value = "";
});
$("#reset-map").addEventListener("click", () => map.setView([22, 80], 4));
for (const id of ["#about-button", "#footer-sources"])
  $(id).addEventListener("click", () => $("#about-dialog").showModal());
$("#close-about").addEventListener("click", () => $("#about-dialog").close());
window.addEventListener("popstate", () => {
  state = stateFromSearch(location.search);
  render();
});
new ResizeObserver(() => map.invalidateSize()).observe($("#map"));
render();
