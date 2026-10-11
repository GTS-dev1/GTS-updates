/**
 * The content of the GTS updates page: the areas used to filter highlights, the roadmap, and one
 * entry per week, NEWEST FIRST. This is the only file you edit to post an update.
 *
 * WHY a script and not a .json file: the page then also works when opened straight from disk
 * (file://), where browsers block fetching JSON.
 *
 * PUBLIC REPOSITORY: product progress only. No money amounts, legal research, business model,
 * partner or pilot dates, phone numbers, email addresses or anyone's personal data.
 * `node tools/check-updates.js` checks the shape below and flags anything that looks private.
 *
 * ---------------------------------------------------------------------------------------------
 * HOW TO POST A WEEK (full steps in README.md)
 *   1. Screenshots -> assets/updates/<yyyy-mm-dd>/  (JPEG, about 720 px wide)
 *   2. Open compose.html, fill the form, press "Copy entry"
 *   3. Paste the entry at the TOP of `weeks` below
 *   4. node tools/check-updates.js   -> "problems: 0"
 *   5. Open index.html to look, then commit
 *
 * ---------------------------------------------------------------------------------------------
 * WEEK ENTRY SCHEMA (every field)
 *
 *   id         string, required. The day the week ends on, as yyyy-mm-dd. Also the permalink
 *              (index.html#2026-10-04) and the screenshot folder name. Unique.
 *              e.g. '2026-10-04'   '2026-10-11'
 *   dateLabel  string, required. How the date reads on the page.
 *              e.g. 'Week ending 4 October 2026'
 *   title      string, required. One plain sentence, no full stop.
 *              e.g. 'The app runs on a real phone'   'Sign-in works end to end'
 *   summary    string, required. Two or three sentences a parent could follow.
 *   phase      string, optional. The roadmap phase this week mostly moved: one of the `id`s in
 *              roadmap.phases. e.g. 'foundation'   'driver-setup'
 *   highlights array, required, 1 to 9 items. Each:
 *     icon     string, required. A name from js/icons.js (compose.html shows them all).
 *              e.g. 'radar'  'bell'  'shield'  'van'  'key'  'map-pin'
 *     title    string, required. Two to four words. e.g. 'Journey alerts'
 *     text     string, required. One or two sentences.
 *     tags     array, required, at least one id from `areas` below.
 *              e.g. ['parents']   ['safety', 'tech']
 *   gallery    array, required (may be []). Phone screenshots, shown in phone frames. Each:
 *     src      string, required. Path from the site root; the file must exist.
 *              e.g. 'assets/updates/2026-10-04/trip-arrived-dark.jpg'
 *     caption  string, required. Shown under the phone and in the viewer.
 *              e.g. 'Arrived: the van docks into home'
 *     alt      string, optional. Screen-reader text when it should say more than the caption;
 *              without it the caption is the alt text.
 *   feature    object, optional. One wide image (not a phone screen) shown after the gallery:
 *              { src, caption, alt? } with the same rules as a gallery item.
 *   next       array of strings, required, at least one. What the coming week is for.
 *              e.g. ['Sign in with a phone number and a one-time code']
 *
 * EXAMPLE (compose.html writes this for you; paste at the top of `weeks`):
 *
 *   {
 *     id: '2026-10-11',
 *     dateLabel: 'Week ending 11 October 2026',
 *     title: 'Sign-in works end to end',
 *     summary: 'Parents and drivers can now ...',
 *     phase: 'sign-in',
 *     highlights: [
 *       { icon: 'key', title: 'One-time code', text: 'Sign in with ...', tags: ['parents', 'drivers'] },
 *     ],
 *     gallery: [
 *       { src: 'assets/updates/2026-10-11/sign-in-code.jpg', caption: 'Typing the one-time code' },
 *     ],
 *     next: ['Driver setup: vehicle and papers'],
 *   },
 *
 * ---------------------------------------------------------------------------------------------
 * ROADMAP PHASE SCHEMA
 *   id      string, unique, kebab-case.  e.g. 'live-trips'
 *   label   string, the stop's name.      e.g. 'Live trips'
 *   detail  string, one short line.       e.g. 'Real GPS and a live map for parents'
 *   icon    string, a name from js/icons.js.
 *   status  'done'    finished
 *           'now'     being built (exactly one phase)
 *           'next'    the phase after the current one (at most one)
 *           'planned' on the way to the pilot, not started yet
 *           'later'   after the pilot, from the full product plan
 *   Phases are listed in journey order: every 'done' first, then 'now', 'next', 'planned', 'later'.
 *   When a phase finishes: set it to 'done' and move 'now' and 'next' one stop along.
 *
 * @example window.GTS_UPDATES.weeks[0].title;  // -> 'The app runs on a real phone'
 * @example window.GTS_UPDATES.roadmap.phases.find((p) => p.status === 'now').label;  // -> 'Driver setup'
 * @example window.GTS_UPDATES.areas.map((a) => a.id);
 *          // -> ['parents', 'drivers', 'safety', 'design', 'tech']
 */
window.GTS_UPDATES = {
  /**
   * The areas a highlight can belong to; they become the filter chips above the updates.
   * `id` is what a highlight's `tags` lists; `label` is what the chip says.
   */
  areas: [
    { id: 'parents', label: 'Parents' },
    { id: 'drivers', label: 'Drivers' },
    { id: 'safety', label: 'Safety & privacy' },
    { id: 'design', label: 'Design' },
    { id: 'tech', label: 'Behind the scenes' },
  ],

  /**
   * The whole product as a journey: the stops to the pilot with real families, then the features
   * from the full product plan that follow it. Drawn as the road on the page.
   */
  roadmap: {
    phases: [
      { id: 'foundation', label: 'Foundation', detail: 'App skeleton, journey alerts, design system', icon: 'phone', status: 'done' },
      { id: 'sign-in', label: 'Sign-in', detail: 'Phone number and one-time code, consent, roles', icon: 'key', status: 'done' },
      { id: 'driver-setup', label: 'Driver setup', detail: 'Vehicle, papers, schools, invite code', icon: 'van', status: 'now' },
      { id: 'gts-review', label: 'GTS review', detail: 'GTS staff check papers, approve or reject', icon: 'shield', status: 'next' },
      { id: 'parent-joins', label: 'Parent joins', detail: 'Invite code, child, pickup point', icon: 'users', status: 'planned' },
      { id: 'live-trips', label: 'Live trips', detail: 'Real GPS and a live map for parents', icon: 'map-pin', status: 'planned' },
      { id: 'alerts', label: 'Alerts', detail: 'Near home, reached and left school, delays, SOS', icon: 'bell', status: 'planned' },
      { id: 'settings-privacy', label: 'Settings & privacy', detail: 'Account deletion, grievance contact', icon: 'settings', status: 'planned' },
      { id: 'phone-testing', label: 'Testing on phones', detail: 'Many Android phones, real roads', icon: 'check', status: 'planned' },
      { id: 'pilot', label: 'Pilot', detail: 'Real families, real school runs', icon: 'school', status: 'planned' },
      { id: 'find-driver', label: 'Find a driver', detail: 'Parents look up drivers by school and area', icon: 'search', status: 'later' },
      { id: 'find-students', label: 'Find students', detail: 'Drivers see families looking for a ride', icon: 'users', status: 'later' },
      { id: 'messages', label: 'Messages', detail: 'Text and voice notes between parent and driver', icon: 'chat', status: 'later' },
      { id: 'ratings', label: 'Ratings & reviews', detail: 'Parents rate trips, drivers see feedback', icon: 'star', status: 'later' },
      { id: 'trip-records', label: 'Trip records', detail: 'A month of trips at a glance', icon: 'file', status: 'later' },
      { id: 'help', label: 'Help & support', detail: 'Help inside the app after an alert', icon: 'help', status: 'later' },
      { id: 'iphone', label: 'iPhone', detail: 'GTS on iPhone as well as Android', icon: 'phone', status: 'later' },
    ],
  },

  /** One entry per week, newest first. Paste a new week ABOVE the first one. */
  weeks: [
    {
      id: '2026-10-04',
      dateLabel: 'Week ending 4 October 2026',
      title: 'The app runs on a real phone',
      summary:
        "The first working build of GTS is running on an Android phone: a parent's live-trip " +
        'screen on demo data, the journey alerts behind it, English and Hindi, and a design ' +
        'made for GTS rather than a template.',
      phase: 'foundation',
      highlights: [
        {
          icon: 'radar',
          title: 'Proximity radar',
          text:
            'Home sits at the centre and the van approaches from its real direction. The 1 km ring ' +
            'lights up when the van is near, and the van "docks" into home on arrival.',
          tags: ['parents', 'design'],
        },
        {
          icon: 'bell',
          title: 'Journey alerts',
          text:
            'Reached school, left school, near home, reached home: detected on the phone and checked ' +
            'by 80 automated tests on every change.',
          tags: ['parents', 'safety', 'tech'],
        },
        {
          icon: 'sun',
          title: 'A living sky',
          text:
            'The background follows the time of day, with dawn for the morning run and dusk for the ' +
            'drive home, in both light and dark mode.',
          tags: ['design'],
        },
        {
          icon: 'language',
          title: 'English and Hindi',
          text:
            'Every screen in both languages, set in Anek, an Indian typeface with matching Latin and ' +
            'Devanagari letters.',
          tags: ['parents', 'drivers', 'design'],
        },
        {
          icon: 'phone',
          title: 'Made for real use',
          text:
            'The screen stays on while a parent watches a live trip, text is readable in sunlight, ' +
            "and the app respects the phone's reduced-motion setting.",
          tags: ['parents', 'design'],
        },
        {
          icon: 'shield',
          title: 'Safe foundations',
          text:
            'A test version and the real app install side by side, and the cloud database refuses ' +
            'every request until each rule is written and tested.',
          tags: ['safety', 'tech'],
        },
      ],
      gallery: [
        { src: 'assets/updates/2026-10-04/trip-on-the-way-dark.jpg', caption: 'Live trip: the van is on its way, about 5 minutes out' },
        { src: 'assets/updates/2026-10-04/trip-nearby-dark.jpg', caption: 'Within 1 km: the ring lights up and the parent is told to get ready' },
        { src: 'assets/updates/2026-10-04/trip-arrived-dark.jpg', caption: 'Arrived: the van docks into home' },
        { src: 'assets/updates/2026-10-04/start-dawn-light.jpg', caption: 'Start screen under the dawn sky (light mode)' },
        { src: 'assets/updates/2026-10-04/start-night-dark.jpg', caption: 'Start screen under the night sky (dark mode)' },
        { src: 'assets/updates/2026-10-04/trip-nearby-hindi.jpg', caption: 'The same moment in Hindi: 1.0 km, about 2 minutes away' },
      ],
      feature: {
        src: 'assets/updates/2026-10-04/living-sky-overview.jpg',
        caption: 'The living sky: dawn, day, dusk and night, in light mode (top) and dark mode (bottom)',
      },
      next: [
        'Sign in with a phone number and a one-time code',
        'Consent screens and account basics',
        'Separate journeys for parents and drivers',
      ],
    },
  ],
};
