/**
 * The week's gallery: phone screenshots and screen-recording videos in phone frames, as HTML.
 *
 * WHO calls it: js/render.js (renderWeek for the body, renderLatest for the hero's cover), so the
 * page (js/app.js) and the compose preview (js/compose.js) draw galleries the same way.
 * WHAT it draws, by the shape of `week.gallery` (schema at the top of data/updates.js):
 *   - no `group` on any item: one grid of phones (one swipeable row on phones), as before;
 *   - items with `group`: one section per run of items sharing a group, each a <details> whose
 *     summary is the heading and the count. A gallery longer than GALLERY_OPEN_LIMIT starts with
 *     every section closed, under a line saying how to see them all, so 80 screens do not make the
 *     page endless (a section with a video still starts open); a shorter one starts open.
 *   - a video item ({ video, poster, caption }) plays inside its phone frame with the browser's
 *     own controls; nothing downloads until play is pressed (preload="none").
 * The screenshot viewer (js/lightbox.js) steps through every [data-shot] in the week, including
 * screenshots in closed sections; videos are not part of it.
 */
(function defineGallery(root) {
  'use strict';

  const icons = root.GTS.icons;
  const escapeHtml = root.GTS.escapeHtml;

  /** A grouped gallery with more items than this starts with its sections closed. */
  const GALLERY_OPEN_LIMIT = 12;

  /**
   * True when a gallery item is a video ({ video, poster, caption }) rather than a screenshot.
   *
   * @param {object} item A gallery item.
   * @returns {boolean}
   * @example isVideo({ video: 'assets/updates/2026-10-25/live-trip.mp4', poster: 'assets/updates/2026-10-25/live-trip.jpg', caption: 'A trip' });
   *          // -> true
   * @example isVideo({ src: 'assets/updates/2026-10-18/j6-03-battery-guide.jpg', caption: 'Keep GTS running' });  // -> false
   * @example isVideo(undefined);  // -> false
   */
  function isVideo(item) {
    return Boolean(item) && typeof item.video === 'string';
  }

  /**
   * The picture the hero's "latest update" card shows: the week's `cover` when set, else the first
   * screenshot, else the first video's poster.
   *
   * @param {object} week A week entry.
   * @returns {string|undefined} A path from the site root.
   * @example coverSrc({ cover: 'assets/updates/2026-10-18/j6-20-home-trip-in-progress.jpg', gallery: [...] });
   *          // -> 'assets/updates/2026-10-18/j6-20-home-trip-in-progress.jpg'
   * @example coverSrc({ gallery: [{ src: 'assets/updates/2026-10-11/privacy-notice.jpg', caption: '…' }] });
   *          // -> 'assets/updates/2026-10-11/privacy-notice.jpg'
   * @example coverSrc({ gallery: [{ video: 'a.mp4', poster: 'assets/updates/2026-10-25/live-trip.jpg', caption: '…' }] });
   *          // -> 'assets/updates/2026-10-25/live-trip.jpg'   a video's poster
   * @example coverSrc({ gallery: [] });  // -> undefined   the card has no phone
   */
  function coverSrc(week) {
    if (week.cover) {
      return week.cover;
    }
    const first = (week.gallery || [])[0];
    if (!first) {
      return undefined;
    }
    return isVideo(first) ? first.poster : first.src;
  }

  /**
   * How many screenshots and videos a week has, as words for buttons and hints. The wide feature
   * image counts as a screenshot.
   *
   * @param {object[]} gallery The week's gallery.
   * @param {object} [feature] The week's wide image, when it has one.
   * @returns {string} '' when there is nothing.
   * @example mediaCountLabel(weeks[0].gallery);            // -> '82 screenshots'
   * @example mediaCountLabel(weeks[1].gallery, feature);   // -> '16 screenshots'   15 + the wide image
   * @example mediaCountLabel([shot, video, video]);        // -> '1 screenshot · 2 videos'
   * @example mediaCountLabel([]);                          // -> ''
   */
  function mediaCountLabel(gallery, feature) {
    let screenshots = feature ? 1 : 0;
    let videos = 0;
    for (const item of gallery || []) {
      if (isVideo(item)) {
        videos += 1;
      } else {
        screenshots += 1;
      }
    }
    const parts = [];
    if (screenshots) {
      parts.push(`${screenshots} screenshot${screenshots === 1 ? '' : 's'}`);
    }
    if (videos) {
      parts.push(`${videos} video${videos === 1 ? '' : 's'}`);
    }
    return parts.join(' · ');
  }

  /**
   * Splits a gallery into sections: one per run of neighbouring items with the same `group`.
   *
   * @param {object[]} gallery
   * @returns {{heading: string|undefined, items: object[]}[]}
   * @example groupItems([{ src: 'a.jpg', group: 'Sign-up' }, { src: 'b.jpg', group: 'Sign-up' }, { src: 'c.jpg', group: 'Trips' }]);
   *          // -> [{ heading: 'Sign-up', items: [a, b] }, { heading: 'Trips', items: [c] }]
   * @example groupItems([{ src: 'a.jpg' }, { src: 'b.jpg' }]);
   *          // -> [{ heading: undefined, items: [a, b] }]   no groups: one plain section
   * @example groupItems([]);  // -> []
   */
  function groupItems(gallery) {
    const sections = [];
    for (const item of gallery) {
      const last = sections[sections.length - 1];
      if (last && last.heading === item.group) {
        last.items.push(item);
      } else {
        sections.push({ heading: item.group, items: [item] });
      }
    }
    return sections;
  }

  /**
   * One screenshot in a phone frame, as a button that opens the viewer.
   *
   * @param {{src: string, caption: string, alt?: string}} shot
   * @param {string} src The address to load (compose.html swaps in a local preview).
   * @returns {string}
   * @example renderShot({ src: 'a.jpg', caption: 'Arrived' }, 'a.jpg');
   *          // <figure class="shot"><button class="device" data-shot data-src="a.jpg" ...><img alt="Arrived">
   * @example renderShot({ src: 'a.jpg', caption: 'Arrived', alt: 'Van icon inside the home circle' }, 'a.jpg');
   *          // the image's alt says the longer text; the caption stays 'Arrived'
   */
  function renderShot(shot, src) {
    const alt = shot.alt || shot.caption;
    return `
      <figure class="shot">
        <button type="button" class="device" data-shot data-src="${escapeHtml(src)}" data-caption="${escapeHtml(shot.caption)}"
                data-alt="${escapeHtml(alt)}" aria-label="View larger: ${escapeHtml(shot.caption)}">
          <span class="device__screen"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" /></span>
        </button>
        <figcaption>${escapeHtml(shot.caption)}</figcaption>
      </figure>`;
  }

  /**
   * One video in a phone frame. It plays where it is (the viewer is for screenshots); the poster
   * shows until play is pressed, and preload="none" keeps the page from downloading it before.
   *
   * @param {{video: string, poster: string, caption: string, alt?: string, download?: string}} item
   * @param {(src: string) => string} resolveSrc Address to load for a path (compose preview).
   * @returns {string}
   * @example renderVideo({ video: 'assets/updates/2026-10-25/live-trip.mp4', poster: 'assets/updates/2026-10-25/live-trip.jpg',
   *                        caption: 'A whole trip, start to End' }, (src) => src);
   *          // <figure class="shot shot--video"><div class="device device--video">
   *          //   <video controls preload="none" playsinline poster="…live-trip.jpg" src="…live-trip.mp4"
   *          //          aria-label="Video: A whole trip, start to End">  + caption with a 'Video' tag
   * @example renderVideo({ ...item, alt: 'The van moving on the map, then the alerts' }, (src) => src);
   *          // aria-label 'Video: The van moving on the map, then the alerts'; caption unchanged
   * @example renderVideo({ ...item, download: 'assets/updates/2026-10-18/full-demo-hd.mp4' }, (src) => src);
   *          // caption ends with <a class="shot__download" href="…full-demo-hd.mp4" download>Full resolution</a>
   *          // WHY a link, not a second player: the big file downloads only when someone asks for it
   */
  function renderVideo(item, resolveSrc) {
    const label = item.alt || item.caption;
    return `
      <figure class="shot shot--video">
        <div class="device device--video">
          <span class="device__screen"><video controls preload="none" playsinline
            poster="${escapeHtml(resolveSrc(item.poster))}" src="${escapeHtml(resolveSrc(item.video))}"
            aria-label="Video: ${escapeHtml(label)}"></video></span>
        </div>
        <figcaption><span class="shot__kind">${icons.svg('play')}Video</span> ${escapeHtml(item.caption)}${
          item.download
            ? ` <a class="shot__download" href="${escapeHtml(resolveSrc(item.download))}" download>Full resolution</a>`
            : ''
        }</figcaption>
      </figure>`;
  }

  /**
   * The phones of one section as a list; `label` names the list for screen readers.
   *
   * @param {object[]} items Screenshots and videos, in order.
   * @param {string} label e.g. 'Screenshots' or the section heading 'Trip reminders'.
   * @param {(src: string) => string} resolveSrc
   * @returns {string}
   * @example renderTrack([shot1, shot2], 'Trip reminders', (src) => src);
   *          // <ul class="gallery__track" aria-label="Trip reminders"> two screenshot buttons
   * @example renderTrack([shot, video], 'Screenshots', (src) => src);
   *          // one screenshot button, then one inline video
   */
  function renderTrack(items, label, resolveSrc) {
    const phones = items
      .map((item) => `<li>${isVideo(item) ? renderVideo(item, resolveSrc) : renderShot(item, resolveSrc(item.src))}</li>`)
      .join('');
    return `<ul class="gallery__track" aria-label="${escapeHtml(label)}">${phones}</ul>`;
  }

  /**
   * The whole gallery block for a week body, or '' when the week has no gallery.
   *
   * @param {object} week A week entry (uses gallery and galleryNote).
   * @param {{resolveSrc: (src: string) => string}} context
   * @returns {string}
   * @example renderGallery(weeks[1], { resolveSrc });
   *          // 15 screenshots, no groups -> <div class="gallery"><ul class="gallery__track"> 15 phones
   * @example renderGallery(weeks[0], { resolveSrc });
   *          // 82 screenshots in 12 groups -> the note, the hint '82 screenshots in 12 parts…',
   *          // 12 closed <details> 'Sign-up and privacy · 8', 'Driver papers and vehicle check · 10', …
   * @example renderGallery(weekWithDemoFirst, { resolveSrc });
   *          // 83 items: 'Full demo: start to finish · 1' (a video) starts open; the 12 others closed
   * @example renderGallery({ gallery: [a, b, c].map((shot) => ({ ...shot, group: 'Start a trip' })) }, { resolveSrc });
   *          // 3 items, one group -> one <details open> 'Start a trip · 3', no hint
   * @example renderGallery({ gallery: [] }, { resolveSrc });  // -> ''
   */
  function renderGallery(week, context) {
    const gallery = week.gallery || [];
    if (gallery.length === 0) {
      return '';
    }
    const note = week.galleryNote ? `<p class="gallery__note">${escapeHtml(week.galleryNote)}</p>` : '';
    const sections = groupItems(gallery);
    const grouped = sections.some((section) => section.heading !== undefined);
    if (!grouped) {
      return `<div class="gallery">${note}${renderTrack(gallery, 'Screenshots', context.resolveSrc)}</div>`;
    }

    const startOpen = gallery.length <= GALLERY_OPEN_LIMIT;
    const hint = startOpen
      ? ''
      : `<p class="gallery__hint">${escapeHtml(mediaCountLabel(gallery))} in ${sections.length} parts. ` +
        'Open a part, or tap any screen and use the arrows to step through all of them.</p>';
    const parts = sections
      .map((section) => {
        if (section.heading === undefined) {
          return `<div class="gallery__group">${renderTrack(section.items, 'Screenshots', context.resolveSrc)}</div>`;
        }
        // WHY a video's section opens even in a long gallery: a video is the week's headline, and
        // it costs only its poster until play is pressed.
        const opens = startOpen || section.items.some(isVideo);
        return `
          <details class="gallery__group"${opens ? ' open' : ''}>
            <summary class="gallery__heading">
              <span class="gallery__heading-text">${escapeHtml(section.heading)}</span>
              <span class="gallery__count">${section.items.length}</span>
              ${icons.svg('chevron-down', 'gallery__chevron')}
            </summary>
            ${renderTrack(section.items, section.heading, context.resolveSrc)}
          </details>`;
      })
      .join('');
    return `<div class="gallery gallery--grouped">${note}${hint}${parts}</div>`;
  }

  root.GTS.gallery = { renderGallery, coverSrc, mediaCountLabel, isVideo, GALLERY_OPEN_LIMIT };
})(window);
