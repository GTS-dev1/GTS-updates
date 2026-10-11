/**
 * Light and dark theme. Loaded in <head> (not deferred) so the right colours apply before the first
 * paint, with no white flash for a dark-mode reader.
 *
 * WHICH theme wins, in order:
 *   1. ?theme=light or ?theme=dark in the address (for screenshots and testing; not remembered);
 *   2. the reader's choice from the toggle button, remembered in localStorage;
 *   3. otherwise nothing is set and CSS follows the phone's or computer's setting.
 * HOW: sets data-theme="light|dark" on <html>; the colour tokens in css/base.css react to it.
 * Any button with [data-theme-toggle] flips between light and dark.
 */
(function applyTheme() {
  'use strict';

  /** localStorage key for the reader's choice: 'light' or 'dark'. */
  const STORAGE_KEY = 'gts-updates-theme';
  const THEMES = ['light', 'dark'];
  const html = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  /**
   * The remembered choice, or null. Storage can throw (private windows, blocked site data), so
   * every access is guarded and failure simply means "follow the system".
   *
   * @returns {'light'|'dark'|null}
   * @example readStoredTheme();  // -> 'dark'   the reader chose dark before
   * @example readStoredTheme();  // -> null     never chosen, or storage blocked
   */
  function readStoredTheme() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return THEMES.includes(stored) ? stored : null;
    } catch {
      return null;
    }
  }

  /**
   * Remembers the reader's choice when storage allows it.
   *
   * @example storeTheme('light');  // localStorage['gts-updates-theme'] = 'light'
   * @example storeTheme('dark');   // storage blocked -> nothing saved; the page still switches
   */
  function storeTheme(theme) {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage unavailable: the choice lasts until the page is closed, which is fine.
    }
  }

  /**
   * The theme on screen now, whether chosen or inherited from the system.
   *
   * @returns {'light'|'dark'}
   * @example effectiveTheme();  // data-theme="light" set -> 'light'
   * @example effectiveTheme();  // nothing set, system dark -> 'dark'
   */
  function effectiveTheme() {
    if (THEMES.includes(html.dataset.theme)) {
      return html.dataset.theme;
    }
    return systemDark.matches ? 'dark' : 'light';
  }

  /**
   * Makes every toggle button describe the action it will take ("Switch to dark theme").
   */
  function labelToggles() {
    const target = effectiveTheme() === 'dark' ? 'light' : 'dark';
    for (const button of document.querySelectorAll('[data-theme-toggle]')) {
      button.setAttribute('aria-label', `Switch to ${target} theme`);
      button.title = `Switch to ${target} theme`;
    }
  }

  const requested = new URLSearchParams(window.location.search).get('theme');
  const initial = THEMES.includes(requested) ? requested : readStoredTheme();
  if (initial) {
    html.dataset.theme = initial;
  }

  document.addEventListener('DOMContentLoaded', () => {
    labelToggles();
    document.addEventListener('click', (event) => {
      if (!event.target.closest('[data-theme-toggle]')) {
        return;
      }
      const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      html.dataset.theme = next;
      storeTheme(next);
      labelToggles();
    });
    // A reader who never chose follows the system live, so the label must too.
    systemDark.addEventListener('change', labelToggles);
  });
})();
