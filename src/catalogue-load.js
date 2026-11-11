// The shipped page loads a slim catalogue. Longer profiles are separate files.
export function slimRecord(record) {
  const { details, ...rest } = record;
  const searchText = (details || []).map(section => `${section.heading} ${section.text}`).join(' ').trim();
  const slim = { ...rest };
  if (searchText) slim.searchText = searchText;
  if (details?.length) slim.hasProfile = true;
  return slim;
}

export function slimCatalogue(data) {
  return {
    schemaVersion: data.schemaVersion,
    sources: data.sources,
    records: (data.records || []).map(slimRecord),
  };
}
