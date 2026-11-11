# Migration and provenance

## Starting point (7 November 2026)

- Repository: `Saumya170501/History-of-India`.
- Base: `main`, commit `4ab0c00dbc20494be104a98d43bf53f84d72ade1`.
- Existing tracked files: one 73-byte `README.md`; no application code, data or package configuration.
- The available conversation reference, *Historical Map*, confirmed the GitHub handoff, the 1–2026 CE slider, historical records and a 1 CE pilot. Retrieved turns contained setup discussion and screenshots of account settings, but no recoverable prototype implementation or source dataset.
- This branch recreates the requested prototype from those requirements. It does not claim to recover missing code or reproduce unseen designs.

## Historical seed records

Source pages were read on 7 November 2026. Each record in `src/data/atlas.json` includes its source, relevant section, date limitations and location meaning. The five UNESCO pages are institutional syntheses. The seeds are cited but await independent scholarly review.

Coordinates were converted from the property reference points in each UNESCO listing, preserving their role as site references rather than precise monument or battlefield surveys:

- [Sanchi](https://whc.unesco.org/en/list/524/): N23 28 45.984, E77 44 22.992 → `[77.73972, 23.47944]`.
- [Ajanta](https://whc.unesco.org/en/list/242/): N20 33 11.2, E75 42 0.9 → `[75.70025, 20.553111]`.
- [Nalanda](https://whc.unesco.org/en/list/1502/): N25 8 12, E85 26 38 → `[85.443889, 25.136667]`.
- [Hampi](https://whc.unesco.org/en/list/241/): N15 18 51.984, E76 28 18.012 → `[76.47167, 15.31444]`.
- [Taj Mahal](https://whc.unesco.org/en/list/252/): N27 10 27.012, E78 2 31.992 → `[78.04222, 27.17417]`.

Historical summaries are short original paraphrases. UNESCO descriptions display a CC-BY-SA IGO 3.0 notice; no wholesale descriptions, photographs or boundary files are bundled. This repository makes no claim to relicense the linked sources.

## Geographic background

- Dataset: Natural Earth, 1:110 million physical land, release `v5.1.2`.
- Download: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_land.geojson
- Local file: `public/data/land.geojson`, downloaded unmodified on 7 November 2026.
- SHA-256: `9e0729ee253ca7d7a5c4ae9395fb1902264c5377c52e224d13dd85010e2835d9`.
- License: [public domain](https://www.naturalearthdata.com/about/terms-of-use/).
- This is a generalized modern physical land outline. It includes no administrative boundaries and makes no claim about historical coastlines, river courses or sovereignty. At high zoom the geometry remains coarse; the map caps zoom accordingly.

## Software

Leaflet `1.9.4` (BSD-2-Clause) supplies map interactions; Vite `8.3.6` (MIT) supplies local development and builds. Exact dependencies are pinned in `package-lock.json`. Their notices remain available in their installed packages. No external fonts, remote imagery, tracking scripts, tile services, secret keys or account connections are required by the app.
