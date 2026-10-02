/* App state and wiring. All state changes are simulated; nothing leaves the browser. */
(function () {
  const D = window.TandemData;
  const M = window.TandemModel;
  const UI = window.TandemUI;
  const { track, EVENTS } = window.Tandem;
  const $ = (s, r = document) => r.querySelector(s);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FX = window.TandemFX;
  const byId = Object.fromEntries(D.LISTINGS.map((l) => [l.id, l]));

  const state = {
    stage: 'intro', // intro | wizard | generating | brief
    step: 0,
    a: clone(D.DEFAULT_ANSWERS),
    insight: false,
    weights: null, // null = derived from the answers; object = user-adjusted
    removed: new Set(),
    compare: ['flatiron', 'nomad', 'chelsea'],
    tours: ['flatiron', 'nomad', 'chelsea'],
    avail: 'thu-am',
    requested: false,
    askOpen: new Set(),
    askSent: {},
    breakdown: new Set(),
    prioritiesOpen: false,
    shortlistTracked: false,
  };

  const weights = () => state.weights || M.deriveWeights(state.a, state.insight);
  function shortlist() {
    const w = weights();
    return D.LISTINGS.filter((l) => !state.removed.has(l.id))
      .map((l) => ({ l, res: M.scoreListing(l, state.a, w) }))
      .sort((a, b) => b.res.total - a.res.total);
  }
  const announce = (msg) => {
    $('#sr-status').textContent = msg;
  };
  const scrollToEl = (el) => el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

  /* ---------- Renderers ---------- */
  function renderHero() {
    const w = M.deriveWeights(D.DEFAULT_ANSWERS, false);
    const rows = D.LISTINGS.map((l) => ({ l, res: M.scoreListing(l, D.DEFAULT_ANSWERS, w) }))
      .sort((a, b) => b.res.total - a.res.total)
      .slice(0, 3);
    $('#hero-mount').innerHTML = UI.Hero({ previewRows: rows });
    FX.scan($('#hero-mount'));
  }

  function renderWorkspace() {
    const el = $('#workspace-mount');
    if (state.stage === 'intro') {
      el.innerHTML = UI.WorkspaceIntro({ a: D.DEFAULT_ANSWERS, brief: M.buildBrief(D.DEFAULT_ANSWERS, false) });
    } else if (state.stage === 'wizard') {
      const qs = M.questions(state.insight);
      state.step = Math.min(state.step, qs.length - 1);
      el.innerHTML = UI.DiscoveryStep({ q: qs[state.step], a: state.a, index: state.step, total: qs.length });
    } else if (state.stage === 'generating') {
      el.innerHTML = UI.Generating();
    } else {
      el.innerHTML = UI.AIBrief({ brief: M.buildBrief(state.a, state.insight) });
    }
    FX.scan(el);
  }
  const focusQuestion = () => {
    const t = $('#q-title');
    if (t) t.focus({ preventScroll: true });
  };

  function renderToolbar() {
    const list = shortlist();
    const personalised = state.stage === 'brief';
    const removed = [...state.removed].map((id) => byId[id]);
    $('#sl-toolbar').innerHTML = `
      <div class="sl-banner ${personalised ? 'sl-live' : ''}">${
        personalised
          ? 'Ranked against your brief.'
          : 'Showing the sample search. Start an office search to rank against your own requirements.'
      } <span class="fine">Sample inventory, not live listings.</span></div>
      <div class="sl-controls">
        <span class="fine" aria-live="polite">${list.length} space${list.length === 1 ? '' : 's'} shortlisted · ${state.compare.length}/3 in comparison · ${state.tours.length}/${state.a.maxTours} tours</span>
        <div class="sl-buttons">
          ${UI.Button({ label: 'Adjust priorities', size: 'sm', action: 'toggle-priorities', attrs: `aria-expanded="${state.prioritiesOpen}"` })}
          ${UI.Button({ label: `Open comparison (${state.compare.length})`, size: 'sm', variant: 'primary', action: 'open-compare', attrs: state.compare.length ? '' : 'disabled' })}
        </div>
      </div>
      ${
        removed.length
          ? `<div class="removed"><span class="fine">Removed:</span>${removed.map((l) => UI.Button({ label: `Restore ${l.neighborhood}`, size: 'sm', variant: 'quiet', action: 'restore', id: l.id })).join('')}</div>`
          : ''
      }`;
  }

  function renderPriorities() {
    const el = $('#sl-priorities');
    el.hidden = !state.prioritiesOpen;
    el.innerHTML = state.prioritiesOpen ? UI.PrioritiesPanel({ weights: weights(), derived: !state.weights }) : '';
  }

  function renderShortlistBody() {
    const list = shortlist();
    const maxTours = state.a.maxTours;
    const cards = list
      .map(({ l, res }, i) =>
        UI.ListingCard({
          l, res, rank: i + 1,
          ctx: {
            inCompare: state.compare.includes(l.id),
            compareFull: state.compare.length >= 3,
            inTour: state.tours.includes(l.id),
            tourFull: state.tours.length >= maxTours,
            maxTours,
            breakdownOpen: state.breakdown.has(l.id),
            askOpen: state.askOpen.has(l.id),
            askSent: state.askSent[l.id],
          },
        })
      )
      .join('');
    $('#sl-body').innerHTML = `<div class="sl-layout"><div class="sl-cards">${
      cards || '<p class="empty">Your shortlist is empty. Restore a space above or adjust your requirements.</p>'
    }</div><aside>${UI.NeighborhoodMap({ items: list, route: D.ROUTE_ORDER.filter((id) => state.tours.includes(id)) })}</aside></div>`;
    FX.scan($('#sl-body'));
  }

  function renderCompare() {
    const w = weights();
    const inSet = state.compare.filter((id) => !state.removed.has(id));
    const items = inSet.map((id) => ({ l: byId[id], res: M.scoreListing(byId[id], state.a, w) })).sort((a, b) => b.res.total - a.res.total);
    const others = shortlist().filter((x) => !inSet.includes(x.l.id)).map((x) => x.l);
    $('#compare-mount').innerHTML = items.length
      ? UI.ComparisonTable({ items, others: state.compare.length < 3 ? others : [] }) + UI.FactorChart({ items }) + UI.DecisionMemo({ memo: M.memo(items) })
      : `<p class="empty">Pick up to three spaces to compare. Use “Compare spaces” on a card.</p>${
          others.length ? `<div class="add-row">${others.map((o) => UI.Button({ label: '+ ' + o.neighborhood, size: 'sm', action: 'toggle-compare', id: o.id })).join('')}</div>` : ''
        }`;
    FX.scan($('#compare-mount'));
  }

  function renderTours() {
    const list = shortlist().map((x) => x.l);
    const plan = M.itinerary(state.tours, state.avail);
    $('#tours-mount').innerHTML = UI.TourPlanner({
      shortlist: list, tours: state.tours, maxTours: state.a.maxTours, availability: state.avail, plan, byId, requested: state.requested,
    });
  }

  const renderInsight = () => ($('#insight-mount').innerHTML = UI.InsightCard({ applied: state.insight }));

  // Re-render everything that depends on scores, selections, or answers.
  function renderDerived() {
    renderToolbar();
    renderShortlistBody();
    renderCompare();
    renderTours();
  }

  /* ---------- Wizard ---------- */
  function readAnswers(target) {
    const q = target.dataset.q;
    const a = state.a;
    switch (q) {
      case 'headcountNow':
      case 'budgetMin':
      case 'budgetMax':
        a[q] = Number(target.value);
        break;
      case 'maxTours':
        a.maxTours = Number(target.value);
        break;
      case 'move':
        a.move = Number(target.value);
        break;
      case 'badFit':
        a.badFit = target.value;
        break;
      case 'hoods':
      case 'features': {
        const checked = [...document.querySelectorAll(`[data-q="${q}"]:checked`)].map((i) => i.value);
        a[q] = checked;
        if (q === 'features') {
          document.querySelectorAll('[data-q="features"]').forEach((i) => {
            i.disabled = !i.checked && checked.length >= 3;
          });
        }
        break;
      }
      case 'city':
        a.city = target.value;
        a.hoods = a.city === 'nyc' ? [...D.DEFAULT_ANSWERS.hoods] : D.HOODS[a.city].slice(0, 3);
        renderWorkspace();
        { const first = $('[data-q="city"]:checked'); if (first) first.focus(); }
        break;
      default:
        a[q] = target.value;
    }
  }

  function validateStep() {
    const q = M.questions(state.insight)[state.step];
    const a = state.a;
    let msg = '';
    if (q.type === 'number' && !(a.headcountNow >= 1)) msg = 'Enter at least 1 person.';
    if (q.type === 'budget') {
      if (!(a.budgetMin >= 0) || !(a.budgetMax > a.budgetMin)) msg = 'Enter a minimum and a higher maximum.';
    }
    if (q.type === 'hoods' && !a.hoods.length) msg = 'Choose at least one neighborhood.';
    if (q.type === 'features' && !a.features.length) msg = 'Choose at least one feature.';
    $('#q-error').textContent = msg;
    return !msg;
  }

  async function finish() {
    state.tours = state.tours.filter((id) => !state.removed.has(id)).slice(0, state.a.maxTours);
    state.requested = false;
    track(EVENTS.DISCOVERY_COMPLETED, {
      city: state.a.city, headcountNow: state.a.headcountNow, growth: state.a.growth, move: state.a.move,
      flex: state.a.flex, insightApplied: state.insight,
    });
    state.stage = 'generating';
    renderWorkspace();
    announce('Assembling your brief');
    await new Promise((r) => setTimeout(r, reduceMotion ? 100 : 900));
    state.stage = 'brief';
    renderWorkspace();
    renderDerived();
    if (!state.shortlistTracked) {
      state.shortlistTracked = true;
      shortlist().forEach(({ l }) => track(EVENTS.SPACE_SHORTLISTED, { id: l.id, source: 'generated' }));
    }
    announce('Brief ready. Shortlist updated.');
    const h = $('#workspace-mount h3');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  function startSearch(source) {
    track(EVENTS.SEARCH_STARTED, { source: source || 'cta' });
    state.stage = 'wizard';
    state.step = 0;
    renderWorkspace();
    scrollToEl($('#search'));
    setTimeout(focusQuestion, reduceMotion ? 0 : 450);
  }

  function goAdvisor(source) {
    track(EVENTS.ADVISOR_CTA, { source });
    const note = $('#af-note');
    if (note && !note.value && state.stage === 'brief') note.value = M.buildBrief(state.a, state.insight).paragraphs[0];
    scrollToEl($('#advisor'));
    setTimeout(() => $('#af-name').focus({ preventScroll: true }), reduceMotion ? 0 : 450);
  }

  /* ---------- Tour / compare helpers ---------- */
  function toggleTour(id) {
    if (state.tours.includes(id)) state.tours = state.tours.filter((x) => x !== id);
    else if (state.tours.length < state.a.maxTours) state.tours.push(id);
    state.requested = false;
    renderToolbar();
    renderShortlistBody();
    renderTours();
  }

  /* ---------- Events ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    const id = b.dataset.id;
    switch (b.dataset.action) {
      case 'start-search': startSearch(b.closest('.hero') ? 'hero' : 'workspace'); break;
      case 'see-shortlist': scrollToEl($('#shortlist')); break;
      case 'view-spaces': scrollToEl($('#shortlist')); break;
      case 'wizard-next':
        if (validateStep()) { state.step++; renderWorkspace(); focusQuestion(); }
        break;
      case 'wizard-back': state.step = Math.max(0, state.step - 1); renderWorkspace(); focusQuestion(); break;
      case 'wizard-finish': if (validateStep()) finish(); break;
      case 'wizard-skip': state.a = { ...clone(D.DEFAULT_ANSWERS), uncertainty: state.a.uncertainty, meetingLoad: state.a.meetingLoad }; finish(); break;
      case 'edit-req': state.stage = 'wizard'; state.step = 0; renderWorkspace(); focusQuestion(); break;
      case 'talk-advisor': goAdvisor('brief_or_memo'); break;
      case 'toggle-priorities': state.prioritiesOpen = !state.prioritiesOpen; renderPriorities(); renderToolbar(); break;
      case 'reset-weights': state.weights = null; renderPriorities(); renderShortlistBody(); renderCompare(); break;
      case 'toggle-compare':
        if (state.compare.includes(id)) state.compare = state.compare.filter((x) => x !== id);
        else if (state.compare.length < 3) state.compare.push(id);
        renderToolbar(); renderShortlistBody(); renderCompare();
        break;
      case 'open-compare':
        track(EVENTS.COMPARISON_OPENED, { spaces: state.compare.slice() });
        scrollToEl($('#compare'));
        break;
      case 'remove':
        state.removed.add(id);
        state.compare = state.compare.filter((x) => x !== id);
        state.tours = state.tours.filter((x) => x !== id);
        state.requested = false;
        renderDerived();
        announce(`${byId[id].neighborhood} removed from shortlist`);
        break;
      case 'restore':
        state.removed.delete(id);
        track(EVENTS.SPACE_SHORTLISTED, { id, source: 'restored' });
        renderDerived();
        announce(`${byId[id].neighborhood} restored`);
        break;
      case 'toggle-ask': state.askOpen.has(id) ? state.askOpen.delete(id) : state.askOpen.add(id); renderShortlistBody(); break;
      case 'toggle-breakdown': state.breakdown.has(id) ? state.breakdown.delete(id) : state.breakdown.add(id); renderShortlistBody(); break;
      case 'toggle-tour': toggleTour(id); break;
      case 'request-tours':
        state.requested = true;
        track(EVENTS.TOUR_REQUESTED, { spaces: state.tours.slice(), window: state.avail });
        renderTours();
        announce('Tour request prepared');
        break;
      case 'edit-tours': state.requested = false; renderTours(); break;
      case 'apply-insight':
        state.insight = !state.insight;
        renderInsight();
        if (state.stage === 'wizard') renderWorkspace();
        if (state.stage === 'brief') renderWorkspace();
        renderDerived();
        announce(state.insight ? 'Discovery flow updated with two new questions' : 'Discovery flow restored');
        break;
    }
  });

  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.weight) {
      state.weights = { ...weights(), [t.dataset.weight]: Number(t.value) };
      const sum = D.FACTORS.reduce((s, f) => s + state.weights[f.key], 0) || 1;
      D.FACTORS.forEach((f) => {
        const lab = $('#wv-' + f.key);
        if (lab) lab.textContent = Math.round((state.weights[f.key] / sum) * 100) + '%';
      });
      const reset = $('[data-action="reset-weights"]');
      if (reset) reset.disabled = false;
      renderShortlistBody();
      renderCompare();
    } else if (t.dataset.q && (t.type === 'number' || t.tagName === 'TEXTAREA')) {
      readAnswers(t);
    }
  });

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.q && !(t.type === 'number' || t.tagName === 'TEXTAREA')) readAnswers(t);
    else if (t.dataset.tour) toggleTour(t.dataset.tour);
    else if (t.hasAttribute('data-avail')) { state.avail = t.value; state.requested = false; renderTours(); }
    else if (t.dataset.askSelect) {
      const ta = $(`#ask-txt-${t.dataset.askSelect}`);
      if (ta && t.value) ta.value = t.value;
    }
  });

  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (f.dataset.ask) {
      e.preventDefault();
      const id = f.dataset.ask;
      const text = $(`#ask-txt-${id}`).value.trim();
      if (!text) { $(`#ask-txt-${id}`).focus(); return; }
      state.askSent[id] = text;
      renderShortlistBody();
    }
  });

  /* ---------- Advisor form ---------- */
  function mountAdvisorForm() {
    $('#advisor-form-mount').innerHTML = UI.CtaForm();
    const form = $('#advisor-form');
    if (!D.CONFIG.endpoint) $('#af-local').hidden = false;
    const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rules = {
        'af-name': (v) => (v ? '' : 'Enter your name.'),
        'af-email': (v) => (EMAIL.test(v) ? '' : 'Enter a valid work email.'),
        'af-company': (v) => (v ? '' : 'Enter your company.'),
        'af-role': (v) => (v ? '' : 'Choose your role.'),
      };
      let firstBad = null;
      Object.entries(rules).forEach(([id, check]) => {
        const el = document.getElementById(id);
        const msg = check(el.value.trim());
        document.getElementById(id + '-err').textContent = msg;
        el.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (msg && !firstBad) firstBad = el;
      });
      if (firstBad) { firstBad.focus(); return; }

      const entry = {
        name: $('#af-name').value.trim(), email: $('#af-email').value.trim(), company: $('#af-company').value.trim(),
        role: $('#af-role').value, note: $('#af-note').value.trim(),
        search: { city: state.a.city, headcountNow: state.a.headcountNow, budget: [state.a.budgetMin, state.a.budgetMax], shortlist: shortlist().map((x) => x.l.id) },
        submittedAt: new Date().toISOString(),
      };
      const btn = $('button[type="submit"]', form);
      btn.disabled = true;
      try {
        if (D.CONFIG.endpoint) {
          const res = await fetch(D.CONFIG.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(entry) });
          if (!res.ok) throw new Error('failed');
        } else {
          try {
            const list = JSON.parse(localStorage.getItem(D.CONFIG.storageKey) || '[]');
            list.push(entry);
            localStorage.setItem(D.CONFIG.storageKey, JSON.stringify(list));
          } catch (err) { /* storage blocked: confirmation still shows */ }
        }
        track(EVENTS.ADVISOR_CTA, { source: 'form_submit' });
        form.hidden = true;
        const ok = $('#advisor-success');
        ok.hidden = false;
        ok.focus();
      } catch (err) {
        $('#af-fail').hidden = false;
        btn.disabled = false;
      }
    });
  }

  /* ---------- Static wiring ---------- */
  $('#boundary-mount').innerHTML = UI.HumanAIBoundary();
  FX.scan($('#boundary-mount'));
  $('#nav-start').addEventListener('click', () => startSearch('nav'));
  $('#cta-start').addEventListener('click', () => startSearch('closing_cta'));
  $('#cta-advisor').addEventListener('click', () => goAdvisor('closing_cta'));

  renderHero();
  renderWorkspace();
  renderPriorities();
  renderDerived();
  renderInsight();
  mountAdvisorForm();

  /* ---------- Nav polish: shadow on scroll and section highlighting ---------- */
  const nav = $('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if ('IntersectionObserver' in window) {
    const links = [...document.querySelectorAll('.nav nav a')];
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    links.forEach((a) => {
      const sec = document.querySelector(a.getAttribute('href'));
      if (sec) spy.observe(sec);
    });
  }

  FX.scan(document);

  window.TandemApp = { state, shortlist };
})();
