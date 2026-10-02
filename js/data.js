/* Mock data and copy for the Tandem Concierge demo. Everything here is sample content. */
(function () {
  const MOVE_IN_WEEKS = 5; // sample lease starts five weeks from today

  const DEMO_PROMPT =
    'We just signed a 12-month lease for a 4,200 sq ft office in Boston. 24 people move in five weeks from today. Get us ready: furniture under $60k, internet, access badges, and insurance. Send the vendor requests and put the deadlines on my calendar.';

  const CONFIG = {
    // Set to a form endpoint (e.g. Formspree) to receive submissions.
    // While empty, submissions are saved to this browser only.
    waitlistEndpoint: '',
    storageKey: 'tandem.waitlist.v1',
  };

  const CHIPS = [
    { label: 'Plan our move-in', text: DEMO_PROMPT },
    { label: 'Set up internet and access badges', text: 'Set up internet and access badges for our new 24-person office before day one.' },
    { label: 'Book a team welcome lunch', text: 'Book a welcome lunch for 24 people on our first day in the new office.' },
    { label: 'Plan a client dinner near the office', text: 'Plan a client dinner for 4 near the new office next Thursday at 7:30 PM, under $100 per person.' },
    { label: 'Handle building paperwork', text: 'Handle the building paperwork: certificate of insurance, deposits, and freight elevator booking.' },
  ];

  const STAGES = [
    { title: 'Understand request', running: 'Reading the request and pulling out constraints' },
    { title: 'Check lease and calendar', running: 'Checking lease dates, building rules, and your calendar' },
    { title: 'Apply saved preferences', running: 'Matching against your saved preferences' },
    { title: 'Research and compare options', running: 'Comparing furniture approaches' },
    { title: 'Prepare a recommendation', running: 'Building the move-in plan' },
    { title: 'Ask for approval', running: 'Waiting for your decision' },
    { title: 'Complete the approved actions', running: 'Carrying out what you approved' },
  ];
  const STAGE_MS = [900, 1000, 900, 1400, 1000];

  const PREFERENCE_MATCH = [
    'Prefers terms that fit a 12-month lease',
    'Avoids vendors with install lead times over 6 weeks',
    'Asks before any payment or deposit',
    'Wants one summary of replies, not a dozen email threads',
  ];

  // Furniture approaches. `flexible` true = fits a 12-month term.
  const OPTIONS = [
    { id: 'rental', label: 'Option A', name: 'Furniture rental package', cost: 36000, lead: 3, flexible: true, note: 'Fits the 12-month term; return or renew at the end' },
    { id: 'mixed', label: 'Option B', name: 'Buy desks, rent lounge and meeting rooms', cost: 52000, lead: 5, flexible: 'partial', note: 'Part owned, part flexible' },
    { id: 'buy', label: 'Option C', name: 'Buy everything new', cost: 68000, lead: 7, flexible: false, note: 'You own it; hard to move or resell on a short lease' },
  ];

  // Non-furniture vendor requests. Furniture lead time comes from the chosen option.
  const VENDORS = [
    { id: 'internet', name: 'Internet service', lead: 6 },
    { id: 'access', name: 'Access badges', lead: 6 },
    { id: 'insurance', name: 'Insurance', lead: 4 },
  ];

  const DEFAULT_CONSTRAINTS = { budget: 60000, maxLead: 6, flexOnly: false };
  const BUDGET_CHOICES = [40000, 50000, 60000, 80000];
  const LEAD_CHOICES = [3, 4, 6, 8];

  const EXEC_STEPS = [
    'Sending the vendor requests',
    'Adding the deadlines to your calendar',
    'Setting up reply tracking',
  ];

  const HOW_STEPS = [
    { title: 'Ask naturally', text: 'Tell Tandem what you need in plain English.' },
    { title: 'Tandem coordinates', text: 'It checks your lease dates, building rules, preferences, timing, and constraints.' },
    { title: 'You approve important actions', text: 'Tandem never books, buys, sends, or changes your calendar without permission.' },
    { title: 'The task gets completed', text: 'Tandem organizes requests, replies, and next steps in one place.' },
  ];

  const COMPARISON = {
    columns: ['Capability', 'Chatbot', 'Spreadsheet and email', 'Tandem Concierge'],
    rows: [
      ['Finds vendor options', 'Yes', 'Manual', 'Yes'],
      ['Uses your lease details and preferences', 'Limited', 'Manual', 'Yes'],
      ['Coordinates several vendors and deadlines', 'No', 'Manual', 'Yes'],
      ['Works instantly, anytime', 'Yes', 'Yes', 'Yes'],
      ['Requires approval before anything is sent', 'Varies', 'Yes', 'Yes'],
      ['Tracks replies and follow-ups', 'No', 'Manual', 'Yes'],
      ['Reuses the plan for your next office', 'No', 'Manual', 'Yes'],
    ],
  };

  const USE_CASES = [
    { tag: 'Move-in', title: 'Move-in coordination', text: 'Furniture, internet, access badges, insurance, and deposits. Tandem prepares each vendor request from your lease details and sends it after you approve.' },
    { tag: 'Timeline', title: 'Lease-to-launch timeline', text: 'See what has to start now and what can wait, based on your move-in date, headcount, and building rules.' },
    { tag: 'Concierge', title: 'Team and client logistics', text: 'Welcome lunches, client dinners, and visitor access for a new office. Nothing is booked until you approve.' },
    { tag: 'Memory', title: 'Recurring preferences', text: 'Tandem remembers your vendors, building rules, lead-time limits, and approval settings, so the next office starts further along.' },
  ];

  const PRINCIPLES = [
    'Tandem prepares; you approve.',
    'No vendor is contacted, no payment is made, and nothing is added to your calendar without permission.',
    'Preferences are visible, editable, and removable.',
    'Activity is logged so you can see what Tandem did and why.',
    'Sensitive account connections are optional and only used for the task you authorize.',
  ];

  const SAVED_PREFERENCES = [
    'Terms that fit a 12-month lease',
    'Install lead time under 6 weeks',
    'Asks before any payment',
    'One summary of replies',
    'Keeps 12–1 PM free',
  ];

  const CONNECTED_TOOLS = [
    { name: 'Google Calendar', note: 'Used only to add deadlines you approve' },
    { name: 'Gmail', note: 'Used only to send requests you approve' },
    { name: 'Slack', note: 'Used only to share updates you approve' },
  ];

  const SEED_ACTIVITY = [
    { text: 'Prepared 3 furniture options for review. Nothing ordered.', when: 'Yesterday' },
    { text: 'Drafted the insurance request. Waiting on your approval; not sent.', when: 'Yesterday' },
    { text: 'Saved your preference: asks before any payment.', when: 'Mon' },
  ];

  const ROLES = ['Founder / CEO', 'Operations / office manager', 'Executive', 'Broker / real estate', 'Tandem team', 'Other'];
  const HOURS = ['Under 2', '2–5', '5–10', '10+'];

  window.TandemData = {
    MOVE_IN_WEEKS, DEMO_PROMPT, CONFIG, CHIPS, STAGES, STAGE_MS, PREFERENCE_MATCH, OPTIONS, VENDORS,
    DEFAULT_CONSTRAINTS, BUDGET_CHOICES, LEAD_CHOICES, EXEC_STEPS, HOW_STEPS, COMPARISON, USE_CASES,
    PRINCIPLES, SAVED_PREFERENCES, CONNECTED_TOOLS, SEED_ACTIVITY, ROLES, HOURS,
  };
})();
