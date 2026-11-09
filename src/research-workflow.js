// Annual research tracking is independent of the public atlas records.
// An unresearched year must never be interpreted as an event-free year.
const states = new Set(['not-started', 'researching', 'awaiting-review', 'reviewed']);
const nonempty = v => typeof v === 'string' && v.trim().length > 0;
export function validateAnnualResearch(item) {
  const errors = [];
  if (!item || typeof item !== 'object') return ['Annual research record must be an object'];
  if (!Number.isInteger(item.year) || item.year < 1 || item.year > 2026) errors.push('Invalid year');
  if (!states.has(item.status)) errors.push('Invalid status');
  if (!Array.isArray(item.regions) || !item.regions.length || item.regions.some(r => !nonempty(r.name) || !states.has(r.status))) errors.push('Regions need names and valid research statuses');
  if (!Array.isArray(item.claims)) errors.push('Claims must be an array');
  else for (const c of item.claims) {
    if (!nonempty(c.id) || !nonempty(c.statement)) errors.push('Claims need IDs and statements');
    if (!['confirmed', 'approximate', 'disputed', 'unknown'].includes(c.confidence)) errors.push('Claim requires an evidence confidence');
    if (!Array.isArray(c.sources) || (c.confidence !== 'unknown' && !c.sources.length)) errors.push('Supported claims need citations');
    else if (c.sources.some(s => !nonempty(s.sourceId) || !nonempty(s.locator) || !nonempty(s.supports))) errors.push('Claim citations require source ID, locator and scope');
    if (!nonempty(c.dateNote) || !nonempty(c.locationNote)) errors.push('Claims require date and location context');
  }
  if (item.status === 'reviewed' && (!nonempty(item.review?.reviewer) || !nonempty(item.review?.method))) errors.push('Reviewed year requires independent named reviewer and method');
  return errors;
}
export function researchProgress(records) {
  const counts = Object.fromEntries([...states].map(s => [s,0]));
  for (const r of records) {
    if (!states.has(r.status)) throw new Error('Invalid research status');
    counts[r.status]++;
  }
  return { reviewedYears: counts.reviewed, trackedYears: records.length, counts };
}
