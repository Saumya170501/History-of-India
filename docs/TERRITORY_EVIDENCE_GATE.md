# Candidate territory evidence gate

This branch adds `src/territory-evidence.js`, a **metadata and elementary coordinate validator** for unpublished historical-territory candidates. It does not add historical boundaries to the map.

## Editorial procedure
1. Create a candidate separate from `src/data/map-layers.json` and production GeoJSON.
2. Link every boundary interpretation to a source with author, edition, page, scale, reuse terms, digitization method and alternative interpretation.
3. Mark dates and geometric confidence separately; distinguish direct administration, tribute, dispute, military occupation and cultural distribution.
4. Check geometry using a specialist GIS topology validator, including ring intersections, holes, polygon overlap and antimeridian handling. This JavaScript gate does **not** perform those checks.
5. Have a named independent reviewer inspect the original map/source, georeferencing, licensing, historical validity and uncertainty.
6. Only then convert an approved record into the existing reviewed regional-layer contract; no automatic promotion is implemented.

## Safety
- A successful validator test means **structural completeness only**, not historical truth.
- `reviewed` metadata without a substantive human review is not approval.
- Do not reuse modern state outlines as historical sovereignty boundaries.
- Do not interpolate unsupported changes between dated source maps.
- Do not use ruler reign intervals as evidence of unchanged geographic extent.
- Artificial coordinates live only in tests. There are no newly published polygons in this change.

## Run
`npm test` runs the candidate evidence tests through the existing Node test command.
