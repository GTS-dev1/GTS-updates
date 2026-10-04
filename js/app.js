/**
 * GTS updates — renders window.GTS_UPDATES (data/updates.js) into the page.
 *
 * WHAT it does, in order: sets the living sky and greeting for the visitor's time of day, draws the
 * roadmap ribbon, renders every week (newest first), and wires the screenshot lightbox.
 * WHY plain JavaScript: GitHub Pages serves the files as they are — no build step to keep working.
 */
(function renderUpdatesPage() {
  'use strict';

  /** Sky phases by local hour — the same boundaries as the GTS app's living sky. */
  const SKY_PHASES = [
    { name: 'dawn', fromHour: 5, greeting: 'Good morning', icon: 'icon-sun' },
    { name: 'day', fromHour: 8, greeting: 'Good day', icon: 'icon-sun' },
    { name: 'dusk', fromHour: 16, greeting: 'Good evening', icon: 'icon-sun' },
    { name: 'night', fromHour: 19, greeting: 'Good night', icon: 'icon-moon' },
  ];

  /** Roadmap drawing size (SVG user units); the SVG scales to the page width. */
  const ROADMAP_WIDTH = 1000;
  const ROADMAP_HEIGHT = 190;
  const ROAD_Y = 70;
  const ROAD_BEND = 34;
  const NODE_RADIUS = 11;
  const VAN_RADIUS = 18;
  const LABEL_GAP = 44;
  const DETAIL_GAP = 19;
  const SIDE_INSET = 40;

  const data = window.GTS_UPDATES;
  if (!data) {
    return;
  }

  applyLivingSky(new Date());
  renderRoadmap(document.getElementById('roadmap'), data.roadmap);
  renderWeeks(document.getElementById('weeks'), data.weeks);
  wireLightbox(document.getElementById('lightbox'));

  /**
   * Picks the sky phase for a local time and applies it: `data-sky` on <html> and the greeting.
   *
   * @param {Date} now The visitor's current time.
   * @example applyLivingSky(new Date(2026, 9, 5, 7, 30));  // data-sky="dawn", "Good morning"
   * @example applyLivingSky(new Date(2026, 9, 5, 21, 0));  // data-sky="night", "Good night"
   * @example applyLivingSky(new Date(2026, 9, 5, 2, 0));   // night — wraps past midnight
   */
  function applyLivingSky(now) {
    const hour = now.getHours();
    // The last phase whose start has passed today; before 05:00 it is still last night.
    let phase = SKY_PHASES[SKY_PHASES.length - 1];
    for (const candidate of SKY_PHASES) {
      if (hour >= candidate.fromHour) {
        phase = candidate;
      }
    }
    document.documentElement.dataset.sky = phase.name;
    const greeting = document.getElementById('greeting');
    greeting.innerHTML = '';
    greeting.append(icon(phase.icon), document.createTextNode(phase.greeting));
  }

  /**
   * Draws the roadmap as the GTS journey ribbon: a road from the first phase to the pilot, lit up
   * to where the work is, with the van there. On small screens CSS swaps it for a simple list.
   *
   * @param {HTMLElement} host The <figure> to draw into.
   * @param {{phases: {label: string, detail: string}[], currentPhase: number, phaseProgress: number}} roadmap
   * @example renderRoadmap(figure, { phases: [...7], currentPhase: 0, phaseProgress: 0.9 });
   *          // van 90 % of the way from "Foundation" to "Sign-in"; Foundation's node lit
   */
  function renderRoadmap(host, roadmap) {
    const count = roadmap.phases.length;
    const step = (ROADMAP_WIDTH - 2 * SIDE_INSET) / (count - 1);
    const nodeX = (index) => SIDE_INSET + index * step;
    // A gentle wave through every node: up and down alternately, like the app's ribbon.
    const nodeY = (index) => ROAD_Y + (index % 2 === 0 ? -1 : 1) * ROAD_BEND * 0.35;
    const vanIndex = Math.min(roadmap.currentPhase + roadmap.phaseProgress, count - 1);

    let road = `M ${nodeX(0)} ${nodeY(0)}`;
    for (let index = 1; index < count; index++) {
      const midX = (nodeX(index - 1) + nodeX(index)) / 2;
      road += ` C ${midX} ${nodeY(index - 1)}, ${midX} ${nodeY(index)}, ${nodeX(index)} ${nodeY(index)}`;
    }

    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('viewBox', `0 0 ${ROADMAP_WIDTH} ${ROADMAP_HEIGHT}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute(
      'aria-label',
      `Roadmap: now working on ${roadmap.phases[roadmap.currentPhase].label}, ` +
        `${count} phases to the pilot.`,
    );
    svg.innerHTML = `
      <defs>
        <linearGradient id="roadmap-gradient" x1="0" x2="1">
          <stop offset="0" stop-color="var(--brand)" />
          <stop offset="1" stop-color="var(--live)" />
        </linearGradient>
      </defs>
      <path class="roadmap__track" d="${road}" />
      <path class="roadmap__lit" d="${road}" pathLength="1"
            stroke-dasharray="1" stroke-dashoffset="${1 - vanIndex / (count - 1)}" />`;

    roadmap.phases.forEach((phase, index) => {
      const isDone = index <= roadmap.currentPhase;
      const isGoal = index === count - 1;
      const x = nodeX(index);
      const y = nodeY(index);
      const nodeClass = `roadmap__node${isDone ? ' roadmap__node--done' : ''}${isGoal ? ' roadmap__node--goal' : ''}`;
      svg.insertAdjacentHTML(
        'beforeend',
        `<circle class="${nodeClass}" cx="${x}" cy="${y}" r="${NODE_RADIUS}" />
         <text class="roadmap__label" x="${x}" y="${y + LABEL_GAP}" text-anchor="middle">${escapeHtml(phase.label)}</text>
         <text class="roadmap__detail" x="${x}" y="${y + LABEL_GAP + DETAIL_GAP}" text-anchor="middle">${escapeHtml(shorten(phase.detail))}</text>`,
      );
    });

    // The van: interpolated between the two nodes around its position along the road.
    const from = Math.floor(vanIndex);
    const share = vanIndex - from;
    const to = Math.min(from + 1, count - 1);
    const vanX = nodeX(from) + (nodeX(to) - nodeX(from)) * share;
    const vanY = nodeY(from) + (nodeY(to) - nodeY(from)) * share;
    svg.insertAdjacentHTML(
      'beforeend',
      `<circle class="roadmap__van-ring" cx="${vanX}" cy="${vanY}" r="${VAN_RADIUS}" />
       <circle class="roadmap__van-disc" cx="${vanX}" cy="${vanY}" r="${VAN_RADIUS}" />
       <use href="#icon-van" x="${vanX - 12}" y="${vanY - 12}" width="24" height="24" style="color: var(--on-brand)" />`,
    );
    host.append(svg);

    // The small-screen version: the same phases as a list.
    const list = document.createElement('ol');
    list.className = 'roadmap__list';
    roadmap.phases.forEach((phase, index) => {
      const item = document.createElement('li');
      item.dataset.state =
        index < roadmap.currentPhase ? 'done' : index === roadmap.currentPhase ? 'current' : 'upcoming';
      item.textContent = `${phase.label} — ${phase.detail}`;
      list.append(item);
    });
    host.append(list);
  }

  /**
   * Renders every week as a <section>: date, title, summary, highlights, gallery, feature image
   * and what comes next.
   *
   * @param {HTMLElement} host Where the weeks go.
   * @param {object[]} weeks Newest first, as in data/updates.js.
   * @example renderWeeks(container, window.GTS_UPDATES.weeks);  // one <section class="week"> each
   */
  function renderWeeks(host, weeks) {
    for (const week of weeks) {
      const section = document.createElement('section');
      section.className = 'week';
      section.id = week.id;
      section.innerHTML = `
        <p class="week__date">${escapeHtml(week.dateLabel)}</p>
        <h2 class="week__title">${escapeHtml(week.title)}</h2>
        <p class="week__summary">${escapeHtml(week.summary)}</p>
        <ul class="highlights">
          ${week.highlights
            .map(
              (item) => `
            <li class="highlight">
              <span class="highlight__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-${item.icon}" /></svg></span>
              <div>
                <h3 class="highlight__title">${escapeHtml(item.title)}</h3>
                <p class="highlight__text">${escapeHtml(item.text)}</p>
              </div>
            </li>`,
            )
            .join('')}
        </ul>
        <ul class="gallery">
          ${week.gallery.map((shot) => `<li>${figure(shot, 'shot')}</li>`).join('')}
        </ul>
        ${week.feature ? figure(week.feature, 'feature') : ''}
        <aside class="next">
          <h3 class="next__title">Next</h3>
          <ul class="next__list">
            ${week.next
              .map((item) => `<li><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-arrow" /></svg>${escapeHtml(item)}</li>`)
              .join('')}
          </ul>
        </aside>`;
      host.append(section);
    }
  }

  /**
   * One screenshot as a <figure> whose image opens in the lightbox.
   *
   * @param {{src: string, caption: string}} shot
   * @param {'shot'|'feature'} kind Phone screenshot or the wide feature image.
   * @returns {string} The figure's HTML.
   * @example figure({ src: 'a.jpg', caption: 'Arrived' }, 'shot');
   *          // <figure class="shot"><button …><img alt="Arrived" …></button><figcaption>Arrived</figcaption></figure>
   */
  function figure(shot, kind) {
    const caption = escapeHtml(shot.caption);
    return `
      <figure class="${kind}">
        <button type="button" data-full="${escapeHtml(shot.src)}" data-caption="${caption}" aria-label="Enlarge: ${caption}">
          <img src="${escapeHtml(shot.src)}" alt="${caption}" loading="lazy" decoding="async" />
        </button>
        <figcaption>${caption}</figcaption>
      </figure>`;
  }

  /**
   * Opens any clicked screenshot full size in the <dialog>; Escape, the close button or a click on
   * the backdrop closes it.
   *
   * @param {HTMLDialogElement} dialog
   * @example // click a screenshot -> dialog opens with the image and its caption
   */
  function wireLightbox(dialog) {
    const image = dialog.querySelector('.lightbox__image');
    const caption = dialog.querySelector('.lightbox__caption');
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-full]');
      if (!trigger) {
        return;
      }
      image.src = trigger.dataset.full;
      image.alt = trigger.dataset.caption;
      caption.textContent = trigger.dataset.caption;
      dialog.showModal();
    });
    dialog.querySelector('.lightbox__close').addEventListener('click', () => dialog.close());
    // A click on the dimmed area (the dialog element itself, outside its content) closes it.
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  }

  /**
   * An inline SVG icon from the sprite in index.html.
   *
   * @param {string} id e.g. 'icon-sun'
   * @returns {SVGSVGElement}
   * @example icon('icon-moon');  // <svg><use href="#icon-moon"></use></svg>
   */
  function icon(id) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#${id}`);
    svg.append(use);
    return svg;
  }

  /**
   * Keeps roadmap captions short enough to sit under a node without colliding with the next one.
   *
   * @param {string} text
   * @returns {string}
   * @example shorten('Phone number and OTP, consent, roles');  // -> 'Phone number and OTP'
   * @example shorten('Real families');                          // -> 'Real families'
   */
  function shorten(text) {
    return text.split(',')[0];
  }

  /**
   * Escapes text for safe insertion into HTML (the data is ours, but this keeps it that way).
   *
   * @param {string} text
   * @returns {string}
   * @example escapeHtml('Anjali\'s <b>trip</b>');  // -> 'Anjali&#39;s &lt;b&gt;trip&lt;/b&gt;'
   */
  function escapeHtml(text) {
    return String(text)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
})();
