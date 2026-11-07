# Project plan: from a prototype to a historical atlas

## 0. Working research prototype — implemented

- Local Windows development environment and production build.
- Full 1–2026 CE year controls and interactive geographic map.
- Seven source-linked records, five source entries, visible uncertainty and explicit empty states.
- Point-only historical data; no invented historical boundaries.
- Validation and tests for temporal filtering, citations and location data.

This milestone demonstrates the workflow. It does not deliver comprehensive historical coverage.

## 1. A carefully reviewed 1 CE pilot — next

Define the geographical scope of the historical Indian subcontinent without equating it to a modern state's borders. Compile candidate sites, polities, rulers and trade/cultural connections relevant to 1 CE. Prioritize archaeological evidence, dated inscriptions and specialist scholarship.

For each candidate, separate what is securely attested in 1 CE from what is only broadly dated to the first century or nearby decades. The current Sanchi seed is century-dated, so it is not enough to certify a precise 1 CE reconstruction. Keep unsupported candidates in research notes, outside the published dataset.

Acceptance: each displayed claim has chronology and location evidence, uncertainties are explicit, source disagreements are retained, and an independent reviewer has checked the pilot. Do not make territory completion a requirement if adequate evidence does not exist.

## 2. Research year by year, store intervals where justified

Start with 1–100 CE, then expand in manageable chronological batches. Maintain a coverage log for each reviewed year, including researched regions, checked sources and unresolved questions. Use source-supported date intervals to avoid duplicating identical records 100 times. Inspect changes between adjoining years.

Acceptance: there is a documented distinction between unresearched years, researched years with sparse evidence, and years with reviewed records. Neither a blank map nor a populated map implies complete knowledge.

## 3. People, polities, battles and civilizations

Separate entities from dated claims as the collection grows. Add stable identities and aliases, succession/reign evidence, place associations, event participants and relationships. Preserve disputed chronology. Expand beyond monumental sites to economic, social, intellectual and regional histories. Source each relationship and avoid treating a civilization as a bounded nation-state.

Acceptance: users can follow a person, polity or cultural tradition across its sourced records without conflating reign dates, construction dates, site occupation and territorial control.

## 4. Historical boundary research — gated on evidence

Select licensed scholarly maps or datasets and record provenance, edition/page, date validity and precision. Compare competing reconstructions. Design a boundary-specific data model and review process before adding polygon rendering. Show uncertain or disputed areas using an explicitly explained visual language. Do not infer a border merely because two neighbouring dates have geometry.

Acceptance: every published historical shape has traceable evidence and review, and no present-day political boundary is silently reused as ancient territory.

## 5. Publication and collaboration

Add automated CI once repository workflow permissions and hosting choices are agreed. Select a code license and clarify data/source licensing. Choose deployment hosting, test keyboard and screen-reader navigation, add browser regression coverage, and review performance on low-end mobile devices. Add contribution templates and a historical review checklist.

Acceptance: repeatable build, documented licensing, reviewed research workflow, basic accessibility checks and a reproducible release. This handoff does not deploy a public site or merge the prototype branch.

## Working loop

Choose one bounded claim → read evidence → record dates and location separately → note disagreement → validate → inspect the map → independent review → commit with a clear summary. Use Git branches and pull requests to make changes reviewable.
