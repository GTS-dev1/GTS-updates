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
      { id: 'driver-setup', label: 'Driver setup', detail: 'Vehicle, papers, schools, invite code', icon: 'van', status: 'done' },
      { id: 'gts-review', label: 'GTS review', detail: 'GTS staff check papers, approve or reject', icon: 'shield', status: 'done' },
      { id: 'parent-joins', label: 'Parent joins', detail: 'Invite code, child, pickup point', icon: 'users', status: 'done' },
      { id: 'live-trips', label: 'Live trips', detail: 'Real GPS and a live map for parents', icon: 'map-pin', status: 'done' },
      { id: 'alerts', label: 'Alerts', detail: 'Near home, reached and left school, delays, SOS', icon: 'bell', status: 'now' },
      { id: 'settings-privacy', label: 'Settings & privacy', detail: 'Account deletion, grievance contact', icon: 'settings', status: 'next' },
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
      id: '2026-10-18',
      dateLabel: 'Week ending 18 October 2026',
      title: 'Live trips, parents joining and a stronger vehicle check',
      summary:
        'GTS now runs a whole school trip: a parent joins their driver with the invite code and ' +
        'adds their child, the driver starts a trip, and the parent follows the van with an alert ' +
        'at each step. Before any of that, GTS checks every vehicle: seven fresh photos ' +
        'carrying a one-time code, and the number plate on the government record. Everything was ' +
        'run end to end on a virtual Android phone, and what the run found was fixed the same day.',
      phase: 'live-trips',
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
          title: 'Tested end to end',
          text:
            'Run screen by screen on a virtual Android phone against the real backend: both trip ' +
            'directions fired every alert once and in order, and the bugs it found were fixed that day.',
          tags: ['tech'],
        },
      ],
      gallery: [
        { src: 'assets/updates/2026-10-18/start-a-trip.jpg', caption: 'Start a trip: the way is preset by the time of day' },
        { src: 'assets/updates/2026-10-18/start-a-trip-hindi.jpg', caption: 'The same screen in Hindi' },
        { src: 'assets/updates/2026-10-18/keep-gts-running.jpg', caption: 'A short guide so the phone does not pause GTS mid-trip' },
        { src: 'assets/updates/2026-10-18/driver-trip-events.jpg', caption: "The driver's running trip, each step as it happens" },
        { src: 'assets/updates/2026-10-18/todays-alerts.jpg', caption: "The parent's alerts for today, newest first" },
        { src: 'assets/updates/2026-10-18/parent-trip-timeline.jpg', caption: 'After the trip: every step in order, and Call driver' },
        { src: 'assets/updates/2026-10-18/add-your-child.jpg', caption: 'A parent adds their child: first name, pickup point, declaration' },
        { src: 'assets/updates/2026-10-18/vehicle-photo-code.jpg', caption: 'Seven vehicle photos, with the one-time code on the dashboard' },
        { src: 'assets/updates/2026-10-18/approve-government-record.jpg', caption: 'GTS approves only after checking the government record' },
      ],
      next: [
        "A live run with a parent's real phone watching while the van drives",
        'Keeping GPS running when the driver swipes GTS away',
        'Real push notifications when GTS is closed',
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
