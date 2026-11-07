export const MIN_YEAR = 1;
export const MAX_YEAR = 2026;
export const TYPES = {
  site: "Sites & monuments",
  ruler: "Rulers",
  kingdom: "Kingdoms",
  battle: "Battles & aftermath",
  culture: "Culture & learning",
};

export function normalizeYear(value, fallback = MIN_YEAR) {
  if (value === null || String(value).trim() === "") return fallback;
  const year = Number(value);
  return Number.isFinite(year)
    ? Math.max(MIN_YEAR, Math.min(MAX_YEAR, Math.round(year)))
    : fallback;
}

export function recordsForYear(records, year, type = "all", query = "") {
  const term = query.trim().toLocaleLowerCase("en");
  return records.filter(
    (record) =>
      year >= record.startYear &&
      year <= record.endYear &&
      (type === "all" || record.type === type) &&
      (!term ||
        `${record.title} ${record.place} ${record.summary}`
          .toLocaleLowerCase("en")
          .includes(term)),
  );
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
    if (record.type === 'battle' && !['battle', 'siege', 'aftermath'].includes(record.eventKind))
      errors.push(`${record.id}: battle records require an explicit eventKind`);
    if (
      !Number.isInteger(record.startYear) ||
      !Number.isInteger(record.endYear) ||
      record.startYear < MIN_YEAR ||
      record.endYear > MAX_YEAR ||
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
