# Prototype verification — 7 November 2026

## Automated checks

Validated on Windows using Node.js 22.14.0 and npm 11.3.0:

- `npm.cmd test`: 10 tests covering inclusive date windows and adjacent years, exact-year events, combined search/type filters, year normalization, URL state, source/coordinate validation, malformed citation fields and the background asset checksum.
- `npm.cmd run build`: historical data validation and Vite production build.
- `git diff --check`: no whitespace errors.
- Dependency installation audit: zero reported vulnerabilities at installation time.

These checks validate implementation and data structure. They do not certify historical accuracy.

## Interactive browser checks

Tested the local development server in the desktop app's browser:

- Initial 1 CE view shows the Sanchi first-century record and its date uncertainty.
- 500 CE shows Ajanta and Nalanda; the culture filter selects Nalanda.
- An unmatched search shows a filter-specific empty state; clearing filters restores records.
- 2026 CE shows a research gap, and the next-year button is disabled.
- Negative year input clamps to 1; slider Home/ArrowRight keyboard controls update the year.
- At 1565, the shared Hampi marker offers both records; selecting the aftermath record shows its affected-city caveat.
- Sources dialog opens and closes; cited URLs are exposed as normal links.
- Browsing the Taj Mahal record selects its date window; reloading preserves the year in the URL.
- Browser console showed no warnings or errors during these checks.
- A 390 × 844 viewport displayed the single-column layout without horizontal overflow. The viewport override was reset afterward.
- A full-page screenshot of the 500 CE view was saved in the task's outputs as `atlas-preview.jpg`.

The local server responded with HTTP 200. A temporary initial preview connection failure was resolved by starting the server with the permitted local network access; no app code change was needed.

## Remaining review

No exhaustive accessibility audit, screen-reader test, cross-browser matrix, automated end-to-end suite, or independent scholarly review has been completed. The production bundle was built successfully; the interactive checks used the development server. The prototype has not been deployed or merged into `main`.
