/* Page wiring: static sections, hero CTAs, trust mockup, waitlist form. */
(function () {
  const D = window.TandemData;
  const UI = window.TandemUI;
  const { track, EVENTS } = window.Tandem;
  const $ = (sel, root = document) => root.querySelector(sel);

  const scrollTo = (el) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  /* ---------- Static sections rendered from data ---------- */
  $('#how-steps').innerHTML = D.HOW_STEPS.map(
    (st, i) => `<li class="how-step"><span class="how-n" aria-hidden="true">${i + 1}</span><h3>${UI.esc(st.title)}</h3><p>${UI.esc(st.text)}</p></li>`
  ).join('');

  $('#compare-table').innerHTML = UI.ComparisonTable(D.COMPARISON);
  $('#usecases').innerHTML = D.USE_CASES.map(UI.UseCaseCard).join('');
  $('#principles').innerHTML = D.PRINCIPLES.map((p) => `<li>${UI.esc(p)}</li>`).join('');

  /* ---------- Hero ---------- */
  const input = $('#task-input');
  $('#chips').innerHTML = D.CHIPS.map(
    (c, i) => `<button type="button" class="chip chip-btn" data-chip="${i}">${UI.esc(c.label)}</button>`
  ).join('');
  $('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-chip]');
    if (!b) return;
    window.TandemDemo.setPrompt(D.CHIPS[Number(b.dataset.chip)].text);
    input.focus();
  });

  $('#cta-try').addEventListener('click', () => {
    track(EVENTS.HERO_CTA, { cta: 'try_live_task' });
    scrollTo($('#demo'));
    window.TandemDemo.start();
  });
  $('#cta-how').addEventListener('click', () => track(EVENTS.HERO_CTA, { cta: 'see_how_it_works' }));
  $('#nav-access').addEventListener('click', () => track(EVENTS.HERO_CTA, { cta: 'nav_early_access' }));

  /* ---------- Trust mockup ---------- */
  let prefs = D.SAVED_PREFERENCES.slice();
  let activity = D.SEED_ACTIVITY.slice();
  let lastPhase = 'idle';

  function renderPrefs() {
    $('#mock-prefs').innerHTML = prefs.length
      ? prefs.map((p, i) => UI.Chip(p, { removable: true, index: i })).join('')
      : '<span class="fine">No saved preferences. Tandem will ask each time.</span>';
  }
  $('#mock-prefs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-remove]');
    if (!b) return;
    prefs.splice(Number(b.dataset.remove), 1);
    renderPrefs();
  });
  $('#pref-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const field = $('#pref-input');
    const v = field.value.trim();
    if (v && prefs.length < 12) {
      prefs.push(v);
      field.value = '';
      renderPrefs();
    }
  });

  $('#mock-tools').innerHTML = D.CONNECTED_TOOLS.map(
    (t) => `<li><span><strong>${UI.esc(t.name)}</strong><span class="fine block">${UI.esc(t.note)}</span></span><span class="badge badge-muted">Not connected</span></li>`
  ).join('');

  function renderActivity() {
    $('#mock-activity').innerHTML = activity
      .map((a) => `<li><span>${UI.esc(a.text)}</span><span class="fine">${UI.esc(a.when)}</span></li>`)
      .join('');
  }

  window.TandemDemo.subscribe((snap) => {
    $('#mock-pending').innerHTML = snap.pending
      ? `<li><span>${UI.esc(snap.pending)}</span><span class="badge badge-warn">Waiting on you</span></li>`
      : '<li class="fine">Nothing waiting on you.</li>';
    if (snap.phase === 'done' && lastPhase !== 'done' && snap.completed) {
      activity = [
        { text: `Simulated: reserved ${snap.completed.name} and added it to the calendar after your approval.`, when: 'Just now' },
        ...activity,
      ];
      renderActivity();
    }
    lastPhase = snap.phase;
  });
  renderPrefs();
  renderActivity();

  /* ---------- Waitlist form ---------- */
  const form = $('#access-form');
  form.querySelector('.fields').innerHTML = [
    UI.Field({ id: 'wl-name', label: 'Name', required: true, autocomplete: 'name' }),
    UI.Field({ id: 'wl-email', label: 'Work email', type: 'email', required: true, autocomplete: 'email' }),
    UI.Field({ id: 'wl-role', label: 'Role', required: true, options: D.ROLES }),
    UI.Field({
      id: 'wl-task',
      label: 'The task you would most want Tandem to handle',
      required: true,
      textarea: true,
      placeholder: 'For example: rebook travel when a flight is canceled and move my meetings.',
    }),
    UI.Field({ id: 'wl-hours', label: 'How many hours per week do you spend on scheduling, travel, or personal admin?', optional: true, options: D.HOURS }),
  ].join('');
  if (!D.CONFIG.waitlistEndpoint) $('#access-note').hidden = false;

  let started = false;
  const markStarted = () => {
    if (started) return;
    started = true;
    track(EVENTS.FORM_STARTED);
  };
  ['focusin', 'input', 'change'].forEach((evt) => form.addEventListener(evt, markStarted));

  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function validate() {
    const rules = {
      'wl-name': (v) => (v ? '' : 'Enter your name.'),
      'wl-email': (v) => (EMAIL.test(v) ? '' : 'Enter a valid work email.'),
      'wl-role': (v) => (v ? '' : 'Choose your role.'),
      'wl-task': (v) => (v.length >= 10 ? '' : 'Describe the task in a sentence or two.'),
    };
    let firstBad = null;
    Object.entries(rules).forEach(([id, check]) => {
      const el = document.getElementById(id);
      const msg = check(el.value.trim());
      document.getElementById(id + '-err').textContent = msg;
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg && !firstBad) firstBad = el;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const entry = {
      name: $('#wl-name').value.trim(),
      email: $('#wl-email').value.trim(),
      role: $('#wl-role').value,
      task: $('#wl-task').value.trim(),
      hoursPerWeek: $('#wl-hours').value || null,
      submittedAt: new Date().toISOString(),
    };
    const submit = $('button[type="submit"]', form);
    submit.disabled = true;
    try {
      if (D.CONFIG.waitlistEndpoint) {
        const res = await fetch(D.CONFIG.waitlistEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(entry),
        });
        if (!res.ok) throw new Error('Request failed');
      } else {
        try {
          const list = JSON.parse(localStorage.getItem(D.CONFIG.storageKey) || '[]');
          list.push(entry);
          localStorage.setItem(D.CONFIG.storageKey, JSON.stringify(list));
        } catch (err) {
          /* storage blocked: the confirmation still shows, nothing is stored */
        }
      }
      track(EVENTS.FORM_SUBMITTED, { role: entry.role, hasHours: !!entry.hoursPerWeek });
      $('#access-form-wrap').hidden = true;
      const ok = $('#access-success');
      ok.hidden = false;
      ok.focus();
    } catch (err) {
      $('#access-error').hidden = false;
      submit.disabled = false;
    }
  });

  // "Tell us what you would delegate" from the demo jumps here with the task prefilled.
  document.addEventListener('tandem:request-task', (e) => {
    const text = e.detail && e.detail.text;
    const field = $('#wl-task');
    if (text && !field.value) field.value = text;
    scrollTo($('#access'));
    setTimeout(() => $('#wl-name').focus({ preventScroll: true }), 400);
  });
})();
