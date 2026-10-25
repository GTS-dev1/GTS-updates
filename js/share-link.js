/**
 * The link to share one update: its own page, update.html?id=… (25 October 2026). Used by the
 * "Copy link" button on every update, on both index.html and update.html.
 *
 * WHY the single-update page, not index.html#id: the main page opens on the hero and the journey,
 * and an update shared with someone should open on that update alone (Teja: "I can share the
 * particular update link").
 */
(function defineShareLink(root) {
  'use strict';

  /** How long "Copied" shows on a copy-link button before it reads "Copy link" again (ms). */
  const COPIED_MS = 2000;

  /**
   * The address of update [id]'s own page, next to the page this runs on.
   *
   * @param {string} id A week id, e.g. '2026-10-25'.
   * @param {string} [from] The current address; defaults to the page's.
   * @returns {string}
   * @example linkTo('2026-10-25', 'https://gts-dev1.github.io/GTS-updates/')
   *          // -> 'https://gts-dev1.github.io/GTS-updates/update.html?id=2026-10-25'
   * @example linkTo('2026-10-25', 'https://gts-dev1.github.io/GTS-updates/index.html#updates')
   *          // -> 'https://gts-dev1.github.io/GTS-updates/update.html?id=2026-10-25'
   * @example linkTo('2026-10-20', 'file:///C:/GTS-updates/update.html?id=2026-10-25')
   *          // -> 'file:///C:/GTS-updates/update.html?id=2026-10-20'   (opened from disk)
   */
  function linkTo(id, from = root.location.href) {
    return new URL(`update.html?id=${encodeURIComponent(id)}`, from).href;
  }

  /**
   * Copies update [button.dataset.copyLink]'s own-page address and confirms on the button for
   * COPIED_MS. The Clipboard API needs a secure page; from file:// or an old browser a hidden
   * text field and the older copy command do the job instead.
   *
   * @param {HTMLButtonElement} button A [data-copy-link="2026-10-25"] button.
   * @example copy(button);  // clipboard: 'https://gts-dev1.github.io/GTS-updates/update.html?id=2026-10-25'
   * @example copy(button);  // opened from disk: 'file:///C:/…/update.html?id=2026-10-25'
   */
  function copy(button) {
    const url = linkTo(button.dataset.copyLink);
    const label = button.querySelector('span');
    const confirm = (text) => {
      label.textContent = text;
      root.setTimeout(() => {
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
    if (navigator.clipboard && root.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => confirm('Copied'), fallback);
    } else {
      fallback();
    }
  }

  root.GTS = root.GTS || {};
  root.GTS.shareLink = { linkTo, copy };
})(window);
