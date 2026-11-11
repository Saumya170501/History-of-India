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

export function successionLine(records, tag = 'Mughal') {
  return records
    .filter((record) => record.type === 'ruler' && record.tags?.includes(tag))
    .slice()
    .sort((a, b) => a.startYear - b.startYear || a.endYear - b.endYear || a.title.localeCompare(b.title, 'en'));
}
