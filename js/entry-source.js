/**
 * Writes a week entry as JavaScript source in the exact style of data/updates.js, so the text
 * compose.html copies can be pasted at the top of `weeks` without any tidying.
 *
 * WHY not JSON.stringify: data/updates.js uses unquoted keys, single-quoted strings and trailing
 * commas; pasting JSON there would work but read differently from every other entry.
 */
(function defineEntrySource(root) {
  'use strict';

  /** Indent of one entry inside `weeks: [` in data/updates.js (4 spaces), and one nesting step. */
  const ENTRY_INDENT = '    ';
  const STEP = '  ';

  /**
   * A string as a single-quoted JavaScript literal.
   *
   * @param {string} text
   * @returns {string}
   * @example quote('Arrived');                 // -> "'Arrived'"
   * @example quote("The parent's screen");     // -> "'The parent\\'s screen'"
   * @example quote('line one\nline two');      // -> "'line one\\nline two'"   kept on one line
   * @example quote('C:\\shots');               // -> "'C:\\\\shots'"
   */
  function quote(text) {
    const escaped = String(text)
      .replaceAll('\\', '\\\\')
      .replaceAll("'", "\\'")
      .replaceAll('\r', '')
      .replaceAll('\n', '\\n');
    return `'${escaped}'`;
  }

  /**
   * A gallery item or the wide image on one line, fields in the data file's order: a screenshot
   * `{ src, caption }` or a video `{ video, poster, caption }`, then `alt` and `group` when given.
   *
   * @example mediaSource({ src: 'assets/updates/2026-10-11/otp.jpg', caption: 'Typing the code' });
   *          // -> "{ src: 'assets/updates/2026-10-11/otp.jpg', caption: 'Typing the code' }"
   * @example mediaSource({ src: 'a.jpg', caption: 'Map', alt: 'Map with the school pin' });
   *          // -> "{ src: 'a.jpg', caption: 'Map', alt: 'Map with the school pin' }"
   * @example mediaSource({ src: 'a.jpg', caption: 'Battery guide', group: 'Starting a trip' });
   *          // -> "{ src: 'a.jpg', caption: 'Battery guide', group: 'Starting a trip' }"
   * @example mediaSource({ video: 'trip.mp4', poster: 'trip.jpg', caption: 'A whole trip' });
   *          // -> "{ video: 'trip.mp4', poster: 'trip.jpg', caption: 'A whole trip' }"
   */
  function mediaSource(item) {
    const file = item.video !== undefined
      ? `video: ${quote(item.video)}, poster: ${quote(item.poster)}`
      : `src: ${quote(item.src)}`;
    const alt = item.alt ? `, alt: ${quote(item.alt)}` : '';
    const group = item.group ? `, group: ${quote(item.group)}` : '';
    return `{ ${file}, caption: ${quote(item.caption)}${alt}${group} }`;
  }

  /**
   * The whole entry, in field order id, dateLabel, title, summary, phase, progress, highlights,
   * gallery, galleryNote, cover, feature, next. Optional fields that are absent are left out.
   *
   * @param {object} week A week entry (the shape documented in data/updates.js).
   * @returns {string} Source text ending in '},' ready to paste.
   * @example entrySource({ id: '2026-10-11', dateLabel: 'Week ending 11 October 2026', title: 'Sign-in works',
   *                        summary: 'Parents can sign in.', highlights: [{ icon: 'key', title: 'Code',
   *                        text: 'A one-time code.', tags: ['parents'] }], gallery: [], next: ['Driver setup'] });
   *          // ->     {
   *          //          id: '2026-10-11',
   *          //          ...
   *          //          highlights: [
   *          //            {
   *          //              icon: 'key',
   *          //              ...
   *          //              tags: ['parents'],
   *          //            },
   *          //          ],
   *          //          gallery: [],
   *          //          next: [
   *          //            'Driver setup',
   *          //          ],
   *          //        },
   * @example entrySource({ ...week, phase: 'sign-in', feature: { src: 'a.jpg', caption: 'All screens' } });
   *          // adds "phase: 'sign-in'," after summary and "feature: { src: 'a.jpg', caption: 'All screens' }," before next
   * @example entrySource({ ...week, progress: { estimates: [{ label: 'Whole product', value: 'about 25%' }], note: 'Measured…' } });
   *          // adds after phase:  progress: { estimates: [ { label: 'Whole product', value: 'about 25%' }, ], note: 'Measured…' },
   */
  function entrySource(week) {
    const pad1 = ENTRY_INDENT + STEP;
    const pad2 = pad1 + STEP;
    const pad3 = pad2 + STEP;
    const lines = [`${ENTRY_INDENT}{`];
    for (const field of ['id', 'dateLabel', 'title', 'summary', 'phase']) {
      if (week[field] !== undefined) {
        lines.push(`${pad1}${field}: ${quote(week[field])},`);
      }
    }
    if (week.progress) {
      lines.push(`${pad1}progress: {`, `${pad2}estimates: [`);
      for (const estimate of week.progress.estimates || []) {
        lines.push(`${pad3}{ label: ${quote(estimate.label)}, value: ${quote(estimate.value)} },`);
      }
      lines.push(`${pad2}],`, `${pad2}note: ${quote(week.progress.note)},`, `${pad1}},`);
    }
    lines.push(`${pad1}highlights: [`);
    for (const item of week.highlights || []) {
      lines.push(
        `${pad2}{`,
        `${pad3}icon: ${quote(item.icon)},`,
        `${pad3}title: ${quote(item.title)},`,
        `${pad3}text: ${quote(item.text)},`,
        `${pad3}tags: [${(item.tags || []).map(quote).join(', ')}],`,
        `${pad2}},`,
      );
    }
    lines.push(`${pad1}],`);
    if ((week.gallery || []).length === 0) {
      lines.push(`${pad1}gallery: [],`);
    } else {
      lines.push(`${pad1}gallery: [`);
      for (const item of week.gallery) {
        lines.push(`${pad2}${mediaSource(item)},`);
      }
      lines.push(`${pad1}],`);
    }
    for (const field of ['galleryNote', 'cover']) {
      if (week[field] !== undefined) {
        lines.push(`${pad1}${field}: ${quote(week[field])},`);
      }
    }
    if (week.feature) {
      lines.push(`${pad1}feature: ${mediaSource(week.feature)},`);
    }
    lines.push(`${pad1}next: [`);
    for (const item of week.next || []) {
      lines.push(`${pad2}${quote(item)},`);
    }
    lines.push(`${pad1}],`, `${ENTRY_INDENT}},`);
    return lines.join('\n');
  }

  root.GTS = root.GTS || {};
  root.GTS.entrySource = entrySource;
})(window);
