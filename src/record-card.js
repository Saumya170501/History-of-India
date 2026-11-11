import { empireCategory, EMPIRE_COLORS } from './empire-data.js';

export function recordFactionColor(record) {
  const category = empireCategory((record.tags || []).join(' '));
  return EMPIRE_COLORS[category];
}
const roles = { ruler: 'Ruler', kingdom: 'Kingdom', site: 'Monument', battle: 'Battle', culture: 'Culture' };

// The current app uses DOM components; CSS is also shared by the React example.
export function createRecordCard({ record, factionColor, selected = false, avatarUrl,
  featureBbox = null, handleCardClick, locationNote = '' }) {
  const node = (tag, className, text) => {
    const el = document.createElement(tag); el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const button = node('button', 'record-card');
  button.type = 'button';
  button.dataset.id = record.id;
  button.style.setProperty('--faction-color', factionColor || EMPIRE_COLORS.Other);
  button.setAttribute('aria-pressed', String(selected));
  const artwork = node('span', 'record-artwork');
  artwork.setAttribute('aria-hidden', 'true');
  const role = roles[record.type] || 'Record';
  const label = node('span', 'record-art-label', role);
  const selectedLabel = node('span', 'record-selected-label', '✓ Selected');
  // Decorative museum pictograms, not portraits or historical reconstructions.
  const motifs = {
    ruler: '<path d="M20 62h80M30 62V38l20 12 10-25 10 25 20-12v24M30 72h60"/>',
    kingdom: '<path d="M25 77V36h15v12h12V25h16v23h12V36h15v41M49 77V62a11 11 0 0 1 22 0v15"/>',
    site: '<path d="M20 78h80M30 78V48h60v30M36 48a24 24 0 0 1 48 0M60 24V16M50 78V64a10 10 0 0 1 20 0v14"/>',
    battle: '<path d="m30 22 58 58m-6-58L24 80M20 62l18 18m44-18L64 80M30 22l4 20 12-12m36-8-4 20-12-12"/>',
    culture: '<path d="M60 34c-12-10-26-12-40-9v48c14-3 28-1 40 9 12-10 26-12 40-9V25c-14-3-28-1-40 9v48M30 38l18 5m-18 8 18 5m24-13 18-5m-18 18 18-5"/>',
  };
  const icon = node('span', 'record-art-icon');
  icon.innerHTML = `<svg viewBox="0 0 120 100" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${motifs[record.type] || motifs.culture}</svg>`;
  artwork.append(label, selectedLabel, icon);
  if (avatarUrl) {
    const img = document.createElement('img'); img.src = avatarUrl; img.alt = ''; img.loading = 'lazy';
    img.addEventListener('error', () => img.remove(), { once: true });
    artwork.prepend(img);
  }
  const body = node('span', 'record-card-body');
  const badges = node('span', 'record-badges');
  badges.append(node('span', 'record-badge record-date-badge', record.dateLabel),
    node('span', 'record-badge record-role-badge', roles[record.type] || 'Record'));
  body.append(node('span', 'record-place', record.place), node('strong', 'record-title', record.title), badges);
  if (record.summary) body.append(node('span', 'record-excerpt', record.summary));
  const arrow = node('span', 'record-open-arrow');
  arrow.setAttribute('aria-hidden', 'true');
  body.append(arrow);
  if (locationNote) body.append(node('span', 'record-location-note', locationNote));
  button.append(artwork, body);
  button.addEventListener('click', () => handleCardClick(featureBbox));
  return button;
}
