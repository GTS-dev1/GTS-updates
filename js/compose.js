/**
 * compose.html: a form for writing one week's update, with a live preview drawn by the real
 * renderer (js/render.js) and a "Copy entry" button that produces the source to paste at the top
 * of `weeks` in data/updates.js (js/entry-source.js).
 *
 * WHO uses it: whoever posts the weekly update, opening compose.html straight from disk. It is
 * a local tool and is not linked from the public page.
 * HOW it works: one `state` object holds the form. Typing updates `state` and redraws only the
 * preview, the checks and the output (so the cursor never jumps); adding or removing a highlight
 * or screenshot redraws the form too. The draft is kept in localStorage, so closing the tab loses
 * nothing (when storage is available).
 * Screenshots: picking files from assets/updates/<date>/ fills their names and shows them in the
 * preview at once from memory, before they are committed; the entry stores only the path.
 * A row whose file is a video (.mp4, .webm) becomes a video item and uses the row's poster image.
 * A row's optional "Section" puts it under that heading (the gallery's `group`).
 */
(function composeUpdate() {
  'use strict';

  /** localStorage key for the draft (the whole `state` as JSON). */
  const DRAFT_KEY = 'gts-updates-compose-draft';
  /** Where a week's screenshots live; the date folder is added after it. */
  const ASSETS_ROOT = 'assets/updates/';
  /** Wait after the last keystroke before saving the draft (ms), so typing stays smooth. */
  const SAVE_DELAY_MS = 400;
  /** How long "Copied" shows on the copy button (ms). */
  const COPIED_MS = 2000;
  /** Sunday = 0 in Date.getDay(); weeks end on a Sunday. */
  const SUNDAY = 0;
  const DAYS_PER_WEEK = 7;
  /** A row's file is a video when its name ends like this (the formats js/validate.js accepts). */
  const VIDEO_FILE_PATTERN = /\.(mp4|webm)$/i;

  const { render, icons, validate, entrySource, lightbox } = window.GTS;
  const data = window.GTS_UPDATES || { areas: [], roadmap: { phases: [] }, weeks: [] };
  const lookups = render.indexData(data);
  /** Short name for the escaper; the form markup below uses it on every value. */
  const esc = render.escapeHtml;
  const areaIds = (data.areas || []).map((area) => area.id);
  const phaseIds = ((data.roadmap && data.roadmap.phases) || []).map((phase) => phase.id);
  const currentPhase = ((data.roadmap && data.roadmap.phases) || []).find((phase) => phase.status === 'now');

  /** Picked screenshot files by file name -> a temporary in-memory address for the preview. */
  const previewUrls = new Map();

  const form = document.getElementById('compose-form');
  const preview = document.getElementById('preview');
  const output = document.getElementById('output');
  const checks = document.getElementById('checks');

  let state = loadDraft() || blankState();
  let saveTimer = 0;

  icons.mount(document);
  lightbox.wire(document.getElementById('lightbox'));
  renderForm();
  refresh();

  form.addEventListener('input', onInput);
  form.addEventListener('change', onInput);
  form.addEventListener('click', onClick);
  document.getElementById('copy-entry').addEventListener('click', copyEntry);
  document.getElementById('reset-form').addEventListener('click', () => {
    if (window.confirm('Clear the form and start a new week?')) {
      state = blankState();
      renderForm();
      refresh();
    }
  });

  /**
   * The id of the week ending on the next Sunday (today, if today is Sunday), in local time.
   *
   * @param {Date} today
   * @returns {string}
   * @example nextSundayId(new Date(2026, 9, 11));  // Sunday            -> '2026-10-11'
   * @example nextSundayId(new Date(2026, 9, 7));   // Wednesday         -> '2026-10-11'
   * @example nextSundayId(new Date(2026, 11, 28)); // Monday, year end  -> '2027-01-03'
   */
  function nextSundayId(today) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    day.setDate(day.getDate() + ((SUNDAY - day.getDay() + DAYS_PER_WEEK) % DAYS_PER_WEEK));
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const date = String(day.getDate()).padStart(2, '0');
    return `${day.getFullYear()}-${month}-${date}`;
  }

  /** A highlight row with nothing filled in; `key` keeps radio-button groups apart. */
  function blankHighlight() {
    return { key: uniqueKey(), icon: '', title: '', text: '', tags: [] };
  }

  /**
   * A gallery row: `file` is the name in the week's folder, e.g. 'sign-in-code.jpg' or
   * 'live-trip.mp4'; `group` the optional section heading; `poster` the picture a video shows
   * before it plays (ignored for screenshots).
   */
  function blankShot(file) {
    return { key: uniqueKey(), file: file || '', caption: '', alt: '', group: '', poster: '' };
  }

  /**
   * A new, empty week for the coming Sunday, set to the phase being built.
   *
   * @example blankState().id;     // -> '2026-10-11' on any day from 5 to 11 October 2026
   * @example blankState().phase;  // -> 'driver-setup'  (the roadmap's 'now' phase)
   */
  function blankState() {
    const id = nextSundayId(new Date());
    return {
      id,
      dateLabel: render.weekLabel(id),
      dateLabelEdited: false,
      title: '',
      summary: '',
      phase: currentPhase ? currentPhase.id : '',
      highlights: [blankHighlight()],
      gallery: [],
      feature: { file: '', caption: '', alt: '' },
      next: '',
    };
  }

  /** A short random id for form controls, e.g. 'k3f9a1'. */
  function uniqueKey() {
    return `k${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * The saved draft, or null when there is none or storage is unavailable.
   *
   * @example loadDraft();  // -> { id: '2026-10-11', title: 'Sign-in works…', … }
   * @example loadDraft();  // private window / nothing saved / damaged JSON -> null
   */
  function loadDraft() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(DRAFT_KEY));
      return saved && typeof saved.id === 'string' && Array.isArray(saved.highlights) ? saved : null;
    } catch {
      return null;
    }
  }

  /** Saves the draft SAVE_DELAY_MS after the last change; silently skipped without storage. */
  function scheduleSave() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
      } catch {
        // No storage (private window, blocked site data): the draft lives until the tab closes.
      }
    }, SAVE_DELAY_MS);
  }

  /**
   * The path stored in the entry for a screenshot file name. A name that already contains a '/'
   * is taken as a full path from the site root.
   *
   * @example screenshotPath('otp.jpg', '2026-10-11');                        // -> 'assets/updates/2026-10-11/otp.jpg'
   * @example screenshotPath('assets/updates/2026-10-04/a.jpg', '2026-10-11'); // -> unchanged
   * @example screenshotPath('  ', '2026-10-11');                             // -> ''
   */
  function screenshotPath(file, id) {
    const name = file.trim();
    if (!name) {
      return '';
    }
    return name.includes('/') ? name : `${ASSETS_ROOT}${id}/${name}`;
  }

  /**
   * The week entry the form describes, in the data/updates.js shape. Optional fields that are
   * empty are left out; required ones stay (even empty) so the checks can point at them.
   *
   * @example buildEntry().gallery;  // -> [{ src: 'assets/updates/2026-10-11/otp.jpg', caption: 'Typing the code' }]
   * @example buildEntry().gallery;  // a row 'live-trip.mp4', poster 'live-trip.jpg', section 'Live trips'
   *          // -> [{ video: 'assets/updates/2026-10-25/live-trip.mp4', poster: 'assets/updates/2026-10-25/live-trip.jpg',
   *          //       caption: 'A whole trip', group: 'Live trips' }]
   * @example buildEntry().phase;    // phase select set to '(none)' -> undefined, so the field is left out
   * @example buildEntry().next;     // textarea 'Driver setup\n\nGTS review' -> ['Driver setup', 'GTS review']
   */
  function buildEntry() {
    // WHY `|| ''`: drafts saved before rows had a section or a poster lack those fields.
    const image = (row) => {
      const result = { src: screenshotPath(row.file, state.id), caption: row.caption.trim() };
      if (row.alt.trim()) {
        result.alt = row.alt.trim();
      }
      return result;
    };
    const galleryItem = (row) => {
      const result = VIDEO_FILE_PATTERN.test(row.file.trim())
        ? {
            video: screenshotPath(row.file, state.id),
            poster: screenshotPath(row.poster || '', state.id),
            caption: row.caption.trim(),
          }
        : image(row);
      if (result.video !== undefined && row.alt.trim()) {
        result.alt = row.alt.trim();
      }
      if ((row.group || '').trim()) {
        result.group = row.group.trim();
      }
      return result;
    };
    const entry = {
      id: state.id,
      dateLabel: state.dateLabel.trim(),
      title: state.title.trim(),
      summary: state.summary.trim().replace(/\s+/g, ' '),
      phase: state.phase || undefined,
      highlights: state.highlights.map((item) => ({
        icon: item.icon,
        title: item.title.trim(),
        text: item.text.trim().replace(/\s+/g, ' '),
        tags: areaIds.filter((id) => item.tags.includes(id)),
      })),
      gallery: state.gallery.map(galleryItem),
      feature: state.feature.file.trim() ? image(state.feature) : undefined,
      next: state.next.split('\n').map((line) => line.trim()).filter(Boolean),
    };
    if (!entry.phase) {
      delete entry.phase;
    }
    if (!entry.feature) {
      delete entry.feature;
    }
    return entry;
  }

  /**
   * The checks shown under the form: the shared rules (js/validate.js) plus two that need the
   * existing data: the id must be new, and newer than the latest posted week.
   *
   * @example weekProblems(entry);  // -> []   ready to copy
   * @example weekProblems({ ...entry, id: '2026-10-04' });
   *          // -> ['This week: id 2026-10-04 is already posted', 'This week: … is not newer than …']
   */
  function weekProblems(entry) {
    const problems = validate.validateWeek(entry, 'This week', {
      knownIcons: icons.contentNames,
      areaIds,
      phaseIds,
    });
    const latest = data.weeks && data.weeks[0];
    if ((data.weeks || []).some((week) => week.id === entry.id)) {
      problems.unshift(`This week: id ${entry.id} is already posted; pick the new week's date`);
    } else if (latest && entry.id <= latest.id) {
      problems.unshift(`This week: ${entry.id} is not newer than the latest week (${latest.id}); it would not go at the top`);
    }
    return problems;
  }

  /** Redraws the preview, the checks and the source text from `state`, and saves the draft. */
  function refresh() {
    const entry = buildEntry();
    const resolveSrc = (src) => previewUrls.get(String(src).split('/').pop()) || src;
    preview.innerHTML =
      `<div class="preview__latest">${render.renderLatest(entry, { resolveSrc })}</div>` +
      `<div class="feed">${render.renderWeek(entry, { ...lookups, number: (data.weeks || []).length + 1, resolveSrc })}</div>`;

    const problems = weekProblems(entry);
    checks.dataset.state = problems.length ? 'problems' : 'clean';
    checks.innerHTML = problems.length
      ? `<p class="checks__title">${problems.length} thing${problems.length === 1 ? '' : 's'} to fix before posting</p>
         <ul>${problems.map((problem) => `<li>${render.escapeHtml(problem.replace(/^This week:? ?/, ''))}</li>`).join('')}</ul>`
      : '<p class="checks__title">Ready: no problems found. Copy the entry and paste it at the top of <code>weeks</code>.</p>';

    output.value = entrySource(entry);
    scheduleSave();
  }

  /**
   * Writes a form control's value into `state`. Controls name their place with data-bind:
   * 'title', 'highlights.2.text', 'gallery.0.caption', 'feature.file'. Checkboxes add or remove
   * their value in a list ('highlights.0.tags').
   *
   * @example // typing 'Code' in [data-bind="highlights.1.title"] -> state.highlights[1].title = 'Code'
   * @example // ticking Drivers in [data-bind="highlights.0.tags"] -> 'drivers' added to state.highlights[0].tags
   * @example // changing the date -> state.id = '2026-10-18' and, unless edited by hand, dateLabel follows
   */
  function onInput(event) {
    const control = event.target;
    const bind = control.dataset && control.dataset.bind;
    if (control.type === 'file') {
      if (event.type === 'change') {
        addPickedFiles(control);
      }
      return;
    }
    if (!bind) {
      return;
    }
    const keys = bind.split('.');
    const field = keys.pop();
    let target = state;
    for (const key of keys) {
      target = target[key];
    }
    if (control.type === 'checkbox') {
      const list = target[field];
      const at = list.indexOf(control.value);
      if (control.checked && at === -1) {
        list.push(control.value);
      } else if (!control.checked && at !== -1) {
        list.splice(at, 1);
      }
    } else if (control.type === 'radio') {
      if (control.checked) {
        target[field] = control.value;
      }
    } else {
      target[field] = control.value;
    }

    if (bind === 'id') {
      if (!state.dateLabelEdited) {
        state.dateLabel = render.weekLabel(state.id);
        form.querySelector('[data-bind="dateLabel"]').value = state.dateLabel;
      }
      // The folder hint under the screenshot picker names the week's folder.
      form.querySelectorAll('[data-folder]').forEach((element) => {
        element.textContent = `${ASSETS_ROOT}${state.id}/`;
      });
    } else if (bind === 'dateLabel') {
      state.dateLabelEdited = true;
    }
    refresh();
  }

  /** Add, remove and move buttons in the form. */
  function onClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button) {
      return;
    }
    const list = button.dataset.list ? state[button.dataset.list] : null;
    const index = Number(button.dataset.index);
    switch (button.dataset.action) {
      case 'add-highlight':
        state.highlights.push(blankHighlight());
        break;
      case 'add-shot':
        state.gallery.push(blankShot());
        break;
      case 'remove':
        list.splice(index, 1);
        break;
      case 'up':
        if (index > 0) {
          [list[index - 1], list[index]] = [list[index], list[index - 1]];
        }
        break;
      case 'down':
        if (index < list.length - 1) {
          [list[index + 1], list[index]] = [list[index], list[index + 1]];
        }
        break;
      default:
        return;
    }
    renderForm();
    refresh();
  }

  /**
   * Turns picked files into screenshot rows (one per file not already listed) and keeps an
   * in-memory copy of each for the preview.
   *
   * @example // pick otp.jpg and role.jpg -> two rows, captions empty, both visible in the preview
   * @example // pick otp.jpg again        -> no new row; its preview is refreshed
   */
  function addPickedFiles(input) {
    for (const file of input.files) {
      if (previewUrls.has(file.name)) {
        URL.revokeObjectURL(previewUrls.get(file.name));
      }
      previewUrls.set(file.name, URL.createObjectURL(file));
      if (!state.gallery.some((row) => row.file === file.name)) {
        state.gallery.push(blankShot(file.name));
      }
    }
    input.value = '';
    renderForm();
    refresh();
  }

  /** Copies the source text; falls back to selecting it for Ctrl+C where copying is blocked. */
  function copyEntry() {
    const button = document.getElementById('copy-entry');
    const label = button.querySelector('span');
    const confirm = (text) => {
      label.textContent = text;
      window.setTimeout(() => {
        label.textContent = 'Copy entry';
      }, COPIED_MS);
    };
    const fallback = () => {
      output.focus();
      output.select();
      confirm(document.execCommand('copy') ? 'Copied' : 'Selected: press Ctrl+C');
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(output.value).then(() => confirm('Copied'), fallback);
    } else {
      fallback();
    }
  }

  // ---------- Form markup ----------

  /**
   * A small icon button for a list row (move up, move down, remove).
   *
   * @example rowButton('remove', 'highlights', 2, 'trash', 'Remove highlight 3');
   */
  function rowButton(action, list, index, icon, label) {
    return `<button type="button" class="icon-button icon-button--small" data-action="${action}" data-list="${list}"
              data-index="${index}" aria-label="${esc(label)}" title="${esc(label)}">${icons.svg(icon)}</button>`;
  }

  /** The move-up / move-down / remove buttons for row `index` of a list of `count`. */
  function rowTools(list, index, count, noun) {
    return `<div class="row-tools">
        ${index > 0 ? rowButton('up', list, index, 'chevron-up', `Move ${noun} ${index + 1} up`) : ''}
        ${index < count - 1 ? rowButton('down', list, index, 'chevron-down', `Move ${noun} ${index + 1} down`) : ''}
        ${rowButton('remove', list, index, 'trash', `Remove ${noun} ${index + 1}`)}
      </div>`;
  }

  /** One highlight's fieldset: icon picker, title, text and area tags. */
  function highlightFieldset(item, index) {
    const iconChoices = icons.contentNames
      .map(
        (name) => `
          <label class="icon-choice" title="${name}">
            <input type="radio" name="icon-${item.key}" value="${name}" data-bind="highlights.${index}.icon"${item.icon === name ? ' checked' : ''} />
            ${icons.svg(name)}<span class="visually-hidden">${name}</span>
          </label>`,
      )
      .join('');
    const tagChoices = (data.areas || [])
      .map(
        (area) => `
          <label class="tag-choice">
            <input type="checkbox" value="${esc(area.id)}" data-bind="highlights.${index}.tags"${item.tags.includes(area.id) ? ' checked' : ''} />
            <span>${esc(area.label)}</span>
          </label>`,
      )
      .join('');
    return `
      <fieldset class="row">
        <legend>Highlight ${index + 1}${item.icon ? ` · ${esc(item.icon)}` : ''}</legend>
        ${rowTools('highlights', index, state.highlights.length, 'highlight')}
        <div class="field">
          <span class="field__label" id="icons-${item.key}">Icon</span>
          <div class="icon-grid" role="radiogroup" aria-labelledby="icons-${item.key}">${iconChoices}</div>
        </div>
        <label class="field"><span class="field__label">Title <small>two to four words</small></span>
          <input type="text" data-bind="highlights.${index}.title" value="${esc(item.title)}" placeholder="Journey alerts" /></label>
        <label class="field"><span class="field__label">Text <small>one or two sentences</small></span>
          <textarea rows="3" data-bind="highlights.${index}.text" placeholder="What changed, in words a parent would use.">${esc(item.text)}</textarea></label>
        <div class="field"><span class="field__label">Areas</span><div class="tag-grid">${tagChoices}</div></div>
      </fieldset>`;
  }

  /**
   * One gallery row: file name, caption, optional section, optional alt text, and the poster for
   * a video. The thumbnail shows the screenshot, or the poster of a video.
   *
   * @example shotFieldset({ file: 'j6-03-battery-guide.jpg', caption: 'Keep GTS running', group: 'Starting a trip', … }, 2);
   *          // 'Screenshot or video 3' with the battery guide as its thumbnail
   * @example shotFieldset({ file: 'live-trip.mp4', poster: 'live-trip.jpg', … }, 0);
   *          // thumbnail = the poster
   */
  function shotFieldset(row, index) {
    const pictureFile = VIDEO_FILE_PATTERN.test(row.file) ? row.poster || '' : row.file;
    const thumb = previewUrls.get(pictureFile) || (pictureFile ? screenshotPath(pictureFile, state.id) : '');
    return `
      <fieldset class="row row--shot">
        <legend>Screenshot or video ${index + 1}</legend>
        ${rowTools('gallery', index, state.gallery.length, 'screenshot')}
        <div class="shot-row">
          <span class="shot-row__thumb">${thumb ? `<img src="${esc(thumb)}" alt="" />` : icons.svg('image')}</span>
          <div class="shot-row__fields">
            <label class="field"><span class="field__label">File name</span>
              <input type="text" data-bind="gallery.${index}.file" value="${esc(row.file)}" placeholder="sign-in-code.jpg" /></label>
            <label class="field"><span class="field__label">Caption</span>
              <input type="text" data-bind="gallery.${index}.caption" value="${esc(row.caption)}" placeholder="Typing the one-time code" /></label>
            <label class="field"><span class="field__label">Section <small>optional; rows with the same section show under one heading</small></span>
              <input type="text" data-bind="gallery.${index}.group" value="${esc(row.group || '')}" placeholder="Starting a trip" /></label>
            <label class="field"><span class="field__label">Alt text <small>optional; the caption is used without it</small></span>
              <input type="text" data-bind="gallery.${index}.alt" value="${esc(row.alt)}" /></label>
            <label class="field"><span class="field__label">Poster image <small>videos only: the picture shown before it plays</small></span>
              <input type="text" data-bind="gallery.${index}.poster" value="${esc(row.poster || '')}" placeholder="live-trip.jpg" /></label>
          </div>
        </div>
      </fieldset>`;
  }

  /** Draws the whole form from `state`. Called on load and after rows are added or removed. */
  function renderForm() {
    const phaseOptions = ((data.roadmap && data.roadmap.phases) || [])
      .map((phase) => `<option value="${esc(phase.id)}"${state.phase === phase.id ? ' selected' : ''}>${esc(phase.label)} (${esc(phase.status)})</option>`)
      .join('');
    form.innerHTML = `
      <section class="panel">
        <h2 class="panel__title">1 · The week</h2>
        <div class="field-pair">
          <label class="field"><span class="field__label">Week ends on</span>
            <input type="date" data-bind="id" value="${esc(state.id)}" required /></label>
          <label class="field"><span class="field__label">Date label</span>
            <input type="text" data-bind="dateLabel" value="${esc(state.dateLabel)}" /></label>
        </div>
        <label class="field"><span class="field__label">Title <small>one plain sentence, no full stop</small></span>
          <input type="text" data-bind="title" value="${esc(state.title)}" placeholder="Sign-in works end to end" /></label>
        <label class="field"><span class="field__label">Summary <small>two or three sentences a parent could follow</small></span>
          <textarea rows="4" data-bind="summary">${esc(state.summary)}</textarea></label>
        <label class="field"><span class="field__label">Roadmap phase <small>the stop this week mostly moved</small></span>
          <select data-bind="phase"><option value="">(none)</option>${phaseOptions}</select></label>
      </section>

      <section class="panel">
        <h2 class="panel__title">2 · Highlights</h2>
        ${state.highlights.map(highlightFieldset).join('')}
        <button type="button" class="button" data-action="add-highlight">${icons.svg('plus')}<span>Add a highlight</span></button>
      </section>

      <section class="panel">
        <h2 class="panel__title">3 · Screenshots</h2>
        <p class="panel__hint">Put the JPEGs in <code data-folder>${esc(ASSETS_ROOT + state.id)}/</code> first, then pick them here
          (they show in the preview straight away). Phone screenshots, about 720 px wide. Videos: .mp4 under 15 MB,
          with a poster JPEG beside them.</p>
        <label class="button button--file">${icons.svg('image')}<span>Pick screenshots or videos…</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple class="visually-hidden" /></label>
        ${state.gallery.map(shotFieldset).join('')}
        <button type="button" class="button button--quiet" data-action="add-shot">${icons.svg('plus')}<span>Add a row by hand</span></button>
        <fieldset class="row">
          <legend>Wide image <small>optional, not a phone screen</small></legend>
          <label class="field"><span class="field__label">File name</span>
            <input type="text" data-bind="feature.file" value="${esc(state.feature.file)}" placeholder="all-screens-overview.jpg" /></label>
          <label class="field"><span class="field__label">Caption</span>
            <input type="text" data-bind="feature.caption" value="${esc(state.feature.caption)}" /></label>
          <label class="field"><span class="field__label">Alt text <small>optional</small></span>
            <input type="text" data-bind="feature.alt" value="${esc(state.feature.alt)}" /></label>
        </fieldset>
      </section>

      <section class="panel">
        <h2 class="panel__title">4 · Coming next</h2>
        <label class="field"><span class="field__label">One item per line</span>
          <textarea rows="4" data-bind="next" placeholder="GTS staff review a driver's papers">${esc(state.next)}</textarea></label>
      </section>`;
  }
})();
