/* Mock data and copy for the Tandem Search Workspace demo.
   Every office, price, date, and recommendation here is SAMPLE content, not live inventory. */
(function () {
  const CONFIG = {
    // Set to a form endpoint (e.g. Formspree) to receive submissions.
    // While empty, submissions are saved to this browser only.
    endpoint: '',
    storageKey: 'tandem.advisor-requests.v1',
  };

  /* ---------- Example company (pre-filled discovery answers) ---------- */
  const SCENARIO_LABEL = 'Series A fintech · 22 people · New York City';

  const DEFAULT_ANSWERS = {
    city: 'nyc',
    headcountNow: 22,
    growth: 'strong', // same | moderate | strong | wide
    move: 60, // 30 | 60 | 120 | 0 (flexible)
    budgetMin: 25000,
    budgetMax: 32000,
    hoods: ['Flatiron', 'NoMad', 'Chelsea', 'Union Square'],
    features: ['Meeting rooms', 'Transit access', 'Client-ready design'],
    flex: 'very', // not | somewhat | very
    badFit: 'Overly corporate Midtown office towers',
    maxTours: 3,
    // Added by the "product learning" example:
    uncertainty: 'moderate', // confident | moderate | uncertain
    meetingLoad: 'medium', // low | medium | high
  };

  const CITIES = [
    { value: 'nyc', label: 'New York City' },
    { value: 'sf', label: 'San Francisco' },
    { value: 'bos', label: 'Boston' },
  ];
  const HOODS = {
    nyc: ['Flatiron', 'NoMad', 'Chelsea', 'Union Square', 'Midtown', 'SoHo', 'Financial District'],
    sf: ['SoMa', 'Financial District', 'Mission Bay', 'Jackson Square', 'Union Square'],
    bos: ['Back Bay', 'Seaport', 'Financial District', 'Kendall Square', 'South End'],
  };
  const GROWTH = [
    { value: 'same', label: 'About the same', max: 25 },
    { value: 'moderate', label: 'Moderate growth (up to 35)', max: 35 },
    { value: 'strong', label: 'Strong growth (35–45)', max: 45 },
    { value: 'wide', label: 'Rapid or uncertain (45+)', max: 55 },
  ];
  const MOVES = [
    { value: 30, label: 'Within 30 days', phrase: 'within 30 days' },
    { value: 60, label: 'Within 60 days', phrase: 'within 60 days' },
    { value: 120, label: 'Within 4 months', phrase: 'within 4 months' },
    { value: 0, label: 'Flexible', phrase: 'on a flexible timeline' },
  ];
  const FEATURES = [
    'Meeting rooms', 'Natural light', 'Transit access', 'Client-ready design',
    'Functional kitchen', 'Furnished / plug-and-play', 'Outdoor space',
  ];
  const FLEX = [
    { value: 'not', label: 'Not important', hint: 'A longer commitment is fine' },
    { value: 'somewhat', label: 'Somewhat important', hint: 'Some flexibility helps' },
    { value: 'very', label: 'Very important', hint: 'Shorter terms or expansion options matter' },
  ];
  const UNCERTAINTY = [
    { value: 'confident', label: 'Confident in the hiring plan' },
    { value: 'moderate', label: 'Fairly confident' },
    { value: 'uncertain', label: 'Uncertain, depends on funding or sales' },
  ];
  const MEETING_LOAD = [
    { value: 'low', label: 'Light: a few meetings a day' },
    { value: 'medium', label: 'Moderate: several overlapping meetings' },
    { value: 'high', label: 'Heavy: client and investor meetings daily' },
  ];

  /* ---------- Fit-score factors ---------- */
  const FACTORS = [
    { key: 'budget', label: 'Budget fit', hint: 'Rent against your monthly range' },
    { key: 'growth', label: 'Growth capacity', hint: 'Seats and layout room for your 12-month plan' },
    { key: 'transit', label: 'Transit fit', hint: 'Subway access for your team and clients' },
    { key: 'client', label: 'Client-readiness', hint: 'Finish and layout for investor and client meetings' },
    { key: 'speed', label: 'Move-in speed', hint: 'How fast the space can be occupied' },
    { key: 'flex', label: 'Lease flexibility', hint: 'Term length and exit options' },
  ];

  /* ---------- Sample inventory ---------- */
  const LISTINGS = [
    {
      id: 'flatiron', neighborhood: 'Flatiron', rent: 29500, sqft: 4200, seats: [32, 40], meetingRooms: 3,
      availableWeeks: 5, flexibility: '18-month minimum term', type: 'Direct lease · private floor · partly furnished',
      transit: 'About a 4-minute walk to 23 St (N/R/W, F/M, 6)',
      why: 'Best balance of growth capacity, client-ready design, and transit access. Fits the team’s preferred commute profile and budget.',
      watch: '18-month minimum term. Limited outdoor space.',
      scores: { growth: 96, transit: 98, client: 96, speed: 92, flex: 80 },
      labels: { growth: 'High', transit: 'Excellent', client: 'High', speed: 'Fast', flex: 'Medium' },
      geo: { x: 54, y: 52 },
      memo: {
        r1: 'Flatiron is the strongest overall fit because it gives you enough room to hire without paying for excess capacity, while meeting your client-facing and commute requirements.',
        r2: 'Flatiron is the strongest balanced alternative because it combines growth capacity, client-ready design, and transit access. It is the right choice if you want room to hire without paying for much excess space.',
        r3: 'Flatiron should be considered only if you can commit to an 18-month minimum term and growth capacity matters more than flexibility.',
      },
    },
    {
      id: 'nomad', neighborhood: 'NoMad', rent: 26800, sqft: 3700, seats: [28, 34], meetingRooms: 2,
      availableWeeks: 2, flexibility: '12–24 month terms', type: 'Furnished sublease · move-in ready',
      transit: 'About a 3-minute walk to 28 St (N/R/W, 6), near multiple lines',
      why: 'Strong value for a move-in-ready space. Lowest upfront setup burden and near multiple subway lines.',
      watch: 'May feel tight if hiring exceeds plan sooner than expected.',
      scores: { growth: 70, transit: 98, client: 80, speed: 92, flex: 92 },
      labels: { growth: 'Medium', transit: 'Excellent', client: 'Medium-high', speed: 'Fast', flex: 'High' },
      geo: { x: 56, y: 30 },
      memo: {
        r1: 'NoMad is the strongest overall fit on your priorities because it is move-in ready, offers better lease flexibility, and sits near multiple subway lines.',
        r2: 'NoMad is the strongest value alternative because it is move-in ready and offers better lease flexibility. It is the right choice if speed and minimizing upfront friction matter more than long-term expansion space.',
        r3: 'NoMad should be considered only if you are comfortable with a tighter layout if hiring outpaces plan.',
      },
    },
    {
      id: 'chelsea', neighborhood: 'Chelsea', rent: 31900, sqft: 4800, seats: [38, 48], meetingRooms: 3,
      availableWeeks: 8, flexibility: '24-month standard term', type: 'Direct lease · private · flexible layout',
      transit: 'C/E at 23 St and the L at 8 Av nearby; longer for Brooklyn commuters',
      why: 'Best long-term growth option with flexible layout and strong natural light.',
      watch: 'Highest monthly cost. Slightly less convenient for the team’s Brooklyn commuters.',
      scores: { growth: 98, transit: 82, client: 96, speed: 80, flex: 78 },
      labels: { growth: 'High', transit: 'Good', client: 'High', speed: 'Medium', flex: 'Medium' },
      geo: { x: 24, y: 42 },
      memo: {
        r1: 'Chelsea is the strongest overall fit on your priorities because it gives the most long-term room and natural light, at the highest monthly cost.',
        r2: 'Chelsea is the strongest growth alternative because it offers the most seats and a flexible layout. It is the right choice if you are confident in your hiring plan and can accept the highest monthly cost.',
        r3: 'Chelsea should be considered only if your hiring plan is highly confident and workspace quality is a strategic part of recruiting.',
      },
    },
    {
      id: 'unionsq', neighborhood: 'Union Square', rent: 24900, sqft: 3300, seats: [25, 30], meetingRooms: 2,
      availableWeeks: 4, flexibility: '12-month terms available', type: 'Furnished private office · short-term',
      transit: 'Steps from 14 St–Union Sq (4/5/6, L, N/Q/R/W)',
      why: 'Best location and lowest monthly rent. Good fit if the company prioritizes central access and near-term flexibility.',
      watch: 'Limited growth room. Could require another move within 12 months.',
      scores: { growth: 55, transit: 100, client: 78, speed: 88, flex: 85 },
      labels: { growth: 'Low', transit: 'Excellent', client: 'Medium', speed: 'Fast', flex: 'Medium-high' },
      geo: { x: 66, y: 74 },
      memo: {
        r1: 'Union Square is the strongest overall fit on your priorities because it combines the best location with the lowest monthly rent.',
        r2: 'Union Square is the strongest location alternative because it has the best transit access and the lowest rent. It is the right choice if central access and near-term flexibility matter more than growth room.',
        r3: 'Union Square should be considered only if you are comfortable with limited growth room and could need another move within 12 months.',
      },
    },
  ];

  /* ---------- Tour coordination ---------- */
  const TOUR_STEPS = [
    { title: 'Select the spaces to visit', owner: 'You' },
    { title: 'Share availability', owner: 'You' },
    { title: 'Tandem confirms tours with each building', owner: 'Tandem + advisor' },
    { title: 'Your Tandem advisor creates a tour route and briefing', owner: 'Advisor' },
    { title: 'Tour spaces with a local advisor', owner: 'Advisor' },
    { title: 'Record feedback immediately after each visit', owner: 'You' },
    { title: 'Update the shortlist and prepare offers', owner: 'Tandem + advisor' },
  ];
  const AVAILABILITY = [
    { value: 'thu-am', label: 'Thursday morning', day: 'Thursday', start: 10 * 60 },
    { value: 'thu-pm', label: 'Thursday afternoon', day: 'Thursday', start: 14 * 60 },
    { value: 'fri-am', label: 'Friday morning', day: 'Friday', start: 10 * 60 },
  ];
  // Minutes after the first tour that each later tour starts (10:00, 10:50, 11:45 in the sample).
  const TOUR_OFFSETS = [0, 50, 105];
  const DEBRIEF_GAP = 35;
  // Visiting order follows geography, not score, so the route is efficient.
  const ROUTE_ORDER = ['flatiron', 'nomad', 'chelsea', 'unionsq'];

  /* ---------- Human + AI boundary ---------- */
  const AI_HANDLES = [
    'Translating needs into structured requirements',
    'Searching and organizing inventory',
    'Ranking options against stated preferences',
    'Detecting tradeoffs and missing requirements',
    'Creating comparison summaries',
    'Scheduling and follow-up coordination',
    'Tracking documents, next steps, and deadlines',
    'Capturing feedback patterns to improve matching',
  ];
  const ADVISOR_HANDLES = [
    'Asking the questions a form cannot anticipate',
    'Assessing neighborhood, building, and space quality in person',
    'Building trust with customers and landlords',
    'Advising on pricing, concessions, lease terms, and timing',
    'Supporting sensitive or high-stakes decisions',
    'Guiding negotiations and final decision-making',
    'Escalating issues that require judgment or a relationship',
  ];
  const BOUNDARY_STATEMENT =
    'The goal is not to remove the broker from an important decision. The goal is to remove the busywork so the human conversation happens where it matters.';

  /* ---------- Product learning ---------- */
  const LEARNING_QUESTIONS = [
    'Which questions predict a successful match?',
    'Which attributes matter only after someone sees a space in person?',
    'Where do AI recommendations save time?',
    'Where do users override the system?',
    'Which steps still require a trusted human advisor?',
    'What causes a deal to stall?',
  ];
  const INSIGHT = {
    pattern: 'Companies with 20–40 employees frequently prioritize flexibility and meeting-room capacity more than raw square footage.',
    implication:
      'Ask about expected meeting load and hiring uncertainty earlier in discovery. Increase weight on flexible terms for teams with uncertain 12-month headcount.',
  };

  const ROLES = ['Founder / CEO', 'COO / Head of Operations', 'CFO / Finance lead', 'Office manager', 'Other'];

  window.TandemData = {
    CONFIG, SCENARIO_LABEL, DEFAULT_ANSWERS, CITIES, HOODS, GROWTH, MOVES, FEATURES, FLEX, UNCERTAINTY,
    MEETING_LOAD, FACTORS, LISTINGS, TOUR_STEPS, AVAILABILITY, TOUR_OFFSETS, DEBRIEF_GAP, ROUTE_ORDER,
    AI_HANDLES, ADVISOR_HANDLES, BOUNDARY_STATEMENT, LEARNING_QUESTIONS, INSIGHT, ROLES,
  };
})();
