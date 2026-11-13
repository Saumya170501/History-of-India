import { empireCategory, EMPIRE_COLORS } from './empire-data.js';

export function recordFactionColor(record) {
  const category = empireCategory((record.tags || []).join(' '));
  return EMPIRE_COLORS[category];
}
const roles = { ruler: 'Ruler', kingdom: 'Kingdom', site: 'Monument', battle: 'Battle', culture: 'Culture', state: 'State' };
const motifs = {
  ruler: '<path d="M3 13h10M4 13V8l3 2 1-4 1 4 3-2v5"/>',
  kingdom: '<path d="M2 13V6h2v2h2V4h2v4h2V6h2v7"/>',
  site: '<path d="M2 13h12M4 13V8h8v5M6 8a2 2 0 0 1 4 0"/>',
  battle: '<path d="m3 3 10 10M13 3 3 13"/>',
  culture: '<path d="M2 4h5v8H2zM9 4h5v8H9z"/>',
  state: '<path d="M3 13V6h10v7M5 13V9h2v4M9 13V8h2v5"/>',
};

// Compact catalogue row. Icons are category marks, not portraits or emblems.
export function createRecordCard({ record, factionColor, selected = false, handleCardClick, locationNote = '' }) {
  const node = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const button = node('button', 'catalogue-row');
  button.type = 'button';
  button.dataset.id = record.id;
  button.style.setProperty('--faction-color', factionColor || EMPIRE_COLORS.Other);
  button.setAttribute('aria-pressed', String(selected));
  button.setAttribute('aria-label', `${record.title}, ${record.place}, ${record.dateLabel}`);
  const icon = node('span', 'catalogue-icon');
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${motifs[record.type] || motifs.culture}</svg>`;
  const copy = node('span', 'catalogue-copy');
  copy.append(
    node('strong', 'catalogue-title', record.title),
    node('span', 'catalogue-meta', `${record.place} · ${record.dateLabel}`),
    node('span', 'catalogue-note', record.summary || locationNote || roles[record.type] || 'Record'),
  );
  button.append(icon, copy);
  button.addEventListener('click', () => handleCardClick?.(null));
  return button;
}
