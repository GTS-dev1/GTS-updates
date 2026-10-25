# GTS Updates

Weekly build updates for **GTS (Go to Shore)**: safe school journeys, tracked live.
A static site (HTML, CSS, JavaScript; no build step, no framework) published with GitHub Pages. It
also opens straight from disk (`index.html`).

> **This repository is public.** It shows product progress only: what was built, screenshots and
> what comes next. Money, legal research, the business model, partner or pilot dates and anyone's
> personal data stay in the private app repository. `node tools/check-updates.js` flags text that
> looks private.

## Post a week

1. **Screenshots.** Put the week's phone screenshots in `assets/updates/<yyyy-mm-dd>/` (the Sunday
   the week ends on), as JPEGs about 720 px wide, with short kebab-case names
   (`sign-in-code.jpg`). Demo data only — made-up people, test numbers, the made-up route and the sample
   plate — and then **no blurring or covering**: screens go up exactly as filmed (Teja, 25 October
   2026: the founder read a blurred map as the app not working). **Videos:** an `.mp4` under 15 MB per video (the checker measures it), with a poster
   JPEG from the video beside it.
2. **Compose.** Open `compose.html` in a browser (double-click; it works offline). Fill in the week,
   the highlights (pick an icon and the areas), pick the screenshots and videos, caption each one
   (a screen that shows a problem fixed later says so), give rows a **Section** when there are many
   (rows with the same section show under one heading; more than 12 items start closed), and list
   what comes next. The preview is drawn by the real page renderer, and the box above it lists
   anything still missing. `progress` (honest estimates), `galleryNote` and `cover` are written by
   hand in `data/updates.js`; the schema at its top shows each with examples.
3. **Copy and paste.** Press **Copy entry** and paste the result at the top of `weeks` in
   `data/updates.js`, right after `weeks: [`.
4. **Roadmap.** If a phase finished, edit `roadmap.phases` in the same file: set it to `'done'`, and
   move `'now'` and `'next'` one stop along.
5. **Check.** `node tools/check-updates.js` must print `problems: 0`:

   ```
   $ node tools/check-updates.js
   updates: 3 weeks — problems: 0
   ```

6. **Preview.** Open `index.html` and look at the new week in light and dark mode (the moon/sun
   button), on a narrow window too.
7. **Commit** the screenshots and `data/updates.js` together.

The data schema (every field, with examples) is documented at the top of `data/updates.js`.

## What the page does

- **Hero:** what GTS is, the latest week, and progress to the pilot at a glance.
- **The journey:** every roadmap stop as a road (horizontal on wide screens, vertical on phones),
  then the features after the pilot. On wide screens each stop keeps a minimum width, so a long
  road scrolls sideways and opens with the stop being built in the middle.
- **Weekly updates:** newest first. The two newest weeks are open, older ones collapse to their
  header, and anything past six sits behind "Show older updates". A sticky week index (a "Jump to
  week" menu on phones) marks the week being read.
- **Progress estimates:** a week's `progress` figures show at the top of the week, and the newest
  week's also on the hero's card, with the line saying how they are measured.
- **Gallery:** phone-framed screenshots and videos. Items with a `group` show in sections with a
  heading and a count; a long gallery starts with its sections closed. Videos play in their frame
  and download nothing until played.
- **Permalinks:** `index.html#2026-10-04` opens that week, expanding it if needed, and highlights it;
  every week has a **Copy link** button.
- **Area filters:** Parents, Drivers, Safety & privacy, Design, Behind the scenes (from each
  highlight's `tags`).
- **Screenshot viewer:** arrow keys or swipe, Esc to close, pinch-zoom on phones.
- **Light and dark:** follows the system; the toggle remembers the choice. `?theme=light` or
  `?theme=dark` forces one (for screenshots).

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The page: containers that the scripts fill |
| `compose.html` | Local tool for writing a week (not linked from the page) |
| `data/updates.js` | The content: areas, roadmap and weekly entries, with the schema |
| `js/icons.js` | The icon sprite and the list of icon names content may use |
| `js/escape-html.js` | The one HTML escaper the renderers share |
| `js/gallery.js` | The week's gallery as HTML: phones, sections, videos, the hero's cover |
| `js/render.js` | Turns the data into HTML (used by the page and the compose preview) |
| `js/app.js` | Page behaviour: feed, collapse, permalinks, week index, filters |
| `js/lightbox.js` | Screenshot viewer |
| `js/theme.js` | Light/dark choice, applied before the first paint |
| `js/validate.js` | The rules an update must pass (used by the checker and compose) |
| `js/entry-source.js` | Writes a week as source text for compose's "Copy entry" |
| `js/compose.js` | The compose form |
| `tools/check-updates.js` | `node tools/check-updates.js`: checks the data before a commit |
| `css/` | `base` (colours, type, shared pieces), `hero`, `road`, `updates`, `gallery`, `lightbox`, `compose` |
| `assets/` | Favicon and screenshots |

## Add an icon or an area

- **Icon:** add a 24 x 24 drawing to `CONTENT_ICONS` in `js/icons.js`. It then appears in the
  compose picker and the checker accepts it.
- **Area:** add `{ id, label }` to `areas` in `data/updates.js`. It becomes a filter chip.

## Publish (one-time)

Repository **Settings → Pages → Build and deployment → Deploy from a branch → `main` / root**.
The page then lives at `https://gts-dev1.github.io/GTS-updates/`.
