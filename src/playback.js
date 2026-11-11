import { nearestSnapshot } from './period-map.js';
import { sheetIsSuppressed } from './sheet-policy.js';

export const PLAY_SPEEDS = Object.freeze({
  slow: { step: 1, everyMs: 700 },
  steady: { step: 5, everyMs: 450 },
  fast: { step: 25, everyMs: 280 },
});

// Advance the year. Pause when the step lands on a different sheet that is not exact,
// so a gap warning stays on screen until play is pressed again.
export function nextPlaybackYear({ year, maxYear, step, snapshots }) {
  if (!Number.isInteger(year) || !Number.isInteger(maxYear) || !Number.isInteger(step) || step < 1)
    throw new Error('Playback needs integer years');
  if (year >= maxYear) return { year, done: true, pause: false, gapYears: 0, snapshotYear: null };
  const next = Math.min(maxYear, year + step);
  const before = nearestSnapshot(year, snapshots);
  const after = nearestSnapshot(next, snapshots);
  const crossed = before?.snapshot?.year !== after?.snapshot?.year;
  const suppressed = sheetIsSuppressed(next, after);
  const pause = Boolean(crossed && after && (after.gapYears > 0 || suppressed));
  return {
    year: next,
    done: next >= maxYear,
    pause,
    gapYears: after?.gapYears ?? 0,
    snapshotYear: after?.snapshot?.year ?? null,
    suppressed,
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
