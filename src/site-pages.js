export const FEEDBACK_ADDRESS = 'saumyapatel170501@gmail.com';

export function feedbackMailto({ name = '', email = '', message = '', page = '', year = '' } = {}) {
  const lines = [
    message.trim(),
    '',
    `Page: ${page || 'not given'}`,
    `Year: ${year || 'not given'}`,
    name.trim() ? `Name: ${name.trim()}` : 'Name: not given',
    email.trim() ? `Email: ${email.trim()}` : 'Email: not given',
  ];
  const subject = `History of India atlas feedback${year ? ` (${year})` : ''}`;
  return `mailto:${FEEDBACK_ADDRESS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character]));
}

function pageShell({ title, description, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#244c42">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)}</title>
  <link rel="icon" href="./favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="./src/pages.css">
</head>
<body>
  <a class="skip" href="#content">Skip to content</a>
  <header class="mast">
    <a class="brand" href="./">History of India</a>
    <nav aria-label="Site">
      <a href="./">Atlas</a>
      <a href="./about">About</a>
      <a href="./feedback">Feedback</a>
      <a href="./privacy">Privacy</a>
    </nav>
  </header>
  <main id="content">${body}</main>
</body>
</html>
`;
}

export function aboutPage({ shapes = [], sources = [] } = {}) {
  const credits = shapes.map(shape => `<li>
    <a href="${escapeHtml(shape.commonsUrl)}">${escapeHtml(shape.commonsFile || shape.title)}</a>
    <span>${escapeHtml(shape.title)}. ${escapeHtml(shape.author)}. ${escapeHtml(shape.licence)}.</span>
  </li>`).join('\n');
  const bibliography = sources.map(source => `<li>
    <a href="${escapeHtml(source.url)}">${escapeHtml(source.title)}</a>
    <span>${escapeHtml(source.publisher)}</span>
  </li>`).join('\n');
  return pageShell({
    title: 'About and credits · History of India',
    description: 'How this atlas uses sources, approximate outlines, and uncertainty, and who made the maps.',
    body: `
    <p class="eyebrow">About and credits</p>
    <h1>A source-led atlas, not a finished border.</h1>
    <p>This atlas is a way to move through the history of the Indian subcontinent from 600 BCE to 2026 CE and read the evidence for each record. A year on the timeline is a search window. It is not a claim that a kingdom held the same land on every day inside that window.</p>
    <h2>Method</h2>
    <p>Records are added from published sources. A Wikipedia article, a museum page, or a surveyed coordinate can support a date or a point. Nothing is placed from memory alone. Where a kingdom has no surveyed frontier, the map may show an approximate outline traced from a free Commons map, or the nearest dated sheet. Those shapes are labelled approximate. A low fit is drawn softer than a closer one.</p>
    <p>If a reign has no map of its own, it may share the dynasty’s outline. The note then says the extent is the dynasty’s, not that reign’s. A point is a cited place: where something happened, or a capital, not a territory.</p>
    <p>Uncertainty stays visible. The year bar says when the political sheet is from another year. A sheet more than 30 years away is not drawn. Borders are not invented to fill the gap.</p>
    <h2>Map credits</h2>
    <ul class="credits">
      <li><a href="https://www.openhistoricalmap.org/copyright">OpenHistoricalMap</a> <span>Physical geography and dated context. Contributors keep their own licences. The atlas hides the provider’s political labels.</span></li>
      <li><a href="https://github.com/aourednik/historical-basemaps">historical-basemaps</a> <span>André Ourednik and contributors. GPL-3.0-only. Coarse political sheets, clipped to the subcontinent. These polygons are not part of the traced dataset and are not relicensed.</span></li>
      <li><a href="https://www.naturalearthdata.com/">Natural Earth</a> <span>1:50 million land, public domain. Used as a coast mask so the colour stops at the sea. It is a modern shore, not a historical one.</span></li>
      <li><a href="https://leafletjs.com/">Leaflet</a> and <a href="https://maplibre.org/">MapLibre</a> <span>The map view. No project-wide licence has been chosen for this site’s code.</span></li>
    </ul>
    <h2>Traced outlines</h2>
    <p>Each outline below was traced from a Wikimedia Commons file with a free licence. The tracing is CC BY-SA 4.0 data. That licence is not a licence for the site code.</p>
    <ul class="credits" id="traced-credits">
      ${credits}
    </ul>
    <h2 id="sources">Citation sources</h2>
    <p>These are the works the records cite. A citation supports the claim it is attached to. It is not an independent review of the whole atlas.</p>
    <ul class="credits" id="bibliography">
      ${bibliography}
    </ul>
    <p class="note"><a href="./feedback">Send feedback</a> · <a href="./privacy">Privacy</a></p>`,
  });
}

export function privacyPage() {
  return pageShell({
    title: 'Privacy · History of India',
    description: 'What the feedback form collects, and that this atlas does not use tracking or cookies.',
    body: `
    <p class="eyebrow">Privacy</p>
    <h1>No account, no tracking, no cookies.</h1>
    <p>The atlas does not ask you to sign in. It does not set cookies, and it does not run analytics or advertising.</p>
    <h2>Feedback</h2>
    <p>The feedback form does not send anything to a server. Choosing Send opens your own email app with a message addressed to the atlas author. The message includes what you typed, the page you were on, and the year if one was open.</p>
    <p>Name and email are optional. They are included in that email only if you fill them in. If you do not send the email, nothing leaves your device. This site does not store the form.</p>
    <p>The map may request tiles from OpenHistoricalMap while you use the atlas. That request is made by your browser to OpenHistoricalMap, under their own terms. This site does not add a tracker to it.</p>
    <p class="note"><a href="./about">About and credits</a> · <a href="./feedback">Feedback</a></p>`,
  });
}

export function feedbackPage() {
  return pageShell({
    title: 'Feedback · History of India',
    description: 'Send a note about a year, a place, or a source. No account is needed.',
    body: `
    <p class="eyebrow">Feedback</p>
    <h1>Tell us what to look at next.</h1>
    <p>No account is needed. Send opens your email app. Nothing is stored on this site. <a href="./privacy">Privacy note</a>.</p>
    <form id="feedback-form">
      <label>Name <span>optional</span><input id="feedback-name" name="name" autocomplete="name"></label>
      <label>Email <span>optional</span><input id="feedback-email" name="email" type="email" autocomplete="email"></label>
      <label>Message<textarea id="feedback-message" name="message" required></textarea></label>
      <label>Page<input id="feedback-page" name="page" readonly></label>
      <label>Year<input id="feedback-year" name="year" readonly></label>
      <button type="submit">Send</button>
      <p id="feedback-status" role="status"></p>
    </form>
    <script type="module" src="./src/feedback-form.js"></script>`,
  });
}

export function sitemapXml(origin, paths = ['/', '/about', '/feedback', '/privacy']) {
  const host = String(origin || '').replace(/\/$/, '');
  const urls = paths.map(path => `  <url><loc>${host}${path}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
