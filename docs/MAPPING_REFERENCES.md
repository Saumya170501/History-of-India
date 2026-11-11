# Mapping references

Suggested by the project owner; website and terms pages checked 7 November 2026.

## OpenHistoricalMap

- Site: https://www.openhistoricalmap.org/
- Owner's example: https://www.openhistoricalmap.org/#map=5/26.59/89.52&layers=O&date=1586-05-25&daterange=1500-01-01,2026-12-31
- Rights: https://www.openhistoricalmap.org/copyright

The copyright page describes a CC0 default, with exceptions identified by individual features' licence tags, including CC BY and CC BY-SA. Check the actual element before reuse. The site's general description does not verify a particular empire's boundary.

OpenHistoricalMap is the primary mapping reference requested by the owner. The atlas links to OHM using 1 January of the selected year as a navigation date and an explicit 0001-01-01 to 2026-12-31 browsing range. This range configures navigation; it does not establish complete coverage. This is not a claim about an accession, battle or boundary on that day. The owner's 1586 example remains above; it is not reused as evidence for every year.

Before importing geometry, inspect and retain feature identifiers and versions, source tags, start/end dates, uncertainty, geometry, applicable licence and attribution. Cross-check the claimed extent against dated historical evidence and obtain independent review under DATA_MODEL.md. Missing map features do not prove historical absence. No individual feature or boundary has been verified or imported in this pass; the JavaScript-rendered map was not inspected through the text retrieval tool.

## TimeMaps (previously considered)

- Site: https://timemaps.com/
- Terms: https://timemaps.com/terms-and-conditions/

TimeMaps offers maps at selected periods rather than a verified annual boundary dataset. Its published terms permit non-commercial reuse of freely discoverable official content subject to attribution rules; commercial use requires permission. Check exact page/date attribution, map credit and logo requirements before reproducing content. No images or geometry have been copied.

The TimeMaps link has been removed from the map interface at the owner’s request; these research notes retain the previous rights check. Before attaching a map to a historical record, inspect its actual date, legend and supporting sources. Do not interpolate borders between snapshots or turn an illustrative map into precise surveyed territory.

These are research leads and external navigation links, separate from the reviewed regional layers. Existing historical records and their citations are unchanged.

## Official embedding option

OpenHistoricalMap documents its supported embed at https://github.com/OpenHistoricalMap/openhistoricalmap-embed (checked 7 November 2026). The embed accepts a date and the Historical style via `layer=O`; interactive pan/zoom is supported. Its own date can be updated through the URL. Embedding this provider as the main map is a separate integration from using it as a research reference. Selecting a record now shows an official embedded research preview alongside its evidence, while the existing Leaflet map remains the main atlas. The preview and external link share the selected year and sourced point when available. Otherwise both use a labelled subcontinent overview; it is not a ruler-specific extent. The preview is external contextual material, not an imported or independently reviewed boundary. No provider geometry is copied into regional layers.

## Record selection

Dropdown choices and record cards open the map preview and evidence together. The local map also resets to the selected sourced point, reviewed overlay if present, or broad default view, so an unlocated ruler cannot inherit the previous record's zoomed location. Battle records keep their separate battlefield/siege/aftermath meanings. The date follows the selected year, with 1 January used only for navigation. Internet failure leaves the local map, citations and a direct source link available.

A web-index search for Mughal/Mewar features did not yield a verified OHM element suitable for import. No complete feature inventory, source-tag verification or historical boundary review is claimed. Research previews may show features unrelated to the selected record; users must inspect the source and dates on OHM. Full ruler-specific territory coverage remains pending.

## Current integration: main OHM map and selection highlighting

This supersedes the earlier preview-only arrangement at the owner's request. The old land basemap and duplicate research iframe have been removed from the UI. Official OHM style package 0.9.22 supplies the map appearance, with live vector tiles and the official date-filtering library. Our catalogue points/battles remain separately cited overlays. Record selection scrolls to this one main map.

Boundary highlighting uses OHM's published TileJSON https://vtiles.openhistoricalmap.org/maps/ohm_admin.json and its `boundaries` source layer, whose schema supplies names, administrative levels and decimal-year dates. Documentation: https://wiki.openstreetmap.org/wiki/OpenHistoricalMap/Reuse . Exact-name candidates are restricted to dated administrative levels 1–4; nearby features remain in the base style. No synthetic polygons or independent-review claims are added. Missing matches and unsupported rulers are explicit. The view is scoped to the visible map; it is not a worldwide search result.

Live OHM tile hosts were blocked by the development environment's outbound policy during this pass. Official documentation/schema and npm style code were inspected, and the filters are tested with MapLibre's expression evaluator. This does not verify actual Mughal or Rajput coverage on the live service. The interface reports unavailable resources and retains a direct OHM link. Full live visual verification remains pending in an environment that permits these hosts.

Validation: 26 automated tests passed. A browser check with synthetic, test-only vector tiles exercised a visible matching highlight, the highlight toggle, clearing the old selection, date changes and the absence of duplicate iframes, with no page errors. A separate blocked-network browser check verified that record selection and the error message still work. Synthetic shapes were never added to project data or production resources.

## Selection and loading repair

Huvishka and the other ruler records explicitly identified as Kushan in their cited `place` field now search for Kushan/Kushana Empire names. This is an association lookup, not new geometry. Cultural records mentioning Kushan are not treated as kingdoms.

Failures are tracked by source and tile, so a terrain or label failure does not invalidate successfully loaded kingdom boundaries. A matching successful tile/metadata event clears its own failure; Retry map rebuilds the provider style while preserving the selected record and date. Incomplete live provider coverage remains explicit. Validation: 29 tests plus browser checks of retry, selection, and the expanded sidebar. Live provider availability is still subject to the external service/network.


## Current rendering: physical geography and geometry-specific overlays

This supersedes earlier circle, dashed-outline, gold-highlight, and neighbouring-kingdom display descriptions. The pinned OHM basemap now retains an explicit physical-geography allowlist; every symbol/text/label layer and all other context layers are hidden on each `style.load`, before application layers are added. Attribution remains visible. Underlying physical geography is not asserted to be a historical reconstruction.

`src/historical-style.js` defines zoom-scaled, solid MapLibre circle markers for Point records, and separate Polygon/MultiPolygon fill/blurred-halo layers. Leaflet retains transparent keyboard/click targets and source popups. Battles retain separate B/S/A markers. Original date notes and citations remain unchanged.

No geographic context circles or substitute territories are drawn. Related-area definitions orient the viewport only. Dated OHM name matches use a purple translucent fill and a solid blurred halo. Reviewed GeoJSON polygons use the same styling; the reviewed collection remains empty. No empire polygons have been fabricated or added to the point-only catalogue.

MapLibre has no polygon fill-blur or continuous spatial fill-opacity gradient. The two-layer halo is a bounded-cost visual approximation with a residual fill edge, not a true seamless distance-field fade or quantified historical confidence. A continuous fade requires a separately prepared raster alpha mask/custom shader; non-overlapping inward opacity bands can approximate one. Blur widths are pixels, not geographic uncertainty distances.
