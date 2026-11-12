import { nearestSnapshot } from './period-map.js';
import { sheetIsSuppressed } from './sheet-policy.js';

export const PLAY_SPEEDS = Object.freeze({
  slow: { step: 1, everyMs: 700 },
  steady: { step: 5, everyMs: 450 },
  fast: { step: 25, everyMs: 280 },
});

function describeSheet(year, choice) {
  if (!choice) return 'No snapshot is published.';
  if (sheetIsSuppressed(year, choice))
    return `No close political sheet. Nearest is ${choice.snapshot.year}, ${choice.gapYears} years away.`;
  if (choice.gapYears === 0) return `Sheet ${choice.snapshot.year}.`;
  return `Nearest sheet ${choice.snapshot.year}, ${choice.gapYears} years away. Borders are not interpolated.`;
}

// Keep moving. A year without its own sheet uses the nearest sheet and says so.
// Years that would show a distant modern country map are skipped to the next year that can be drawn.
export function nextPlaybackYear({ year, maxYear, step, snapshots }) {
  if (!Number.isInteger(year) || !Number.isInteger(maxYear) || !Number.isInteger(step) || step < 1)
    throw new Error('Playback needs integer years');
  if (year >= maxYear) return { year, done: true, pause: false, skipped: false, gapYears: 0, snapshotYear: null, suppressed: false, label: '' };
  const stepped = Math.min(maxYear, year + step);
  let next = stepped;
  let choice = nearestSnapshot(next, snapshots);
  let skipped = false;
  if (sheetIsSuppressed(next, choice)) {
    let cursor = next;
    while (cursor < maxYear && sheetIsSuppressed(cursor, nearestSnapshot(cursor, snapshots))) cursor += 1;
    if (!sheetIsSuppressed(cursor, nearestSnapshot(cursor, snapshots))) {
      skipped = cursor !== stepped;
      next = cursor;
      choice = nearestSnapshot(next, snapshots);
    }
  }
  return {
    year: next,
    done: next >= maxYear,
    pause: false,
    skipped,
    gapYears: choice?.gapYears ?? 0,
    snapshotYear: choice?.snapshot?.year ?? null,
    suppressed: sheetIsSuppressed(next, choice),
    label: describeSheet(next, choice),
  };
}

export function compareNames(leftNames, rightNames) {
  const left = [...new Set((leftNames || []).filter(Boolean))];
  const right = [...new Set((rightNames || []).filter(Boolean))];
  const rightSet = new Set(right);
  const leftSet = new Set(left);
  const byName = (a, b) => a.localeCompare(b, 'en');
  return {
    onlyLeft: left.filter(name => !rightSet.has(name)).sort(byName),
    onlyRight: right.filter(name => !leftSet.has(name)).sort(byName),
    both: left.filter(name => rightSet.has(name)).sort(byName),
  };
}
