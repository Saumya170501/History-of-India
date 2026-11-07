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
