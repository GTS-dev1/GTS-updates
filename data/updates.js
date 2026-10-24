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
 *   progress   object, optional. Honest estimates, shown at the top of the week and, for the
 *              newest week, on the hero's card:
 *     estimates  array, 1 to 4 items, each { label, value } (both strings).
 *                e.g. { label: 'First release (pilot)', value: 'about 40–45%' }
 *                     { label: 'Whole product', value: 'about 25%' }
 *     note       string, required. How the figures are measured.
 *                e.g. 'Only features working for families on real phones count as done'
 *   highlights array, required, 1 to 9 items. Each:
 *     icon     string, required. A name from js/icons.js (compose.html shows them all).
 *              e.g. 'radar'  'bell'  'shield'  'van'  'key'  'map-pin'
 *     title    string, required. Two to four words. e.g. 'Journey alerts'
 *     text     string, required. One or two sentences.
 *     tags     array, required, at least one id from `areas` below.
 *              e.g. ['parents']   ['safety', 'tech']
 *   gallery    array, required (may be []). Phone screenshots and screen-recording videos, shown
 *              in phone frames. A SCREENSHOT is:
 *     src      string, required. Path from the site root; the file must exist (.jpg .png .webp).
 *              e.g. 'assets/updates/2026-10-04/trip-arrived-dark.jpg'
 *     caption  string, required. Shown under the phone and in the viewer.
 *              e.g. 'Arrived: the van docks into home'
 *              A screen that shows a problem fixed later says so:
 *              e.g. 'Dates filled in, but shown without the year (found in the live run, fixed the same day)'
 *     alt      string, optional. Screen-reader text when it should say more than the caption;
 *              without it the caption is the alt text.
 *     group    string, optional. The section the item belongs to; neighbouring items with the same
 *              group show under one heading. Keep a section's items together. Without any group
 *              the gallery is one grid, as before; a grouped gallery of more than 12 items starts
 *              with its sections closed.
 *              e.g. 'Sign-up and privacy'   'Starting a trip: battery and location'
 *              A VIDEO is { video, poster, caption, alt?, group?, download? }:
 *     video    string, required. An .mp4 (or .webm) under assets/, at most 15 MB (GitHub Pages;
 *              tools/check-updates.js measures it). It plays in its phone frame; nothing downloads
 *              until play is pressed.
 *              e.g. 'assets/updates/2026-10-25/live-trip.mp4'
 *     poster   string, required. A JPEG shown before the video plays (a frame from it, 720 px wide).
 *              e.g. 'assets/updates/2026-10-25/live-trip.jpg'
 *     download string, optional. The same video at full resolution, offered as a "Full resolution"
 *              link under the caption (fetched only when tapped), at most 50 MB.
 *              e.g. 'assets/updates/2026-10-18/full-demo-hd.mp4'
 *   galleryNote string, optional. One line above the gallery, e.g. what is hidden in the screens.
 *              e.g. 'Number plates and map details are hidden; names are made-up test data.'
 *   cover      string, optional. The picture on the hero's "latest update" card: one of this week's
 *              screenshots or video posters. Without it the first screenshot is used.
 *              e.g. 'assets/updates/2026-10-18/j6-20-home-trip-in-progress.jpg'
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
 *     progress: { estimates: [{ label: 'Whole product', value: 'about 10%' }], note: 'Only …' },
 *     highlights: [
 *       { icon: 'key', title: 'One-time code', text: 'Sign in with ...', tags: ['parents', 'drivers'] },
 *     ],
 *     gallery: [
 *       { src: 'assets/updates/2026-10-11/sign-in-code.jpg', caption: 'Typing the one-time code', group: 'Sign-in' },
 *       { video: 'assets/updates/2026-10-11/sign-in.mp4', poster: 'assets/updates/2026-10-11/sign-in.jpg',
 *         caption: 'Signing in, start to finish', group: 'Sign-in' },
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
 * @example window.GTS_UPDATES.weeks[0].title;  // -> 'Live trips, parents joining and a stronger vehicle check'
 * @example window.GTS_UPDATES.roadmap.phases.find((p) => p.status === 'now').label;  // -> 'Live trips'
 * @example window.GTS_UPDATES.weeks[0].progress.estimates[1].value;  // -> 'about 25%'
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
      { id: 'driver-setup', label: 'Driver setup', detail: 'Vehicle, papers, schools, invite code', icon: 'van', status: 'done' },
      { id: 'gts-review', label: 'GTS review', detail: 'GTS staff check papers, approve or reject', icon: 'shield', status: 'done' },
      { id: 'parent-joins', label: 'Parent joins', detail: 'Invite code, child, pickup point', icon: 'users', status: 'done' },
      { id: 'live-trips', label: 'Live trips', detail: 'Real GPS and a live map, even after a swipe', icon: 'map-pin', status: 'done' },
      { id: 'find-driver', label: 'Finding a ride', detail: 'Parents find drivers, drivers find families', icon: 'search', status: 'done' },
      { id: 'monthly-fees', label: 'Monthly fees', detail: 'By UPI or cash, recorded and confirmed', icon: 'calendar', status: 'done' },
      { id: 'messages', label: 'Messages, ratings', detail: 'A chat per child; parents rate trips', icon: 'chat', status: 'done' },
      { id: 'languages', label: 'Languages', detail: 'English and 22 Indian languages', icon: 'language', status: 'done' },
      { id: 'alerts', label: 'Alerts', detail: 'Push with GTS closed, no signal, SOS', icon: 'bell', status: 'now' },
      { id: 'settings-privacy', label: 'Settings & privacy', detail: 'Account deletion, grievance, help desk', icon: 'settings', status: 'next' },
      { id: 'cloud-backend', label: 'Cloud backend', detail: 'Firebase in Mumbai: push, real SMS', icon: 'code', status: 'planned' },
      { id: 'phone-testing', label: 'Testing on phones', detail: 'Many Android phones, real roads', icon: 'check', status: 'planned' },
      { id: 'pilot', label: 'Pilot', detail: 'Real families, real school runs', icon: 'school', status: 'planned' },
      { id: 'trip-records', label: 'Trip records', detail: 'A month of trips at a glance', icon: 'file', status: 'later' },
      { id: 'voice-notes', label: 'Voice notes', detail: 'Voice messages between parent and driver', icon: 'chat', status: 'later' },
      { id: 'iphone', label: 'iPhone', detail: 'GTS on iPhone as well as Android', icon: 'phone', status: 'later' },
    ],
  },

  /** One entry per week, newest first. Paste a new week ABOVE the first one. */
  weeks: [
    {
      id: '2026-10-25',
      dateLabel: '24–25 October 2026',
      title: 'A safer SOS button, screens that load in shape, and tidier foundations',
      summary:
        'Raising an SOS now takes a 3-second hold, so a phone pulled from a pocket cannot raise one ' +
        'by mistake; people who use a screen reader get a 5-second countdown they can cancel. The ' +
        'live trip shows its own outline while it loads, and the rating questions are written in ' +
        'full at the largest text size. Behind the scenes, a review of the code finished its most ' +
        "important items, and a failure on GTS's server is now logged as the step and an error " +
        'code only. Everything still runs against a test backend on a laptop, so families cannot ' +
        'use it yet.',
      phase: 'alerts',
      progress: {
        estimates: [
          { label: 'First release (pilot)', value: 'about 55%' },
          { label: 'Whole product', value: 'about 50%' },
        ],
        note:
          'Unchanged this week: the work made what exists safer and clearer rather than adding ' +
          'features. Built and tested on the laptop counts toward building only',
      },
      highlights: [
        {
          icon: 'sos',
          title: 'Hold to raise SOS',
          text:
            'A 3-second hold with a light buzz at each quarter; lifting early raises nothing and says ' +
            'so. With a screen reader, a double-tap starts a countdown a second tap cancels. Call 112 ' +
            'stays one tap away.',
          tags: ['safety', 'parents', 'design'],
        },
        {
          icon: 'clock',
          title: 'Loading in shape',
          text:
            'While a trip is being fetched, the live trip shows its outline — the header, the radar, ' +
            'the distance and the buttons — so nothing jumps when it fills in.',
          tags: ['parents', 'design'],
        },
        {
          icon: 'star',
          title: 'Ratings at any size',
          text:
            "The rating screen's questions sit above their boxes, so at the largest text size they " +
            'are written in full instead of ending in "…".',
          tags: ['parents', 'design'],
        },
        {
          icon: 'lock',
          title: 'Logs without details',
          text:
            "When a step on GTS's server fails, its log names the step and a short error code — " +
            'never the names or record numbers inside the failed request.',
          tags: ['safety', 'tech'],
        },
        {
          icon: 'code',
          title: 'Tidier foundations',
          text:
            'A review of the code finished its most important items: what a notification opens, what ' +
            'keeps the reminders and which screen each address shows are each one clear, tested piece.',
          tags: ['tech'],
        },
      ],
      gallery: [
        { src: 'assets/updates/2026-10-25/oct24-01-sos-holding.jpg', caption: 'Raising an SOS now takes a 3-second hold: half way, the fill has crossed half the button and it says "Keep holding…"', group: 'Added on 24 October: hold to raise SOS, clearer loading and rating' },
        { src: 'assets/updates/2026-10-25/oct24-02-sos-released-early.jpg', caption: 'A quick tap raises nothing, and says why: "Released too soon. Hold for 3 seconds to raise SOS."', group: 'Added on 24 October: hold to raise SOS, clearer loading and rating' },
        { src: 'assets/updates/2026-10-25/oct24-03-sos-holding-night.jpg', caption: 'The same hold at night', group: 'Added on 24 October: hold to raise SOS, clearer loading and rating' },
        { src: 'assets/updates/2026-10-25/oct24-04-sos-holding-hindi.jpg', caption: 'In Hindi', group: 'Added on 24 October: hold to raise SOS, clearer loading and rating' },
        { src: 'assets/updates/2026-10-25/oct24-05-live-loading.jpg', caption: 'While a trip is being fetched, the live trip shows its own outline instead of a spinner', group: 'Added on 24 October: hold to raise SOS, clearer loading and rating' },
        { src: 'assets/updates/2026-10-25/oct24-06-live-loading-night.jpg', caption: 'The outline at night', group: 'Added on 24 October: hold to raise SOS, clearer loading and rating' },
        { src: 'assets/updates/2026-10-25/oct24-07-rate-largest-text.jpg', caption: 'At the largest text size the rating questions sit above their boxes and are written in full', group: 'Added on 24 October: hold to raise SOS, clearer loading and rating' },
      ],
      galleryNote:
        "These stills are drawn by the app's own screen gallery on the laptop, not filmed on a phone; " +
        'names and places are made-up test data.',
      cover: 'assets/updates/2026-10-25/oct24-01-sos-holding.jpg',
      next: [
        'SOS: the three reasons as big tiles, and a clearer screen after raising',
        "India's scripts drawn by fonts that ship with GTS",
        'A cloud backend in Mumbai, so alerts arrive with GTS closed',
        'A run on real Android phones, including a budget one',
      ],
    },
    {
      id: '2026-10-20',
      dateLabel: '19–20 October 2026',
      title: 'Finding a driver, fees, ratings and messages; a safer, clearer live trip',
      summary:
        'Most of the full product now works on test phones: a parent finds a driver near the ' +
        'school and the two agree a monthly fee, each month is recorded as paid by UPI or cash and ' +
        'the driver confirms it, parents rate trips and message their driver, and GTS speaks English ' +
        "and India's 22 scheduled languages. On 20 October a security review tightened who sees " +
        'what, each parent chose the speed they are alerted above, the live trip was redesigned ' +
        'around a radar that reads at a glance, and a review of the code fixed a crash where one odd ' +
        'record could empty a whole list. Everything still runs against a test backend on a laptop, ' +
        'so families cannot use it yet. A 9-minute video shows the new parts on two test phones; the ' +
        'run found 2 problems, both fixed the same day.',
      phase: 'find-driver',
      progress: {
        estimates: [
          { label: 'First release (pilot)', value: 'about 55%' },
          { label: 'Whole product', value: 'about 50%' },
        ],
        note:
          'Share of the work to each goal. Built and tested on the laptop counts toward building only; ' +
          'nothing is on the cloud or with families yet',
      },
      highlights: [
        {
          icon: 'search',
          title: 'Find a driver',
          text:
            'Parents look for drivers near the school; drivers who choose to be shown see requests near ' +
            "their schools. Neither sees the other's home, name or phone number — only the area, about 1 km.",
          tags: ['parents', 'drivers', 'safety'],
        },
        {
          icon: 'calendar',
          title: 'Agree and record fees',
          text:
            'Parent and driver take turns making an offer until one accepts. Each month is then ' +
            'recorded as paid by UPI or cash, and the driver confirms it. GTS never holds the money.',
          tags: ['parents', 'drivers'],
        },
        {
          icon: 'van',
          title: 'GPS that survives a swipe',
          text:
            'Swiping GTS away from Recents mid-trip no longer stops the van: parents keep seeing it ' +
            'move, and GTS opens again on the same trip. Checked on two virtual phones.',
          tags: ['drivers', 'tech'],
        },
        {
          icon: 'chat',
          title: 'Ratings and messages',
          text:
            'After a trip, parents give 1 to 5 stars; drivers see the stars, never who gave them. A chat ' +
            'per child, a reply straight from an alert, report and block; messages go after 30 days.',
          tags: ['parents', 'drivers', 'safety'],
        },
        {
          icon: 'language',
          title: '23 languages',
          text:
            "English and India's 22 scheduled languages, chosen on the first screen or in Settings. " +
            'The translations are drafts until native speakers check them.',
          tags: ['parents', 'drivers', 'design'],
        },
        {
          icon: 'sos',
          title: 'SOS, settings and help',
          text:
            'An SOS button on every live trip, emergency contacts, notification choices, account ' +
            'deletion and a help desk answered by GTS staff. Built and tested, not yet walked on a phone.',
          tags: ['safety', 'parents'],
        },
        {
          icon: 'bell',
          title: 'Your own speed alert',
          text:
            'Each parent chooses to be alerted above 40, 50 or 60 km/h. A slower overspeed still shows ' +
            "in Today's alerts, and the app and the server decide from the same tested list of cases.",
          tags: ['parents', 'safety'],
        },
        {
          icon: 'lock',
          title: 'Who sees what',
          text:
            "A security review of every screen and server step: a driver's number and plate reach only " +
            'the parents of children who ride with him, staff see only what their screens use, and ' +
            "nothing of GTS goes into a phone's backup.",
          tags: ['safety', 'tech'],
        },
        {
          icon: 'radar',
          title: 'A clearer live trip',
          text:
            'The live trip opens on a radar around the pickup point, with the distance in large type and ' +
            'honest minutes away; the map is one tap away. Colours were rechecked for contrast, and ' +
            'screens re-flow at the largest text size instead of breaking words.',
          tags: ['parents', 'design'],
        },
      ],
      gallery: [
        {
          video: 'assets/updates/2026-10-20/whats-new-demo.mp4',
          poster: 'assets/updates/2026-10-20/whats-new-demo.jpg',
          download: 'assets/updates/2026-10-20/whats-new-demo-hd.mp4',
          caption: "What's new since the last demo, on two test phones (9 min)",
          alt: 'Demo video: a parent finds a driver and agrees a monthly fee, records a cash payment the driver confirms, follows a trip that keeps going after the driver swipes GTS away, rates the trip, messages the driver and switches to Kannada',
          group: "What's new: the demo",
        },
        { src: 'assets/updates/2026-10-20/m16-01-find-students.jpg', caption: 'Find students: the driver chooses to be shown to parents nearby', group: 'Finding a driver and agreeing a fee' },
        { src: 'assets/updates/2026-10-20/m16-02-pick-on-map.jpg', caption: 'Pick on a map: move the map until the pin is on the school gate', group: 'Finding a driver and agreeing a fee' },
        { src: 'assets/updates/2026-10-20/m16-03-school-pinned.jpg', caption: 'The school pinned; next, roughly where home is', group: 'Finding a driver and agreeing a fee' },
        { src: 'assets/updates/2026-10-20/m16-04-drivers-near.jpg', caption: 'A driver near the school: vehicle, children riding, schools', group: 'Finding a driver and agreeing a fee' },
        { src: 'assets/updates/2026-10-20/m16-05-asked.jpg', caption: 'Asked, and the request posted for any nearby driver', group: 'Finding a driver and agreeing a fee' },
        { src: 'assets/updates/2026-10-20/m16-06-driver-request.jpg', caption: 'The driver sees "a parent", with no name', group: 'Finding a driver and agreeing a fee' },
        { src: 'assets/updates/2026-10-20/m16-07-offer-received.jpg', caption: 'Sunita gets Ramesh\'s offer: accept, counter or decline', group: 'Finding a driver and agreeing a fee' },
        { src: 'assets/updates/2026-10-20/m16-08-counter-received.jpg', caption: 'Ramesh gets Sunita\'s counter-offer', group: 'Finding a driver and agreeing a fee' },
        { src: 'assets/updates/2026-10-20/m16-09-agreed.jpg', caption: 'Agreed, then add the child: no invite code needed', group: 'Finding a driver and agreeing a fee' },
        { src: 'assets/updates/2026-10-20/m16-10-upi-id.jpg', caption: 'The driver adds his UPI ID (a made-up one)', group: 'The monthly fee' },
        { src: 'assets/updates/2026-10-20/m16-11-fee-card.jpg', caption: 'This month\'s fee on the parent\'s home', group: 'The monthly fee' },
        { src: 'assets/updates/2026-10-20/m16-12-pay-box.jpg', caption: 'Pay: by UPI, or record that it was paid', group: 'The monthly fee' },
        { src: 'assets/updates/2026-10-20/m16-13-no-upi-app.jpg', caption: 'No UPI app on the test phone: GTS says so and offers the ID to copy', group: 'The monthly fee' },
        { src: 'assets/updates/2026-10-20/m16-14-recorded.jpg', caption: 'Paid in cash and recorded: waiting for the driver to confirm', group: 'The monthly fee' },
        { src: 'assets/updates/2026-10-20/m16-15-confirm.jpg', caption: 'The driver confirms he received it', group: 'The monthly fee' },
        { src: 'assets/updates/2026-10-20/m16-16-fee-done.jpg', caption: 'Confirmed: the fee card leaves the home', group: 'The monthly fee' },
        { src: 'assets/updates/2026-10-20/m16-17-start-trip.jpg', caption: 'Start a trip: to school, morning', group: 'A trip that survives a swipe' },
        { src: 'assets/updates/2026-10-20/m16-18-live-map.jpg', caption: 'Sunita follows the van; alerts so far listed below the map', group: 'A trip that survives a swipe' },
        { src: 'assets/updates/2026-10-20/m16-19-recents-swipe.jpg', caption: 'Mid-trip, the driver swipes GTS away from Recents', group: 'A trip that survives a swipe' },
        { src: 'assets/updates/2026-10-20/m16-20-still-moving.jpg', caption: 'After the swipe: the van keeps moving on the parent\'s map', group: 'A trip that survives a swipe' },
        { src: 'assets/updates/2026-10-20/m16-21-reopened.jpg', caption: 'GTS opened again: the same trip, nothing lost', group: 'A trip that survives a swipe' },
        { src: 'assets/updates/2026-10-20/m16-22-reached-school.jpg', caption: 'Reached school: live tracking closes', group: 'A trip that survives a swipe' },
        { src: 'assets/updates/2026-10-20/m16-23-end-trip.jpg', caption: 'End this trip? Parents stop seeing the van at once', group: 'After the trip: rating and messages' },
        { src: 'assets/updates/2026-10-20/m16-24-rate-card.jpg', caption: 'How was today\'s trip? on the parent\'s home', group: 'After the trip: rating and messages' },
        { src: 'assets/updates/2026-10-20/m16-25-rating.jpg', caption: 'Five stars and a few words', group: 'After the trip: rating and messages' },
        { src: 'assets/updates/2026-10-20/m16-26-rating-sent.jpg', caption: 'Thank you: the rating was sent', group: 'After the trip: rating and messages' },
        { src: 'assets/updates/2026-10-20/m16-27-driver-home.jpg', caption: 'The driver\'s home: the rating\'s average and a new message', group: 'After the trip: rating and messages' },
        { src: 'assets/updates/2026-10-20/m16-28-chat.jpg', caption: 'A message and its reply', group: 'After the trip: rating and messages' },
        { src: 'assets/updates/2026-10-20/m16-29-languages.jpg', caption: 'Choose your language: English and 22 Indian languages', group: 'In Kannada' },
        { src: 'assets/updates/2026-10-20/m16-30-home-kannada.jpg', caption: 'Sunita\'s home in Kannada', group: 'In Kannada' },
        { src: 'assets/updates/2026-10-20/m16-31-payments-kannada.jpg', caption: 'Payments in Kannada', group: 'In Kannada' },
        { src: 'assets/updates/2026-10-20/oct20-01-live-on-the-way.jpg', caption: 'The live trip opens on a radar around the pickup point: the van 2.4 km away, about 5 minutes', group: 'Added on 20 October: a clearer live trip and your own speed alert' },
        { src: 'assets/updates/2026-10-20/oct20-02-live-nearby.jpg', caption: 'Nearby: inside the 1 km ring. The alert arrived just before the trip was opened, so its banner still offers See live; it floats above SOS and Call driver', group: 'Added on 20 October: a clearer live trip and your own speed alert' },
        { src: 'assets/updates/2026-10-20/oct20-03-live-nearby-night.jpg', caption: 'The same at night', group: 'Added on 20 October: a clearer live trip and your own speed alert' },
        { src: 'assets/updates/2026-10-20/oct20-04-live-largest-text.jpg', caption: 'At the largest text size, the name and the buttons move onto new lines instead of breaking words', group: 'Added on 20 October: a clearer live trip and your own speed alert' },
        { src: 'assets/updates/2026-10-20/oct20-05-live-hindi.jpg', caption: 'In Hindi', group: 'Added on 20 October: a clearer live trip and your own speed alert' },
        { src: 'assets/updates/2026-10-20/oct20-06-speed-alert.jpg', caption: 'Settings: each parent chooses to be alerted above 40, 50 or 60 km/h', group: 'Added on 20 October: a clearer live trip and your own speed alert' },
        { src: 'assets/updates/2026-10-20/oct20-07-rate-stars.jpg', caption: 'Rating a trip: the empty stars now stand out, even on a sunny screen', group: 'Added on 20 October: a clearer live trip and your own speed alert' },
      ],
      galleryNote:
        "First the demo of what's new on two virtual phones — 0:08 the driver is shown to parents · " +
        '0:32 a parent finds a driver · 1:30 an offer · 1:56 counter and agree · 2:43 the UPI ID · ' +
        "3:13 paying the month's fee · 4:00 the driver confirms · 4:31 a trip that survives a swipe · " +
        '6:30 end and rate · 7:22 messages · 8:25 Kannada — then stills from it, in order. ' +
        'Number plates and map details are hidden; names, places, fees and the UPI ID are made-up test data. ' +
        "The 20 October stills at the end are drawn by the app's own screen gallery on the laptop, not filmed " +
        'on a phone.',
      cover: 'assets/updates/2026-10-20/whats-new-demo.jpg',
      next: [
        'A cloud backend in Mumbai, so alerts arrive with GTS closed',
        'A run on real Android phones, including a budget one',
        'Native speakers check the translations',
        'Walking SOS, settings and help on a phone',
      ],
    },
    {
      id: '2026-10-18',
      dateLabel: 'Week ending 18 October 2026',
      title: 'Live trips, parents joining and a stronger vehicle check',
      summary:
        'GTS can now run a whole school trip: a parent joins their driver with the invite code and ' +
        'adds their child, the driver starts a trip, and the parent follows the van with an alert at ' +
        'each step, after GTS has checked the vehicle. For now everything runs against a test backend ' +
        "on a laptop, so GTS is not yet usable by families. This week's run on a virtual Android phone " +
        'found 7 problems: 6 were fixed the same day, and one — GPS pausing when the driver swipes ' +
        'GTS away — is being fixed next. A 13-minute video now shows the whole flow on two test phones.',
      phase: 'live-trips',
      progress: {
        estimates: [
          { label: 'First release (pilot)', value: 'about 40–45%' },
          { label: 'Whole product', value: 'about 25%' },
        ],
        note: 'Only features working for families on real phones count as done',
      },
      highlights: [
        {
          icon: 'van',
          title: 'Start a trip',
          text:
            'The way is preset by the time of day, and the driver is warned when no parent will see ' +
            'the trip. A short guide first makes sure the phone does not pause GTS to save battery.',
          tags: ['drivers'],
        },
        {
          icon: 'map-pin',
          title: 'Follow the van live',
          text:
            "Parents see \"On the way\" on their child's card, then the van on a map with \"Updated " +
            '20 seconds ago" (red after 3 minutes), the distance from the pickup, every step so far ' +
            'and Call driver.',
          tags: ['parents'],
        },
        {
          icon: 'bell',
          title: 'An alert at every step',
          text:
            'Near home, reached school, left school, dropped at home: a banner in the app and a phone ' +
            'notification, only ever about your own child on a shared van.',
          tags: ['parents', 'safety'],
        },
        {
          icon: 'clock',
          title: 'Daily trip reminders',
          text:
            'Drivers can set a morning and an afternoon reminder in Settings; tapping it opens Start a trip.',
          tags: ['drivers'],
        },
        {
          icon: 'users',
          title: 'Parents join',
          text:
            "A parent types the driver's invite code, picks the school and adds their child: a first " +
            'name, the pickup point and a short declaration. The driver sees them under My children.',
          tags: ['parents', 'drivers'],
        },
        {
          icon: 'camera',
          title: 'Coded vehicle photos',
          text:
            'Front, back, both sides, the seats, the chassis number and the driver with the vehicle, ' +
            'taken with the camera only. A one-time code on the dashboard proves the photos are new.',
          tags: ['drivers', 'safety'],
        },
        {
          icon: 'shield',
          title: 'Government record check',
          text:
            'Before approving, GTS looks the number plate up on the government vehicle record and ' +
            'ticks five checks. The app refuses an approval without them.',
          tags: ['safety', 'drivers'],
        },
        {
          icon: 'check',
          title: 'GTS review screens',
          text:
            'GTS staff see the vehicle, its photos and the papers, then approve with the dates from ' +
            'the papers or reject with a reason. The driver fixes what the reason names and sends again.',
          tags: ['drivers', 'safety'],
        },
        {
          icon: 'phone',
          title: 'Tested on a virtual phone',
          text:
            'Every screen was tapped through on a virtual Android phone against a test backend on a ' +
            'laptop. Both trip directions fired every alert once and in order. The run found 7 ' +
            'problems: 6 were fixed the same day, one is next. A second run, with a second virtual phone ' +
            "as the parent, found 5 more: the parent's map was a narrow strip (fixed the same day) and 4 " +
            'smaller ones, next. Not yet tried by families or on real roads.',
          tags: ['tech'],
        },
      ],
      gallery: [
        {
          video: 'assets/updates/2026-10-18/full-demo.mp4',
          poster: 'assets/updates/2026-10-18/full-demo.jpg',
          download: 'assets/updates/2026-10-18/full-demo-hd.mp4',
          caption: 'The whole of GTS, start to finish, on two test phones (13 min)',
          alt: 'Demo video: a driver signs up and sends his papers, GTS approves him, a parent joins and follows the trip home on a map with alerts',
          group: 'Full demo: start to finish',
        },
        { src: 'assets/updates/2026-10-18/00-probe.jpg', caption: 'GTS opening on the test phone', group: 'Sign-up and privacy' },
        { src: 'assets/updates/2026-10-18/j1-01-language.jpg', caption: 'First screen: choose English or हिन्दी', group: 'Sign-up and privacy' },
        { src: 'assets/updates/2026-10-18/j1-02-notice.jpg', caption: 'What GTS uses and why, before anything else', group: 'Sign-up and privacy' },
        { src: 'assets/updates/2026-10-18/j1-04-notice-agreed.jpg', caption: 'Read to the end and agreed: data stays in India, nothing is sold', group: 'Sign-up and privacy' },
        { src: 'assets/updates/2026-10-18/j1-05-phone.jpg', caption: 'Sign in with a mobile number (a made-up test number)', group: 'Sign-up and privacy' },
        { src: 'assets/updates/2026-10-18/j1-06-code.jpg', caption: 'The 6-digit code (the test setup sends no SMS)', group: 'Sign-up and privacy' },
        { src: 'assets/updates/2026-10-18/j1-07-role.jpg', caption: 'Parent or driver?', group: 'Sign-up and privacy' },
        { src: 'assets/updates/2026-10-18/j1-08-about-you.jpg', caption: 'A driver, Ramesh Kumar', group: 'Sign-up and privacy' },
        { src: 'assets/updates/2026-10-18/j1-09-driver-home.jpg', caption: "The driver's checklist for the first trip", group: 'Driver papers and vehicle check' },
        { src: 'assets/updates/2026-10-18/j1-10-papers.jpg', caption: 'Vehicle and papers: type, number plate, make and model', group: 'Driver papers and vehicle check' },
        { src: 'assets/updates/2026-10-18/j1-11-vehicle.jpg', caption: 'Van, number plate, make and model filled in', group: 'Driver papers and vehicle check' },
        { src: 'assets/updates/2026-10-18/j1-12-add-paper.jpg', caption: 'Each paper: a photo, or a PDF from DigiLocker', group: 'Driver papers and vehicle check' },
        { src: 'assets/updates/2026-10-18/j1-13-camera.jpg', caption: "The phone's own camera app (a test scene on the virtual phone)", group: 'Driver papers and vehicle check' },
        { src: 'assets/updates/2026-10-18/j1-14-camera-review.jpg', caption: 'Keep the photo or take it again', group: 'Driver papers and vehicle check' },
        { src: 'assets/updates/2026-10-18/j1-15-licence-added.jpg', caption: 'First paper added', group: 'Driver papers and vehicle check' },
        { src: 'assets/updates/2026-10-18/j1-16-papers-scrolled.jpg', caption: 'Five papers, then seven vehicle photos with a one-time code', group: 'Driver papers and vehicle check' },
        { src: 'assets/updates/2026-10-18/j1-17-photos-done.jpg', caption: 'All seven vehicle photos, each with the code on the dashboard', group: 'Driver papers and vehicle check' },
        { src: 'assets/updates/2026-10-18/j1-18-sent.jpg', caption: 'Sent: waiting for GTS approval, papers locked', group: 'Driver papers and vehicle check' },
        { src: 'assets/updates/2026-10-18/j2-01-parent-home-empty.jpg', caption: "The GTS reviewer's test account", group: 'GTS review: not approved, fixed, sent again' },
        { src: 'assets/updates/2026-10-18/j2-02-review-list.jpg', caption: 'GTS review: one driver waiting', group: 'GTS review: not approved, fixed, sent again' },
        { src: 'assets/updates/2026-10-18/j2-03-driver-review.jpg', caption: 'Vehicle, photo code and photos; Check on Parivahan opens the government record', group: 'GTS review: not approved, fixed, sent again' },
        { src: 'assets/updates/2026-10-18/j2-04-reject-sheet.jpg', caption: "Why can't GTS approve? Ready-made reasons", group: 'GTS review: not approved, fixed, sent again' },
        { src: 'assets/updates/2026-10-18/j2-05-reason-chosen.jpg', caption: 'Reason chosen: the code is not visible in the photos', group: 'GTS review: not approved, fixed, sent again' },
        { src: 'assets/updates/2026-10-18/j2-06-after-reject.jpg', caption: 'Not approved, with the reason', group: 'GTS review: not approved, fixed, sent again' },
        { src: 'assets/updates/2026-10-18/j3-01-driver-home-rejected.jpg', caption: 'The driver sees: Not approved, tap to see why', group: 'GTS review: not approved, fixed, sent again' },
        { src: 'assets/updates/2026-10-18/j3-02-papers-rejected.jpg', caption: 'The reason, then Send again', group: 'GTS review: not approved, fixed, sent again' },
        { src: 'assets/updates/2026-10-18/j3-03-resent.jpg', caption: 'Sent again: waiting for GTS', group: 'GTS review: not approved, fixed, sent again' },
        { src: 'assets/updates/2026-10-18/j3-04-my-schools-empty.jpg', caption: 'My schools: none yet', group: 'The driver adds a school' },
        { src: 'assets/updates/2026-10-18/j3-05-add-school.jpg', caption: 'Add a school: three ways to set the gate', group: 'The driver adds a school' },
        { src: 'assets/updates/2026-10-18/j3-06-other-ways.jpg', caption: 'Other ways: paste a link or the numbers', group: 'The driver adds a school' },
        { src: 'assets/updates/2026-10-18/j3-07-school-typed.jpg', caption: 'Typing the numbers closed the field mid-number; the rest went into the name (found in the live run, fixed the same day)', group: 'The driver adds a school' },
        { src: 'assets/updates/2026-10-18/j3-08-typing-stays.jpg', caption: 'After the fix: the numbers stay in their field', group: 'The driver adds a school' },
        { src: 'assets/updates/2026-10-18/j3-09-school-preview.jpg', caption: 'The gate on a map before saving', group: 'The driver adds a school' },
        { src: 'assets/updates/2026-10-18/j3-10-school-saved.jpg', caption: 'The school saved', group: 'The driver adds a school' },
        { src: 'assets/updates/2026-10-18/j3-11-approve-screen.jpg', caption: 'Approve: five checks against the government record', group: 'GTS review: approved' },
        { src: 'assets/updates/2026-10-18/j3-12-approve-ticked.jpg', caption: 'All five checks ticked', group: 'GTS review: approved' },
        { src: 'assets/updates/2026-10-18/j3-13-date-picker.jpg', caption: 'Dates from the record and the papers', group: 'GTS review: approved' },
        { src: 'assets/updates/2026-10-18/j3-14-dates-set.jpg', caption: 'Dates filled in, but shown without the year (found in the live run, fixed the same day)', group: 'GTS review: approved' },
        { src: 'assets/updates/2026-10-18/j3-15-approved.jpg', caption: 'Approved', group: 'GTS review: approved' },
        { src: 'assets/updates/2026-10-18/j5-01-parent-home.jpg', caption: 'A parent, Sunita Sharma: Join your driver', group: 'A parent joins and adds a child' },
        { src: 'assets/updates/2026-10-18/j5-02-join.jpg', caption: "Type the driver's invite code", group: 'A parent joins and adds a child' },
        { src: 'assets/updates/2026-10-18/j5-03-driver-card.jpg', caption: 'The driver, approved by GTS, and the school', group: 'A parent joins and adds a child' },
        { src: 'assets/updates/2026-10-18/j5-04-child-form.jpg', caption: 'Add your child: first name, pickup point and a declaration', group: 'A parent joins and adds a child' },
        { src: 'assets/updates/2026-10-18/j5-05-other-ways.jpg', caption: "The pickup's other ways said 'school gate' (found in the live run, fixed the same day)", group: 'A parent joins and adds a child' },
        { src: 'assets/updates/2026-10-18/j5-06-child-filled.jpg', caption: "Anjali's pickup point on the map, declaration ticked", group: 'A parent joins and adds a child' },
        { src: 'assets/updates/2026-10-18/j5-08-notification-permission.jpg', caption: 'Once a child is added, GTS asks to send notifications', group: 'A parent joins and adds a child' },
        { src: 'assets/updates/2026-10-18/j5-09-parent-home-child.jpg', caption: "Anjali's card on the parent's home", group: 'A parent joins and adds a child' },
        { src: 'assets/updates/2026-10-18/j6-01-driver-home-approved.jpg', caption: "Approved: Start a trip on the driver's home", group: 'Starting a trip: battery and location' },
        { src: 'assets/updates/2026-10-18/j6-02-start-form.jpg', caption: 'Start a trip: the way is preset by the time of day', group: 'Starting a trip: battery and location' },
        { src: 'assets/updates/2026-10-18/j6-03-battery-guide.jpg', caption: 'Keep GTS running: a guide before the first trip', group: 'Starting a trip: battery and location' },
        { src: 'assets/updates/2026-10-18/j6-04-android-battery-list.jpg', caption: "Android's list of apps and battery use", group: 'Starting a trip: battery and location' },
        { src: 'assets/updates/2026-10-18/j6-05-android-gts-battery.jpg', caption: "GTS Dev's battery page", group: 'Starting a trip: battery and location' },
        { src: 'assets/updates/2026-10-18/j6-06-android-background-usage.jpg', caption: "Android 16 puts 'Unrestricted' under Allow background usage; the guide now names both (found in the live run)", group: 'Starting a trip: battery and location' },
        { src: 'assets/updates/2026-10-18/j6-07-unrestricted.jpg', caption: 'Unrestricted chosen', group: 'Starting a trip: battery and location' },
        { src: 'assets/updates/2026-10-18/j6-08-guide-ok.jpg', caption: 'Back in GTS: it can run in the background now', group: 'Starting a trip: battery and location' },
        { src: 'assets/updates/2026-10-18/j6-09-after-start.jpg', caption: 'Android asks for location once', group: 'Starting a trip: battery and location' },
        { src: 'assets/updates/2026-10-18/j6-11-play-location-accuracy.jpg', caption: "Google's Location Accuracy prompt at Start", group: 'Starting a trip: battery and location' },
        { src: 'assets/updates/2026-10-18/j6-12b-after-no-thanks.jpg', caption: "Saying No thanks blocked every trip (found in the live run, fixed the same day: trips now use the phone's own GPS)", group: 'Starting a trip: battery and location' },
        { src: 'assets/updates/2026-10-18/j6-13-google-dialog-again.jpg', caption: 'The next try asked again, before the fix', group: 'Starting a trip: battery and location' },
        { src: 'assets/updates/2026-10-18/j6-14-running.jpg', caption: 'Afternoon trip running from the school gate', group: 'The afternoon trip and End' },
        { src: 'assets/updates/2026-10-18/j6-15-running-events.jpg', caption: "Moving, but the driver's list of steps stayed empty (found in the live run, fixed the same day)", group: 'The afternoon trip and End' },
        { src: 'assets/updates/2026-10-18/j6-16-arrived.jpg', caption: "Home reached and the list still empty; the parent's alerts all arrived", group: 'The afternoon trip and End' },
        { src: 'assets/updates/2026-10-18/j6-17-end-confirm.jpg', caption: 'End this trip? Parents stop seeing the van at once', group: 'The afternoon trip and End' },
        { src: 'assets/updates/2026-10-18/j6-18-ended.jpg', caption: 'Ended: back to the trip form', group: 'The afternoon trip and End' },
        { src: 'assets/updates/2026-10-18/j6-19-morning-running.jpg', caption: 'Morning trip started', group: 'The morning trip: swipe away and back' },
        { src: 'assets/updates/2026-10-18/j6-20-home-trip-in-progress.jpg', caption: 'Home: the tile says Trip in progress', group: 'The morning trip: swipe away and back' },
        { src: 'assets/updates/2026-10-18/j6-21-driver-sees-event.jpg', caption: "After the fix: the driver sees 'the van is about 1 km away'", group: 'The morning trip: swipe away and back' },
        { src: 'assets/updates/2026-10-18/j6-22-recents.jpg', caption: 'Swiping GTS away mid-trip pauses its GPS until it is opened again (being fixed next)', group: 'The morning trip: swipe away and back' },
        { src: 'assets/updates/2026-10-18/j6-23-reopened-home.jpg', caption: 'Opened again: still Trip in progress', group: 'The morning trip: swipe away and back' },
        { src: 'assets/updates/2026-10-18/j6-24-resumed.jpg', caption: 'The trip carried on; nothing was sent twice', group: 'The morning trip: swipe away and back' },
        { src: 'assets/updates/2026-10-18/j6-25-reached-school.jpg', caption: 'Reached school', group: 'The morning trip: swipe away and back' },
        { src: 'assets/updates/2026-10-18/j6-00-settings-driver.jpg', caption: 'Settings: trip reminders, off until set', group: 'Trip reminders' },
        { src: 'assets/updates/2026-10-18/j6-26-time-picker.jpg', caption: 'Pick a reminder time', group: 'Trip reminders' },
        { src: 'assets/updates/2026-10-18/j6-27-time-typed.jpg', caption: 'Or type it: 6:50 PM', group: 'Trip reminders' },
        { src: 'assets/updates/2026-10-18/j6-28-reminder-shade.jpg', caption: 'The reminder arrives: Time for the school run', group: 'Trip reminders' },
        { src: 'assets/updates/2026-10-18/j6-29-reminder-opened.jpg', caption: 'Tapping it opens Start a trip', group: 'Trip reminders' },
        { src: 'assets/updates/2026-10-18/j7-01-parent-home-after-trip.jpg', caption: "The parent's home after the trip: 4 alerts today", group: "After the trip: the parent's alerts" },
        { src: 'assets/updates/2026-10-18/j7-02-today-alerts.jpg', caption: "Today's alerts, newest first", group: "After the trip: the parent's alerts" },
        { src: 'assets/updates/2026-10-18/j7-03-ended-trip.jpg', caption: 'The ended trip: every step in order, and Call driver', group: "After the trip: the parent's alerts" },
        { src: 'assets/updates/2026-10-18/j6-30-settings-hindi.jpg', caption: 'Settings in Hindi', group: 'In Hindi' },
        { src: 'assets/updates/2026-10-18/j6-31-home-hindi.jpg', caption: "The driver's home in Hindi", group: 'In Hindi' },
        { src: 'assets/updates/2026-10-18/j6-32-trip-form-hindi.jpg', caption: 'Start a trip in Hindi', group: 'In Hindi' },
      ],
      galleryNote:
        'First the full demo on two virtual phones — 0:07 the driver signs up · 1:23 vehicle and papers · ' +
        '4:03 the school · 4:38 GTS staff approve the driver · 6:38 the invite code · 7:04 a parent joins · ' +
        "8:29 the trip home, live · 12:05 Today's alerts and Hindi — then every screen from the first run, " +
        'in order. Number plates and map details are hidden; names and phone numbers are made-up test data.',
      cover: 'assets/updates/2026-10-18/j6-20-home-trip-in-progress.jpg',
      next: [
        "A live run with a parent's real phone watching while the van drives",
        'Keeping GPS running when the driver swipes GTS away',
        'Real push notifications when GTS is closed',
        'Kannada, then the other Indian languages',
      ],
    },
    {
      id: '2026-10-11',
      dateLabel: 'Week ending 11 October 2026',
      title: 'Sign-in and driver setup, tested on a real phone',
      summary:
        'GTS now has its front door and its driver setup. People choose a language, read what the ' +
        'app uses and why, and sign in with a mobile number and a one-time code. Drivers send ' +
        'their vehicle and papers for checking, add the schools they drive to, and share an invite ' +
        'code. Everything was run on an Android phone, and what the run showed was fixed the same day.',
      phase: 'driver-setup',
      highlights: [
        {
          icon: 'key',
          title: 'Sign in with your number',
          text:
            'A 10-digit mobile number and a 6-digit SMS code. No passwords; the code can be sent ' +
            'again after 30 seconds.',
          tags: ['parents', 'drivers'],
        },
        {
          icon: 'shield',
          title: 'Consent before anything',
          text:
            'A plain notice lists each piece of data and why it is needed. Nothing is ticked for ' +
            'you, and the app cannot continue until you agree.',
          tags: ['safety'],
        },
        {
          icon: 'language',
          title: 'Your language, one tap away',
          text:
            'English and हिन्दी side by side at the top of every sign-up screen, so a language ' +
            'chosen by mistake never leaves anyone stuck on screens they cannot read.',
          tags: ['parents', 'drivers', 'design'],
        },
        {
          icon: 'file',
          title: 'Papers as photos or PDFs',
          text:
            "Drivers photograph their licence, RC, permit, insurance and police verification with " +
            "the phone's own camera app, or choose the PDF they downloaded from DigiLocker.",
          tags: ['drivers'],
        },
        {
          icon: 'check',
          title: 'Every driver checked',
          text:
            'Papers wait for GTS approval. If something is wrong the driver sees why, fixes it and ' +
            'sends again; papers cannot be changed while they are being checked.',
          tags: ['drivers', 'safety'],
        },
        {
          icon: 'map-pin',
          title: 'No coordinates to type',
          text:
            "A school's gate is set by standing there and tapping once, by moving a map under a " +
            'pin, or by dropping a pin in Google Maps and sharing it to GTS.',
          tags: ['drivers', 'design'],
        },
        {
          icon: 'users',
          title: 'Invite parents',
          text:
            'Each driver gets a 6-character code to copy or share on WhatsApp. Codes skip look-alike ' +
            'characters, so 0 and O are never confused.',
          tags: ['drivers', 'parents'],
        },
        {
          icon: 'radar',
          title: 'Kind to the battery',
          text:
            'Animations pause on battery saver or low battery. Parents can choose Auto, Always on ' +
            'or Always calm in Settings.',
          tags: ['design', 'tech'],
        },
        {
          icon: 'lock',
          title: 'Locked down by default',
          text:
            'Each person reads only their own data, a driver can never approve themselves, and 60 ' +
            'automated checks prove what is allowed and what is refused.',
          tags: ['safety', 'tech'],
        },
      ],
      gallery: [
        { src: 'assets/updates/2026-10-11/privacy-notice.jpg', caption: 'What GTS uses and why, with the language switch on top' },
        { src: 'assets/updates/2026-10-11/privacy-notice-hindi.jpg', caption: 'One tap on हिन्दी: the same screen in Hindi' },
        { src: 'assets/updates/2026-10-11/sign-in-number.jpg', caption: 'Sign in with a mobile number' },
        { src: 'assets/updates/2026-10-11/sign-in-code.jpg', caption: 'The 6-digit code' },
        { src: 'assets/updates/2026-10-11/driver-home.jpg', caption: "A driver's checklist for the first trip" },
        { src: 'assets/updates/2026-10-11/papers-photo-or-pdf.jpg', caption: 'Five papers: a PDF from DigiLocker and four photos' },
        { src: 'assets/updates/2026-10-11/papers-waiting.jpg', caption: 'Sent: waiting for GTS approval, papers locked' },
        { src: 'assets/updates/2026-10-11/papers-not-approved.jpg', caption: 'Not approved: the reason, then send again' },
        { src: 'assets/updates/2026-10-11/driver-approved.jpg', caption: 'Approved by GTS' },
        { src: 'assets/updates/2026-10-11/add-school-ways.jpg', caption: 'Three ways to set a school gate, no numbers' },
        { src: 'assets/updates/2026-10-11/share-from-google-maps.jpg', caption: 'Drop a pin in Google Maps and share it to GTS' },
        { src: 'assets/updates/2026-10-11/school-from-google-maps.jpg', caption: 'Shared from Google Maps: name and gate filled in' },
        { src: 'assets/updates/2026-10-11/my-schools.jpg', caption: "The driver's schools" },
        { src: 'assets/updates/2026-10-11/invite-code.jpg', caption: 'The invite code, copied' },
        { src: 'assets/updates/2026-10-11/settings.jpg', caption: 'Settings: language first' },
      ],
      feature: {
        src: 'assets/updates/2026-10-11/app-icons.jpg',
        caption: 'The new app icon: the GTS van on amber, and on indigo for the test version',
        alt: 'Two rounded app icons: a dark van on amber, and an amber van on dark indigo',
      },
      next: [
        'GTS review screens: approve or reject a driver, with a reason',
        'Parents join a driver with the invite code and add their child',
        'Setting the home pickup point the same easy way as a school gate',
      ],
    },
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
