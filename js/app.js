/**
 * index.html: puts the content of data/updates.js on the page and makes it easy to move around.
 *
 * WHAT it does, in order:
 *   1. hero: the latest week's card and the at-a-glance progress (js/render.js);
 *   2. the journey road;
 *   3. the updates feed, newest first: the first OPEN_WEEKS weeks open, later ones collapsed to
 *      their header, and anything past VISIBLE_WEEKS behind a "Show older updates" button;
 *   4. the week index (sticky sidebar on wide screens, a "Jump to week" menu on phones), which
 *      marks the week being read;
 *   5. permalinks: index.html#2026-10-04 opens that week (expanding it if needed), scrolls to it
 *      and flashes it; "Copy link" copies that address;
 *   6. area filter chips, which narrow every week's highlights to one area;
 *   7. the screenshot viewer (js/lightbox.js).
 * WHY plain JavaScript: GitHub Pages serves the files as they are, and the page must also open
 * from disk (file://), so there is no build step and no framework.
 */
(function renderUpdatesPage() {
  'use strict';

  /** Weeks shown fully open at the top; older ones start collapsed to their header and summary. */
  const OPEN_WEEKS = 2;
  /** Weeks on the page before "Show older updates"; keeps a long history short to scroll. */
  const VISIBLE_WEEKS = 6;
  /** How long a week opened by its permalink stays highlighted (ms); matches the CSS animation. */
  const TARGET_FLASH_MS = 2400;
  /** How long "Copied" shows on a copy-link button before it reads "Copy link" again (ms). */
  const COPIED_MS = 2000;
  /** The band of the screen (from the top) that decides which week the index marks as current. */
  const READING_BAND = '-25% 0px -65% 0px';

  const data = window.GTS_UPDATES;
  const { render, icons, lightbox } = window.GTS;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  icons.mount(document);
  if (!data || !Array.isArray(data.weeks) || data.weeks.length === 0) {
    document.getElementById('feed').innerHTML = '<p class="empty">No updates yet.</p>';
    return;
  }

  const lookups = render.indexData(data);
  const feed = document.getElementById('feed');

  document.getElementById('latest').innerHTML = render.renderLatest(data.weeks[0]);
  // The card shows the newest week's progress estimates, so the hero and the latest update agree.
  document.getElementById('glance').innerHTML = render.renderGlance(data.roadmap, data.weeks[0].progress);
  document.getElementById('road').innerHTML = render.renderRoadmap(data.roadmap);
  showStopBeingBuilt();
  renderFeed();
  renderWeekIndex();
  renderFilters();
  lightbox.wire(document.getElementById('lightbox'));
  wireWeekLinks();
  wireJumpMenu();
  wireReadingTracker();
  if (window.location.hash) {
    // Opened from a permalink: jump straight there (no animation on arrival), then line it up
    // again once the web font has loaded, because the font changes line heights above the week.
    const linkedId = decodeURIComponent(window.location.hash.slice(1));
    if (revealWeek(linkedId, { instant: true }) && document.fonts) {
      document.fonts.ready.then(() => {
        document.getElementById(linkedId).scrollIntoView({ block: 'start' });
      });
    }
  }

  /**
   * Scrolls a road wider than its panel sideways so the stop being built sits in the middle; the
   * page itself does not move (scrollLeft, never scrollIntoView). WHY: from 960 px the road keeps
   * a minimum width per stop (css/road.css), so with many stops it scrolls, and the stop that
   * matters most would otherwise start off to the right.
   *
   * @example // 15 stops in a 1,120 px panel, 'Alerts' (stop 11) now -> scrolled ~300 px right
   * @example // 15 stops in a 1,500 px panel -> nothing to scroll, nothing changes
   * @example // a phone (vertical road) or a roadmap with no 'now' stop -> nothing changes
   */
  function showStopBeingBuilt() {
    const road = document.querySelector('#road .road');
    const current = road && road.querySelector('[aria-current="step"]');
    if (!current || road.scrollWidth <= road.clientWidth) {
      return;
    }
    const offset = current.getBoundingClientRect().left - road.getBoundingClientRect().left;
    road.scrollLeft += offset - (road.clientWidth - current.offsetWidth) / 2;
  }

  /**
   * Draws every week into the feed, numbered from the oldest (Update 1), plus the "Show older"
   * button when the history is longer than VISIBLE_WEEKS.
   *
   * @example // 1 week  -> one open article, no button
   * @example // 9 weeks -> weeks 1–2 open, 3–6 collapsed, 7–9 hidden; button 'Show 3 older updates'
   */
  function renderFeed() {
    const total = data.weeks.length;
    let html = '';
    data.weeks.forEach((week, index) => {
      html += render.renderWeek(week, {
        ...lookups,
        number: total - index,
        collapsed: index >= OPEN_WEEKS,
      });
    });
    const olderCount = Math.max(0, total - VISIBLE_WEEKS);
    if (olderCount > 0) {
      html += `<button type="button" class="show-older" data-show-older>${icons.svg('chevron-down')}
                 <span>Show ${olderCount} older update${olderCount === 1 ? '' : 's'}</span></button>`;
    }
    feed.innerHTML = html;
    feed.querySelectorAll('[data-week]').forEach((article, index) => {
      article.tabIndex = -1;
      if (index >= VISIBLE_WEEKS) {
        article.hidden = true;
        article.dataset.older = '';
      }
    });

    feed.addEventListener('click', (event) => {
      const expand = event.target.closest('.week__expand');
      if (expand) {
        expandWeek(expand.closest('[data-week]'));
        return;
      }
      if (event.target.closest('[data-show-older]')) {
        showOlderWeeks();
        return;
      }
      const copy = event.target.closest('[data-copy-link]');
      if (copy) {
        copyWeekLink(copy);
      }
    });
  }

  /**
   * Opens a collapsed week: shows its body and removes the expand button.
   *
   * @param {HTMLElement} article A [data-week] article.
   * @example expandWeek(document.getElementById('2026-09-13'));  // body visible, button gone
   * @example expandWeek(document.getElementById('2026-10-04'));  // already open: nothing changes
   */
  function expandWeek(article) {
    if (!article.classList.contains('is-collapsed')) {
      return;
    }
    article.classList.remove('is-collapsed');
    article.querySelector('.week__body').hidden = false;
    const button = article.querySelector('.week__expand');
    if (button) {
      button.remove();
    }
  }

  /** Reveals every week hidden behind "Show older updates" and removes that button. */
  function showOlderWeeks() {
    feed.querySelectorAll('[data-older]').forEach((article) => {
      article.hidden = false;
    });
    const button = feed.querySelector('[data-show-older]');
    if (button) {
      button.remove();
    }
  }

  /**
   * Opens the week a permalink names, scrolls to it and flashes it. Unknown ids do nothing, so
   * ordinary anchors (#journey) keep their normal behaviour.
   *
   * @param {string} id A week id from the address, e.g. '2026-10-04'.
   * @param {{instant?: boolean}} [options] `instant` jumps without the smooth scroll (page load).
   * @returns {boolean} True when the id was a week.
   * @example revealWeek('2026-10-04');  // smooth-scrolls to the week and flashes it -> true
   * @example revealWeek('2026-08-16', { instant: true });
   *          // an old, hidden, collapsed week: shown, expanded, jumped to -> true
   * @example revealWeek('journey');     // not a week -> false; the browser handles it
   */
  function revealWeek(id, options = {}) {
    const article = document.getElementById(id);
    if (!article || !article.matches('[data-week]')) {
      return false;
    }
    if (article.hidden && 'older' in article.dataset) {
      showOlderWeeks();
    }
    if (article.classList.contains('is-filtered-out')) {
      applyFilter(null);
    }
    expandWeek(article);
    const smooth = !options.instant && !reducedMotion.matches;
    article.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
    article.focus({ preventScroll: true });
    article.classList.remove('is-target');
    // Force a reflow so re-adding the class restarts the flash when the same week is opened twice.
    void article.offsetWidth;
    article.classList.add('is-target');
    window.setTimeout(() => article.classList.remove('is-target'), TARGET_FLASH_MS);
    return true;
  }

  /**
   * Same-page links to a week (hero card, index, week titles) reveal the week instead of the
   * browser's plain jump, and keep the address bar on the permalink. Back/forward also reveal.
   */
  function wireWeekLinks() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || event.metaKey || event.ctrlKey || event.shiftKey) {
        return;
      }
      const id = decodeURIComponent(link.getAttribute('href').slice(1));
      if (!document.getElementById(id) || !document.getElementById(id).matches('[data-week]')) {
        return;
      }
      event.preventDefault();
      if (window.location.hash !== `#${id}`) {
        window.history.pushState(null, '', `#${id}`);
      }
      const jump = link.closest('details');
      if (jump) {
        jump.open = false;
      }
      revealWeek(id);
    });
    window.addEventListener('hashchange', () => revealWeek(decodeURIComponent(window.location.hash.slice(1))));
  }

  /**
   * The phone "Jump to week" menu is a native <details>, which stays open until its own button is
   * pressed again. As a menu it should also close on a tap anywhere else (it covers the filter
   * chips) and on Escape, which returns focus to the button.
   *
   * @example // menu open, tap a filter chip  -> menu closes
   * @example // menu open, tap inside the list -> stays open until a week link is chosen
   * @example // menu open, Escape              -> closes; focus back on "Jump to week"
   */
  function wireJumpMenu() {
    const menu = document.querySelector('.jump');
    document.addEventListener('click', (event) => {
      if (menu.open && !menu.contains(event.target)) {
        menu.open = false;
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.open) {
        menu.open = false;
        menu.querySelector('summary').focus();
      }
    });
  }

  /**
   * Copies the week's permalink and confirms on the button for COPIED_MS.
   * The Clipboard API needs a secure page; from file:// or an old browser a hidden text field and
   * the older copy command do the job instead.
   *
   * @param {HTMLButtonElement} button A [data-copy-link="2026-10-04"] button.
   * @example copyWeekLink(button);  // clipboard: 'https://gts-dev1.github.io/GTS-updates/#2026-10-04'
   * @example copyWeekLink(button);  // opened from disk: 'file:///C:/…/index.html#2026-10-04'
   */
  function copyWeekLink(button) {
    const url = `${window.location.href.split('#')[0]}#${button.dataset.copyLink}`;
    const label = button.querySelector('span');
    const confirm = (text) => {
      label.textContent = text;
      window.setTimeout(() => {
        label.textContent = 'Copy link';
      }, COPIED_MS);
    };
    const fallback = () => {
      const field = document.createElement('textarea');
      field.value = url;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.append(field);
      field.select();
      const copied = document.execCommand('copy');
      field.remove();
      confirm(copied ? 'Copied' : 'Copy failed');
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => confirm('Copied'), fallback);
    } else {
      fallback();
    }
  }

  /**
   * The week index: a sticky list on wide screens and a "Jump to week" menu on phones, both
   * built from the same list items.
   *
   * @example // 1 week -> one entry: '4 Oct' · 'The app runs on a real phone'
   */
  function renderWeekIndex() {
    const items = data.weeks
      .map(
        (week) => `
          <li><a href="#${render.escapeHtml(week.id)}" data-index-link="${render.escapeHtml(week.id)}">
            <span class="index__date">${render.escapeHtml(render.shortDate(week.id))}</span>
            <span class="index__title">${render.escapeHtml(week.title)}</span>
          </a></li>`,
      )
      .join('');
    document.getElementById('week-index-list').innerHTML = items;
    document.getElementById('jump-list').innerHTML = items;
    document.getElementById('jump-count').textContent = `${data.weeks.length}`;
  }

  /**
   * Marks the week being read in both indexes, using the band READING_BAND of the screen.
   */
  function wireReadingTracker() {
    if (!('IntersectionObserver' in window)) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          for (const link of document.querySelectorAll('[data-index-link]')) {
            if (link.dataset.indexLink === entry.target.id) {
              link.setAttribute('aria-current', 'true');
            } else {
              link.removeAttribute('aria-current');
            }
          }
        }
      },
      { rootMargin: READING_BAND },
    );
    feed.querySelectorAll('[data-week]').forEach((article) => observer.observe(article));
  }

  /**
   * The area chips: "All" plus one per area in data.areas. Pressing one narrows the highlights.
   */
  function renderFilters() {
    const chips = [{ id: '', label: 'All' }, ...(data.areas || [])]
      .map(
        (area) =>
          `<button type="button" class="chip" data-area="${render.escapeHtml(area.id)}" aria-pressed="${area.id === ''}">${render.escapeHtml(area.label)}</button>`,
      )
      .join('');
    const host = document.getElementById('filters');
    host.innerHTML = chips;
    host.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-area]');
      if (chip) {
        applyFilter(chip.dataset.area || null);
      }
    });
  }

  /**
   * Shows only the highlights tagged with `areaId` (null = everything). A week with no matching
   * highlight leaves the feed; each remaining week says how many of its highlights match, and the
   * status line under the chips sums it up for screen readers too.
   *
   * @param {string|null} areaId e.g. 'drivers'.
   * @example applyFilter('drivers');  // 4 October: 1 of 6 highlights; status '1 highlight in 1 update'
   * @example applyFilter('safety');   // 2 of 6 highlights
   * @example applyFilter(null);       // everything back; status cleared
   */
  function applyFilter(areaId) {
    const areaLabel = areaId && lookups.areasById[areaId] ? lookups.areasById[areaId].label : '';
    let matchingHighlights = 0;
    let matchingWeeks = 0;
    for (const article of feed.querySelectorAll('[data-week]')) {
      const cards = article.querySelectorAll('.highlight');
      let matches = 0;
      for (const card of cards) {
        const tagged = !areaId || card.dataset.tags.split(' ').includes(areaId);
        card.hidden = !tagged;
        matches += tagged ? 1 : 0;
      }
      article.classList.toggle('is-filtered-out', Boolean(areaId) && matches === 0);
      const note = article.querySelector('.week__filtered');
      note.hidden = !areaId || matches === 0;
      note.textContent = areaId ? `Showing ${matches} of ${cards.length} highlights about ${areaLabel}` : '';
      matchingHighlights += matches;
      matchingWeeks += matches > 0 ? 1 : 0;
    }
    for (const chip of document.querySelectorAll('#filters [data-area]')) {
      chip.setAttribute('aria-pressed', String((chip.dataset.area || null) === areaId));
    }
    const status = document.getElementById('filter-status');
    if (!areaId) {
      status.textContent = '';
    } else if (matchingHighlights === 0) {
      status.textContent = `Nothing about ${areaLabel} yet.`;
    } else {
      status.textContent =
        `${matchingHighlights} highlight${matchingHighlights === 1 ? '' : 's'} about ${areaLabel} ` +
        `in ${matchingWeeks} update${matchingWeeks === 1 ? '' : 's'}`;
    }
  }
})();
