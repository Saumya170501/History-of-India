// Search associations, not claims of continuous sovereignty or verified borders.
const mughalReigns = new Set(['babur', 'humayun-first', 'humayun-second', 'akbar', 'jahangir', 'shah-jahan-reign', 'aurangzeb', 'bahadur-shah-i', 'jahandar-shah', 'farrukhsiyar', 'rafi-darajat', 'shah-jahan-ii', 'muhammad-shah', 'ahmad-shah-bahadur', 'alamgir-ii', 'shah-alam-ii-first', 'shah-alam-ii-second', 'akbar-ii', 'bahadur-shah-ii']);
const regionalNames = [
  ['Mewar', ['Mewar', 'Kingdom of Mewar', 'Mewar Kingdom', 'Udaipur State']],
  ['Marwar', ['Marwar', 'Kingdom of Marwar', 'Jodhpur State']],
  ['Amber', ['Amber', 'Kingdom of Amber', 'Amber State']],
  ['Jaipur', ['Jaipur', 'Jaipur State', 'Kingdom of Jaipur']],
  ['Bikaner', ['Bikaner', 'Bikaner State', 'Kingdom of Bikaner']],
  ['Kota', ['Kota', 'Kota State', 'Kotah State']],
  ['Jaisalmer', ['Jaisalmer', 'Jaisalmer State', 'Kingdom of Jaisalmer']],
];
export function kingdomNames(record) {
  if (!record || !['ruler', 'kingdom'].includes(record.type)) return [];
  if (record.type === 'ruler' && /^Kushan(?:;|$)/.test(record.place || '')) return ['Kushan Empire', 'Kushana Empire', 'Kushan', 'Kushana'];
  if (mughalReigns.has(record.id)) return ['Mughal Empire', 'Mogul Empire', 'Mughal'];
  if (record.tags?.includes('Rajput')) {
    // More specific names first where a description mentions Amber/Jaipur together.
    if (record.id === 'rajput-jai-singh-ii') return ['Jaipur', 'Jaipur State', 'Amber', 'Amber State'];
    return regionalNames.find(([name]) => record.place.includes(name))?.[1] || [];
  }
  if (record.type === 'kingdom') {
    const known = [
      ['chola', ['Chola Empire', 'Chola dynasty', 'Cholas']],
      ['kushan', ['Kushan Empire', 'Kushan']],
      ['satavahana', ['Satavahana dynasty', 'Satavahana Empire', 'Satavahana']],
      ['gupta', ['Gupta Empire', 'Gupta']],
    ];
    return known.find(([key]) => record.id.includes(key))?.[1] || [record.title];
  }
  return [];
}
export const nameFields = ['name', 'name_en', 'official_name', 'short_name'];
export function nameFilter(names) {
  if (!names.length) return ['==', 1, 0];
  return ['any', ...nameFields.map(field => ['in', ['downcase', ['to-string', ['get', field]]], ['literal', names.map(name => name.toLowerCase())]])];
}
export function selectionFilter(record, year) {
  // January 1 snapshot, matching the date on the map. Require dated evidence.
  return ['all', ['==', ['get', 'type'], 'administrative'],
    ['has', 'admin_level'], ['>=', ['number', ['get', 'admin_level'], 99], 1], ['<=', ['number', ['get', 'admin_level'], 99], 4],
    ['has', 'start_decdate'], ['<=', ['number', ['get', 'start_decdate'], 99999], year],
    ['any', ['!', ['has', 'end_decdate']], ['>', ['number', ['get', 'end_decdate'], -99999], year]],
    nameFilter(kingdomNames(record))];
}
