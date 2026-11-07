# History of India

A source-led historical atlas of India, **1 CE–2026 CE**. Explore a year, select a record and follow its evidence.

## Current prototype

- Interactive Leaflet map with locally bundled Natural Earth land geometry; no map API key or remote tiles.
- Year slider, exact-year input, previous/next controls and sample date shortcuts.
- 67 cited research records across sites, rulers, kingdoms, battle aftermath, and culture/learning; 17 source entries, including museum, university and scholarly references.
- Search, type filters, accessible record cards, source details and shareable year/filter URLs.
- Explicit date uncertainty, location meaning and empty research windows.
- Responsive layout, keyboard controls and source dialog.
- Regional map evidence beside record descriptions, with a linked published 1–300 CE period map.
- Independent year-filtered battle layer with explicit battlefield, siege and aftermath symbols; Hampi remains an aftermath location.
- Reviewed regional overlay support with separate map provenance and date windows; no reviewed shapes are bundled yet.

**This is a working research prototype, not a complete atlas or independently reviewed historical dataset.** At 1 CE, the Sanchi record matches a first-century date window; it does not claim that gateway ornamentation occurred in that exact year. Most years remain unresearched.

No historical boundaries are drawn. A present-day, low-resolution land outline provides geographic context only. Points identify places associated with claims, not territories. The Talikota aftermath marker is at Hampi, the affected city, not at the battlefield.

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

Build output is in `dist/`. Serve it over HTTP; do not double-click `index.html`. After installation, the app and geographic map run locally without internet. Opening external source links still requires internet.

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
