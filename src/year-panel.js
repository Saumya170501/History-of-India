import { formatYear } from './atlas.js';
import { recordsForPolity } from './period-map.js';

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

export function countPhrase(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function yearOpenLabel(summary) {
  if (!summary?.named?.length && !summary?.cautions?.length && !summary?.omitted?.length) return 'Open this year in the archive';
  const bits = [];
  if (summary.named.length) bits.push(countPhrase(summary.named.length, 'named area', 'named areas'));
  if (summary.residual.length) bits.push(countPhrase(summary.residual.length, 'residual category', 'residual categories'));
  if (summary.cautions?.length) bits.push(countPhrase(summary.cautions.length, 'disagreement with the research', 'disagreements with the research'));
  if (summary.omitted?.length) bits.push(countPhrase(summary.omitted.length, 'sheet name left off', 'sheet names left off'));
  return `${bits.join(' · ')} in the archive`;
}

export function fillYearSummary(container, summary, { onOpenList }) {
  container.replaceChildren();
  if (!summary) {
    container.append(el('p', 'year-line', 'No historical snapshot is available.'));
    return;
  }
  const line = el('p', 'year-line', summary.lead
    || (summary.exact
      ? `Who was mapped in ${formatYear(summary.year)} · snapshot ${formatYear(summary.snapshotYear)} · approximate`
      : `Who was mapped near ${formatYear(summary.year)} · nearest snapshot ${formatYear(summary.snapshotYear)} · ${summary.gapYears} years away · borders are not interpolated`));
  container.append(line);
  const open = el('button', 'year-open', yearOpenLabel(summary));
  open.type = 'button';
  open.addEventListener('click', () => onOpenList?.());
  container.append(open);
  const cited = [...summary.kingdoms, ...summary.rulers];
  const shown = cited.slice(0, 4);
  const extra = cited.length - shown.length;
  container.append(el('p', 'year-cited', shown.length
    ? `Cited windows: ${shown.join('; ')}${extra > 0 ? `; +${extra} in the archive` : ''}. A window is not proof of rule in this exact year.`
    : `No cited ruler, kingdom or state window includes ${summary.year}. That is a research gap, not evidence that nobody ruled.`));
}

export function fillYearList(container, { features, query = '', selectedName, onPolity }) {
  container.replaceChildren();
  const term = query.trim().toLocaleLowerCase('en');
  const rows = [];
  const seen = new Set();
  for (const feature of features || []) {
    const name = feature?.properties?.name;
    if (!name || seen.has(name)) continue;
    if (term && !name.toLocaleLowerCase('en').includes(term)) continue;
    seen.add(name);
    rows.push(feature);
  }
  if (!rows.length) {
    container.append(el('p', 'year-empty', term ? 'No area name matches that search.' : 'No snapshot areas are loaded for this year.'));
    return;
  }
  const named = rows.filter(feature => feature.properties.kind === 'named');
  const caution = rows.filter(feature => feature.properties.kind === 'caution');
  const residual = rows.filter(feature => feature.properties.kind === 'residual');
  const addGroup = (title, group) => {
    if (!group.length) return;
    container.append(el('h3', 'year-group', title));
    const list = el('div', 'polity-list');
    for (const feature of group) {
      const button = el('button', 'polity-row');
      button.type = 'button';
      button.setAttribute('aria-pressed', String(feature.properties.name === selectedName));
      const swatch = el('i', 'polity-swatch');
      swatch.style.background = feature.properties.color || '#8a8d91';
      button.append(swatch, el('span', 'polity-row-name', feature.properties.name));
      if (feature.properties.kind === 'residual') button.append(el('span', 'polity-row-note', 'Category, not one kingdom'));
      if (feature.properties.kind === 'caution') button.append(el('span', 'polity-row-note', 'Disagrees with the research'));
      button.addEventListener('click', () => onPolity(feature.properties.name));
      list.append(button);
    }
    container.append(list);
  };
  addGroup('Named areas on this sheet', named);
  addGroup('Sheet labels that disagree with the research', caution);
  addGroup('Residual categories', residual);
}

export function fillYearSources(container, { year, records, sources }) {
  container.replaceChildren();
  container.append(el('p', null, `Sources cited by records whose date window includes ${year} CE, plus the external sheet used for the shapes.`));
  const licence = el('p', 'polity-licence');
  licence.append(document.createTextNode('Shapes: historical-basemaps, André Ourednik and contributors, GPL-3.0-only. '));
  const repo = el('a', null, 'Source repository');
  repo.href = 'https://github.com/aourednik/historical-basemaps';
  repo.target = '_blank';
  repo.rel = 'noopener noreferrer';
  licence.append(repo);
  container.append(licence, el('p', null, 'The coast is a modern Natural Earth land mask, public domain, so the colour is not painted on the sea. It is not a historical shoreline. Long inland edges of the coarse sheet are lightly irregular, and that wobble is not a frontier. Borders are not interpolated between sheets.'));
  const seen = new Set();
  const active = (records || []).filter(record => year >= record.startYear && year <= record.endYear);
  for (const record of active) {
    for (const citation of [...(record.citations || []), ...(record.details || []).flatMap(section => section.citations || [])]) {
      if (!citation?.sourceId || seen.has(citation.sourceId)) continue;
      seen.add(citation.sourceId);
      const source = sources.get(citation.sourceId);
      if (!source) continue;
      const item = el('article', 'source-row');
      const link = el('a', null, source.title);
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      item.append(link, el('p', null, `${source.publisher}. Accessed ${source.accessed}.`));
      container.append(item);
    }
  }
  if (!seen.size) container.append(el('p', null, 'No catalogue source is attached to a record in this year.'));
}

export function fillPolityCard(container, { feature, year, summary, links, records, sources, onRecord, onClose }) {
  container.replaceChildren();
  const name = feature?.properties?.name;
  const head = el('div', 'polity-head');
  const kindLabel = feature?.properties?.kind === 'residual'
    ? 'RESIDUAL CATEGORY'
    : feature?.properties?.kind === 'caution' ? 'SHEET LABEL, NOT THE RESEARCH' : 'SNAPSHOT POLITY';
  head.append(el('p', 'eyebrow', kindLabel));
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
  if (feature?.properties?.kind === 'caution')
    container.append(el('p', 'polity-warning', feature.properties.caution || 'This sheet label disagrees with the cited research for the selected year.'));
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
