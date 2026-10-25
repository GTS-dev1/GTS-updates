/**
 * The single-update page (update.html, 25 October 2026): one update, fully open, the link to share.
 *
 * WHAT it draws, from the address:
 *   - update.html?id=2026-10-25 -> that update, as on the main page, with Newer and Older in its
 *     pinned bar and "Read the update before" at its end — each to that update's own page;
 *   - no id, or one no update has -> "Which update?" and every update as a link.
 * WHO opens it: the link a reader copies with "Copy link" (js/share-link.js), and Newer / Older.
 */
(function renderSingleUpdatePage() {
  'use strict';

  const data = window.GTS_UPDATES;
  const { render, icons, lightbox, shareLink } = window.GTS;
  const host = document.getElementById('single');
  const weeks = data && Array.isArray(data.weeks) ? data.weeks : [];
  const wanted = new URLSearchParams(window.location.search).get('id');
  const index = weeks.findIndex((week) => week.id === wanted);

  icons.mount(document);
  if (index < 0) {
    showEveryUpdate();
  } else {
    showUpdate(index);
  }
  lightbox.wire(document.getElementById('lightbox'));
  host.addEventListener('click', (event) => {
    const copy = event.target.closest('[data-copy-link]');
    if (copy) {
      shareLink.copy(copy);
    }
  });

  /**
   * Draws update weeks[index], numbered as on the main page (the oldest is Update 1), and names
   * the page after it.
   *
   * @param {number} index Its place in data.weeks (0 = the newest).
   * @example showUpdate(0);  // 'Update 5: A safer SOS from start to finish… — GTS'; bar: Latest · Older
   * @example showUpdate(4);  // 'Update 1: The app runs on a real phone — GTS'; bar: Newer;
   *                          // end: "This is the first update."
   */
  function showUpdate(index) {
    const total = weeks.length;
    const week = weeks[index];
    const neighbour = (at) =>
      weeks[at] ? { id: weeks[at].id, number: total - at, dateLabel: weeks[at].dateLabel } : null;
    host.innerHTML = render.renderWeek(week, {
      ...render.indexData(data),
      number: total - index,
      collapsed: false,
      isLatest: index === 0,
      older: neighbour(index + 1),
      newer: neighbour(index - 1),
      linkTo: (id) => shareLink.linkTo(id),
    });
    document.title = `Update ${total - index}: ${week.title} — GTS`;
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute('content', week.summary);
    }
    // "All updates" returns to this update's place in the list.
    document.getElementById('single-back').href = `index.html#${encodeURIComponent(week.id)}`;
  }

  /**
   * No update named (or a link to one since removed): every update as a link to its own page.
   *
   * @example showEveryUpdate();  // 'Which update?' then 'Update 5 · 24–25 October 2026 · A safer SOS…', …
   */
  function showEveryUpdate() {
    const total = weeks.length;
    const items = weeks
      .map(
        (week, at) => `
          <li><a href="${render.escapeHtml(shareLink.linkTo(week.id))}">
            <span class="single__pick-meta">Update ${total - at} · ${render.escapeHtml(week.dateLabel)}</span>
            <span class="single__pick-title">${render.escapeHtml(week.title)}</span>
          </a></li>`,
      )
      .join('');
    host.innerHTML = `
      <h1 class="single__pick-heading">Which update?</h1>
      <p class="section-sub">${wanted ? 'That update is not here.' : 'Choose one to read.'}</p>
      <ol class="single__pick">${items}</ol>`;
  }
})();
