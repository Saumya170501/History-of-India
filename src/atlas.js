// Historical years. There is no year 0: 1 BCE is -1 and 1 CE is 1.
export const MIN_YEAR = -600;
export const MAX_YEAR = 2026;
export const TYPES = {
  site: "Sites & monuments",
  ruler: "Rulers",
  kingdom: "Kingdoms",
  battle: "Battles & aftermath",
  culture: "Culture & learning",
  state: "States & governments",
};

export function clampYear(year) {
  if (year === 0) return 1;
  return Math.max(MIN_YEAR, Math.min(MAX_YEAR, year));
}

export function formatYear(year) {
  if (!Number.isInteger(year) || year === 0) return '';
  if (year < 0) return `${(-year).toLocaleString('en')} BCE`;
  return `${year.toLocaleString('en')} CE`;
}

// ISO 8601 uses astronomical years: 0000 is 1 BCE and -0001 is 2 BCE.
export function historicalIsoDate(year) {
  const astronomical = year < 0 ? year + 1 : year;
  const negative = astronomical < 0;
  return `${negative ? '-' : ''}${String(Math.abs(astronomical)).padStart(4, '0')}-01-01`;
}

export function formatYearParts(year) {
  if (!Number.isInteger(year) || year === 0) return { number: '', era: '' };
  if (year < 0) return { number: (-year).toLocaleString('en'), era: 'BCE' };
  return { number: year.toLocaleString('en'), era: 'CE' };
}

// A positive step that would land on year 0 continues into 1 CE.
export function shiftYear(year, delta) {
  if (!Number.isInteger(year) || !Number.isInteger(delta) || delta === 0) return clampYear(year);
  let next = year + delta;
  if (year < 0 && next >= 0) next += 1;
  if (year > 0 && next <= 0) next -= 1;
  if (next === 0) next = delta > 0 ? 1 : -1;
  return clampYear(next);
}

export function normalizeYear(value, fallback = 1) {
  if (value === null || value === undefined || String(value).trim() === '') return fallback;
  const text = String(value).trim();
  let year;
  const labelled = text.match(/^(-?\d+)\s*(BCE|BC|CE|AD)$/i);
  if (labelled) {
    const magnitude = Number(labelled[1]);
    const era = labelled[2].toUpperCase();
    year = era === 'BCE' || era === 'BC' ? -Math.abs(magnitude) : Math.abs(magnitude);
  } else {
    year = Number(text);
  }
  if (!Number.isFinite(year)) return fallback;
  return clampYear(Math.round(year));
}

export function recordSearchText(record) {
  return `${record.title} ${record.place} ${record.summary} ${(record.tags || []).join(" ")} ${(record.details || []).map((section) => `${section.heading} ${section.text}`).join(" ")} ${record.searchText || ""}`;
}

export function recordsForYear(records, year, type = "all", query = "") {
  const term = query.trim().toLocaleLowerCase("en");
  return records.filter(
    (record) =>
      year >= record.startYear &&
      year <= record.endYear &&
      (type === "all" || record.type === type) &&
      (!term || recordSearchText(record).toLocaleLowerCase("en").includes(term)),
  );
}

export function searchAtlas(records, query) {
  const term = query.trim().toLocaleLowerCase("en");
  if (!term) return [];
  return records
    .filter((record) => recordSearchText(record).toLocaleLowerCase("en").includes(term))
    .sort((a, b) => a.startYear - b.startYear || a.title.localeCompare(b.title, "en"));
}

export function stateFromSearch(search) {
  const params = new URLSearchParams(search);
  return {
    year: normalizeYear(params.get("year")),
    type: Object.hasOwn(TYPES, params.get("type")) ? params.get("type") : "all",
    query: params.get("q") || "",
  };
}

export function validateAtlas(data) {
  const errors = [];
  if (
    data?.schemaVersion !== 1 ||
    !Array.isArray(data?.sources) ||
    !Array.isArray(data?.records)
  )
    return ["Expected schemaVersion 1 with sources and records arrays."];
  const sources = new Set();
  for (const source of data.sources) {
    if (!source || typeof source !== "object") {
      errors.push("Invalid source object.");
      continue;
    }
    if (typeof source.id !== "string" || !source.id.trim() || sources.has(source.id))
      errors.push(`Duplicate or missing source ID: ${source.id}`);
    sources.add(source.id);
    for (const key of ["title", "publisher", "url", "accessed"])
      if (typeof source[key] !== "string" || !source[key].trim())
        errors.push(`${source.id}: missing ${key}`);
    try {
      if (new URL(source.url).protocol !== "https:")
        errors.push(`${source.id}: source URL must use HTTPS`);
    } catch {
      errors.push(`${source.id}: invalid source URL`);
    }
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(source.accessed || "") ||
      Number.isNaN(Date.parse(source.accessed))
    )
      errors.push(`${source.id}: invalid access date`);
  }
  const ids = new Set();
  for (const record of data.records) {
    if (!record || typeof record !== "object") {
      errors.push("Invalid record object.");
      continue;
    }
    if (typeof record.id !== "string" || !record.id.trim() || ids.has(record.id))
      errors.push(`Duplicate or missing record ID: ${record.id}`);
    ids.add(record.id);
    for (const key of [
      "title",
      "place",
      "summary",
      "dateLabel",
      "dateNote",
      "locationNote",
    ])
      if (typeof record[key] !== "string" || !record[key].trim())
        errors.push(`${record.id}: missing ${key}`);
    if (!Object.hasOwn(TYPES, record.type))
      errors.push(`${record.id}: invalid record type`);
    if (record.tags !== undefined && (!Array.isArray(record.tags) || record.tags.some(tag => typeof tag !== 'string' || !tag.trim())))
      errors.push(`${record.id}: invalid research tags`);
    if (record.details !== undefined) {
      if (!Array.isArray(record.details) || record.details.length === 0)
        errors.push(`${record.id}: details must be a nonempty array`);
      else for (const section of record.details) {
        if (!section || typeof section.heading !== 'string' || !section.heading.trim()
          || typeof section.text !== 'string' || !section.text.trim()
          || !Array.isArray(section.citations) || !section.citations.length
          || section.citations.some(citation => !sources.has(citation?.sourceId)
            || typeof citation?.locator !== 'string' || !citation.locator.trim()
            || typeof citation?.supports !== 'string' || !citation.supports.trim()))
          errors.push(`${record.id}: biography sections need text and complete citations`);
      }
    }
    if (record.type === 'battle' && !['battle', 'siege', 'aftermath'].includes(record.eventKind))
      errors.push(`${record.id}: battle records require an explicit eventKind`);
    if (
      !Number.isInteger(record.startYear) ||
      !Number.isInteger(record.endYear) ||
      record.startYear < MIN_YEAR ||
      record.endYear > MAX_YEAR ||
      record.startYear === 0 ||
      record.endYear === 0 ||
      record.endYear < record.startYear
    )
      errors.push(`${record.id}: invalid year window`);
    if (!["year", "century", "approximate"].includes(record.datePrecision))
      errors.push(`${record.id}: invalid date precision`);
    if (record.reviewStatus !== "cited")
      errors.push(
        `${record.id}: prototype records must be labelled cited, not independently reviewed`,
      );
    if (!Array.isArray(record.citations) || record.citations.length === 0)
      errors.push(`${record.id}: citations required`);
    else
      for (const citation of record.citations) {
        if (
          !sources.has(citation?.sourceId) ||
          typeof citation?.locator !== "string" ||
          !citation.locator.trim() ||
          typeof citation?.supports !== "string" ||
          !citation.supports.trim()
        )
          errors.push(`${record.id}: unresolved or incomplete citation`);
      }
    if (record.geometry === null && record.locationSourceId === null) continue;
    if (!sources.has(record.locationSourceId))
      errors.push(`${record.id}: location source required`);
    const point = record.geometry?.coordinates;
    if (
      record.geometry?.type !== "Point" ||
      !Array.isArray(point) ||
      point.length !== 2 ||
      !point.every(Number.isFinite) ||
      Math.abs(point[0]) > 180 ||
      Math.abs(point[1]) > 90
    )
      errors.push(
        `${record.id}: only valid sourced GeoJSON Points are supported; historical polygons are not enabled`,
      );
  }
  return errors;
}
