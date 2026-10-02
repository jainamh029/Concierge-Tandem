/* Task simulation: a small state machine that walks the client-dinner example
   through seven stages. Nothing here talks to a real service. */
(function () {
  const D = window.TandemData;
  const UI = window.TandemUI;
  const { track, EVENTS } = window.Tandem;
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? Math.min(ms, 120) : ms));

  const input = document.getElementById('task-input');
  const out = document.getElementById('demo-output');
  const status = document.getElementById('demo-status');
  const subscribers = [];

  const fresh = () => ({
    phase: 'idle', // idle | running | awaiting | executing | done | unsupported
    active: -1, // stage index currently working or waiting
    doneUpTo: 0, // number of stages fully finished
    panel: null, // null | compare | adjust
    constraints: { ...D.DEFAULT_CONSTRAINTS },
    selectedId: null,
    exec: 0, // completed execution sub-steps
    seen: new Set(), // sections already shown, so only new ones animate
    runId: 0,
    edited: false,
  });
  let s = fresh();

  /* ---------- Evaluation ---------- */
  function evaluate(opt) {
    const c = s.constraints;
    const reasons = [];
    if (opt.pp > c.budget) reasons.push('Over budget');
    if (opt.walk > c.maxWalk) reasons.push('Too far');
    if (c.savedCuisineOnly && !D.SAVED_CUISINES.includes(opt.cuisine)) reasons.push('Not a saved cuisine');
    return { opt, reasons, eligible: reasons.length === 0, timeDiff: Math.abs(opt.timeMin - D.REQUESTED_TIME_MIN) };
  }
  const evaluated = () => D.OPTIONS.map(evaluate);
  function ranked() {
    return evaluated()
      .filter((e) => e.eligible)
      .sort((a, b) => a.timeDiff - b.timeDiff || a.opt.walk - b.opt.walk || a.opt.pp - b.opt.pp);
  }
  const bestOption = () => (ranked()[0] || {}).opt || null;
  function selectedOption() {
    const eligible = ranked().map((e) => e.opt);
    return eligible.find((o) => o.id === s.selectedId) || eligible[0] || null;
  }

  const summary = (o) => `${o.name} — ${o.time} — ${o.cuisine} — estimated $${o.pp}/person — ${o.walk}-minute walk`;
  const tomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  function reasonsFor(opt) {
    const r = [];
    const diff = Math.abs(opt.timeMin - D.REQUESTED_TIME_MIN);
    r.push(diff === 0 ? 'Table at your requested 7:30 PM' : `Closest available time: ${opt.time} (${diff} min off 7:30 PM)`);
    r.push(`About $${opt.pp}/person, within your $${s.constraints.budget} target`);
    r.push(`${opt.walk}-minute walk from the client meeting`);
    r.push(
      D.SAVED_CUISINES.includes(opt.cuisine)
        ? `${opt.cuisine} is one of your saved cuisines`
        : `${opt.cuisine} is not one of your saved cuisines`
    );
    return r;
  }

  /* ---------- Rendering ---------- */
  function stepStatus(i) {
    if (i < s.doneUpTo) return 'done';
    if (s.active === i) return i === 5 && s.phase === 'awaiting' ? 'waiting' : 'active';
    return 'pending';
  }

  function section(key, html) {
    const isNew = !s.seen.has(key);
    s.seen.add(key);
    return `<section class="result${isNew ? ' enter' : ''}">${html}</section>`;
  }

  function renderStepper() {
    return `<ol class="steps">${D.STAGES.map((st, i) => {
      const st8 = stepStatus(i);
      let note = '';
      if (st8 === 'active') {
        note = i === 6 ? D.EXEC_STEPS[Math.min(s.exec, D.EXEC_STEPS.length - 1)] + '…' : st.running + '…';
      }
      if (st8 === 'waiting') note = 'Waiting on you';
      return UI.WorkflowStep({ n: i + 1, title: st.title, status: st8, note });
    }).join('')}</ol>`;
  }

  function renderResults() {
    const parts = [];
    const done = s.doneUpTo;

    if (s.edited) {
      parts.push(
        `<p class="notice">This demo runs one scripted example, so the results below reflect the sample request rather than your edits.</p>`
      );
    }

    if (done > 0) {
      const adjusted =
        s.constraints.budget !== D.DEFAULT_CONSTRAINTS.budget ||
        s.constraints.maxWalk !== D.DEFAULT_CONSTRAINTS.maxWalk ||
        s.constraints.savedCuisineOnly;
      parts.push(
        section(
          'constraints',
          `<h3>Detected constraints</h3>
          <ul class="chips">${D.CONSTRAINTS.map((c) => `<li>${UI.Chip(c)}</li>`).join('')}</ul>
          ${
            adjusted
              ? `<p class="fine">Adjusted by you: up to $${s.constraints.budget}/person, up to a ${s.constraints.maxWalk}-minute walk${
                  s.constraints.savedCuisineOnly ? ', saved cuisines only' : ''
                }.</p>`
              : ''
          }`
        )
      );
    }

    if (done > 1) {
      parts.push(
        section(
          'calendar',
          `<h3>Calendar check <span class="tag">Sample calendar</span></h3>
          <ul class="rows">${D.CALENDAR_CHECK.map(
            (r) => `<li><span class="row-when">${UI.esc(r.when)}</span><span>${UI.esc(r.what)}</span><span class="badge badge-${
              r.state === 'Free' ? 'ok' : 'muted'
            }">${UI.esc(r.state)}</span></li>`
          ).join('')}</ul>`
        )
      );
    }

    if (done > 2) {
      parts.push(
        section(
          'prefs',
          `<h3>Preference match</h3>
          <ul class="checks">${D.PREFERENCE_MATCH.map((p) => `<li>${UI.esc(p)}</li>`).join('')}</ul>`
        )
      );
    }

    if (done > 3) {
      const ev = evaluated();
      const best = bestOption();
      const sel = selectedOption();
      parts.push(
        section(
          'options',
          `<h3>Recommended options <span class="tag">Sample data</span></h3>
          <div class="options">${ev
            .map((e) => {
              const badges = [];
              if (best && e.opt.id === best.id) badges.push({ kind: 'accent', text: 'Best fit' });
              if (sel && e.opt.id === sel.id && sel.id !== (best || {}).id) badges.push({ kind: 'ok', text: 'Selected' });
              e.reasons.forEach((r) => badges.push({ kind: 'warn', text: r }));
              return UI.OptionCard({ option: e.opt, summary: summary(e.opt), badges, selected: !!sel && sel.id === e.opt.id });
            })
            .join('')}</div>`
        )
      );
    }

    if (done > 4) {
      const best = bestOption();
      if (best) {
        parts.push(
          section(
            'recommendation-' + best.id,
            `<h3>Best fit: ${UI.esc(best.name)}</h3>
            <ul class="checks">${reasonsFor(best).map((r) => `<li>${UI.esc(r)}</li>`).join('')}</ul>`
          )
        );
      } else {
        parts.push(
          section(
            'recommendation-none',
            `<h3>No option fits these constraints</h3>
            <p>Nothing in the sample set meets your budget, walking distance, and cuisine settings together. Loosen one and Tandem will re-rank.</p>`
          )
        );
      }
    }

    // Approval / execution / completion
    if (s.phase === 'awaiting') {
      const sel = selectedOption();
      if (sel) {
        parts.push(
          `<section class="result">${UI.ApprovalPanel({
            text: `Ready to reserve ${sel.name} for 4 at ${sel.time} and add it to your calendar.`,
            buttons: [
              { label: 'Approve reservation', variant: 'primary', action: 'approve' },
              { label: s.panel === 'compare' ? 'Hide comparison' : 'Compare options', action: 'compare' },
              { label: s.panel === 'adjust' ? 'Hide constraints' : 'Adjust constraints', action: 'adjust' },
            ],
            note: 'Simulation only. Approving does not contact a restaurant or touch a real calendar.',
          })}</section>`
        );
      } else {
        parts.push(
          `<section class="result">${UI.ApprovalPanel({
            text: 'No option to approve yet. Adjust your constraints to continue.',
            buttons: [{ label: 'Adjust constraints', variant: 'primary', action: 'adjust' }],
          })}</section>`
        );
      }
      if (s.panel === 'compare') parts.push(renderCompare());
      if (s.panel === 'adjust') parts.push(renderAdjust());
    }

    if (s.phase === 'executing' || s.phase === 'done') {
      const sel = selectedOption();
      parts.push(
        `<section class="result"><div class="approval approval-approved"><p class="eyebrow">Approved</p><p class="approval-text">You approved: reserve ${UI.esc(
          sel.name
        )} for 4 at ${UI.esc(sel.time)} and add it to your calendar.</p></div></section>`
      );
      parts.push(
        section(
          'exec',
          `<h3>Carrying out your approval</h3>
          <ul class="checks checks-live">${D.EXEC_STEPS.map(
            (t, i) => `<li class="${i < s.exec ? 'is-done' : i === s.exec ? 'is-active' : ''}">${UI.esc(t)}</li>`
          ).join('')}</ul>`
        )
      );
    }

    if (s.phase === 'done') {
      const sel = selectedOption();
      parts.push(
        section(
          'complete',
          `<div class="complete">
            <h3>Reservation confirmed.</h3>
            <ul class="checks">
              <li>Reservation confirmed.</li>
              <li>Calendar invite created.</li>
              <li>Confirmation details saved in Tandem.</li>
            </ul>
            <div class="event" aria-label="Sample calendar event">
              <p class="event-title">Client dinner — ${UI.esc(sel.name)}</p>
              <p>${UI.esc(tomorrow())} · ${UI.esc(sel.time)} · 4 guests</p>
              <p class="fine">${UI.esc(sel.cuisine)} · about $${sel.pp}/person · ${sel.walk}-minute walk from the client meeting</p>
            </div>
            <p class="notice">This was a simulation. No reservation, calendar event, or message was actually created.</p>
            <div class="approval-actions">${UI.Button({ label: 'Run it again', variant: 'secondary', action: 'reset' })}
            ${UI.Button({ label: 'Tell us what you would delegate', variant: 'primary', action: 'request-task' })}</div>
          </div>`
        )
      );
    }

    return parts.join('');
  }

  function renderCompare() {
    const ev = evaluated();
    const sel = selectedOption();
    const best = bestOption();
    const rows = [
      ['Time', (e) => e.opt.time],
      ['Cuisine', (e) => e.opt.cuisine],
      ['Estimated per person', (e) => UI.money(e.opt.pp)],
      ['Estimated for 4', (e) => UI.money(e.opt.pp * 4) + ' before tax and tip'],
      ['Walk from client meeting', (e) => e.opt.walk + ' min'],
      ['Saved cuisine', (e) => (D.SAVED_CUISINES.includes(e.opt.cuisine) ? 'Yes' : 'No')],
      ['Fits your constraints', (e) => (e.eligible ? 'Yes' : e.reasons.join(', '))],
    ];
    return `<section class="result enter panel"><h3>Compare options <span class="tag">Sample data</span></h3>
      <div class="table-wrap" tabindex="0" role="region" aria-label="Restaurant comparison"><table class="compare compare-options">
        <thead><tr><th scope="col"></th>${ev
          .map((e) => `<th scope="col">${UI.esc(e.opt.name)}${best && best.id === e.opt.id ? ' <span class="badge badge-accent">Best fit</span>' : ''}</th>`)
          .join('')}</tr></thead>
        <tbody>${rows.map((r) => `<tr><th scope="row">${r[0]}</th>${ev.map((e) => `<td>${UI.esc(r[1](e))}</td>`).join('')}</tr>`).join('')}
        <tr><th scope="row">Choose</th>${ev
          .map((e) =>
            e.eligible
              ? `<td><button type="button" class="btn btn-secondary btn-sm" data-action="choose" data-id="${e.opt.id}"${
                  sel && sel.id === e.opt.id ? ' aria-pressed="true" disabled' : ''
                }>${sel && sel.id === e.opt.id ? 'Selected' : 'Choose'}</button></td>`
              : '<td><span class="fine">Not available under current constraints</span></td>'
          )
          .join('')}</tr></tbody>
      </table></div></section>`;
  }

  function renderAdjust() {
    const c = s.constraints;
    return `<section class="result enter panel"><h3>Adjust constraints</h3>
      <div class="adjust">
        <div class="field"><label for="adj-budget">Maximum per person</label>
          <select id="adj-budget">${D.BUDGET_CHOICES.map((b) => `<option value="${b}"${b === c.budget ? ' selected' : ''}>$${b}</option>`).join('')}</select></div>
        <div class="field"><label for="adj-walk">Maximum walk from client meeting</label>
          <select id="adj-walk">${D.WALK_CHOICES.map((w) => `<option value="${w}"${w === c.maxWalk ? ' selected' : ''}>${w} minutes</option>`).join('')}</select></div>
        <label class="check"><input type="checkbox" id="adj-cuisine"${c.savedCuisineOnly ? ' checked' : ''}> Only my saved cuisines (Italian, Japanese, New American)</label>
      </div>
      <div class="approval-actions">${UI.Button({ label: 'Apply and re-rank', variant: 'primary', action: 'apply-adjust' })}${UI.Button({
        label: 'Reset to original',
        action: 'reset-constraints',
      })}</div></section>`;
  }

  function renderUnsupported() {
    return `<div class="unsupported"><h3>This demo only simulates one task.</h3>
      <p>Right now it walks through the client dinner example end to end. Your request is the kind of thing we want to learn from.</p>
      <div class="approval-actions">${UI.Button({ label: 'Run the client dinner example', variant: 'primary', action: 'run-example' })}${UI.Button({
        label: 'Tell us you would want this',
        action: 'request-task',
      })}</div></div>`;
  }

  function render() {
    if (s.phase === 'idle') {
      out.innerHTML = `<div class="placeholder"><p><strong>Run the task to watch Tandem work.</strong></p>
        <p>You will see each step, then an approval request. Nothing here books, sends, or buys anything.</p></div>`;
    } else if (s.phase === 'unsupported') {
      out.innerHTML = renderUnsupported();
    } else {
      const pct = Math.round((s.doneUpTo / D.STAGES.length) * 100);
      out.innerHTML = `<div class="workflow">
        <div class="stepper"><div class="progress" role="progressbar" aria-label="Task progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div>${renderStepper()}</div>
        <div class="results">${renderResults()}</div></div>`;
    }
    subscribers.forEach((fn) => fn(snapshot()));
  }

  function snapshot() {
    const sel = s.phase === 'awaiting' ? selectedOption() : null;
    return {
      phase: s.phase,
      pending: sel ? `Reserve ${sel.name} for 4 at ${sel.time} and add to calendar` : null,
      completed: s.phase === 'done' ? selectedOption() : null,
    };
  }

  const announce = (msg) => {
    status.textContent = msg;
  };

  /* ---------- Flow ---------- */
  async function runFrom(start) {
    const id = ++s.runId;
    s.phase = 'running';
    s.doneUpTo = start;
    for (let i = start; i <= 4; i++) {
      s.active = i;
      render();
      announce(D.STAGES[i].title + ' in progress');
      await wait(D.STAGE_MS[i]);
      if (id !== s.runId) return;
      s.doneUpTo = i + 1;
    }
    s.active = 5;
    s.phase = 'awaiting';
    render();
    announce(selectedOption() ? 'Approval needed' : 'No option fits. Adjust constraints.');
  }

  function start() {
    const text = input.value.trim();
    if (!text) input.value = D.DEMO_PROMPT;
    const prompt = input.value.trim();
    s.runId++;
    s = fresh();
    if (!/dinner/i.test(prompt)) {
      s.phase = 'unsupported';
      render();
      announce('This demo only simulates the client dinner example.');
      return;
    }
    s.edited = prompt !== D.DEMO_PROMPT;
    track(EVENTS.DEMO_STARTED, { edited: s.edited });
    runFrom(0);
  }

  async function approve() {
    if (s.phase !== 'awaiting') return;
    const sel = selectedOption();
    if (!sel) return;
    track(EVENTS.APPROVAL, { option: sel.id });
    const id = ++s.runId;
    s.phase = 'executing';
    s.panel = null;
    s.active = 6;
    s.doneUpTo = 6;
    s.exec = 0;
    render();
    announce('Carrying out your approval');
    for (let k = 0; k < D.EXEC_STEPS.length; k++) {
      await wait(800);
      if (id !== s.runId) return;
      s.exec = k + 1;
      render();
    }
    s.active = -1;
    s.doneUpTo = 7;
    s.phase = 'done';
    render();
    announce('Simulated reservation confirmed. Calendar invite created. Confirmation details saved.');
    track(EVENTS.DEMO_COMPLETED, { option: sel.id });
  }

  function reset() {
    s.runId++;
    s = fresh();
    render();
    announce('Demo reset');
  }

  function applyAdjust() {
    s.constraints = {
      budget: Number(document.getElementById('adj-budget').value),
      maxWalk: Number(document.getElementById('adj-walk').value),
      savedCuisineOnly: document.getElementById('adj-cuisine').checked,
    };
    s.panel = null;
    s.selectedId = null;
    runFrom(3);
  }

  out.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    switch (b.dataset.action) {
      case 'approve': approve(); break;
      case 'compare': s.panel = s.panel === 'compare' ? null : 'compare'; render(); break;
      case 'adjust': s.panel = s.panel === 'adjust' ? null : 'adjust'; render(); break;
      case 'choose': s.selectedId = b.dataset.id; render(); break;
      case 'apply-adjust': applyAdjust(); break;
      case 'reset-constraints':
        s.constraints = { ...D.DEFAULT_CONSTRAINTS };
        s.selectedId = null;
        s.panel = null;
        runFrom(3);
        break;
      case 'reset': reset(); break;
      case 'run-example': input.value = D.DEMO_PROMPT; start(); break;
      case 'request-task':
        document.dispatchEvent(new CustomEvent('tandem:request-task', { detail: { text: input.value.trim() } }));
        break;
    }
  });

  document.getElementById('task-form').addEventListener('submit', (e) => {
    e.preventDefault();
    start();
  });

  input.value = D.DEMO_PROMPT;
  render();

  window.TandemDemo = {
    start,
    reset,
    setPrompt(text) { input.value = text; },
    subscribe(fn) { subscribers.push(fn); fn(snapshot()); },
  };
})();
