# History of India

A source-led historical atlas of India, **1 CE–2026 CE**. Explore a year, select a record and follow its evidence.

## Current prototype

- OpenHistoricalMap historical map with date filtering, neighbouring kingdoms, and gold highlighting of dated kingdom-name matches. Requires internet and WebGL; no API key.
- Year slider, exact-year input, previous/next controls and sample date shortcuts.
- 117 cited research records across sites, rulers, kingdoms, battle aftermath, and culture/learning; 41 source entries, including museum, university and scholarly references.
- Mughal and Rajput choices in the existing evidence browser, searchable biography notes and section-level citations. Coverage is explicitly incomplete; see [research coverage](docs/RESEARCH_MUGHAL_RAJPUT.md).
- Search, type filters, accessible record cards, source details and shareable year/filter URLs.
- Explicit date uncertainty, location meaning and empty research windows.
- Responsive layout, keyboard controls and source dialog.
- All 117 current records have a labelled purple related-area fallback for geographic orientation. The circle is hidden when a matching OHM boundary or reviewed regional overlay is available. These approximate display buffers are not historical borders.
- Selecting a dropdown entry or record brings the main OHM map into view. Sourced points receive a ring; mapped ruler/kingdom associations highlight matching provider boundaries. Missing matches are reported explicitly.
- Regional map evidence beside record descriptions, with a linked published 1–300 CE period map.
- Independent year-filtered battle layer with explicit battlefield, siege and aftermath symbols; Hampi remains an aftermath location.
- Reviewed regional overlay support with separate map provenance and date windows; no reviewed shapes are bundled yet.

**This is a working research prototype, not a complete atlas or independently reviewed historical dataset.** At 1 CE, the Sanchi record matches a first-century date window; it does not claim that gateway ornamentation occurred in that exact year. Most years remain unresearched.

Historical boundaries on the main map come from OpenHistoricalMap. They are external provider features, not independently reviewed project reconstructions. Gold areas identify exact kingdom-name matches at the selected January 1 snapshot; a match does not prove a ruler controlled all of that area. Points identify places associated with claims, not territories. The Talikota aftermath marker is at Hampi, the affected city, not at the battlefield.

## Run on Windows

Install [Git for Windows](https://git-scm.com/download/win) and [Node.js](https://nodejs.org/en/download) **22.12 or newer**. Open PowerShell in your repository folder:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open the Local URL printed by Vite (normally `http://127.0.0.1:5173`). Keep PowerShell open while using the app; press `Ctrl+C` to stop. Using `npm.cmd` avoids PowerShell's script-policy restriction on `npm.ps1`.

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

Build output is in `dist/`. Serve it over HTTP; do not double-click `index.html`. After installation, the app and record evidence can run locally without internet. The OHM map, historical tiles and external source links require internet. The old bundled land asset is retained for provenance tests but is no longer displayed.

See [Windows & Codex setup](docs/WINDOWS_SETUP.md) for existing-clone and new-clone instructions.

## Repository layout

```text
src/
  main.js             UI, map and interaction wiring
  atlas.js            Year filtering, URL state and record validator
  map-layers.js       Regional evidence validation and map context selectors
  data/map-layers.json Regional map references and reviewed overlays
  style.css           Responsive atlas styles
  data/atlas.json     Historical records and source registry
public/data/
  land.geojson        Natural Earth present-day land background
scripts/
  validate-data.mjs   Data validation command
test/
  atlas.test.js       Date, filter, provenance and geometry checks
docs/
  DATA_MODEL.md       Data contract and research rules
  PROJECT_PLAN.md     Milestones and year-by-year workflow
  WINDOWS_SETUP.md    Local setup and opening in Codex
  PROVENANCE.md       Migration findings and asset provenance
```

## Add historical research

Read [the data contract](docs/DATA_MODEL.md) before editing `src/data/atlas.json`. Every record needs a date window, uncertainty note, source locator, a statement of what the source supports, and separate location provenance. `npm.cmd run validate:data` checks this structure; it cannot determine historical truth.

The [project plan](docs/PROJECT_PLAN.md) starts with a reviewed 1 CE pilot before expanding chronologically. Modern national boundaries must never be reused as historical kingdoms. Historical polygons remain forbidden in catalogue records. The separate regional layer accepts only shapes with dated map provenance, reuse rights, uncertainty and independent review; the current collection has none. See the data contract before adding any overlay.

## Licensing

No project-wide code license has been selected by the owner. Public repository access alone is not a license grant. Natural Earth data is public domain; third-party packages retain their own licenses. Historical source material is linked and paraphrased, not relicensed as project code. See [provenance](docs/PROVENANCE.md).

## Map workspace layout

The map fills the viewport (`100vh`, with `100dvh` for mobile browser chrome). A compact header floats at the top and the glass timeline floats at the bottom. The Evidence button toggles a fixed-height, scrollable right drawer; it starts closed on phones. Selected-record citations, provider status, and expandable map context/battle notes remain in that drawer. Sources and project notes are available through Sources & approach. Layout overrides live in `src/layout.css`; no React migration is required.

## Deploy to Vercel

Import `Saumya170501/History-of-India` in Vercel and select `codex/historical-atlas-prototype` as the production branch to deploy this version. Use the repository root and Node.js 24.x. `vercel.json` configures Vite, `npm ci`, `npm run build`, and the `dist` output directory. No application environment variables are required. OpenHistoricalMap tiles still require internet access from each visitor. Once Git integration is connected, pushes to the configured production branch trigger deployments.


## Current rendering: physical geography and geometry-specific overlays

This supersedes earlier circle, dashed-outline, gold-highlight, and neighbouring-kingdom display descriptions. The pinned OHM basemap now retains an explicit physical-geography allowlist; every symbol/text/label layer and all other context layers are hidden on each `style.load`, before application layers are added. Attribution remains visible. Underlying physical geography is not asserted to be a historical reconstruction.

`src/historical-style.js` defines zoom-scaled, solid MapLibre circle markers for Point records, and separate Polygon/MultiPolygon fill/blurred-halo layers. Leaflet retains transparent keyboard/click targets and source popups. Battles retain separate B/S/A markers. Original date notes and citations remain unchanged.

No geographic context circles or substitute territories are drawn. Related-area definitions orient the viewport only. Dated OHM name matches use a purple translucent fill and a solid blurred halo. Reviewed GeoJSON polygons use the same styling; the reviewed collection remains empty. No empire polygons have been fabricated or added to the point-only catalogue.

MapLibre has no polygon fill-blur or continuous spatial fill-opacity gradient. The two-layer halo is a bounded-cost visual approximation with a residual fill edge, not a true seamless distance-field fade or quantified historical confidence. A continuous fade requires a separately prepared raster alpha mask/custom shader; non-overlapping inward opacity bands can approximate one. Blur widths are pixels, not geographic uncertainty distances.

### Local Akbar demonstration polygon

Selecting Akbar during 1556–1605 loads `public/data/1500s.geojson` and fits the map to the supplied polygon. This owner-provided sketch is explicitly unverified, not a reviewed empire boundary. See `src/local-boundary.js` for matching, bounds validation and lazy fetching. Other records continue using dated OHM matches where available; this sketch is not assigned to other rulers.

## Automated empire ingestion

See [OHM ingestion](docs/OHM_INGESTION.md) for the import command, current network limitation, date semantics, categorical colors and reusable React hook.

### Record tiles

`src/record-card.js` renders keyboard-accessible museum-style tiles with the shared empire color palette, circular initial/image avatars, date/role badges and location uncertainty notes. `src/record-card.css` supplies the responsive styling. `examples/react/RecordCard.jsx` provides the equivalent React component with `factionColor`, `avatarUrl`, `featureBbox`, and `handleCardClick(featureBbox)` props. Missing bounds may be null; the caller must retain a safe no-geometry fallback. No historical portraits or faction emblems are invented.
