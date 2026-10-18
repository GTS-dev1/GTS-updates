/**
 * The GTS updates icon set: one inline SVG sprite, drawn for this site on a 24 x 24 grid in a single
 * stroke style (1.8 px, round caps), so every icon matches.
 *
 * WHO uses it:
 *   - index.html and compose.html: `GTS.icons.mount()` puts the sprite into the page once, and
 *     `GTS.icons.svg('van')` returns the markup that draws one icon from it.
 *   - compose.html's icon picker lists `GTS.icons.contentNames`.
 *   - tools/check-updates.js loads this file in Node to learn which icon names are valid, so the
 *     list of known icons lives in exactly one place.
 *
 * TO ADD AN ICON: add one entry to CONTENT_ICONS (usable in data/updates.js) or UI_ICONS (page
 * chrome only). The value is the inner SVG of a 24 x 24 drawing; `fill` defaults to none and
 * `stroke` to currentColor, so write `fill="currentColor"` on solid parts only.
 */
(function defineIcons(root) {
  'use strict';

  /**
   * Icons that content may name in data/updates.js (highlights and roadmap phases).
   * Key = the name written in the data, e.g. 'map-pin'; value = the drawing.
   */
  const CONTENT_ICONS = {
    van:
      '<path d="M5 17H3.5a1 1 0 0 1-1-1V8a2 2 0 0 1 2-2h11l4.5 5v5a1 1 0 0 1-1 1H18.5M9 17h5.5M2.5 11h18M10 6v5"/>' +
      '<circle cx="7" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/>',
    radar:
      '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5" opacity=".55"/>' +
      '<path d="m12 12 6.4-6.4"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    shield: '<path d="M12 3 5 5.5v5.7c0 4.4 2.9 8.2 7 9.8 4.1-1.6 7-5.4 7-9.8V5.5L12 3Z"/><path d="m9 12 2 2 4-4"/>',
    sun:
      '<circle cx="12" cy="12" r="4"/>' +
      '<path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
    language: '<path d="M4 5h9M8.5 3v2M6 5c.6 3 2.8 5.6 6 7M11 5c-.8 3.4-3.2 6.2-7 7.6M13 21l4-9 4 9M14.4 18h5.2"/>',
    phone: '<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M11 18.5h2"/>',
    'map-pin': '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    camera:
      '<path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/>' +
      '<circle cx="12" cy="13" r="3.5"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    school: '<path d="M3 21h18M5 21V10l7-5 7 5v11M10 21v-5h4v5M12 5V2.5h3"/><circle cx="12" cy="11" r="1.6"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8.5-8.5M15.5 7.5 18 10M18 5l2 2"/>',
    check: '<path d="M5 12.5 10 17.5 19.5 7"/>',
    users:
      '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/>' +
      '<path d="M16.5 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
    settings: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    chat: '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/><path d="M8 10h8M8 13h5"/>',
    star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
    flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
    sos: '<path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
    sparkle: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM18.5 16l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z"/>',
    code: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    route:
      '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/>' +
      '<path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8"/>',
  };

  /** Icons for the page itself (buttons, arrows); not offered to content. */
  const UI_ICONS = {
    arrow: '<path d="M5 12h13M13 6l6 6-6 6"/>',
    'chevron-left': '<path d="m15 5-7 7 7 7"/>',
    'chevron-right': '<path d="m9 5 7 7-7 7"/>',
    'chevron-down': '<path d="m5 9 7 7 7-7"/>',
    'chevron-up': '<path d="m5 15 7-7 7 7"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    link:
      '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/>' +
      '<path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m20.5 16-5-5-9 8.5"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    /** The 'Video' tag under a video in the gallery (js/gallery.js); a solid triangle. */
    play: '<path d="M8 5.5v13l10-6.5z" fill="currentColor"/>',
  };

  /** Every icon, content first; the sprite holds all of them. */
  const ALL_ICONS = Object.assign({}, CONTENT_ICONS, UI_ICONS);

  /** The id prefix of each <symbol>, so 'van' becomes #gts-icon-van. */
  const SYMBOL_PREFIX = 'gts-icon-';

  /**
   * Puts the sprite into the document once (a hidden <svg> at the start of <body>).
   * Calling it again does nothing.
   *
   * @param {Document} doc The page's document.
   * @example GTS.icons.mount(document);  // <svg id="gts-icon-sprite" hidden> with 40 <symbol>s
   * @example GTS.icons.mount(document);  // second call: no change, the sprite is already there
   */
  function mount(doc) {
    if (doc.getElementById('gts-icon-sprite')) {
      return;
    }
    let symbols = '';
    for (const name in ALL_ICONS) {
      if (Object.prototype.hasOwnProperty.call(ALL_ICONS, name)) {
        symbols += `<symbol id="${SYMBOL_PREFIX}${name}" viewBox="0 0 24 24">${ALL_ICONS[name]}</symbol>`;
      }
    }
    doc.body.insertAdjacentHTML(
      'afterbegin',
      `<svg id="gts-icon-sprite" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
            style="position:absolute;width:0;height:0;overflow:hidden">${symbols}</svg>`,
    );
  }

  /**
   * Markup for one decorative icon from the sprite. Unknown names draw nothing visible, and
   * tools/check-updates.js stops them reaching the data in the first place.
   *
   * @param {string} name An icon name, e.g. 'bell'.
   * @param {string} [className] Extra class names for sizing, e.g. 'icon--lg'.
   * @returns {string}
   * @example GTS.icons.svg('bell');
   *          // -> '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#gts-icon-bell"></use></svg>'
   * @example GTS.icons.svg('van', 'icon--lg');   // -> same with class="icon icon--lg"
   * @example GTS.icons.svg('rocket');            // -> an empty icon box (no such symbol)
   */
  function svg(name, className) {
    const classes = className ? `icon ${className}` : 'icon';
    return (
      `<svg class="${classes}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">` +
      `<use href="#${SYMBOL_PREFIX}${name}"></use></svg>`
    );
  }

  root.GTS = root.GTS || {};
  root.GTS.icons = {
    mount,
    svg,
    /** Names usable in data/updates.js, e.g. ['van', 'radar', 'bell', ...]. */
    contentNames: Object.keys(CONTENT_ICONS),
    /** Every name in the sprite, content and page chrome. */
    allNames: Object.keys(ALL_ICONS),
  };
})(typeof window === 'undefined' ? globalThis : window);
