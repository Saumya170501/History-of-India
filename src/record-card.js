import { empireCategory, EMPIRE_COLORS } from './empire-data.js';

export function recordFactionColor(record) {
  const category = empireCategory((record.tags || []).join(' '));
  return EMPIRE_COLORS[category];
}
const roles = { ruler: 'Ruler', kingdom: 'Kingdom', site: 'Monument', battle: 'Battle', culture: 'Culture' };
const initials = title => title.trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join('').toUpperCase();

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
  const avatar = node('span', 'record-avatar', initials(record.title));
  avatar.setAttribute('aria-hidden', 'true');
  if (avatarUrl) {
    const img = document.createElement('img'); img.src = avatarUrl; img.alt = ''; img.loading = 'lazy';
    img.addEventListener('error', () => avatar.replaceChildren(document.createTextNode(initials(record.title))), { once: true });
    avatar.replaceChildren(img);
  }
  const body = node('span', 'record-card-body');
  const badges = node('span', 'record-badges');
  badges.append(node('span', 'record-badge record-date-badge', record.dateLabel),
    node('span', 'record-badge record-role-badge', roles[record.type] || 'Record'));
  body.append(node('strong', 'record-title', record.title), badges);
  if (locationNote) body.append(node('span', 'record-location-note', locationNote));
  button.append(avatar, body);
  button.addEventListener('click', () => handleCardClick(featureBbox));
  return button;
}
