/* Reusable UI components. Each returns an HTML string; all dynamic text is escaped. */
(function () {
  const D = window.TandemData;
  const M = window.TandemModel;
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ids = (s) => String(s).replace(/[^a-z0-9]/gi, '');

  /* ---------- Primitives ---------- */
  function Button({ label, variant = 'secondary', size = '', action = '', id = '', type = 'button', attrs = '' }) {
    return `<button type="${type}" class="btn btn-${variant}${size ? ' btn-' + size : ''}"${action ? ` data-action="${action}"` : ''}${
      id ? ` data-id="${esc(id)}"` : ''
    } ${attrs}>${esc(label)}</button>`;
  }
  const Chip = (text) => `<span class="chip">${esc(text)}</span>`;
  const Badge = (text, kind = 'muted') => `<span class="badge badge-${kind}">${esc(text)}</span>`;

  function Field({ id, label, type = 'text', required = false, options = null, textarea = false, placeholder = '', autocomplete = '' }) {
    let control;
    if (options) {
      control = `<select id="${id}" name="${id}"${required ? ' required' : ''}><option value="">Select…</option>${options
        .map((o) => `<option>${esc(o)}</option>`)
        .join('')}</select>`;
    } else if (textarea) {
      control = `<textarea id="${id}" name="${id}" rows="4"${required ? ' required' : ''} placeholder="${esc(placeholder)}"></textarea>`;
    } else {
      control = `<input id="${id}" name="${id}" type="${type}"${required ? ' required' : ''}${autocomplete ? ` autocomplete="${autocomplete}"` : ''} placeholder="${esc(placeholder)}">`;
    }
    return `<div class="field"><label for="${id}">${esc(label)}</label>${control}<p class="field-error" id="${id}-err" role="alert"></p></div>`;
  }

  /* ---------- Hero ---------- */
  function Hero({ previewRows }) {
    return `<section class="hero"><div class="wrap hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">Tandem Search Workspace · interactive prototype</p>
        <h1>Find an office your team will actually want to work from.</h1>
        <p class="lede">Tandem combines AI-powered matching with local leasing expertise to help growing teams find, tour, compare, and lease office space in weeks—not months.</p>
        <div class="cta-row">
          ${Button({ label: 'Start an office search', variant: 'primary', size: 'lg', action: 'start-search' })}
          ${Button({ label: 'See a sample shortlist', size: 'lg', action: 'see-shortlist' })}
        </div>
        <p class="trust-line">Verified spaces. Local advisors. No cost to tenants.</p>
      </div>
      <aside class="preview" aria-label="Sample search preview">
        <div class="preview-bar"><span>Sample search</span>${Badge('Demo data', 'muted')}</div>
        <p class="preview-title">${esc(D.SCENARIO_LABEL)}</p>
        <p class="fine">22 seats now · up to 45 in 12 months · $25,000–$32,000 / month · move in within 60 days</p>
        <ol class="preview-list">${previewRows
          .map(
            (r, i) => `<li><span class="rank">${i + 1}</span><span class="pv-name"><strong>${esc(r.l.neighborhood)}</strong><span class="fine block">${esc(M.money(r.l.rent))}/mo · ${esc(r.l.seats[0])}–${esc(r.l.seats[1])} seats</span></span><span class="score">${r.res.total}</span></li>`
          )
          .join('')}</ol>
        <p class="fine">Tandem fit score — based on your stated priorities.</p>
      </aside>
    </div></section>`;
  }

  /* ---------- Discovery form ---------- */
  function DiscoveryStep({ q, a, index, total }) {
    let body = '';
    switch (q.type) {
      case 'city':
        body = `<div class="choice-grid">${D.CITIES.map(
          (c) => `<label class="choice"><input type="radio" name="city" data-q="city" value="${c.value}"${a.city === c.value ? ' checked' : ''}><span>${esc(c.label)}</span></label>`
        ).join('')}</div>`;
        break;
      case 'number':
        body = `<div class="field"><label for="q-headcount">People needing seats now</label><input id="q-headcount" type="number" min="1" max="500" data-q="headcountNow" value="${a.headcountNow}"></div>`;
        break;
      case 'growth':
        body = `<div class="choice-grid">${D.GROWTH.map(
          (g) => `<label class="choice"><input type="radio" name="growth" data-q="growth" value="${g.value}"${a.growth === g.value ? ' checked' : ''}><span>${esc(g.label)}</span></label>`
        ).join('')}</div>`;
        break;
      case 'move':
        body = `<div class="choice-grid">${D.MOVES.map(
          (m) => `<label class="choice"><input type="radio" name="move" data-q="move" value="${m.value}"${a.move === m.value ? ' checked' : ''}><span>${esc(m.label)}</span></label>`
        ).join('')}</div>`;
        break;
      case 'budget':
        body = `<div class="two-col"><div class="field"><label for="q-bmin">Minimum per month ($)</label><input id="q-bmin" type="number" min="0" step="500" data-q="budgetMin" value="${a.budgetMin}"></div>
          <div class="field"><label for="q-bmax">Maximum per month ($)</label><input id="q-bmax" type="number" min="0" step="500" data-q="budgetMax" value="${a.budgetMax}"></div></div>`;
        break;
      case 'hoods':
        body = `<div class="choice-grid">${D.HOODS[a.city]
          .map((h) => `<label class="choice"><input type="checkbox" data-q="hoods" value="${esc(h)}"${a.hoods.includes(h) ? ' checked' : ''}><span>${esc(h)}</span></label>`)
          .join('')}</div>`;
        break;
      case 'features':
        body = `<div class="choice-grid">${D.FEATURES.map((f) => {
          const on = a.features.includes(f);
          return `<label class="choice"><input type="checkbox" data-q="features" value="${esc(f)}"${on ? ' checked' : ''}${!on && a.features.length >= 3 ? ' disabled' : ''}><span>${esc(f)}</span></label>`;
        }).join('')}</div>`;
        break;
      case 'flex':
        body = `<div class="choice-grid">${D.FLEX.map(
          (f) => `<label class="choice"><input type="radio" name="flex" data-q="flex" value="${f.value}"${a.flex === f.value ? ' checked' : ''}><span>${esc(f.label)}<span class="fine block">${esc(f.hint)}</span></span></label>`
        ).join('')}</div>`;
        break;
      case 'uncertainty':
        body = `<div class="choice-grid">${D.UNCERTAINTY.map(
          (u) => `<label class="choice"><input type="radio" name="uncertainty" data-q="uncertainty" value="${u.value}"${a.uncertainty === u.value ? ' checked' : ''}><span>${esc(u.label)}</span></label>`
        ).join('')}</div>`;
        break;
      case 'meetingLoad':
        body = `<div class="choice-grid">${D.MEETING_LOAD.map(
          (u) => `<label class="choice"><input type="radio" name="meetingLoad" data-q="meetingLoad" value="${u.value}"${a.meetingLoad === u.value ? ' checked' : ''}><span>${esc(u.label)}</span></label>`
        ).join('')}</div>`;
        break;
      case 'badfit':
        body = `<div class="field"><label for="q-bad">What should we avoid?</label><textarea id="q-bad" rows="3" data-q="badFit">${esc(a.badFit)}</textarea></div>
          <div class="field"><label for="q-tours">Most spaces you are willing to tour</label><select id="q-tours" data-q="maxTours">${[1, 2, 3, 4]
            .map((n) => `<option value="${n}"${a.maxTours === n ? ' selected' : ''}>${n}</option>`)
            .join('')}</select></div>`;
        break;
    }
    const last = index === total - 1;
    return `<div class="wizard-card">
      <div class="wizard-top"><p class="step-count">Question ${index + 1} of ${total}${q.isNew ? ' ' + Badge('New from product learning', 'accent') : ''}</p>
        <div class="progress" role="progressbar" aria-label="Discovery progress" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${index + 1}"><span style="width:${((index + 1) / total) * 100}%"></span></div></div>
      <h3 id="q-title" tabindex="-1">${esc(q.title)}</h3>
      <p class="fine">${esc(q.hint)}</p>
      <div class="q-body">${body}</div>
      <p class="field-error" id="q-error" role="alert"></p>
      <div class="wizard-actions">
        <div>${index > 0 ? Button({ label: 'Back', action: 'wizard-back' }) : ''}${Button({ label: last ? 'Generate my brief' : 'Next', variant: 'primary', action: last ? 'wizard-finish' : 'wizard-next' })}</div>
        ${Button({ label: 'Use example answers and skip to brief', variant: 'link', action: 'wizard-skip' })}
      </div>
    </div>`;
  }

  function WorkspaceIntro({ a, brief }) {
    return `<div class="wizard-card intro">
      <p class="eyebrow">Sample search loaded</p>
      <h3>${esc(D.SCENARIO_LABEL)}</h3>
      <div class="chips">${brief.chips.slice(0, 7).map(([k, v]) => Chip(`${k}: ${v}`)).join('')}</div>
      <p class="fine">The shortlist below is built from these sample requirements. Answer nine short questions, or edit the example, and Tandem rebuilds the brief and the ranking.</p>
      <div class="wizard-actions"><div>${Button({ label: 'Start an office search', variant: 'primary', action: 'start-search' })}</div></div>
    </div>`;
  }

  function Generating() {
    return `<div class="wizard-card generating" role="status"><span class="spinner" aria-hidden="true"></span> Assembling your brief from your answers…</div>`;
  }

  /* ---------- AI brief ---------- */
  function AIBrief({ brief }) {
    return `<div class="brief">
      <div class="brief-head"><h3>Your office search brief</h3>${Badge('Assembled from your answers with sample rules', 'muted')}</div>
      <div class="brief-text">${brief.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
      <div class="brief-grid">
        <div><h4>Structured requirements</h4>
          <dl class="req">${brief.chips.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div>
        <div><h4>What Tandem noticed</h4>
          <ul class="notes">${brief.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>
      </div>
      <div class="cta-row">
        ${Button({ label: 'View recommended spaces', variant: 'primary', action: 'view-spaces' })}
        ${Button({ label: 'Edit requirements', action: 'edit-req' })}
        ${Button({ label: 'Talk to a Tandem advisor', action: 'talk-advisor' })}
      </div>
    </div>`;
  }

  /* ---------- Match explanation (fit score breakdown) ---------- */
  function MatchExplanation({ res }) {
    return `<div class="breakdown">
      <p class="fine">Tandem fit score — based on your stated priorities. Not an objective rating.</p>
      <table class="mini"><thead><tr><th scope="col">Factor</th><th scope="col">Score</th><th scope="col">Weight</th><th scope="col">Points</th></tr></thead><tbody>${res.parts
        .map(
          (p) => `<tr><th scope="row">${esc(p.label)}</th><td><span class="bar"><span style="width:${p.score}%"></span></span> ${p.score}</td><td>${Math.round(p.weight * 100)}%</td><td>${p.points.toFixed(1)}</td></tr>`
        )
        .join('')}${res.penalty ? `<tr><th scope="row">Outside preferred neighborhoods</th><td></td><td></td><td>−${res.penalty}</td></tr>` : ''}</tbody></table>
    </div>`;
  }

  /* ---------- Office listing card ---------- */
  function ListingCard({ l, res, rank, ctx }) {
    const seats = `${l.seats[0]}–${l.seats[1]}`;
    const fact = (k, v) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`;
    const tourDisabled = !ctx.inTour && ctx.tourFull;
    const compareDisabled = !ctx.inCompare && ctx.compareFull;
    return `<article class="listing" id="listing-${l.id}" aria-labelledby="ln-${l.id}">
      <header class="listing-head">
        <div><span class="rank-tag">#${rank}</span><h3 id="ln-${l.id}">${esc(l.neighborhood)}</h3><p class="fine">${esc(l.type)}</p></div>
        <div class="score-box" aria-label="Tandem fit score ${res.total} out of 100"><span class="score-num">${res.total}</span><span class="score-lbl">Fit score</span></div>
      </header>
      <dl class="facts">
        ${fact('Monthly rent', M.money(l.rent))}
        ${fact('Approx. size', l.sqft.toLocaleString('en-US') + ' sq ft')}
        ${fact('Seat capacity', seats)}
        ${fact('Meeting rooms', String(l.meetingRooms))}
        ${fact('Available', M.availableDate(l))}
        ${fact('Lease flexibility', l.flexibility)}
      </dl>
      <p class="transit"><strong>Transit:</strong> ${esc(l.transit)}</p>
      <div class="chips">${res.overBudget ? Badge('Over your budget', 'warn') : ''}${res.outside ? Badge('Outside preferred neighborhoods', 'warn') : ''}${Badge(`Seats up to ${l.seats[1]} · covers ${res.coverage}% of your ${res.max}-person plan`, 'muted')}</div>
      <div class="why-grid">
        <div><h4>Why it matches</h4><p>${esc(l.why)}</p></div>
        <div><h4>Watch-outs</h4><p>${esc(l.watch)}</p></div>
      </div>
      <button type="button" class="link-btn" data-action="toggle-breakdown" data-id="${l.id}" aria-expanded="${ctx.breakdownOpen}">${ctx.breakdownOpen ? 'Hide' : 'Show'} how the fit score is built</button>
      ${ctx.breakdownOpen ? MatchExplanation({ res }) : ''}
      <div class="listing-actions">
        ${Button({ label: ctx.inCompare ? 'In comparison ✓' : 'Compare spaces', size: 'sm', action: 'toggle-compare', id: l.id, attrs: `aria-pressed="${ctx.inCompare}"${compareDisabled ? ' disabled' : ''}` })}
        ${Button({ label: 'Ask a question', size: 'sm', action: 'toggle-ask', id: l.id, attrs: `aria-expanded="${!!ctx.askOpen}"` })}
        ${Button({ label: ctx.inTour ? 'Tour requested ✓' : 'Request a tour', size: 'sm', variant: ctx.inTour ? 'primary' : 'secondary', action: 'toggle-tour', id: l.id, attrs: `aria-pressed="${ctx.inTour}"${tourDisabled ? ' disabled' : ''}` })}
        ${Button({ label: 'Remove from shortlist', size: 'sm', variant: 'quiet', action: 'remove', id: l.id })}
      </div>
      ${ctx.inTour ? `<p class="fine">Added to the tour plan below. Nothing is booked until your advisor confirms.</p>` : ''}
      ${compareDisabled ? `<p class="fine">Comparison is full (3 spaces). Remove one to add another.</p>` : ''}
      ${tourDisabled ? `<p class="fine">You set a limit of ${ctx.maxTours} tours. Remove one from the tour plan to add another.</p>` : ''}
      ${ctx.askOpen ? AskPanel({ l, sent: ctx.askSent }) : ''}
    </article>`;
  }

  function AskPanel({ l, sent }) {
    const prompts = [
      'What is the landlord’s typical concession for this term length?',
      'Can the layout flex if we hire faster than planned?',
      'What are the after-hours access and visitor rules?',
      'What is the real commute for our Brooklyn team members?',
    ];
    if (sent) {
      return `<div class="ask" role="status"><p><strong>Question saved for your Tandem advisor.</strong></p><p class="fine">“${esc(sent)}”</p><p class="fine">Demo only: nothing was sent. In a live search, a local advisor would answer this, because it depends on the building and landlord.</p></div>`;
    }
    return `<form class="ask" data-ask="${l.id}">
      <label for="ask-sel-${l.id}">Pick a common question</label>
      <select id="ask-sel-${l.id}" data-ask-select="${l.id}"><option value="">Choose…</option>${prompts.map((p) => `<option>${esc(p)}</option>`).join('')}</select>
      <label for="ask-txt-${l.id}">Or write your own</label>
      <textarea id="ask-txt-${l.id}" rows="2" placeholder="Ask about ${esc(l.neighborhood)}…"></textarea>
      <div>${Button({ label: 'Send to advisor', variant: 'primary', size: 'sm', type: 'submit' })}</div>
    </form>`;
  }

  /* ---------- Priorities panel ---------- */
  function PrioritiesPanel({ weights, derived }) {
    const sum = D.FACTORS.reduce((s, f) => s + weights[f.key], 0) || 1;
    return `<div class="priorities" id="priorities-panel">
      <div class="priorities-head"><h3>Adjust priorities</h3><p class="fine">Drag to change how much each factor counts. Scores and ranking update immediately.</p></div>
      <div class="sliders">${D.FACTORS.map(
        (f) => `<div class="slider"><label for="w-${f.key}">${esc(f.label)} <span class="fine" id="wv-${f.key}">${Math.round((weights[f.key] / sum) * 100)}%</span></label>
        <input id="w-${f.key}" type="range" min="0" max="30" step="1" value="${weights[f.key]}" data-weight="${f.key}" aria-describedby="wh-${f.key}"><span class="fine" id="wh-${f.key}">${esc(f.hint)}</span></div>`
      ).join('')}</div>
      <div>${Button({ label: 'Reset to my brief', size: 'sm', action: 'reset-weights', attrs: derived ? 'disabled' : '' })}</div>
    </div>`;
  }

  /* ---------- Schematic map ---------- */
  function NeighborhoodMap({ items }) {
    return `<figure class="map"><svg viewBox="0 0 100 100" role="img" aria-label="Schematic map of the shortlisted neighborhoods in Manhattan, not to scale">
      <rect width="100" height="100" fill="var(--map-bg)"/>
      <rect x="0" y="0" width="9" height="100" fill="var(--map-water)"/><rect x="91" y="0" width="9" height="100" fill="var(--map-water)"/>
      <g stroke="var(--map-line)" stroke-width=".4">${[18, 30, 42, 54, 66, 78, 90].map((y) => `<line x1="9" x2="91" y1="${y}" y2="${y}"/>`).join('')}${[22, 36, 50, 64, 78].map((x) => `<line y1="0" y2="100" x1="${x}" x2="${x}"/>`).join('')}</g>
      <text x="4.5" y="50" font-size="3" fill="var(--muted)" text-anchor="middle" transform="rotate(-90 4.5 50)">HUDSON RIVER</text>
      <text x="95.5" y="50" font-size="3" fill="var(--muted)" text-anchor="middle" transform="rotate(90 95.5 50)">EAST RIVER</text>
      ${items
        .map(
          ({ l, res }) => `<g><circle cx="${l.geo.x}" cy="${l.geo.y}" r="4.2" fill="var(--blue)" stroke="#fff" stroke-width="1"/><text x="${l.geo.x}" y="${l.geo.y + 1.2}" font-size="3.4" font-weight="700" fill="#fff" text-anchor="middle">${res.total}</text><text x="${l.geo.x}" y="${l.geo.y - 6}" font-size="3.4" font-weight="600" fill="var(--ink)" text-anchor="middle">${esc(l.neighborhood)}</text></g>`
        )
        .join('')}
    </svg><figcaption class="fine">Schematic only, not to scale. Pins show fit scores.</figcaption></figure>`;
  }

  /* ---------- Comparison table + memo ---------- */
  function ComparisonTable({ items, others }) {
    const rows = [
      ['Monthly rent', (x) => M.money(x.l.rent)],
      ['Seats today', (x) => `${x.l.seats[0]}–${x.l.seats[1]}`],
      ['Growth capacity', (x) => x.l.labels.growth],
      ['Transit fit', (x) => x.l.labels.transit],
      ['Client-readiness', (x) => x.l.labels.client],
      ['Move-in speed', (x) => x.l.labels.speed],
      ['Lease flexibility', (x) => x.l.labels.flex],
      ['Total score', (x) => String(x.res.total)],
    ];
    return `<div class="table-wrap" tabindex="0" role="region" aria-label="Side-by-side comparison"><table class="compare">
      <thead><tr><th scope="col">Decision factor</th>${items
        .map((x) => `<th scope="col">${esc(x.l.neighborhood)}<button type="button" class="x-btn" data-action="toggle-compare" data-id="${x.l.id}" aria-label="Remove ${esc(x.l.neighborhood)} from comparison">&times;</button></th>`)
        .join('')}</tr></thead>
      <tbody>${rows
        .map(
          (r, i) => `<tr${i === rows.length - 1 ? ' class="total"' : ''}><th scope="row">${r[0]}</th>${items.map((x) => `<td>${esc(r[1](x))}</td>`).join('')}</tr>`
        )
        .join('')}</tbody></table></div>
      <p class="fine">Total score is the Tandem fit score — based on your stated priorities. Qualitative ratings are sample data.</p>
      ${others.length ? `<div class="add-row"><span class="fine">Add to comparison:</span>${others.map((o) => Button({ label: '+ ' + o.neighborhood, size: 'sm', action: 'toggle-compare', id: o.id })).join('')}</div>` : ''}`;
  }

  function DecisionMemo({ memo }) {
    if (!memo) return '';
    return `<div class="memo"><div class="memo-head"><h3>Decision memo</h3>${Badge('Generated from your priorities', 'muted')}</div>
      <p class="memo-rec">${esc(memo.heading)}</p>
      ${memo.paras.map((p) => `<p>${esc(p)}</p>`).join('')}
      <p class="memo-note">This recommendation reflects your stated priorities. Your Tandem advisor can help validate building quality, landlord terms, and live market conditions.</p>
      <div>${Button({ label: 'Ask an advisor to validate this', size: 'sm', action: 'talk-advisor' })}</div></div>`;
  }

  /* ---------- Tour itinerary + planner ---------- */
  function TourItinerary({ plan, byId }) {
    if (!plan.stops.length) return `<p class="fine">Select at least one space to see a route.</p>`;
    return `<div class="itinerary"><p class="itin-head">${esc(plan.day)}, ${esc(M.fmtTime(plan.start))}–${esc(M.fmtTime(plan.end))} <span class="tag">Sample itinerary</span></p>
      <ol>${plan.stops
        .map((s) => `<li><span class="time">${esc(M.fmtTime(s.minutes))}</span><span>${esc(byId[s.id].neighborhood)} office</span></li>`)
        .join('')}<li class="debrief"><span class="time">${esc(M.fmtTime(plan.debrief))}</span><span>Decision debrief with Tandem advisor</span></li></ol></div>`;
  }

  function TourPlanner({ shortlist, tours, maxTours, availability, plan, byId, requested, advisor }) {
    const full = tours.length >= maxTours;
    const statusOf = (i) => (i <= 1 ? (requested ? 'done' : 'todo') : requested && i === 2 ? 'pending' : 'todo');
    return `<div class="tour-grid">
      <ol class="tour-steps">${D.TOUR_STEPS.map((s, i) => {
        const st = statusOf(i);
        return `<li class="tstep tstep-${st}"><span class="tn" aria-hidden="true">${st === 'done' ? '✓' : i + 1}</span><span><strong>${esc(s.title)}</strong><span class="fine block">${esc(s.owner)}${st === 'pending' ? ' · waiting on advisor confirmation' : ''}</span></span></li>`;
      }).join('')}</ol>
      <div class="tour-panel">
        <fieldset><legend>1 · Select the spaces to visit <span class="fine">(up to ${maxTours})</span></legend>
          ${shortlist
            .map((l) => {
              const on = tours.includes(l.id);
              return `<label class="choice"><input type="checkbox" data-tour="${l.id}"${on ? ' checked' : ''}${!on && full ? ' disabled' : ''}><span>${esc(l.neighborhood)}<span class="fine block">${esc(M.money(l.rent))}/mo · ${esc(l.type)}</span></span></label>`;
            })
            .join('') || '<p class="fine">Your shortlist is empty. Restore a space above.</p>'}
        </fieldset>
        <fieldset><legend>2 · Share availability</legend>
          <div class="choice-grid">${D.AVAILABILITY.map(
            (s) => `<label class="choice"><input type="radio" name="avail" data-avail value="${s.value}"${availability === s.value ? ' checked' : ''}><span>${esc(s.label)}</span></label>`
          ).join('')}</div>
        </fieldset>
        ${TourItinerary({ plan, byId })}
        ${
          requested
            ? `<div class="confirm" role="status"><h4>Tour request prepared.</h4><p>Your Tandem advisor will confirm building access, route timing, and any required visitor details.</p><p class="fine">Demo only: no tours are booked and no buildings were contacted.</p><div>${Button({ label: 'Edit request', size: 'sm', action: 'edit-tours' })}</div></div>`
            : `<div>${Button({ label: 'Request these tours', variant: 'primary', action: 'request-tours', attrs: plan.stops.length ? '' : 'disabled' })}</div>`
        }
      </div>
    </div>`;
  }

  /* ---------- Human + AI boundary ---------- */
  function HumanAIBoundary() {
    const col = (title, cls, items) =>
      `<div class="bcol ${cls}"><h3>${esc(title)}</h3><ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`;
    return `<div class="boundary">${col('AI handles', 'ai', D.AI_HANDLES)}${col('A Tandem advisor handles', 'human', D.ADVISOR_HANDLES)}</div>
      <p class="boundary-note">${esc(D.BOUNDARY_STATEMENT)}</p>`;
  }

  /* ---------- Product insight ---------- */
  function InsightCard({ applied }) {
    return `<div class="learning-grid">
      <ul class="lq">${D.LEARNING_QUESTIONS.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>
      <div class="insight"><div class="insight-head"><span>Example product-learning workflow</span>${Badge('Illustrative, not Tandem data', 'warn')}</div>
        <p class="insight-label">Observed pattern</p><p>${esc(D.INSIGHT.pattern)}</p>
        <p class="insight-label">Product implication</p><p>${esc(D.INSIGHT.implication)}</p>
        ${
          applied
            ? `<p class="applied" role="status">Applied in this demo: discovery now asks about hiring confidence and meeting load, and flexible terms weigh more for teams with uncertain headcount.</p><div>${Button({ label: 'Undo in demo', size: 'sm', action: 'apply-insight' })}</div>`
            : `<div>${Button({ label: 'Apply this to the discovery flow', variant: 'primary', size: 'sm', action: 'apply-insight' })}</div>`
        }
      </div></div>`;
  }

  /* ---------- CTA form ---------- */
  function CtaForm() {
    return `<form id="advisor-form" novalidate>
      <div class="fields">
        ${Field({ id: 'af-name', label: 'Name', required: true, autocomplete: 'name' })}
        ${Field({ id: 'af-email', label: 'Work email', type: 'email', required: true, autocomplete: 'email' })}
        ${Field({ id: 'af-company', label: 'Company', required: true, autocomplete: 'organization' })}
        ${Field({ id: 'af-role', label: 'Role', required: true, options: D.ROLES })}
        ${Field({ id: 'af-note', label: 'What should the advisor know?', textarea: true, placeholder: 'Team size, timing, neighborhoods, anything unusual.' })}
      </div>
      <p class="fine" id="af-local" hidden>This prototype has no backend. Your request is saved in this browser only.</p>
      <p class="field-error" id="af-fail" role="alert" hidden>Something went wrong sending that. Please try again.</p>
      <button type="submit" class="btn btn-primary btn-lg">Request an advisor conversation</button>
    </form>`;
  }

  window.TandemUI = {
    esc, ids, Button, Chip, Badge, Field, Hero, DiscoveryStep, WorkspaceIntro, Generating, AIBrief, MatchExplanation,
    ListingCard, PrioritiesPanel, NeighborhoodMap, ComparisonTable, DecisionMemo, TourItinerary, TourPlanner,
    HumanAIBoundary, InsightCard, CtaForm,
  };
})();
