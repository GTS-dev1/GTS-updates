/**
 * The renderer: turns the content of data/updates.js into HTML strings. It does not touch the page
 * and keeps no state, so the same functions draw index.html (via js/app.js) and the live preview in
 * compose.html (via js/compose.js); a preview therefore always looks exactly like the real page.
 *
 * Every piece of content text goes through `escapeHtml`, so a quote or "<" in an update can never
 * break the markup.
 */
(function defineRenderer(root) {
  'use strict';

  const icons = root.GTS.icons;
  /** The shared escaper (js/escape-html.js); also offered below as GTS.render.escapeHtml. */
  const escapeHtml = root.GTS.escapeHtml;
  /** Screenshots, videos and their sections (js/gallery.js). */
  const gallery = root.GTS.gallery;

  /** Short month names for the week index, e.g. '4 Oct'. Index = month number - 1. */
  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  /** Long month names for a generated date label, e.g. 'Week ending 11 October 2026'. */
  const MONTHS_LONG = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  /** What each roadmap status says on the page. */
  const STATUS_LABELS = {
    done: 'Done',
    now: 'Building now',
    next: 'Next',
    planned: 'Planned',
    later: 'Later',
  };

  /**
   * A week id as a short date for the week index.
   *
   * @param {string} id yyyy-mm-dd.
   * @returns {string}
   * @example shortDate('2026-10-04');  // -> '4 Oct'
   * @example shortDate('2026-12-27');  // -> '27 Dec'
   * @example shortDate('soon');        // -> 'soon'   not a date: shown as written
   */
  function shortDate(id) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(id || '');
    return match ? `${Number(match[3])} ${MONTHS_SHORT[Number(match[2]) - 1]}` : String(id || '');
  }

  /**
   * A week's date label made short for the pinned bar: month names cut to three letters, the year
   * dropped. WHY: on a phone the full label pushed Newer / Older onto a second line, and the bar
   * stays pinned over the update, so every line it takes is a line less of the update.
   *
   * @param {string} label The week's dateLabel.
   * @returns {string}
   * @example compactDate('24–25 October 2026');           // -> '24–25 Oct'
   * @example compactDate('Week ending 18 October 2026');  // -> 'Week ending 18 Oct'
   * @example compactDate('30 September – 1 October 2026'); // -> '30 Sep – 1 Oct'
   * @example compactDate('Soon');                          // -> 'Soon'   nothing to shorten
   */
  function compactDate(label) {
    let short = String(label || '');
    MONTHS_LONG.forEach((month, index) => {
      short = short.replace(new RegExp(`\\b${month}\\b`, 'g'), MONTHS_SHORT[index]);
    });
    return short.replace(/\s+\d{4}$/, '');
  }

  /**
   * The standard date label for a week id; compose.html fills it in for the writer.
   *
   * @param {string} id yyyy-mm-dd.
   * @returns {string}
   * @example weekLabel('2026-10-11');  // -> 'Week ending 11 October 2026'
   * @example weekLabel('2027-01-03');  // -> 'Week ending 3 January 2027'
   * @example weekLabel('');            // -> ''
   */
  function weekLabel(id) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(id || '');
    return match ? `Week ending ${Number(match[3])} ${MONTHS_LONG[Number(match[2]) - 1]} ${match[1]}` : '';
  }

  /**
   * Splits the roadmap into the road to the pilot and the features after it, with counts the hero
   * and the road both use.
   *
   * @param {{phases: object[]}} roadmap
   * @returns {{road: object[], later: object[], doneCount: number, current: object|undefined, next: object|undefined}}
   * @example summariseRoadmap(window.GTS_UPDATES.roadmap);
   *          // -> { road: [10 phases], later: [7 phases], doneCount: 2,
   *          //      current: { id: 'driver-setup', ... }, next: { id: 'gts-review', ... } }
   * @example summariseRoadmap({ phases: [] });  // -> { road: [], later: [], doneCount: 0, current: undefined, next: undefined }
   */
  function summariseRoadmap(roadmap) {
    const summary = { road: [], later: [], doneCount: 0, current: undefined, next: undefined };
    for (const phase of (roadmap && roadmap.phases) || []) {
      if (phase.status === 'later') {
        summary.later.push(phase);
        continue;
      }
      summary.road.push(phase);
      if (phase.status === 'done') {
        summary.doneCount += 1;
      } else if (phase.status === 'now') {
        summary.current = phase;
      } else if (phase.status === 'next') {
        summary.next = phase;
      }
    }
    return summary;
  }

  /**
   * A week's honest progress estimates as figures with labels, and the line saying how they are
   * measured. Drawn at the top of the week body and, for the newest week, on the hero's card.
   *
   * @param {{estimates: {label: string, value: string}[], note: string}|undefined} progress
   * @returns {string} '' when the week has no estimates.
   * @example renderEstimates(window.GTS_UPDATES.weeks[0].progress);
   *          // <div class="estimates"> 'about 40–45%' First release (pilot) · 'about 25%' Whole product,
   *          // then 'Only features working for families on real phones count as done'
   * @example renderEstimates({ estimates: [{ label: 'Whole product', value: 'about 30%' }], note: '…' });
   *          // one figure and the note
   * @example renderEstimates(undefined);  // -> ''   older weeks have no estimates
   */
  function renderEstimates(progress) {
    if (!progress || !Array.isArray(progress.estimates) || progress.estimates.length === 0) {
      return '';
    }
    const figures = progress.estimates
      .map(
        (estimate) => `
          <div class="estimates__item">
            <dt>${escapeHtml(estimate.label)}</dt>
            <dd>${escapeHtml(estimate.value)}</dd>
          </div>`,
      )
      .join('');
    const note = progress.note ? `<p class="estimates__note">${escapeHtml(progress.note)}</p>` : '';
    return `<div class="estimates"><dl class="estimates__list">${figures}</dl>${note}</div>`;
  }

  /**
   * The hero's at-a-glance card: stops done out of the road's total, a segmented bar (one segment
   * per stop), the newest week's progress estimates (when it has them), what is being built now
   * and what comes next.
   *
   * @param {{phases: object[]}} roadmap
   * @param {object} [progress] The newest week's `progress`.
   * @returns {string}
   * @example renderGlance(window.GTS_UPDATES.roadmap, window.GTS_UPDATES.weeks[0].progress);
   *          // '5 of 10 stops done', 10 segments (5 done, 1 now, 4 to go), 'about 40–45%' and 'about 25%'
   *          // with their note, 'Building now: Live trips', 'Next: Alerts'
   * @example renderGlance(window.GTS_UPDATES.roadmap);
   *          // the same card without the estimates
   */
  function renderGlance(roadmap, progress) {
    const summary = summariseRoadmap(roadmap);
    const segments = summary.road
      .map((phase) => `<span class="glance__segment" data-status="${escapeHtml(phase.status)}" title="${escapeHtml(phase.label)}"></span>`)
      .join('');
    const row = (label, phase, status) =>
      phase
        ? `<div class="glance__row" data-status="${status}">
             <dt>${label}</dt>
             <dd>${icons.svg(phase.icon)}<span>${escapeHtml(phase.label)}</span></dd>
           </div>`
        : '';
    return `
      <p class="glance__eyebrow">Progress to the pilot</p>
      <p class="glance__count"><strong>${summary.doneCount}</strong><span>of ${summary.road.length} stops done</span></p>
      <div class="glance__bar" role="img" aria-label="${summary.doneCount} of ${summary.road.length} stops done">${segments}</div>
      ${renderEstimates(progress)}
      <dl class="glance__rows">
        ${row('Building now', summary.current, 'now')}
        ${row('Next', summary.next, 'next')}
        <div class="glance__row" data-status="later">
          <dt>After the pilot</dt>
          <dd>${icons.svg('sparkle')}<span>${summary.later.length} more features</span></dd>
        </div>
      </dl>`;
  }

  /**
   * The hero's "latest update" card: date, title, summary and the week's cover picture in a small
   * phone frame (its `cover`, else the first screenshot, else the first video's poster). Links to
   * the week's permalink.
   *
   * @param {object} week The newest week.
   * @param {{resolveSrc?: (src: string) => string}} [options] compose.html passes `resolveSrc` to
   *   show a picked file before it is in the assets folder.
   * @returns {string}
   * @example renderLatest(window.GTS_UPDATES.weeks[0]);
   *          // <a class="latest" href="#2026-10-18"> 'Latest · Week ending 18 October 2026',
   *          // 'Live trips, parents joining…', a phone with its cover j6-20-home-trip-in-progress.jpg
   * @example renderLatest(weekWithoutCover);  // the phone shows the first screenshot instead
   * @example renderLatest({ ...week, gallery: [], cover: undefined });  // the same card without the phone
   */
  function renderLatest(week, options = {}) {
    const resolveSrc = options.resolveSrc || ((src) => src);
    const cover = gallery.coverSrc(week);
    const phone = cover
      ? `<span class="latest__phone device device--mini" aria-hidden="true"><span class="device__screen">
           <img src="${escapeHtml(resolveSrc(cover))}" alt="" decoding="async" /></span></span>`
      : '';
    return `
      <a class="latest" href="#${escapeHtml(week.id)}">
        <span class="latest__text">
          <span class="latest__eyebrow"><span class="pill pill--live">Latest</span><time datetime="${escapeHtml(week.id)}">${escapeHtml(week.dateLabel)}</time></span>
          <span class="latest__title">${escapeHtml(week.title)}</span>
          <span class="latest__summary">${escapeHtml(week.summary)}</span>
          <span class="latest__cta">Read the update ${icons.svg('arrow')}</span>
        </span>
        ${phone}
      </a>`;
  }

  /**
   * The journey road: every stop to the pilot as a list item on a road, lit up to the stop being
   * built, then the features after the pilot as a grid. CSS draws the road horizontally on wide
   * screens and vertically on phones; `--stops` sets the number of columns. A stop's status is
   * shown as a pill ('Building now', 'Next') or, for the others, as text for screen readers only.
   *
   * @param {{phases: object[]}} roadmap
   * @returns {string}
   * @example renderRoadmap(window.GTS_UPDATES.roadmap);
   *          // <ol class="road" style="--stops: 10"> with stop 3 (Driver setup) 'Building now',
   *          // then 'After the pilot' with 7 cards
   * @example renderRoadmap({ phases: everyPhaseDone });  // every stop green with a check; no pill
   */
  function renderRoadmap(roadmap) {
    const summary = summariseRoadmap(roadmap);
    const count = summary.road.length;
    const stops = summary.road
      .map((phase, index) => {
        const isGoal = index === count - 1;
        const markerIcon = phase.status === 'done' ? 'check' : phase.status === 'now' ? 'van' : isGoal ? 'flag' : phase.icon;
        const pill =
          phase.status === 'now' || phase.status === 'next'
            ? `<span class="pill pill--${phase.status}">${STATUS_LABELS[phase.status]}</span>`
            : `<span class="visually-hidden">(${STATUS_LABELS[phase.status] || ''})</span>`;
        return `
          <li class="stop" data-status="${escapeHtml(phase.status)}"${isGoal ? ' data-goal' : ''}${phase.status === 'now' ? ' aria-current="step"' : ''}>
            <span class="stop__marker">${icons.svg(markerIcon)}</span>
            <span class="stop__text">
              <span class="stop__label">${escapeHtml(phase.label)}</span>
              <span class="stop__detail">${escapeHtml(phase.detail)}</span>
              ${pill}
            </span>
          </li>`;
      })
      .join('');
    const later = summary.later
      .map(
        (phase) => `
          <li class="later__item">
            <span class="later__icon">${icons.svg(phase.icon)}</span>
            <span><span class="later__label">${escapeHtml(phase.label)}</span>
            <span class="later__detail">${escapeHtml(phase.detail)}</span></span>
          </li>`,
      )
      .join('');
    return `
      <ol class="road" style="--stops: ${count}">${stops}</ol>
      ${later ? `<div class="later"><h3 class="later__title">After the pilot <span>from the full product plan</span></h3><ul class="later__grid">${later}</ul></div>` : ''}`;
  }

  /**
   * One week as an <article>: header (number, date, phase, title, summary, link), then the body
   * (progress estimates, highlights, the gallery from js/gallery.js, feature image, coming next). A collapsed week
   * hides its body behind a "Show the full week" button; js/app.js wires that button.
   *
   * @param {object} week An entry from data/updates.js.
   * @param {{number: number, areasById: object, phasesById: object, collapsed?: boolean,
   *          resolveSrc?: (src: string) => string, isLatest?: boolean,
   *          older?: {id: string, number: number, dateLabel: string}|null,
   *          newer?: {id: string, number: number, dateLabel: string}|null,
   *          linkTo?: (id: string) => string, pageOf?: (id: string) => string}} context
   *   `number` is the update's count from the first one (the oldest is 1); `resolveSrc` lets the
   *   compose preview show a picked file before it is in the assets folder; `isLatest` marks the
   *   newest update; `older` is the update after this one on the page (`null` for the first one
   *   ever; leave it out in the compose preview); `newer` (the single-update page only) the one
   *   before it; `linkTo` makes the address of another update — `#2026-10-20` on the main page
   *   (the default), `update.html?id=2026-10-20` on the single-update page; `pageOf` (the main
   *   page only) makes an update's own-page address: its title then links there, beside an
   *   "Open as a page" button (Teja, 25 October: "from the main page to particular update page
   *   how to go").
   *
   * WHY the bar, the contents row and the end (Teja, 25 October 2026: "difficult to understand
   * where to where the updates to be read"): an update runs to thousands of pixels on a phone, and
   * the weeks ran into each other under a thin line. Now a bar pinned under the top bar always
   * says which update you are in (and links to the older one), a contents row jumps to its parts,
   * and an end block closes it with the way on.
   * @returns {string}
   * @example renderWeek(weeks[0], { number: 1, areasById, phasesById });
   *          // <article class="week" id="2026-10-04"> 'Update 1', 'Week ending 4 October 2026',
   *          // 'Foundation', 6 highlight cards, 6 phones, the wide sky image, 3 'Coming next' items
   * @example renderWeek(weeks[3], { number: 2, areasById, phasesById, collapsed: true });
   *          // the same header; body hidden; button 'Show the full week · 6 highlights · 4 screenshots'
   * @example renderWeek(weekWithVideos, { number: 4, areasById, phasesById, collapsed: true });
   *          // button 'Show the full week · 9 highlights · 82 screenshots · 2 videos'
   * @example renderWeek({ ...week, gallery: [], feature: undefined }, context);
   *          // no gallery block at all, not an empty one
   */
  function renderWeek(week, context) {
    const resolveSrc = context.resolveSrc || ((src) => src);
    const id = escapeHtml(week.id);
    const phase = week.phase && context.phasesById[week.phase];
    const highlights = week.highlights || [];

    const highlightCards = highlights
      .map((item) => {
        const tags = item.tags || [];
        const tagLabels = tags
          .map((tag) => (context.areasById[tag] ? context.areasById[tag].label : tag))
          .map((label) => `<li>${escapeHtml(label)}</li>`)
          .join('');
        return `
          <li class="highlight" data-tags="${escapeHtml(tags.join(' '))}">
            <span class="highlight__icon">${icons.svg(item.icon)}</span>
            <h4 class="highlight__title">${escapeHtml(item.title)}</h4>
            <p class="highlight__text">${escapeHtml(item.text)}</p>
            ${tagLabels ? `<ul class="highlight__tags" aria-label="Areas">${tagLabels}</ul>` : ''}
          </li>`;
      })
      .join('');

    const galleryBlock = gallery.renderGallery(week, { resolveSrc });

    const feature = week.feature
      ? `<figure class="feature">
           <button type="button" class="feature__frame" data-shot data-src="${escapeHtml(resolveSrc(week.feature.src))}"
                   data-caption="${escapeHtml(week.feature.caption)}" data-alt="${escapeHtml(week.feature.alt || week.feature.caption)}"
                   aria-label="View larger: ${escapeHtml(week.feature.caption)}">
             <img src="${escapeHtml(resolveSrc(week.feature.src))}" alt="${escapeHtml(week.feature.alt || week.feature.caption)}" loading="lazy" decoding="async" />
             <span class="feature__zoom">${icons.svg('expand')}</span>
           </button>
           <figcaption>${escapeHtml(week.feature.caption)}</figcaption>
         </figure>`
      : '';

    const next = (week.next || []).length
      ? `<aside class="next" id="next-${id}" aria-label="Coming next">
           <h4 class="next__title">${icons.svg('route')} Coming next</h4>
           <ul class="next__list">${week.next.map((item) => `<li>${icons.svg('chevron-right')}<span>${escapeHtml(item)}</span></li>`).join('')}</ul>
         </aside>`
      : '';

    // The parts of the update, for the contents row: only those it has.
    const parts = [
      highlights.length ? { href: `#new-${id}`, label: `What's new (${highlights.length})` } : null,
      galleryBlock || feature ? { href: `#media-${id}`, label: 'Pictures and video' } : null,
      next ? { href: `#next-${id}`, label: 'Coming next' } : null,
    ].filter(Boolean);
    const contents = parts.length > 1
      ? `<nav class="week__contents" aria-label="In Update ${context.number}">
           <span class="week__contents-label">In this update</span>
           ${parts.map((part) => `<a href="${part.href}">${escapeHtml(part.label)}</a>`).join('')}
         </nav>`
      : '';
    // The update's own page (main page: update.html?id=…); on that page itself, its own anchor.
    const ownPage = context.pageOf ? context.pageOf(week.id) : `#${week.id}`;
    const latestBadge = context.isLatest ? '<span class="pill pill--live week__latest">Latest</span>' : '';
    const linkTo = context.linkTo || ((weekId) => `#${weekId}`);
    const older = context.older;
    const newer = context.newer;
    const newerLink = newer
      ? `<a class="week__bar-step" href="${escapeHtml(linkTo(newer.id))}">${icons.svg('chevron-left')} Newer</a>`
      : '';
    const olderLink = older
      ? `<a class="week__bar-step week__bar-older" href="${escapeHtml(linkTo(older.id))}">Older ${icons.svg(newer === undefined ? 'chevron-down' : 'chevron-right')}</a>`
      : '';
    const end = older === undefined
      ? ''
      : `<footer class="week__end">
           <p class="week__end-label">End of Update ${context.number} · ${escapeHtml(week.dateLabel)}</p>
           ${older
             ? `<a class="week__end-next" href="${escapeHtml(linkTo(older.id))}">
                  <span>Read the update before: <strong>Update ${older.number}</strong> · ${escapeHtml(older.dateLabel)}</span>
                  ${icons.svg(newer === undefined ? 'chevron-down' : 'chevron-right')}</a>`
             : '<p class="week__end-first">This is the first update.</p>'}
           <a class="week__end-top" href="#${id}">Back to the start of Update ${context.number}</a>
         </footer>`;

    const mediaLabel = gallery.mediaCountLabel(week.gallery, week.feature);
    const expandLabel =
      `Show the full week · ${highlights.length} highlight${highlights.length === 1 ? '' : 's'}` +
      (mediaLabel ? ` · ${mediaLabel}` : '');

    return `
      <article class="week${context.collapsed ? ' is-collapsed' : ''}${context.isLatest ? ' is-latest' : ''}" id="${id}" data-week aria-labelledby="title-${id}">
        <div class="week__bar">
          <span class="week__number">Update ${context.number}</span>
          <time datetime="${id}" title="${escapeHtml(week.dateLabel)}">${escapeHtml(compactDate(week.dateLabel))}</time>
          ${latestBadge}
          <span class="week__bar-steps">${newerLink}${olderLink}</span>
        </div>
        <header class="week__head">
          <div class="week__meta">
            ${phase ? `<span class="week__phase">${icons.svg(phase.icon)}${escapeHtml(phase.label)}</span>` : ''}
          </div>
          <h3 class="week__title" id="title-${id}"><a href="${escapeHtml(ownPage)}">${escapeHtml(week.title)}</a></h3>
          <p class="week__summary">${escapeHtml(week.summary)}</p>
          ${contents}
          <div class="week__actions">
            ${context.pageOf ? `<a class="week__open" href="${escapeHtml(ownPage)}">${icons.svg('arrow')}<span>Open as a page</span></a>` : ''}
            <button type="button" class="week__copy" data-copy-link="${id}">${icons.svg('link')}<span>Copy link</span></button>
          </div>
        </header>
        <div class="week__body" id="body-${id}"${context.collapsed ? ' hidden' : ''}>
          ${renderEstimates(week.progress)}
          ${highlightCards ? `<ul class="highlights" id="new-${id}">${highlightCards}</ul>` : ''}
          <p class="week__filtered" hidden></p>
          ${galleryBlock || feature ? `<div class="week__media" id="media-${id}">${galleryBlock}${feature}</div>` : ''}
          ${next}
          ${end}
        </div>
        ${context.collapsed ? `<button type="button" class="week__expand" aria-expanded="false" aria-controls="body-${id}">${icons.svg('chevron-down')}<span>${escapeHtml(expandLabel)}</span></button>` : ''}
      </article>`;
  }

  /**
   * Lookup tables the week renderer needs, built once from the data.
   *
   * @param {object} data window.GTS_UPDATES.
   * @returns {{areasById: object, phasesById: object}}
   * @example indexData(window.GTS_UPDATES).areasById.safety.label;           // -> 'Safety & privacy'
   * @example indexData(window.GTS_UPDATES).phasesById['driver-setup'].status; // -> 'now'
   * @example indexData({}).areasById;                                         // -> {}
   */
  function indexData(data) {
    const areasById = {};
    const phasesById = {};
    for (const area of data.areas || []) {
      areasById[area.id] = area;
    }
    for (const phase of (data.roadmap && data.roadmap.phases) || []) {
      phasesById[phase.id] = phase;
    }
    return { areasById, phasesById };
  }

  root.GTS.render = {
    escapeHtml,
    shortDate,
    weekLabel,
    compactDate,
    summariseRoadmap,
    renderGlance,
    renderEstimates,
    renderLatest,
    renderRoadmap,
    renderWeek,
    indexData,
  };
})(window);
