export const TRACED_DATASET_LICENCE = 'CC BY-SA 4.0';

const REUSABLE = [
  /public domain/i,
  /^CC0\b/i,
  /^CC BY-SA\b/i,
  /^CC BY \d/i,
  /GFDL/i,
];

export function shapesForYear(index, year) {
  return (index?.shapes || []).filter(shape => year >= shape.startYear && year <= shape.endYear);
}

export function validateTracedIndex(index) {
  const errors = [];
  if (!index || index.licence !== TRACED_DATASET_LICENCE)
    errors.push('Traced dataset must be marked CC BY-SA 4.0.');
  if (!/not a licence for the site code/i.test(index?.licenceNote || ''))
    errors.push('Traced dataset must say the data licence does not cover the site code.');
  for (const shape of index?.shapes || []) {
    const id = shape?.id || '(missing id)';
    for (const key of ['title', 'file', 'depicted', 'confidence', 'commonsUrl', 'author', 'licence', 'mapSource', 'changes'])
      if (typeof shape?.[key] !== 'string' || !shape[key].trim()) errors.push(`${id}: missing ${key}`);
    if (!Number.isInteger(shape?.startYear) || !Number.isInteger(shape?.endYear) || shape.endYear < shape.startYear || shape.startYear === 0 || shape.endYear === 0)
      errors.push(`${id}: invalid year window`);
    if (!['low', 'moderate', 'higher'].includes(shape?.confidence)) errors.push(`${id}: confidence must be low, moderate, or higher`);
    if (!REUSABLE.some(pattern => pattern.test(shape?.licence || ''))) errors.push(`${id}: upstream licence is not on the reusable list`);
    if (!/^https:\/\/commons\.wikimedia\.org\//.test(shape?.commonsUrl || '')) errors.push(`${id}: Commons file URL required`);
    if (!Array.isArray(shape?.recordIds)) errors.push(`${id}: recordIds required`);
  }
  return errors;
}
