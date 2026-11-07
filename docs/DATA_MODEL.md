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

The map background is **modern land**, not a historical reconstruction. A site's point is not a city boundary. A capital does not define a kingdom. A monument does not locate its patron throughout a reign. A battle's aftermath may be located at an affected city only if clearly labelled; it must not be passed off as the battlefield.

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
