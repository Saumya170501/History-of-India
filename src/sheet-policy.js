// Display rules for coarse external sheets. These do not change the files on disk.
// A caution means the sheet still carries a name the cited research does not support for that year.

export const CLOSE_COUNTRY_GAP = 5;
// World country sheets. They are not historical polity maps of an earlier year.
const COUNTRY_SHEETS = new Set([1960, 1994, 2000, 2010]);

export const SHEET_CAUTIONS = Object.freeze([
  {
    name: 'Vijayanagara',
    afterYear: 1565,
    recordId: 'vijayanagara-empire',
    note: 'This sheet still draws Vijayanagara. Cited research says the city was destroyed in 1565, and later rulers used Penukonda until the empire ended about 1614. The shape is a sheet label, not proof that the old capital still ruled.',
  },
  {
    name: 'Bangladesh',
    beforeYear: 1971,
    note: 'Bangladesh was not a separate state before 1971. This name comes from a coarse world sheet, not from a political map of the selected year.',
  },
  {
    name: 'Pakistan',
    beforeYear: 1947,
    note: 'Pakistan was created in 1947. A sheet that labels it in an earlier year is not that year’s political geography.',
  },
]);

export function cautionFor(name, year) {
  if (!Number.isInteger(year)) throw new Error('Invalid historical year');
  const wanted = String(name || '').trim().toLowerCase();
  return SHEET_CAUTIONS.find(rule => {
    if (String(rule.name).trim().toLowerCase() !== wanted) return false;
    if (Number.isInteger(rule.afterYear) && year <= rule.afterYear) return false;
    if (Number.isInteger(rule.beforeYear) && year >= rule.beforeYear) return false;
    return true;
  }) || null;
}

export function applySheetReading(features, year) {
  return (features || []).map(feature => {
    const caution = cautionFor(feature?.properties?.name, year);
    if (!caution) return feature;
    return {
      ...feature,
      properties: {
        ...feature.properties,
        kind: 'caution',
        caution: caution.note,
        cautionRecordId: caution.recordId || '',
      },
    };
  });
}

// A later country map is not drawn when the selected year is too far from that sheet.
export function sheetIsSuppressed(year, choice) {
  if (!choice?.snapshot || !Number.isInteger(year)) return false;
  return year >= 1947
    && COUNTRY_SHEETS.has(choice.snapshot.year)
    && choice.gapYears > CLOSE_COUNTRY_GAP;
}
