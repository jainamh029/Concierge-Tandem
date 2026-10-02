/* Pure logic for the demo: question flow, fit scoring, brief text, itinerary, memo.
   No DOM access here, so it is easy to test and to swap for real services later. */
(function () {
  const D = window.TandemData;

  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const range = (a, b) => `${money(a)}–${money(b)}`;
  const oxford = (items, word) => {
    if (items.length <= 1) return items.join('');
    if (items.length === 2) return `${items[0]} ${word} ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, ${word} ${items[items.length - 1]}`;
  };
  const optionLabel = (list, value) => (list.find((o) => String(o.value) === String(value)) || {}).label || '';

  function fmtTime(min) {
    const h24 = Math.floor(min / 60);
    const m = min % 60;
    const h = ((h24 + 11) % 12) + 1;
    return `${h}:${String(m).padStart(2, '0')} ${h24 >= 12 ? 'PM' : 'AM'}`;
  }

  function availableDate(l) {
    const d = new Date();
    d.setDate(d.getDate() + l.availableWeeks * 7);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /* ---------- Discovery questions ---------- */
  function questions(insightApplied) {
    const base = [
      { id: 'city', type: 'city', title: 'Where does your team need to work?', hint: 'The sample inventory in this demo covers New York only.' },
      { id: 'headcountNow', type: 'number', title: 'How many people need seats now?', hint: 'Include people who are in the office most days.' },
      { id: 'growth', type: 'growth', title: 'How much do you expect to grow in the next 12 months?', hint: 'A rough range is fine. Your advisor can refine it.' },
      { id: 'move', type: 'move', title: 'What is your ideal move-in date?', hint: 'Faster timelines usually favor furnished or move-in-ready spaces.' },
      { id: 'budget', type: 'budget', title: 'What is your monthly budget range?', hint: 'Total monthly rent you would consider, before any one-time costs.' },
      { id: 'hoods', type: 'hoods', title: 'Which neighborhoods work best for your team?', hint: 'Choose all that work. Think about where your team commutes from.' },
      { id: 'features', type: 'features', title: 'Which workspace features matter most?', hint: 'Choose up to three.' },
      { id: 'flex', type: 'flex', title: 'How important is lease flexibility?', hint: 'Shorter terms and expansion options often cost more per square foot.' },
      { id: 'badFit', type: 'badfit', title: 'What would make an office a bad fit?', hint: 'Tell us what to avoid, and how many tours you are willing to do.' },
    ];
    if (!insightApplied) return base;
    // Product-learning example: two earlier questions, inserted after the growth question.
    const extra = [
      { id: 'uncertainty', type: 'uncertainty', title: 'How confident are you in that hiring plan?', hint: 'Added from the product-learning example: uncertain headcount changes which spaces fit.', isNew: true },
      { id: 'meetingLoad', type: 'meetingLoad', title: 'What is your expected meeting load?', hint: 'Added from the product-learning example: meeting capacity often matters more than square footage.', isNew: true },
    ];
    const i = base.findIndex((q) => q.id === 'growth') + 1;
    return [...base.slice(0, i), ...extra, ...base.slice(i)];
  }

  /* ---------- Fit score ---------- */
  function headcountMax(a) {
    const g = D.GROWTH.find((x) => x.value === a.growth);
    return Math.max(g ? g.max : a.headcountNow, a.headcountNow);
  }

  // Rent against the stated range: 100 at or under the minimum, 74 at the maximum, falling beyond it.
  function budgetScore(rent, min, max) {
    if (rent <= min) return 100;
    if (rent <= max) return 100 - (26 * (rent - min)) / Math.max(1, max - min);
    return Math.max(20, 74 - ((rent - max) / max) * 300);
  }

  function deriveWeights(a, insightApplied) {
    const g = { same: 10, moderate: 15, strong: 20, wide: 20 }[a.growth] || 15;
    const speed = { 30: 18, 60: 15, 120: 10, 0: 6 }[a.move];
    let flex = { not: 6, somewhat: 11, very: 15 }[a.flex];
    if (insightApplied && a.uncertainty === 'uncertain') flex += 3;
    return {
      budget: 20,
      growth: g,
      transit: 12 + (a.features.includes('Transit access') ? 3 : 0),
      client: 12 + (a.features.includes('Client-ready design') ? 3 : 0),
      speed: speed === undefined ? 15 : speed,
      flex,
    };
  }

  function scoreListing(l, a, weights) {
    const sum = D.FACTORS.reduce((s, f) => s + Math.max(0, weights[f.key]), 0) || 1;
    const parts = D.FACTORS.map((f) => {
      const score = f.key === 'budget' ? budgetScore(l.rent, a.budgetMin, a.budgetMax) : l.scores[f.key];
      const w = Math.max(0, weights[f.key]) / sum;
      return { key: f.key, label: f.label, score: Math.round(score), weight: w, points: score * w };
    });
    let total = parts.reduce((s, p) => s + p.points, 0);
    const outside = a.city === 'nyc' && !a.hoods.includes(l.neighborhood);
    const penalty = outside ? 8 : 0;
    total = Math.max(0, Math.min(100, Math.round(total - penalty)));
    const max = headcountMax(a);
    const coverage = Math.min(100, Math.round((l.seats[1] / max) * 100));
    const overBudget = l.rent > a.budgetMax;
    return { total, parts, penalty, outside, coverage, overBudget, max };
  }

  /* ---------- AI brief (assembled from the answers with fixed sample rules) ---------- */
  function buildBrief(a, insightApplied) {
    const max = headcountMax(a);
    const lo = Math.round((max * 78) / 500) * 500;
    const hi = Math.round((max * 111) / 500) * 500;
    const sqft = `${lo.toLocaleString('en-US')}–${hi.toLocaleString('en-US')}`;
    const f = a.features;
    const rooms = max >= 30 ? '2–3 meeting rooms' : '1–2 meeting rooms';
    const items = [];
    if (f.includes('Transit access')) items.push('strong subway access');
    if (f.includes('Meeting rooms')) items.push(rooms);
    if (f.includes('Natural light')) items.push('natural light');
    if (f.includes('Functional kitchen')) items.push('a functional kitchen');
    if (f.includes('Outdoor space')) items.push('outdoor space');
    items.push(`a target budget of ${range(a.budgetMin, a.budgetMax)} per month`);
    const hoods = a.hoods.length ? oxford(a.hoods, 'or') : 'your preferred neighborhoods';
    const move = D.MOVES.find((m) => m.value === a.move).phrase;
    const flex = { very: 'prefer flexibility', somewhat: 'value some flexibility', not: 'are comfortable with a longer commitment' }[a.flex];
    const recommend =
      a.flex !== 'not' || (a.move > 0 && a.move <= 60)
        ? 'furnished or plug-and-play spaces with 12–24 month term options'
        : 'direct-lease spaces with longer terms and stronger concession potential';

    const p1 = `You need a ${f.includes('Client-ready design') ? 'private, client-ready' : 'private'} office for ${a.headcountNow} employees, with room for up to ${max} over the next year. Your strongest fit is a ${sqft} sq ft space in ${hoods}, with ${oxford(items, 'and')}.`;
    const p2 = `Because you want to move ${move} and ${flex}, Tandem recommends prioritizing ${recommend}.`;

    const growthLabel = optionLabel(D.GROWTH, a.growth);
    const chips = [
      ['Market', optionLabel(D.CITIES, a.city)],
      ['Seats now', String(a.headcountNow)],
      ['12-month headcount', `Up to ${max}`],
      ['Space', `${sqft} sq ft`],
      ['Neighborhoods', a.hoods.join(', ') || 'Any'],
      ['Budget', `${range(a.budgetMin, a.budgetMax)} / month`],
      ['Move-in', D.MOVES.find((m) => m.value === a.move).label],
      ['Lease flexibility', optionLabel(D.FLEX, a.flex)],
      ['Priorities', f.join(', ') || 'None selected'],
      ['Avoid', a.badFit || 'Nothing specified'],
      ['Tour limit', `${a.maxTours} spaces`],
    ];

    const notes = [];
    if (a.city !== 'nyc') notes.push('The sample inventory in this demo is New York only, so the shortlist below is illustrative for your market.');
    if (!insightApplied) notes.push('Meeting load was not specified. Meeting-room count often matters more than total square footage, so an advisor would ask about it.');
    if (insightApplied) {
      notes.push(`Hiring plan: ${optionLabel(D.UNCERTAINTY, a.uncertainty).toLowerCase()}.${a.uncertainty === 'uncertain' ? ' Flexible terms are weighted higher.' : ''}`);
      notes.push(`Meeting load: ${optionLabel(D.MEETING_LOAD, a.meetingLoad).toLowerCase()}.`);
    }
    if (max / a.headcountNow >= 1.5) notes.push(`Headcount could grow from ${a.headcountNow} to ${max}. A flexible layout or an expansion option matters more than the day-one fit.`);
    notes.push(`At the top of your range, ${money(a.budgetMax)} works out to about ${money(a.budgetMax / max)} per seat per month at full growth.`);
    if (a.move === 30) notes.push('A 30-day timeline usually limits the field to move-in-ready or furnished spaces.');
    notes.push(`Tour limit of ${a.maxTours}: Tandem will recommend the highest-value tours first.`);

    return { paragraphs: [p1, p2], chips, notes, growthLabel };
  }

  /* ---------- Tour itinerary ---------- */
  function itinerary(tourIds, availabilityValue) {
    const slot = D.AVAILABILITY.find((s) => s.value === availabilityValue) || D.AVAILABILITY[0];
    const ordered = D.ROUTE_ORDER.filter((id) => tourIds.includes(id));
    const stops = ordered.map((id, i) => ({ id, minutes: slot.start + D.TOUR_OFFSETS[i] }));
    const last = stops.length ? stops[stops.length - 1].minutes : slot.start;
    const debrief = last + D.DEBRIEF_GAP;
    return { day: slot.day, start: slot.start, end: debrief + 10, stops, debrief };
  }

  /* ---------- Decision memo ---------- */
  // `ordered` is the comparison set sorted by fit score, best first.
  function memo(ordered) {
    if (!ordered.length) return null;
    const names = ordered.slice(0, 2).map((x) => x.l.neighborhood);
    const heading = `Recommendation: Tour ${names.join(' and ')} first.`;
    const paras = ordered.map((x, i) => x.l.memo['r' + (i + 1)]);
    return { heading, paras };
  }

  window.TandemModel = {
    money, range, fmtTime, availableDate, questions, headcountMax, budgetScore, deriveWeights,
    scoreListing, buildBrief, itinerary, memo, optionLabel,
  };
})();
