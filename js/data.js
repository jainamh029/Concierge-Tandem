/* Mock data for the Tandem demo. Everything here is sample content. */
(function () {
  const DEMO_PROMPT =
    'Plan a client dinner for 4 near Back Bay tomorrow at 7:30 PM. Quiet enough to talk, under $100 per person, and add the final reservation to my calendar.';

  const CONFIG = {
    // Set to a form endpoint (e.g. Formspree) to receive submissions.
    // While empty, submissions are saved to this browser only.
    waitlistEndpoint: '',
    storageKey: 'tandem.waitlist.v1',
  };

  const CHIPS = [
    { label: 'Rebook my canceled flight', text: 'Rebook my canceled flight to Boston and keep my 9:00 AM meeting.' },
    { label: 'Find time for a dentist appointment', text: 'Find time for a dentist appointment next week outside my meeting blocks.' },
    { label: 'Plan a client dinner', text: DEMO_PROMPT },
    { label: 'Coordinate a weekend trip', text: 'Coordinate a weekend trip to Montreal for two, leaving Friday after 3 PM.' },
    { label: 'Handle my recurring life admin', text: 'Handle my recurring life admin: car registration, dry cleaning pickup, and annual physical.' },
  ];

  const STAGES = [
    { title: 'Understand request', running: 'Reading the request and pulling out constraints' },
    { title: 'Check calendar constraints', running: 'Checking tomorrow evening for conflicts' },
    { title: 'Apply saved preferences', running: 'Matching against your saved preferences' },
    { title: 'Research and compare options', running: 'Comparing candidate restaurants' },
    { title: 'Prepare a recommendation', running: 'Ranking options against your constraints' },
    { title: 'Ask for approval', running: 'Waiting for your decision' },
    { title: 'Complete the selected action', running: 'Carrying out the action you approved' },
  ];
  // How long each automatic stage "works", in ms (stages 0-4).
  const STAGE_MS = [900, 1000, 900, 1400, 900];

  const CONSTRAINTS = [
    '4 guests',
    'Tomorrow, 7:30 PM',
    'Back Bay',
    'Quiet / client appropriate',
    'Target: under $100 per person',
    'Calendar event required after booking',
  ];

  const CALENDAR_CHECK = [
    { when: 'Tomorrow, 6:00–7:00 PM', what: 'Client meeting, Back Bay', state: 'Existing' },
    { when: 'Tomorrow, 7:30–9:30 PM', what: 'Open — no conflicts', state: 'Free' },
  ];

  const PREFERENCE_MATCH = [
    'Avoids loud venues',
    'Prioritizes tables with reservation availability',
    'Uses your saved preference for Italian, Japanese, and New American cuisine',
    'Checks that the location is within a reasonable distance from the client meeting',
  ];

  const SAVED_CUISINES = ['Italian', 'Japanese', 'New American'];

  const REQUESTED_TIME_MIN = 19 * 60 + 30;

  const OPTIONS = [
    { id: 'srv', label: 'Option A', name: 'SRV', time: '7:30 PM', timeMin: 19 * 60 + 30, cuisine: 'Italian', pp: 85, walk: 6 },
    { id: 'ostra', label: 'Option B', name: 'Ostra', time: '7:45 PM', timeMin: 19 * 60 + 45, cuisine: 'Seafood', pp: 95, walk: 8 },
    { id: 'faccia', label: 'Option C', name: 'Faccia a Faccia', time: '7:15 PM', timeMin: 19 * 60 + 15, cuisine: 'Italian', pp: 80, walk: 10 },
  ];

  const DEFAULT_CONSTRAINTS = { budget: 100, maxWalk: 15, savedCuisineOnly: false };
  const BUDGET_CHOICES = [70, 80, 90, 100, 120];
  const WALK_CHOICES = [5, 10, 15, 20];

  const EXEC_STEPS = [
    'Requesting the table',
    'Creating the calendar invite',
    'Saving confirmation details',
  ];

  const HOW_STEPS = [
    { title: 'Ask naturally', text: 'Tell Tandem what you need in plain English.' },
    { title: 'Tandem coordinates', text: 'It checks your preferences, availability, timing, location, and constraints.' },
    { title: 'You approve important actions', text: 'Tandem never books, buys, sends, or changes your calendar without permission.' },
    { title: 'The task gets completed', text: 'Tandem organizes confirmations, updates, and next steps in one place.' },
  ];

  const COMPARISON = {
    columns: ['Capability', 'Search or Chatbot', 'Traditional Assistant', 'Tandem'],
    rows: [
      ['Finds options', 'Yes', 'Yes', 'Yes'],
      ['Uses your preferences', 'Limited', 'Yes', 'Yes'],
      ['Coordinates multiple steps', 'No', 'Yes', 'Yes'],
      ['Works instantly, anytime', 'Yes', 'No', 'Yes'],
      ['Requires approval for important actions', 'Varies', 'Yes', 'Yes'],
      ['Tracks confirmations and follow-ups', 'No', 'Yes', 'Yes'],
      ['Learns repeatable workflows', 'No', 'Limited', 'Yes'],
    ],
  };

  const USE_CASES = [
    { tag: 'Meetings and dining', title: 'Client and team coordination', text: 'Find a restaurant, coordinate attendees, send the details, and protect the time on your calendar.' },
    { tag: 'Travel', title: 'Travel recovery', text: 'When travel changes, Tandem prepares alternatives, tracks constraints, and helps rebuild the itinerary.' },
    { tag: 'Personal admin', title: 'Appointments and life admin', text: 'Turn recurring chores—appointments, reservations, forms, renewals, and household coordination—into an organized workflow.' },
    { tag: 'Memory', title: 'Recurring preferences', text: 'Tandem remembers how you travel, where you prefer to meet, your schedule rules, and when to ask for approval.' },
  ];

  const PRINCIPLES = [
    'Tandem prepares; you approve.',
    'No bookings, purchases, messages, or calendar edits without permission.',
    'Preferences are visible, editable, and removable.',
    'Activity is logged so you can see what Tandem did and why.',
    'Sensitive account connections are optional and only used for the task you authorize.',
  ];

  const SAVED_PREFERENCES = [
    'Avoids loud venues',
    'Italian, Japanese, New American',
    'Keeps 12–1 PM free',
    'Aisle seat on flights',
    'Asks before any payment',
  ];

  const CONNECTED_TOOLS = [
    { name: 'Google Calendar', note: 'Used only to check conflicts and add approved events' },
    { name: 'Gmail', note: 'Used only to send messages you approve' },
    { name: 'Slack', note: 'Used only to share details you approve' },
  ];

  const SEED_ACTIVITY = [
    { text: 'Prepared 3 alternative flights for review. No rebooking made.', when: 'Yesterday' },
    { text: 'Drafted a message to the client. Waiting on your approval; not sent.', when: 'Yesterday' },
    { text: 'Saved your preference: avoids loud venues.', when: 'Mon' },
  ];

  const ROLES = ['Founder / CEO', 'Executive', 'Operator', 'Investor', 'Consultant / advisor', 'Other'];
  const HOURS = ['Under 2', '2–5', '5–10', '10+'];

  window.TandemData = {
    DEMO_PROMPT, CONFIG, CHIPS, STAGES, STAGE_MS, CONSTRAINTS, CALENDAR_CHECK, PREFERENCE_MATCH,
    SAVED_CUISINES, REQUESTED_TIME_MIN, OPTIONS, DEFAULT_CONSTRAINTS, BUDGET_CHOICES, WALK_CHOICES,
    EXEC_STEPS, HOW_STEPS, COMPARISON, USE_CASES, PRINCIPLES, SAVED_PREFERENCES, CONNECTED_TOOLS,
    SEED_ACTIVITY, ROLES, HOURS,
  };
})();
