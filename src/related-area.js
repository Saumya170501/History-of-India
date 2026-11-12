// Editorial navigation buffers around associated geography, NOT historical extents.
// Centers/radii below are deliberately coarse and carry no sovereignty claim.
const areas = [
  [/Kalinga|Kharavela|Gajapati/, 'Kalinga context', [20.5, 85.5], 220],
  [/Devagiri|Seuna|Yadava/, 'Devagiri and the western Deccan', [19.9, 75.2], 240],
  [/Anahilavada|Patan/, 'Patan and northern Gujarat', [23.85, 72.1], 180],
  [/Kashmir|Karkota/, 'Kashmir valley context', [34.1, 74.8], 180],
  [/Malwa|Paramara|Dhara/, 'Malwa context', [22.6, 75.3], 280],
  [/Ghurid|Ghor/, 'Ghor and the northwest routes', [33.5, 65], 500],
  [/Indo-Greek/, 'Northwestern South Asia', [33, 72.8], 450],
  [/Chhattisgarh/, 'Chhattisgarh context', [21.2, 81.6], 280],
  [/Telangana|Warangal|Orugallu/, 'Telangana and Warangal context', [18, 79.6], 280],
  [/Gujarat Sultanate|Ahmedabad/, 'Gujarat sultanate context', [23.0, 72.6], 250],
  [/Valabhi|Saurashtra|Kathiawar/, 'Saurashtra and Gujarat context', [21.9, 71.8], 280],
  [/Khajuraho|Chandella|Chandela/, 'Khajuraho and Bundelkhand context', [24.8, 79.9], 180],
  [/Pattadakal/, 'Pattadakal on the Malaprabha', [15.9, 75.8], 80],
  [/Seringapatam|Srirangapatna|Mysore/, 'Seringapatam and Mysore context', [12.4, 76.7], 120],
  [/Dandi|Sabarmati/, 'Gujarat coast between Sabarmati and Dandi', [21.3, 72.6], 160],
  [/Mahabalipuram|Mamallapuram/, 'Coromandel coast at Mahabalipuram', [12.6, 80.2], 80],
  [/Kannauj|Thanesar/, 'Kannauj and the upper Ganga plain', [27.1, 79.9], 280],
  [/Assam|Ahom/, 'Assam and the Brahmaputra valley', [26.5, 93], 400],
  [/Bombay|Mumbai/, 'Bombay, the cited launch city', [19, 72.8], 80],
  [/Republic of India/, 'India after 1950 — a republic, not a kingdom extent', [22.5, 79], 1200],
  [/Gupta|Magadha|Ganga-Yamuna/, 'Ganga-Yamuna and Magadha context', [26, 82], 700],
  [/Vakataka/, 'Vakataka Deccan context', [20, 78], 550],
  [/Chalukya|Vatapi|Kalyani|Vengi/, 'Deccan and Vengi context', [16.5, 77], 650],
  [/Pallava|Kanchipuram/, 'Kanchipuram and the northern Tamil country', [12.8, 79.7], 280],
  [/Pala|Bengal and Bihar/, 'Bengal and eastern Bihar', [24.5, 87.5], 450],
  [/Rashtrakuta/, 'Rashtrakuta Deccan context', [18.5, 76.5], 600],
  [/Vijayanagara/, 'Vijayanagara–Hampi region', [15.3, 76.5], 350],
  [/Maratha|Pune|Raigad/, 'Western Deccan Maratha context', [18.2, 74], 450],
  [/Sikh|Punjab|Lahore/, 'Punjab context', [31.5, 74.3], 400],
  [/Company presidencies|East India Company/, 'Company presidencies — broad context', [20, 78], 1100],
  [/British India|British raj/, 'British Indian provinces — broad context', [23, 80], 1200],
  [/Princely/, 'Scattered princely states — not one territory', [24, 78], 1000],
  [/Dominion of India/, 'India after 1947 — a modern state, not a kingdom extent', [22.5, 79], 1200],
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
