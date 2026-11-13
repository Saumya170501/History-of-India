// Phone evidence sheet. Heights are pixels above the year bar.
// Peek and half leave the map and the year on screen. Full covers the map.

export function sheetHeights(viewportHeight, { header = 56, timeline = 236, peek = 88 } = {}) {
  const room = Math.max(peek, Math.round(viewportHeight - header - timeline));
  const half = Math.min(room, Math.max(peek, Math.round(room * 0.5)));
  return { peek, half, full: room };
}

export function nearestSnap(height, heights) {
  const points = [
    ['peek', heights.peek],
    ['half', heights.half],
    ['full', heights.full],
  ];
  return points.reduce((best, item) =>
    Math.abs(item[1] - height) < Math.abs(best[1] - height) ? item : best)[0];
}

export function nextSnap(current, direction) {
  const order = ['peek', 'half', 'full'];
  const index = Math.max(0, order.indexOf(current));
  const next = index + (direction < 0 ? -1 : 1);
  return order[Math.min(order.length - 1, Math.max(0, next))];
}
