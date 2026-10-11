/**
 * The rules every update must pass, written once and used in two places:
 *   - tools/check-updates.js (Node) checks the whole of data/updates.js before a commit;
 *   - compose.html (browser) checks the week being written, live, as warnings under the form.
 *
 * WHAT it checks: required fields and their types, ids that are real dates and unique, newest
 * first, icons and tags that exist, roadmap statuses in journey order, gallery files that exist
 * (when the caller can look at the disk), captions present, and text that looks private for a
 * PUBLIC repository (money, legal words, phone numbers, email addresses).
 *
 * HOW: plain functions that return a list of problem strings; an empty list means clean.
 * Nothing here touches the disk or the page; callers pass `fileExists` when they can.
 */
(function defineValidator(root) {
  'use strict';

  /** Roadmap statuses in journey order; a phase list must never go backwards in this order. */
  const PHASE_STATUS_ORDER = ['done', 'now', 'next', 'planned', 'later'];

  /** The fields a week may have; anything else is almost always a typo ('higlights'). */
  const WEEK_KEYS = ['id', 'dateLabel', 'title', 'summary', 'phase', 'highlights', 'gallery', 'feature', 'next'];
  const HIGHLIGHT_KEYS = ['icon', 'title', 'text', 'tags'];
  const IMAGE_KEYS = ['src', 'caption', 'alt'];
  const PHASE_KEYS = ['id', 'label', 'detail', 'icon', 'status'];

  /** More highlights than this stop reading as highlights; split the week's story instead. */
  const MAX_HIGHLIGHTS = 9;

  /** yyyy-mm-dd, the shape of a week id and its screenshot folder. */
  const DATE_ID_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
  /** kebab-case ids for areas and roadmap phases, e.g. 'driver-setup'. */
  const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  /** Screenshot formats browsers show everywhere. */
  const IMAGE_FILE_PATTERN = /\.(jpe?g|png|webp)$/i;

  /**
   * Text that should not appear in this public repository. Each entry: what to look for and the
   * reason printed when it matches. WHY these: costs, legal research and personal contact details
   * stay in the private app repository (see README.md).
   */
  const PRIVATE_PATTERNS = [
    { pattern: /₹|\bINR\b|\bRs\.?\s?\d/, reason: 'a rupee amount' },
    { pattern: /\bcost(s|ing|ly)?\b/i, reason: 'the word "cost"' },
    { pattern: /\bpric(e|es|ed|ing)\b/i, reason: 'the word "price"' },
    { pattern: /\blawyers?\b/i, reason: 'the word "lawyer"' },
    { pattern: /\blicen[cs]e fees?\b/i, reason: 'a licence fee' },
    { pattern: /\+91[\s-]?\d{5}[\s-]?\d{5}\b/, reason: 'a phone number (+91)' },
    { pattern: /(^|[^\d])[6-9]\d{9}(?!\d)/, reason: 'what looks like a mobile number' },
    { pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, reason: 'an email address' },
  ];

  /**
   * Why a piece of text looks private, or an empty list when it looks fine.
   *
   * @param {string} text Any text from the data.
   * @returns {string[]} One reason per pattern that matched.
   * @example findPrivateText('The 1 km ring lights up');       // -> []
   * @example findPrivateText('Maps key costs ₹0 for now');     // -> ['a rupee amount', 'the word "cost"']
   * @example findPrivateText('Call +91 98765 43210');          // -> ['a phone number (+91)']
   * @example findPrivateText('Write to team@example.in');      // -> ['an email address']
   * @example findPrivateText('Costa Rica');                    // -> []   whole words only
   */
  function findPrivateText(text) {
    const reasons = [];
    for (const rule of PRIVATE_PATTERNS) {
      if (rule.pattern.test(text)) {
        reasons.push(rule.reason);
      }
    }
    return reasons;
  }

  /**
   * True for a non-empty string after trimming.
   *
   * @example isFilled('Arrived');  // -> true
   * @example isFilled('  ');       // -> false
   * @example isFilled(undefined);  // -> false
   */
  function isFilled(value) {
    return typeof value === 'string' && value.trim() !== '';
  }

  /**
   * True when a yyyy-mm-dd string is a real calendar date.
   *
   * @example isRealDate('2026-10-04');  // -> true
   * @example isRealDate('2026-02-30');  // -> false   rolls over to 2 March
   * @example isRealDate('4 Oct 2026');  // -> false   wrong shape
   */
  function isRealDate(id) {
    if (!DATE_ID_PATTERN.test(id)) {
      return false;
    }
    const [year, month, day] = id.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }

  /**
   * Adds a problem for every key of `object` that is not in `allowed`.
   *
   * @example reportUnknownKeys({ src: 'a.jpg', captoin: 'x' }, IMAGE_KEYS, 'gallery[0]', problems);
   *          // problems gets 'gallery[0]: unknown field "captoin" (allowed: src, caption, alt)'
   */
  function reportUnknownKeys(object, allowed, where, problems) {
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key) && !allowed.includes(key)) {
        problems.push(`${where}: unknown field "${key}" (allowed: ${allowed.join(', ')})`);
      }
    }
  }

  /**
   * Checks one gallery or feature image.
   *
   * @param {*} image The `{ src, caption, alt? }` object.
   * @param {string} where Label for messages, e.g. 'weeks[0] gallery[2]'.
   * @param {{fileExists?: (src: string) => boolean}} options
   * @param {string[]} problems Collected messages.
   * @example checkImage({ src: 'assets/updates/2026-10-04/a.jpg', caption: 'Arrived' }, ...)
   *          // clean when the file exists
   * @example checkImage({ src: 'shots/a.jpg', caption: '' }, ...)
   *          // 'src should start with assets/', 'caption is missing'
   */
  function checkImage(image, where, options, problems) {
    if (!image || typeof image !== 'object') {
      problems.push(`${where}: should be { src, caption }`);
      return;
    }
    reportUnknownKeys(image, IMAGE_KEYS, where, problems);
    if (!isFilled(image.src)) {
      problems.push(`${where}: src is missing`);
    } else {
      if (!image.src.startsWith('assets/')) {
        problems.push(`${where}: src "${image.src}" should start with assets/`);
      }
      if (!IMAGE_FILE_PATTERN.test(image.src)) {
        problems.push(`${where}: src "${image.src}" should be a .jpg, .png or .webp file`);
      }
      if (options.fileExists && !options.fileExists(image.src)) {
        problems.push(`${where}: file not found: ${image.src}`);
      }
    }
    if (!isFilled(image.caption)) {
      problems.push(`${where}: caption is missing`);
    }
    if (image.alt !== undefined && !isFilled(image.alt)) {
      problems.push(`${where}: alt is empty; leave it out to use the caption`);
    }
  }

  /**
   * Checks one week entry against the schema in data/updates.js.
   *
   * @param {*} week The entry.
   * @param {string} where Label for messages, e.g. 'weeks[0] (2026-10-04)'.
   * @param {{knownIcons: string[], areaIds: string[], phaseIds: string[], fileExists?: Function}} options
   * @returns {string[]} Problems; [] when clean.
   * @example validateWeek(window.GTS_UPDATES.weeks[0], 'weeks[0]', options);  // -> []
   * @example validateWeek({ id: '2026-10-11' }, 'draft', options);
   *          // -> ['draft: dateLabel is missing', 'draft: title is missing', ...]
   * @example validateWeek({ ...week, highlights: [{ icon: 'rocket', ... }] }, ...)
   *          // -> ['... highlights[0].icon: unknown icon "rocket"']
   */
  function validateWeek(week, where, options) {
    const problems = [];
    if (!week || typeof week !== 'object') {
      return [`${where}: should be an object`];
    }
    reportUnknownKeys(week, WEEK_KEYS, where, problems);

    if (!isRealDate(week.id)) {
      problems.push(`${where}: id "${week.id}" should be a real date as yyyy-mm-dd, e.g. 2026-10-11`);
    }
    for (const field of ['dateLabel', 'title', 'summary']) {
      if (!isFilled(week[field])) {
        problems.push(`${where}: ${field} is missing`);
      }
    }
    if (week.phase !== undefined && !options.phaseIds.includes(week.phase)) {
      problems.push(`${where}: phase "${week.phase}" is not a roadmap phase id (${options.phaseIds.join(', ')})`);
    }

    // Highlights: the cards with icons. Each needs an icon, a title, a text and known tags.
    if (!Array.isArray(week.highlights) || week.highlights.length === 0) {
      problems.push(`${where}: highlights needs at least one item`);
    } else {
      if (week.highlights.length > MAX_HIGHLIGHTS) {
        problems.push(`${where}: ${week.highlights.length} highlights; keep it to ${MAX_HIGHLIGHTS} or fewer`);
      }
      week.highlights.forEach((highlight, index) => {
        const at = `${where} highlights[${index}]`;
        if (!highlight || typeof highlight !== 'object') {
          problems.push(`${at}: should be { icon, title, text, tags }`);
          return;
        }
        reportUnknownKeys(highlight, HIGHLIGHT_KEYS, at, problems);
        if (!options.knownIcons.includes(highlight.icon)) {
          problems.push(`${at}.icon: unknown icon "${highlight.icon}" (see js/icons.js)`);
        }
        for (const field of ['title', 'text']) {
          if (!isFilled(highlight[field])) {
            problems.push(`${at}.${field} is missing`);
          }
        }
        if (!Array.isArray(highlight.tags) || highlight.tags.length === 0) {
          problems.push(`${at}.tags needs at least one of: ${options.areaIds.join(', ')}`);
        } else {
          highlight.tags.forEach((tag, tagIndex) => {
            if (!options.areaIds.includes(tag)) {
              problems.push(`${at}.tags: unknown tag "${tag}" (known: ${options.areaIds.join(', ')})`);
            } else if (highlight.tags.indexOf(tag) !== tagIndex) {
              problems.push(`${at}.tags: "${tag}" is listed twice`);
            }
          });
        }
      });
    }

    // Gallery and feature images: real files with captions.
    if (!Array.isArray(week.gallery)) {
      problems.push(`${where}: gallery should be a list (use [] for none)`);
    } else {
      week.gallery.forEach((image, index) => checkImage(image, `${where} gallery[${index}]`, options, problems));
    }
    if (week.feature !== undefined) {
      checkImage(week.feature, `${where} feature`, options, problems);
    }

    if (!Array.isArray(week.next) || week.next.length === 0) {
      problems.push(`${where}: next needs at least one item`);
    } else {
      week.next.forEach((item, index) => {
        if (!isFilled(item)) {
          problems.push(`${where} next[${index}] is empty`);
        }
      });
    }

    collectStrings(week, where, problems);
    return problems;
  }

  /**
   * Walks every string inside a value and reports the ones that look private.
   *
   * @example collectStrings({ title: 'Ready', next: ['Talk to the lawyer'] }, 'weeks[0]', problems);
   *          // problems gets 'weeks[0].next[0]: looks private (the word "lawyer"): "Talk to the lawyer"'
   */
  function collectStrings(value, path, problems) {
    if (typeof value === 'string') {
      const reasons = findPrivateText(value);
      if (reasons.length > 0) {
        problems.push(`${path}: looks private (${reasons.join(', ')}): "${value}"`);
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => collectStrings(item, `${path}[${index}]`, problems));
    } else if (value && typeof value === 'object') {
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          collectStrings(value[key], `${path}.${key}`, problems);
        }
      }
    }
  }

  /**
   * Checks the areas list (the filter chips).
   *
   * @example validateAreas([{ id: 'parents', label: 'Parents' }]);   // -> []
   * @example validateAreas([{ id: 'Parents', label: '' }]);
   *          // -> ['areas[0]: id "Parents" should be kebab-case', 'areas[0]: label is missing']
   */
  function validateAreas(areas) {
    const problems = [];
    if (!Array.isArray(areas) || areas.length === 0) {
      return ['areas: needs at least one { id, label }'];
    }
    const seen = new Set();
    areas.forEach((area, index) => {
      const at = `areas[${index}]`;
      if (!area || !SLUG_PATTERN.test(area.id)) {
        problems.push(`${at}: id "${area && area.id}" should be kebab-case, e.g. safety`);
        return;
      }
      if (seen.has(area.id)) {
        problems.push(`${at}: id "${area.id}" is used twice`);
      }
      seen.add(area.id);
      if (!isFilled(area.label)) {
        problems.push(`${at}: label is missing`);
      }
    });
    collectStrings(areas, 'areas', problems);
    return problems;
  }

  /**
   * Checks the roadmap: unique ids, known icons and statuses, exactly one phase 'now', at most
   * one 'next', and statuses in journey order (done, now, next, planned, later).
   *
   * @example validateRoadmap(window.GTS_UPDATES.roadmap, ['van', ...]);  // -> []
   * @example validateRoadmap({ phases: [{ ...a, status: 'planned' }, { ...b, status: 'done' }] }, icons);
   *          // -> ['roadmap.phases[1] "b": status "done" comes after "planned"; ...', 'no phase is "now"']
   */
  function validateRoadmap(roadmap, knownIcons) {
    const problems = [];
    const phases = roadmap && roadmap.phases;
    if (!Array.isArray(phases) || phases.length === 0) {
      return ['roadmap.phases: needs at least one phase'];
    }
    const seen = new Set();
    let nowCount = 0;
    let nextCount = 0;
    let previousRank = 0;
    phases.forEach((phase, index) => {
      const at = `roadmap.phases[${index}]${phase && phase.id ? ` "${phase.id}"` : ''}`;
      if (!phase || typeof phase !== 'object') {
        problems.push(`${at}: should be { id, label, detail, icon, status }`);
        return;
      }
      reportUnknownKeys(phase, PHASE_KEYS, at, problems);
      if (!SLUG_PATTERN.test(phase.id)) {
        problems.push(`${at}: id should be kebab-case, e.g. live-trips`);
      } else if (seen.has(phase.id)) {
        problems.push(`${at}: id is used twice`);
      }
      seen.add(phase.id);
      for (const field of ['label', 'detail']) {
        if (!isFilled(phase[field])) {
          problems.push(`${at}: ${field} is missing`);
        }
      }
      if (!knownIcons.includes(phase.icon)) {
        problems.push(`${at}: unknown icon "${phase.icon}" (see js/icons.js)`);
      }
      const rank = PHASE_STATUS_ORDER.indexOf(phase.status);
      if (rank === -1) {
        problems.push(`${at}: status "${phase.status}" should be one of ${PHASE_STATUS_ORDER.join(', ')}`);
        return;
      }
      if (rank < previousRank) {
        problems.push(
          `${at}: status "${phase.status}" comes after "${PHASE_STATUS_ORDER[previousRank]}"; ` +
            `list phases in journey order (${PHASE_STATUS_ORDER.join(', ')})`,
        );
      }
      previousRank = Math.max(previousRank, rank);
      nowCount += phase.status === 'now' ? 1 : 0;
      nextCount += phase.status === 'next' ? 1 : 0;
    });
    const unfinished = phases.some((phase) => phase && ['next', 'planned'].includes(phase.status));
    if (nowCount > 1) {
      problems.push(`roadmap: ${nowCount} phases are "now"; exactly one is being built`);
    } else if (nowCount === 0 && unfinished) {
      problems.push('roadmap: no phase is "now"; mark the one being built');
    }
    if (nextCount > 1) {
      problems.push(`roadmap: ${nextCount} phases are "next"; mark the others "planned"`);
    }
    collectStrings(phases, 'roadmap.phases', problems);
    return problems;
  }

  /**
   * Checks the whole of window.GTS_UPDATES.
   *
   * @param {*} data window.GTS_UPDATES.
   * @param {{knownIcons: string[], fileExists?: (src: string) => boolean}} options
   * @returns {string[]} Problems; [] when clean.
   * @example validateUpdates(window.GTS_UPDATES, { knownIcons, fileExists });  // -> []
   * @example validateUpdates({ ...data, weeks: [week, { ...week }] }, options);
   *          // -> ['weeks[1] (2026-10-04): id is used twice', ...]
   * @example validateUpdates({ ...data, weeks: [older, newer] }, options);
   *          // -> ['weeks[1] (2026-10-11): newer than the week above it; newest goes first']
   * @example validateUpdates(undefined, options);  // -> ['window.GTS_UPDATES is not set ...']
   */
  function validateUpdates(data, options) {
    if (!data || typeof data !== 'object') {
      return ['window.GTS_UPDATES is not set; data/updates.js should assign it'];
    }
    const problems = [];
    problems.push(...validateAreas(data.areas));
    problems.push(...validateRoadmap(data.roadmap, options.knownIcons));

    const areaIds = Array.isArray(data.areas) ? data.areas.map((area) => area && area.id) : [];
    const phaseIds =
      data.roadmap && Array.isArray(data.roadmap.phases) ? data.roadmap.phases.map((phase) => phase && phase.id) : [];
    const weekOptions = { knownIcons: options.knownIcons, fileExists: options.fileExists, areaIds, phaseIds };

    if (!Array.isArray(data.weeks) || data.weeks.length === 0) {
      problems.push('weeks: needs at least one week');
      return problems;
    }
    const seenIds = new Set();
    data.weeks.forEach((week, index) => {
      const where = `weeks[${index}]${week && week.id ? ` (${week.id})` : ''}`;
      problems.push(...validateWeek(week, where, weekOptions));
      if (!week || typeof week.id !== 'string') {
        return;
      }
      if (seenIds.has(week.id)) {
        problems.push(`${where}: id is used twice`);
      }
      seenIds.add(week.id);
      // ids are yyyy-mm-dd, so plain string order is date order.
      const above = data.weeks[index - 1];
      if (above && typeof above.id === 'string' && week.id > above.id) {
        problems.push(`${where}: newer than the week above it; newest goes first`);
      }
    });
    return problems;
  }

  const api = { validateUpdates, validateWeek, findPrivateText, isRealDate, PHASE_STATUS_ORDER };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.GTS = root.GTS || {};
    root.GTS.validate = api;
  }
})(typeof window === 'undefined' ? globalThis : window);
