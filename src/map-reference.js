import { relatedArea } from './related-area.js';
import { normalizeYear } from './atlas.js';

// Viewports are navigation only. Never turn them into historical geometry.
export function mapReference(record, year) {
  const coordinates = record?.geometry?.type === 'Point' ? record.geometry.coordinates : null;
  const area = relatedArea(record);
  const center = area?.center || [22, 80];
  const zoom = coordinates ? 6 : area ? (area.radiusKm > 800 ? 4 : area.radiusKm > 300 ? 5 : 6) : 4;
  const date = `${String(normalizeYear(year)).padStart(4, '0')}-01-01`;
  const viewport = `${zoom}/${center[0]}/${center[1]}`;
  return {
    center, zoom, date,
    scope: coordinates ? 'Sourced associated place — not a territorial boundary.'
      : 'Subcontinent overview — this record has no verified map location or boundary.',
    embedUrl: `https://embed.openhistoricalmap.org/#map=${viewport}&date=${date}&layer=O`,
    sourceUrl: `https://www.openhistoricalmap.org/#map=${viewport}&layers=O&date=${date}&daterange=0001-01-01,2026-12-31`,
  };
}
