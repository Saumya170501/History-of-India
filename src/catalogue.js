// Groups a year's records for the archive. A polity label is a discovery aid.
// It does not mean the record's place is that polity's border.

export const CATEGORY_LABELS = {
  ruler: 'Rulers',
  kingdom: 'Kingdoms',
  state: 'States & governments',
  site: 'Monuments',
  battle: 'Battles & aftermath',
  culture: 'Culture & learning',
};
const CATEGORY_ORDER = ['ruler', 'kingdom', 'state', 'site', 'battle', 'culture'];

function matches(record, link) {
  return link.recordIds?.includes(record.id)
    || (link.tag && record.tags?.includes(link.tag))
    || (link.placeIncludes && record.place?.includes(link.placeIncludes));
}

function canonicalPolity(hits) {
  if (!hits.length) return null;
  const names = hits.map(link => link.name);
  const has = pattern => names.some(name => pattern.test(name));
  if (has(/princely/i)) return 'Princely states';
  if (has(/east india company|^madras$/i)) return 'East India Company';
  if (has(/^rajput/i)) return 'Rajput states';
  if (has(/mughal/i)) return 'Mughal Empire';
  if (has(/chalukya/i)) return 'Chalukyas';
  if (has(/chola/i)) return 'Chola';
  if (has(/pallava/i)) return 'Pallavas';
  if (has(/rashtrakuta/i)) return 'Rashtrakuta';
  if (has(/kushan/i)) return 'Kushan Empire';
  if (has(/^sikh|^lahore$/i)) return 'Sikhs';
  if (has(/maratha/i)) return 'Maratha Confederacy';
  if (has(/sultanate of delhi|delhi sultanate/i)) return 'Delhi Sultanate';
  if (has(/british raj/i)) return 'British Raj';
  if (has(/^india$/i)) return 'India';
  return [...hits].sort((a, b) => a.name.length - b.name.length || a.name.localeCompare(b.name))[0].name;
}

function byDate(a, b) {
  return a.startYear - b.startYear || a.endYear - b.endYear || a.title.localeCompare(b.title, 'en');
}

export function groupRecords(records, links = []) {
  const buckets = new Map();
  for (const record of records) {
    const hits = links.filter(link => matches(record, link));
    const polity = canonicalPolity(hits);
    const key = polity ? `polity:${polity}` : `category:${record.type || 'other'}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        title: polity || CATEGORY_LABELS[record.type] || 'Other records',
        kind: polity ? 'polity' : 'category',
        type: record.type || 'other',
        highlight: new Set(),
        records: [],
      });
    }
    const bucket = buckets.get(key);
    for (const hit of hits) bucket.highlight.add(hit.name);
    if (polity) bucket.highlight.add(polity);
    bucket.records.push(record);
  }
  const groups = [...buckets.values()].map(bucket => ({
    ...bucket,
    highlight: [...bucket.highlight],
    records: bucket.records.sort(byDate),
  }));
  return groups.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'polity' ? -1 : 1;
    if (a.kind === 'polity') return a.records[0].startYear - b.records[0].startYear || a.title.localeCompare(b.title, 'en');
    return CATEGORY_ORDER.indexOf(a.type) - CATEGORY_ORDER.indexOf(b.type);
  });
}

export function storyOrder(records) {
  return [...records].sort(byDate);
}
