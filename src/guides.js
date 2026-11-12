// Tours and succession use records that already exist. They do not add people or dates.

export const TOURS = Object.freeze([
  {
    id: 'morning-1600',
    title: 'A morning in 1600',
    summary: 'Akbar’s last years, the Vijayanagara record, then Jahangir’s accession. Each stop is a cited record, not a new claim.',
    stops: [
      { recordId: 'akbar', year: 1600 },
      { recordId: 'vijayanagara-empire', year: 1600 },
      { recordId: 'jahangir', year: 1605 },
    ],
  },
  {
    id: 'company-to-republic',
    title: 'From the Company to the republic',
    summary: 'Five cited stops from Plassey’s era to the Constitution. Office-holders are not presented as kings.',
    stops: [
      { recordId: 'east-india-company', year: 1757 },
      { recordId: 'british-raj', year: 1858 },
      { recordId: 'quit-india', year: 1942 },
      { recordId: 'dominion-of-india', year: 1947 },
      { recordId: 'republic-of-india', year: 1950 },
    ],
  },
  {
    id: 'seventh-century',
    title: 'Around the seventh century',
    summary: 'Harsha at Kannauj, then the caves at Ellora and the monuments at Mahabalipuram.',
    stops: [
      { recordId: 'harsha', year: 620 },
      { recordId: 'ellora-caves', year: 700 },
      { recordId: 'mahabalipuram-monuments', year: 700 },
    ],
  },
]);

export function resolveTour(tour, records) {
  return tour.stops.map((stop) => {
    const record = records.find((item) => item.id === stop.recordId);
    if (!record) throw new Error(`Tour ${tour.id} is missing ${stop.recordId}`);
    if (stop.year < record.startYear || stop.year > record.endYear)
      throw new Error(`Tour ${tour.id} uses ${stop.recordId} outside its date window`);
    return { ...stop, title: record.title, record };
  });
}

export const SUCCESSIONS = Object.freeze([
  { title: 'Maurya succession', ids: ['chandragupta-maurya', 'ashoka'] },
  { title: 'Shunga succession', ids: ['pushyamitra'] },
  { title: 'Mughal succession', tag: 'Mughal' },
  { title: 'Gupta succession', ids: ['gupta-chandragupta-ii'] },
  { title: 'Chola succession', ids: ['rajaraja-temple', 'rajendra-reign', 'rajadhiraja-career', 'rajaraja-ii'] },
  { title: 'Delhi sultanate succession', ids: ['aybak', 'aram', 'iltutmish', 'raziya', 'bahram', 'jalaluddin-khalji', 'alauddin-khalji', 'bahlul', 'sikandar', 'ibrahim'] },
  { title: 'Maratha succession', tag: 'Maratha' },
]);

export function successionLine(records, spec = 'Mughal') {
  const tag = typeof spec === 'string' ? spec : spec.tag;
  const ids = typeof spec === 'object' ? spec.ids : null;
  const chosen = ids
    ? ids.map((id) => {
      const record = records.find((item) => item.id === id);
      if (!record) throw new Error(`Succession is missing ${id}`);
      return record;
    })
    : records.filter((record) => record.type === 'ruler' && record.tags?.includes(tag));
  return chosen
    .slice()
    .sort((a, b) => a.startYear - b.startYear || a.endYear - b.endYear || a.title.localeCompare(b.title, 'en'));
}
