/**
 * The one HTML escaper every renderer uses (js/render.js for the page, js/gallery.js for the
 * screenshots and videos). It lives in its own file so both can load it without depending on each
 * other; js/render.js still offers it as `GTS.render.escapeHtml` for js/app.js and js/compose.js.
 *
 * WHEN it runs: on every piece of content text and every attribute value before it goes into
 * markup, so a quote or "<" in an update can never break the page.
 */
(function defineEscapeHtml(root) {
  'use strict';

  /**
   * Escapes text for safe insertion into HTML text and attribute values.
   *
   * @param {*} text Anything; null and undefined become ''.
   * @returns {string}
   * @example escapeHtml('The van "docks" <home>');  // -> 'The van &quot;docks&quot; &lt;home&gt;'
   * @example escapeHtml("Parent's view");           // -> 'Parent&#39;s view'
   * @example escapeHtml(82);                        // -> '82'   numbers become text
   * @example escapeHtml(undefined);                 // -> ''
   */
  function escapeHtml(text) {
    if (text === undefined || text === null) {
      return '';
    }
    return String(text)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  root.GTS = root.GTS || {};
  root.GTS.escapeHtml = escapeHtml;
})(window);
