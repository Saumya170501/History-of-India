import { useState } from 'react';
import '../../src/record-card.css';

export default function RecordCard({ title, dateLabel, role, factionColor = '#8a8d91',
  avatarUrl, selected = false, featureBbox = null, handleCardClick, locationNote }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const initials = title.trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join('').toUpperCase();
  return (
    <button type="button" className="record-card" aria-pressed={selected}
      style={{ '--faction-color': factionColor }}
      onClick={() => handleCardClick(featureBbox)}>
      <span className="record-avatar" aria-hidden="true">
        {avatarUrl && failedUrl !== avatarUrl
          ? <img src={avatarUrl} alt="" loading="lazy" onError={() => setFailedUrl(avatarUrl)} />
          : initials}
      </span>
      <span className="record-card-body">
        <strong className="record-title">{title}</strong>
        <span className="record-badges">
          <span className="record-badge record-date-badge">{dateLabel}</span>
          <span className="record-badge record-role-badge">{role}</span>
        </span>
        {locationNote && <span className="record-location-note">{locationNote}</span>}
      </span>
    </button>
  );
}
