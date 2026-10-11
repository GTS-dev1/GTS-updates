/**
 * The screenshot viewer: a full-screen <dialog> that shows one week's screenshots one at a time.
 *
 * WHO opens it: any click on a [data-shot] button (the phone frames and the wide feature image that
 * js/render.js draws). The set it steps through is every [data-shot] in the same week ([data-week]).
 * HOW to move: Left/Right arrow keys, the on-screen arrows, or a one-finger swipe on a phone.
 * Escape, the close button or a click on the dark area closes it, and focus returns to the
 * screenshot that opened it. Tab stays inside the viewer while it is open.
 * Pinch-zoom: the image allows the browser's own pinch-zoom; a swipe only counts when the page is
 * not zoomed, so panning a zoomed screenshot never jumps to the next one.
 */
(function defineLightbox(root) {
  'use strict';

  /** A horizontal finger movement shorter than this (CSS px) is a tap or a wobble, not a swipe. */
  const SWIPE_MIN_DISTANCE = 48;
  /** Pinch-zoom above this scale means the reader is inspecting, so swipes are ignored. */
  const ZOOMED_SCALE = 1.01;
  const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

  /**
   * Wires the viewer. Call once per page.
   *
   * @param {HTMLDialogElement} dialog The <dialog class="lightbox"> from the page.
   * @example GTS.lightbox.wire(document.getElementById('lightbox'));
   *          // click the 2nd phone of 4 October -> viewer shows 'Within 1 km…', counter '2 / 7'
   * @example // in the viewer: ArrowRight on the last screenshot -> wraps to the first ('1 / 7')
   * @example // a week with one screenshot -> the arrows are hidden and arrow keys do nothing
   */
  function wire(dialog) {
    const image = dialog.querySelector('.lightbox__image');
    const caption = dialog.querySelector('.lightbox__caption');
    const counter = dialog.querySelector('.lightbox__counter');
    const previous = dialog.querySelector('[data-lightbox-prev]');
    const next = dialog.querySelector('[data-lightbox-next]');
    const stage = dialog.querySelector('.lightbox__stage');

    let shots = [];
    let index = 0;
    let opener = null;

    /** Shows the screenshot at `newIndex`, wrapping at both ends, and preloads its neighbours. */
    function show(newIndex) {
      index = (newIndex + shots.length) % shots.length;
      const shot = shots[index];
      image.src = shot.dataset.src;
      image.alt = shot.dataset.alt || shot.dataset.caption || '';
      image.classList.toggle('is-wide', shot.classList.contains('feature__frame'));
      caption.textContent = shot.dataset.caption || '';
      counter.textContent = `${index + 1} / ${shots.length}`;
      for (const offset of [-1, 1]) {
        const neighbour = shots[(index + offset + shots.length) % shots.length];
        new Image().src = neighbour.dataset.src;
      }
    }

    function step(direction) {
      if (shots.length > 1) {
        show(index + direction);
      }
    }

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-shot]');
      if (!trigger) {
        return;
      }
      const scope = trigger.closest('[data-week]') || document;
      shots = Array.from(scope.querySelectorAll('[data-shot]'));
      opener = trigger;
      const single = shots.length < 2;
      previous.hidden = single;
      next.hidden = single;
      counter.hidden = single;
      show(shots.indexOf(trigger));
      dialog.showModal();
      dialog.querySelector('.lightbox__close').focus();
    });

    previous.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    dialog.querySelector('.lightbox__close').addEventListener('click', () => dialog.close());

    // A click on the dark area (the dialog or the stage itself, not the image or a button) closes.
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target === stage) {
        dialog.close();
      }
    });

    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        step(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        step(1);
      } else if (event.key === 'Tab') {
        trapFocus(event);
      }
    });

    // Return focus to the screenshot that opened the viewer (Escape closes natively).
    dialog.addEventListener('close', () => {
      image.removeAttribute('src');
      if (opener) {
        opener.focus();
      }
    });

    /** Keeps Tab and Shift+Tab cycling through the viewer's own buttons. */
    function trapFocus(event) {
      const focusable = Array.from(dialog.querySelectorAll(FOCUSABLE)).filter((element) => !element.hidden);
      if (focusable.length === 0) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    // Swipe: one finger, mostly sideways, page not pinch-zoomed.
    const activePointers = new Set();
    let swipeStart = null;
    stage.addEventListener('pointerdown', (event) => {
      activePointers.add(event.pointerId);
      swipeStart = activePointers.size === 1 && event.pointerType !== 'mouse' ? { x: event.clientX, y: event.clientY } : null;
    });
    const endPointer = (event) => {
      activePointers.delete(event.pointerId);
      if (!swipeStart || event.type === 'pointercancel') {
        swipeStart = null;
        return;
      }
      const deltaX = event.clientX - swipeStart.x;
      const deltaY = event.clientY - swipeStart.y;
      swipeStart = null;
      const zoomed = window.visualViewport && window.visualViewport.scale > ZOOMED_SCALE;
      if (!zoomed && Math.abs(deltaX) >= SWIPE_MIN_DISTANCE && Math.abs(deltaX) > Math.abs(deltaY)) {
        // Finger moved left -> the next screenshot slides in from the right.
        step(deltaX < 0 ? 1 : -1);
      }
    };
    stage.addEventListener('pointerup', endPointer);
    stage.addEventListener('pointercancel', endPointer);
  }

  root.GTS = root.GTS || {};
  root.GTS.lightbox = { wire };
})(window);
