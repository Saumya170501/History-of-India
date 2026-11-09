# Annual research and editorial review workflow

This pilot introduces a machine-checkable annual status for 1 CE. Its empty `claims` array means **research gap**, not historical absence.

## Annual research status
- `not-started`: no substantive claim review
- `researching`: evidence collection underway
- `awaiting-review`: candidate citations and interpretations compiled, not independently approved
- `reviewed`: named independent historical reviewer checked claims and limitations

Coverage must be reported as **number of independently reviewed annual research records**, not as the number of years offered by the slider or the number of catalogue records with overlapping date windows.

## Claim protocol
1. Record a narrowly worded, testable historical claim. Separate ruler identity, chronology, political authority, capital/location, battles and territorial extent.
2. Record dated source references, exact page/inscription/object ID and what each source actually supports.
3. Record the geographic meaning: capital, site, claimed territory, battle, aftermath, cultural distribution or unknown.
4. Select claim confidence: confirmed / approximate / disputed / unknown. Preserve competing interpretations.
5. Do not infer that a ruler controlled a region from a monument or one attributed coin alone.
6. Have a historian/editor review factual claims. Boundary geometry additionally requires GIS topology and provenance review under `docs/TERRITORY_EVIDENCE_GATE.md` once integrated.
7. Merge only source-backed claims into `src/data/atlas.json`, keeping date precision and claim-level citations.
8. Revisit adjacent years 1, 2, 3, 4, 5 and document an event only when chronologically supported.

## Source starting points (research leads, not independent confirmation of a 1 CE ruler)
- University of Chicago, Joseph E. Schwartzberg, *A Historical Atlas of South Asia*: https://dsal.uchicago.edu/reference/schwartzberg/
- Archaeological Survey of India, epigraphy: https://asi.nic.in/
- SIDDHAM inscription database: https://siddham.network/
- OpenHistoricalMap: https://www.openhistoricalmap.org/ (geometry provider, not sufficient scholarly verification of historical extent)

## Tests
`npm test` discovers `test/research-workflow.test.js`. These tests check research-record structure and review states, **not** historical accuracy.

## Next research batch
Complete documentary review for 1 CE first, with local/regional evidence and explicit gaps. Then evaluate 2–5 CE by change events. Do not invent changes to fill every year.
