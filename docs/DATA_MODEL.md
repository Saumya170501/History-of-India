# Historical data and research rules

`src/data/atlas.json` is the source of truth. Record and map-layer validators run before production builds and during tests. Regional map evidence lives separately in `src/data/map-layers.json`. `schemaVersion` is `1`.

## Sources

Each source contains a stable `id`, `title`, `publisher`, HTTPS `url`, and `accessed` date in `YYYY-MM-DD` format. Prefer scholarly editions, inscriptions, archaeological reports, museum collections and research institutions. Distinguish an original primary source from a modern institutional synthesis. The UNESCO seed pages are institutional syntheses, not eyewitness primary sources.

## Records

- `id`: unique stable string; do not reuse IDs for different claims.
- `title`, `summary`, `place`: short original descriptions, with the geography used by the source where appropriate.
- `type`: `site`, `ruler`, `kingdom`, `battle`, or `culture`. These categories organize claims; they do not establish territory. Civilization research belongs under `culture` until a dedicated model is justified.
- `startYear`, `endYear`: inclusive integer filtering window within 1–2026 CE. No year zero. Earlier claims require an explicit model extension, not clipping that could masquerade as a foundation date.
- `datePrecision`: `year`, `century`, or `approximate`.
- `dateLabel`: human-readable date with uncertainty visible.
- `dateNote`: what the dates actually mean and what remains uncertain.
- `geometry`: only GeoJSON `Point`, with `[longitude, latitude]` order.
- `locationNote`: what the point identifies, including rounding, site-level precision and whether it is a capital, affected city or associated monument.
- `locationSourceId`: source supporting that coordinate or location association.
- `citations`: one or more `{ sourceId, locator, supports }` objects. `locator` identifies a section, page, inscription or catalogue entry; `supports` identifies the actual claim supported.
- `tags`: optional nonempty search aliases and collection labels; these do not establish political allegiance.
- `details`: optional nonempty profile sections, each with `heading`, `text` and claim-level `citations` using the same source/locator/supports contract. Profile text covers broader context, not necessarily the selected year. State chronology-only coverage and source limitations explicitly.
- `eventKind`: required for battle records: `battle`, `siege`, or `aftermath`. A point for an affected city must use `aftermath`, never `battle`.
- `reviewStatus`: `cited` for this prototype. This means a citation is attached, not that an independent historian has reviewed it. Add a separate reviewer/date workflow before enabling a stronger status.

## Timeline-only records

Records without verified coordinates may set both `geometry` and `locationSourceId` to `null`. Their mandatory `locationNote` explains the missing location evidence. They appear in searches and details with a timeline-only label, but do not create map markers. Undefined geometry or a polygon still fails validation. This extends the initial point-only contract without allowing invented locations.

## Temporal semantics

The first century is 1–100 CE, the fifth is 401–500 CE, and so forth. A century-wide date is represented by that whole search window. A record matching a year means the year lies in the source-derived window; it does not prove activity in that exact year, or continuous activity throughout the window. The UI explicitly states this and uses dashed point symbols for imprecise dates.

For mixed precision, preserve both ends in the note: Hampi's 1301 is the start of a century window, not a foundation date. The Taj Mahal seed follows the detailed UNESCO synthesis's 1632 start while explicitly retaining the introductory text's 1631 variation. Do not silently reconcile contradictory sources. Split distinct phases into separate records rather than stretching one continuous range across gaps.

## Spatial semantics

The main map is now OpenHistoricalMap with dated provider features. Its underlying land/terrain may be modern; it is not a complete reconstruction for every year. A site's point is not a city boundary. A capital does not define a kingdom. A monument does not locate its patron throughout a reign. A battle's aftermath may be located at an affected city only if clearly labelled; it must not be passed off as the battlefield.

Historical polygons are rejected by the catalogue record validator. Only the separate reviewed regional layer may contain historical polygons. The background polygons are land, separately sourced from Natural Earth; they are never passed through the historical-record renderer.

Before enabling historical territories, require dated source maps, scale, author, edition/page, reuse rights, digitization method, geographic uncertainty, competing interpretations and an independent reviewer. Never generate shapes from memory, fill a modern state/country outline, or interpolate borders between years without explicit evidence and an appropriate uncertainty model.

## Research checklist for one claim

1. Choose a specific claim and temporal question.
2. Read the source; record the exact section or page and access date.
3. Separate evidence for chronology, identity, location and extent.
4. Record uncertainty and conflicting evidence in plain language.
5. Use a sourced point or leave the candidate in research notes until its location is supported.
6. Add the source and record, then run `npm.cmd run validate:data` and `npm.cmd test`.
7. Inspect the result at the start/end of its window and the adjoining years.
8. Request independent review before presenting the claim as reviewed.

Validation enforces structure and source references, not historical accuracy, geographic precision, copyright permission or the reliability of a source.


## Regional map layers

`src/data/map-layers.json` has `schemaVersion: 1`, `regions` and `references` arrays. Neither a ruler's reign window nor a civilization's period is sufficient evidence of territorial extent. Select layers only when both their explicit record association and inclusive date window match. Never interpolate across gaps. A cultural distribution must not be labelled as political sovereignty.

Every layer requires a unique `id`, `title`, explicit `recordIds`, `startYear`, `endYear`, `datePrecision`, `dateLabel`, `dateNote`, `uncertaintyNote` and `citations` with the same source/locator/supports structure as records. Sources resolve against the atlas source registry. Associated records must exist and have overlapping date windows.

`references` also require an HTTPS `url`. They link to published maps as context, not digitized or independently reviewed boundaries. The first reference links to the map section of the Harvard-hosted early-CE chronology. It is a period overview, not a verified reconstruction for each ruler and year. Original-map retrieval failed during this pass; no original plate inspection or reuse permission is claimed. No map image was copied.

`regions` require:

- `kind`: `political` or `cultural`.
- `geometry`: GeoJSON `Polygon` or `MultiPolygon`, with closed, nondegenerate rings and valid longitude/latitude coordinates.
- `provenance`: `sourceId`, `author`, `edition`, `page`, `scale`, `rights`, `digitizationMethod` and `competingInterpretations`. Record actual map evidence and reuse terms, not placeholders.
- `review`: `status: reviewed`, a real independent `reviewer` and `date`. Never fill these fields merely to make validation pass.

The validator checks structure, not whether a reviewer exists, whether a license permits reuse or whether a polygon faithfully represents scholarship. Human review must also check topology, georeferencing, holes, scale, uncertainty and historical interpretation. Keep unreviewed candidates outside the published layer file. There are currently **zero reviewed regional shapes**. Synthetic coordinates appear only in tests.

All region outlines are dashed and labelled reconstructed/uncertain; political and cultural extents have different colors. The source, dates, uncertainty, digitization and review details remain accessible in map context and record details. Toggle-off hides geometry, not evidence.

## Battle context

The map's battle layer uses the selected year but ignores catalogue search/type filters, so selecting rulers does not hide contemporary conflict records. Its list is available without using map markers; unlocated events remain timeline-only. A shared year does not establish involvement by the selected ruler, geographic proximity or continuous fighting. The current model does not claim day-level “ongoing” status. `B` means battlefield, `S` siege location, `A` aftermath/affected place. Hampi's 1565 marker remains `A` and is not moved to an invented Talikota battlefield.

## Live provider map

The owner requested replacing the local basemap with OHM and highlighting selections. OHM styles/tiles are displayed live via MapLibre within the existing Leaflet interaction shell; the separate iframe preview is removed. These external features do not populate `regions`, acquire a fabricated reviewer, or become project-verified claims. The zero-reviewed-regions statement still applies to our own dataset.

The whole provider map is filtered to 1 January of the selected year. Selection uses exact, case-insensitive administrative-boundary name matches (provider `name`, `name_en`, `official_name`, `short_name`), admin levels 1–4, a required source start date, and a compatible end date if present. Associations are research candidates from record identities/places, not proof of sovereignty. A matching name can still be ambiguous; the UI identifies it as an OHM name match. Competing Mughal claimants are not automatically assigned the whole empire, and Rajput states are not combined into one territory. Missing matches keep the surrounding map visible with a no-match notice.

Provider data may change. Attribution links to OHM’s feature-specific licensing guidance. Do not export the displayed highlight as a reviewed boundary without the existing provenance and review process.

## Approximate related-area display

At the owner's request, every current record has a purple geographic-context circle, defined in `src/related-area.js`. This is a display buffer, not a historical polygon, kingdom extent, campaign area, or statistical location-error estimate. It must never enter the reviewed `regions` dataset.

For sourced points the circle is centered on that point with a 50 km display radius. Other records use a deliberately rounded geographic center and broad radius based on their cited place/profile; neither the radius nor the center is claimed as source-derived historical geometry. The UI labels these editorial choices and links association evidence. The map zooms to the circle on selection. Actual OHM name-matched boundaries, when available, remain gold; context circles are dashed purple. A battle context circle is not a battlefield boundary, and Hampi remains an affected-city association.

Coverage tests require a context definition for every current record and verify that original record geometry is unchanged. Unknown future geography must be researched and added explicitly, not silently mapped to an arbitrary area. The context is intentionally broader than some records and incomplete for expansive empires; it is an orientation aid, not a depiction of all related places.

The related-area circle is a fallback only: a dated OHM boundary match or displayed reviewed regional overlay takes precedence. Once an OHM match is found, the circle stays hidden while panning/loading for that record and year. Switching record or year clears that match state so an unknown boundary can show its context circle again. The circle’s explanatory block follows the same visibility rule.


## Current rendering: physical geography and geometry-specific overlays

This supersedes earlier circle, dashed-outline, gold-highlight, and neighbouring-kingdom display descriptions. The pinned OHM basemap now retains an explicit physical-geography allowlist; every symbol/text/label layer and all other context layers are hidden on each `style.load`, before application layers are added. Attribution remains visible. Underlying physical geography is not asserted to be a historical reconstruction.

`src/historical-style.js` defines zoom-scaled, solid MapLibre circle markers for Point records, and separate Polygon/MultiPolygon fill/blurred-halo layers. Leaflet retains transparent keyboard/click targets and source popups. Battles retain separate B/S/A markers. Original date notes and citations remain unchanged.

No geographic context circles or substitute territories are drawn. Related-area definitions orient the viewport only. Dated OHM name matches use a purple translucent fill and a solid blurred halo. Reviewed GeoJSON polygons use the same styling; the reviewed collection remains empty. No empire polygons have been fabricated or added to the point-only catalogue.

MapLibre has no polygon fill-blur or continuous spatial fill-opacity gradient. The two-layer halo is a bounded-cost visual approximation with a residual fill edge, not a true seamless distance-field fade or quantified historical confidence. A continuous fade requires a separately prepared raster alpha mask/custom shader; non-overlapping inward opacity bands can approximate one. Blur widths are pixels, not geographic uncertainty distances.

## User-supplied Akbar sketch (unverified exception)

At the owner's explicit request, `public/data/1500s.geojson` preserves their exact Polygon, properties and coordinates. This is a UI demonstration sketch without map provenance or review. It is not added to catalogue geometry or reviewed `regions`. The UI labels it unverified, and treats 1556–1605 as a display window rather than a supported territorial chronology. This supersedes the earlier no-local-empire-polygons description only for this clearly labelled sketch.

Only record ID `akbar` can request this file. Matching also requires exact `entity_name: Mughal Empire`, `ruler: Akbar`, and an inclusive date match. The same file covers 1600–1605; no second copy or inferred geometry is needed. Empty, malformed, or mismatching data produces an error rather than a substitute territory. Responses are cached, stale requests aborted, and switching records clears the source. The local sketch takes display precedence over live OHM matches, and never inherits OHM provenance.

Bounds are calculated from the supplied coordinates. Leaflet owns the existing app's camera, so its fitBounds method synchronizes the MapLibre bridge with overlay padding and reduced-motion support. The coordinate validator checks shape, closure and ranges, not historical accuracy or full topology.
