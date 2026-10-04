# GTS Updates

Weekly development updates for **GTS (Go to Shore)** — safe school journeys, tracked live.
A static page (HTML, CSS, JavaScript; no build step) published with GitHub Pages.

> **This repository is public.** It shows product progress only: what was built, screenshots and
> what comes next. Costs, legal research, the business model, dates promised to partners and
> personal data stay in the private app repository.

## Add a new week

1. Put the week's screenshots in `assets/updates/<yyyy-mm-dd>/` as JPEGs about 720 px wide.
2. In `data/updates.js`, copy the first entry of `weeks`, paste it **at the top** of the list, and
   change its text and image paths.
3. If a phase finished, update `roadmap.currentPhase` and `roadmap.phaseProgress` (0–1).
4. Open `index.html` in a browser to check, then commit.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Page structure and the icon sprite |
| `css/styles.css` | Design: the GTS app's colours, night/day modes, living sky |
| `js/app.js` | Renders the roadmap, the weeks and the screenshot viewer |
| `data/updates.js` | The content: roadmap and weekly entries |
| `assets/` | Favicon and screenshots |

## Publish (one-time)

Repository **Settings → Pages → Build and deployment → Deploy from a branch → `main` / root**.
The page then lives at `https://gts-dev1.github.io/GTS-updates/`.
