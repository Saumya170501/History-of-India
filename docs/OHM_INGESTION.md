# Automated OHM empire import

Run from the repository root (Node 22.12+ and curl required):

```powershell
npm.cmd ci
npm.cmd run ingest:ohm
npm.cmd run dev
```

The script queries the **OHM** Overpass endpoint, not the default modern OpenStreetMap database. It requests administrative relations with exact case-insensitive names Mughal Empire/Mogul Empire, Maratha Empire/Maratha Confederacy, or Rajputana, then downloads member ways/nodes. `osmtogeojson` assembles relation rings and holes; no straight-line stitching or convex hull is invented. This name list is a discovery scope, not an exhaustive inventory of every Rajput polity.

Output: `public/data/historical_empires.geojson`. Existing data is replaced atomically only after a successful nonempty conversion. Request failures, partial Overpass errors and empty conversions do not overwrite existing output. The review report is `artifacts/ohm-ingestion-report.json`. Do not run live imports during Vercel builds.

An exported OHM Overpass JSON response can be converted offline:

```powershell
npm.cmd run ingest:ohm -- C:\path\ohm-export.json
```

## Current availability

The initial live request in the cloud environment was denied by its outbound proxy (CONNECT HTTP 403). The committed output is explicitly empty with `awaiting_successful_ohm_import` metadata. No real OHM geometries were downloaded or claimed. Run the command in an environment allowed to reach the endpoint. Synthetic test shapes are not published.

## Date and source semantics

Exact years, ISO month/day dates, and simple `~`, `c.`, or `circa` prefixes are accepted. Raw tags, uncertainty flags, source links, retrieval timestamp and provider licensing tags remain in each feature. Missing/unsupported start or end dates, incomplete geometry and invalid rings are reported and skipped. Open-ended records are not silently assigned 2026. Rulers remain null unless explicitly tagged `ruler` or `ruler:name`; reign dates alone cannot identify them.

Annual filtering uses calendar-year overlap, not proof of control throughout that year. An exact January 1 end excludes that year; other end dates include their calendar year for discovery. Approximate years remain flagged approximate. A boundary tagged over a broad interval may still be historically wrong. Importing does not confer historical review or permission to redistribute: check relation sources, feature-specific reuse terms and competing interpretations. No independent topology review is claimed.

## Frontend

`src/empire-data.js` filters inclusive numeric year windows and adds a category derived from the entity-name substring. A MapLibre `match` expression maps Mughal/Mogul to muted green, Maratha to orange, Rajput to gold, and others to gray. Current vanilla-JavaScript integration fetches once and filters on each timeline change, preserving sources/layers through ordinary updates and recreating them on style replacement.

`examples/react/useHistoricalEmpires.jsx` is a React adapter using the same filtering and paint definitions. It has request cancellation, style-load handling and layer cleanup. It is an example, not a React migration or a dependency of the current app.

The imported multi-empire context is distinct from the purple selected-record/owner-supplied sketch overlay. All are hidden by the region checkbox. Existing source evidence and uncertainty remain accessible in the data; OHM attribution stays visible.

MapLibre has no spatial fill-opacity gradient or fill-blur. We use two layers (translucent fill + zoom-scaled blurred halo) per source, not per empire, with no per-frame geometry processing. This is a visual approximation, not a seamless distance-to-edge gradient or a quantified uncertainty field. True smooth fades require precomputed alpha masks or custom shaders; extra inward opacity bands are another approximation.

After inspecting a successful generated file and its report, publish it:

```powershell
git add public/data/historical_empires.geojson
git commit -m "Import sourced OHM empire boundaries"
git push origin codex/historical-atlas-prototype
```

Vercel deploys the static output when configured to track this branch.
