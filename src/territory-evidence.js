// Candidate territory records are NEVER rendered on the public map.
// This gate validates evidence metadata before a human review can approve a proposal.
const nonempty = x => typeof x === 'string' && x.trim().length > 0;
const validYear = y => Number.isInteger(y) && y >= 1 && y <= 2026;
const validDate = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x));
const authorityTypes = new Set(['direct', 'tributary', 'disputed', 'cultural', 'occupation']);
const confidence = new Set(['high', 'medium', 'low', 'unknown']);

function ringErrors(ring, prefix) {
  const errors = [];
  if (!Array.isArray(ring) || ring.length < 4) return [prefix + ': ring requires at least four positions'];
  for (const p of ring) {
    if (!Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite)
      || Math.abs(p[0]) > 180 || Math.abs(p[1]) > 90) errors.push(prefix + ': invalid longitude/latitude');
  }
  if (errors.length) return errors;
  if (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1]) errors.push(prefix + ': ring must close');
  if (new Set(ring.slice(0, -1).map(p => p.join(','))).size < 3) errors.push(prefix + ': degenerate ring');
  return errors;
}
export function validateTerritoryCandidate(item, sourceIds = new Set()) {
  const errors = [];
  if (!item || typeof item !== 'object') return ['candidate must be an object'];
  for (const key of ['id','entityId','title','uncertaintyNote']) if (!nonempty(item[key])) errors.push('missing ' + key);
  if (!validYear(item.validFrom) || !validYear(item.validTo) || item.validFrom > item.validTo) errors.push('invalid chronological interval');
  if (!authorityTypes.has(item.authorityType)) errors.push('invalid authority type');
  if (!confidence.has(item.dateConfidence) || !confidence.has(item.boundaryConfidence)) errors.push('invalid confidence');
  if (!Array.isArray(item.citations) || !item.citations.length ||
      item.citations.some(c => !sourceIds.has(c?.sourceId) || !nonempty(c?.locator) || !nonempty(c?.supports))) errors.push('missing claim-specific source references');
  const p = item.provenance;
  for (const key of ['author','edition','page','scale','rights','digitizationMethod','interpretation']) {
    if (!nonempty(p?.[key])) errors.push('missing provenance.' + key);
  }
  const g = item.geometry;
  if (!g || !['Polygon','MultiPolygon'].includes(g.type)) errors.push('a candidate requires Polygon or MultiPolygon geometry');
  else {
    const polygons = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    if (!Array.isArray(polygons) || !polygons.length) errors.push('empty geometry');
    else polygons.forEach((poly, i) => {
      if (!Array.isArray(poly) || !poly.length) errors.push('polygon ' + i + ': no rings');
      else poly.forEach((ring,j) => errors.push(...ringErrors(ring, 'polygon ' + i + ' ring ' + j)));
    });
  }
  // Independent review is never automatically inferred from good schema validation.
  if (item.review?.status === 'reviewed' &&
      (!nonempty(item.review.reviewer) || !validDate(item.review.date) ||
       !nonempty(item.review.reviewNotes))) errors.push('review approval requires a named reviewer, date and review notes');
  return errors;
}
export function readyForEditorialReview(item, sourceIds) {
  return validateTerritoryCandidate(item, sourceIds).length === 0 &&
    item.review?.status !== 'reviewed';
}
