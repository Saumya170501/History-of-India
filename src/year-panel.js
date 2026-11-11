import { recordsForPolity } from './period-map.js';

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

export function fillYearSummary(container, summary, { onPolity }) {
  container.replaceChildren();
  if (!summary) {
    container.append(el('p', 'year-line', 'No historical snapshot is available.'));
    return;
  }
  const line = el('p', 'year-line');
  line.textContent = summary.exact
    ? `Who was mapped in ${summary.year} CE · snapshot ${summary.snapshotYear}`
    : `Who was mapped near ${summary.year} CE · nearest snapshot ${summary.snapshotYear} · ${summary.gapYears} years away · borders are not interpolated`;
  container.append(line);
  const chips = el('div', 'year-chips');
  for (const name of summary.named) {
    const button = el('button', 'year-chip', name);
    button.type = 'button';
    button.addEventListener('click', () => onPolity(name));
    chips.append(button);
  }
  for (const name of summary.residual) {
    const button = el('button', 'year-chip residual', name);
    button.type = 'button';
    button.title = 'Residual category in the source sheet, not a single kingdom';
    button.addEventListener('click', () => onPolity(name));
    chips.append(button);
  }
  container.append(chips);
  const cited = [...summary.kingdoms, ...summary.rulers];
  const shown = cited.slice(0, 10);
  const extra = cited.length - shown.length;
  container.append(el('p', 'year-cited', shown.length
    ? `Cited research windows that include ${summary.year}: ${shown.join('; ')}${extra > 0 ? `; and ${extra} more in the archive` : ''}. A window is not proof of rule in this exact year.`
    : `No cited ruler, kingdom or state window includes ${summary.year}. That is a research gap, not evidence that nobody ruled.`));
}

export function fillPolityCard(container, { feature, year, summary, links, records, sources, onRecord, onClose }) {
  container.replaceChildren();
  const name = feature?.properties?.name;
  const head = el('div', 'polity-head');
  head.append(el('p', 'eyebrow', feature?.properties?.kind === 'residual' ? 'RESIDUAL CATEGORY' : 'SNAPSHOT POLITY'));
  const close = el('button', 'quiet', 'Close');
  close.type = 'button';
  close.addEventListener('click', onClose);
  head.append(close);
  container.append(head, el('h3', 'polity-title', name || 'Unnamed area'));
  if (feature?.properties?.partOf) container.append(el('p', null, `Part of, in the source sheet: ${feature.properties.partOf}.`));
  if (feature?.properties?.subjectTo && feature.properties.subjectTo !== feature.properties.partOf)
    container.append(el('p', null, `Subject to, in the source sheet: ${feature.properties.subjectTo}.`));
  container.append(el('p', 'polity-warning', summary.exact
    ? `Drawn from the ${summary.snapshotYear} CE historical-basemaps sheet. This is a coarse external digitization, not a verified border of ${name}.`
    : `No sheet exists for ${year} CE. This shape is from ${summary.snapshotYear} CE, ${summary.gapYears} years away. Borders are not interpolated, and the shape is not a verified border of ${name}.`));
  if (feature?.properties?.kind === 'residual')
    container.append(el('p', null, 'The source uses this name for an undifferentiated area. It is not shown as one kingdom.'));
  const matches = recordsForPolity(name, links, records, year);
  if (!matches.length) {
    container.append(el('p', null, 'No cited research record is linked to this snapshot name for this year. The name comes from the basemap only.'));
  }
  for (const record of matches) {
    const block = el('section', 'polity-record');
    const open = el('button', 'polity-open', record.title);
    open.type = 'button';
    open.addEventListener('click', () => onRecord(record));
    block.append(el('p', 'eyebrow', `${record.type} · ${record.dateLabel}`), open, el('p', null, record.summary), el('p', null, record.dateNote));
    for (const detail of record.details || []) {
      block.append(el('h4', null, detail.heading), el('p', null, detail.text));
      for (const citation of detail.citations) {
        const source = sources.get(citation.sourceId);
        const link = el('a', 'citation-note', source ? source.title : citation.sourceId);
        if (source) { link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
        block.append(link, el('p', 'citation-note', `${citation.locator}. ${citation.supports}`));
      }
    }
    container.append(block);
  }
  const licence = el('p', 'polity-licence');
  licence.append(document.createTextNode('Sheet licence: GPL-3.0-only, André Ourednik and contributors, historical-basemaps. '));
  const repo = el('a', null, 'Source repository');
  repo.href = 'https://github.com/aourednik/historical-basemaps';
  repo.target = '_blank';
  repo.rel = 'noopener noreferrer';
  licence.append(repo);
  container.append(licence);
}
