# Historical data and research rules

`src/data/atlas.json` is the source of truth. The same validator runs before production builds and during tests. `schemaVersion` is `1`.

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
- `reviewStatus`: `cited` for this prototype. This means a citation is attached, not that an independent historian has reviewed it. Add a separate reviewer/date workflow before enabling a stronger status.

## Timeline-only records

Records without verified coordinates may set both `geometry` and `locationSourceId` to `null`. Their mandatory `locationNote` explains the missing location evidence. They appear in searches and details with a timeline-only label, but do not create map markers. Undefined geometry or a polygon still fails validation. This extends the initial point-only contract without allowing invented locations.

## Temporal semantics

The first century is 1–100 CE, the fifth is 401–500 CE, and so forth. A century-wide date is represented by that whole search window. A record matching a year means the year lies in the source-derived window; it does not prove activity in that exact year, or continuous activity throughout the window. The UI explicitly states this and uses dashed point symbols for imprecise dates.

For mixed precision, preserve both ends in the note: Hampi's 1301 is the start of a century window, not a foundation date. The Taj Mahal seed follows the detailed UNESCO synthesis's 1632 start while explicitly retaining the introductory text's 1631 variation. Do not silently reconcile contradictory sources. Split distinct phases into separate records rather than stretching one continuous range across gaps.

## Spatial semantics

The map background is **modern land**, not a historical reconstruction. A site's point is not a city boundary. A capital does not define a kingdom. A monument does not locate its patron throughout a reign. A battle's aftermath may be located at an affected city only if clearly labelled; it must not be passed off as the battlefield.

Historical polygons are rejected by the current record validator. The background polygons are land, separately sourced from Natural Earth; they are never passed through the historical-record renderer.

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
