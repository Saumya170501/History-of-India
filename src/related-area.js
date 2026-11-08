// Editorial navigation buffers around associated geography, NOT historical extents.
// Centers/radii below are deliberately coarse and carry no sovereignty claim.
const areas = [
  [/Mewar/, 'Mewar region', [25, 74], 220],
  [/Marwar/, 'Marwar region', [26.5, 73], 260],
  [/Amber|Jaipur/, 'Amber–Jaipur region', [27, 76], 130],
  [/Bikaner/, 'Bikaner region', [28, 73.5], 180],
  [/Jaisalmer/, 'Jaisalmer region', [27, 71], 180],
  [/Kota/, 'Kota region', [25, 76], 130],
  [/Ajmer/, 'Ajmer region', [26.5, 74.5], 150],
  [/Panipat|Tarain/, 'Haryana region', [29.5, 77], 150],
  [/Khanwa/, 'Agra–Bharatpur region', [27, 77.5], 120],
  [/Ranthambore/, 'Southeastern Rajasthan', [26, 76.5], 150],
  [/Delhi|Lodi/, 'Delhi and surrounding northern plains', [28.5, 77], 220],
  [/Kushan|Central Asia and northern South Asia/, 'Northwestern South Asia and adjoining Central Asia', [33, 71], 950],
  [/Northern Kshatrapa/, 'Mathura and surrounding northern plains', [27.5, 78], 250],
  [/Western Kshatrapa|Western India/, 'Western South Asia', [23, 72], 500],
  [/Western Deccan|Nasik/, 'Western Deccan', [20, 74], 350],
  [/Southern Deccan/, 'Southern Deccan', [14, 76], 400],
  [/Northern Deccan/, 'Northern Deccan', [18, 76], 450],
  [/Satavahana|^Deccan$/, 'Deccan region', [18, 77], 600],
  [/Ikshvaku|Andhra/, 'Andhra region', [16, 80], 350],
  [/Tamilakam|South India/, 'Southern peninsula', [11, 77.5], 500],
  [/Thanjavur|Gangaikondacholapuram|Darasuram/, 'Kaveri delta and adjoining Tamil region', [11, 79.5], 150],
  [/Chola|Tamil region/, 'Tamil region', [11, 79], 300],
  [/Mughal/, 'South Asia — broad Mughal context', [24, 78], 1200],
];
export function relatedArea(record) {
  if (!record) return null;
  if (record.geometry?.type === 'Point') {
    const [lon, lat] = record.geometry.coordinates;
    return { label: `${record.place} vicinity`, center: [lat, lon], radiusKm: 50,
      basis: 'Center uses the record’s sourced associated place. The 50 km buffer is a display aid, not a historical boundary or location uncertainty estimate.' };
  }
  // Kam Bakhsh's cited profile specifically describes a Deccan claim.
  const match = record.id === 'kam-bakhsh' ? areas.find(([pattern]) => pattern.test('Deccan'))
    : areas.find(([pattern]) => pattern.test(record.place));
  if (!match) return null;
  const [, label, center, radiusKm] = match;
  return { label, center: [...center], radiusKm,
    basis: `Related geography follows the record’s cited place/profile. The rounded center and ${radiusKm} km radius are editorial display choices, not measured historical extent or the ruler’s location.` };
}
