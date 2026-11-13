// Same-origin JSON with a short retry. An aborted request is not a failure.
export async function fetchJson(url, { signal, attempts = 3 } = {}) {
  let last = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (signal?.aborted) throw new DOMException('The sheet request was cancelled.', 'AbortError');
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      last = error;
      if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, 300 * attempt));
    }
  }
  const raw = last?.message || 'the file could not be loaded';
  const message = raw === 'Failed to fetch' ? 'the file could not be reached' : raw;
  const wrapped = new Error(message);
  wrapped.cause = last;
  throw wrapped;
}
