/**
 * The content of the GTS updates page: the roadmap and one entry per week, newest first.
 *
 * HOW TO ADD A WEEK: copy the first entry in `weeks`, put it at the TOP of the list, change the
 * text, and add its screenshots under `assets/updates/<date>/`. Nothing else needs editing.
 *
 * WHY a script and not a .json file: the page then also works when opened straight from disk
 * (file://), where browsers block fetching JSON.
 *
 * PUBLIC REPOSITORY: product progress only. No costs, legal research, business model, partner
 * dates or personal data.
 *
 * @example
 * window.GTS_UPDATES.weeks[0].title;            // -> 'The app runs on a real phone'
 * window.GTS_UPDATES.roadmap.currentPhase;      // -> 0 (Foundation)
 */
window.GTS_UPDATES = {
  /**
   * The journey from first code to the pilot, drawn as the ribbon at the top of the page.
   * `currentPhase` is the index of the phase in progress; `phaseProgress` (0–1) how far into it.
   */
  roadmap: {
    phases: [
      { label: 'Foundation', detail: 'App skeleton, alerts, design system' },
      { label: 'Sign-in', detail: 'Phone number and OTP, consent, roles' },
      { label: 'Driver setup', detail: 'Vehicle, documents, schools, invite code' },
      { label: 'Parent joins', detail: 'Invite code, child, pickup point' },
      { label: 'Live trips', detail: 'Real GPS, map, alerts, notifications' },
      { label: 'Release', detail: 'Testing on phones, Play Store review' },
      { label: 'Pilot', detail: 'Real families, real school runs' },
    ],
    currentPhase: 0,
    phaseProgress: 0.9,
  },

  weeks: [
    {
      id: '2026-10-04',
      dateLabel: 'Week ending 4 October 2026',
      title: 'The app runs on a real phone',
      summary:
        "The first working build of GTS is running on an Android phone: a parent's live-trip " +
        'screen on demo data, the journey alerts behind it, English and Hindi, and a design ' +
        'made for GTS rather than a template.',
      highlights: [
        {
          icon: 'radar',
          title: 'Proximity radar',
          text:
            'Home sits at the centre and the van approaches from its real direction. The 1 km ring ' +
            'lights up when the van is near, and the van "docks" into home on arrival.',
        },
        {
          icon: 'bell',
          title: 'Journey alerts',
          text:
            'Reached school, left school, near home, reached home: detected on the phone and checked ' +
            'by 80 automated tests on every change.',
        },
        {
          icon: 'sun',
          title: 'A living sky',
          text:
            'The background follows the time of day, with dawn for the morning run and dusk for the ' +
            'drive home, in both light and dark mode.',
        },
        {
          icon: 'language',
          title: 'English and Hindi',
          text:
            'Every screen in both languages, set in Anek, an Indian typeface with matching Latin and ' +
            'Devanagari letters.',
        },
        {
          icon: 'phone',
          title: 'Made for real use',
          text:
            'The screen stays on while a parent watches a live trip, text is readable in sunlight, ' +
            "and the app respects the phone's reduced-motion setting.",
        },
        {
          icon: 'shield',
          title: 'Safe foundations',
          text:
            'A test version and the real app install side by side, and the cloud database refuses ' +
            'every request until each rule is written and tested.',
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
