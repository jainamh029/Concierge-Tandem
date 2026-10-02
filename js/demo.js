/* Task simulation: a small state machine that walks a post-lease move-in request
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

  /* ---------- Dates and formatting ---------- */
  const addDays = (n) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + n);
    return d;
  };
  const fmt = (d, o) => d.toLocaleDateString('en-US', o || { month: 'short', day: 'numeric' });
  const fmtLong = (d) => fmt(d, { weekday: 'long', month: 'long', day: 'numeric' });
  const money = (n) => '$' + n.toLocaleString('en-US');
  const moveInDate = () => addDays(D.MOVE_IN_WEEKS * 7);

  /* ---------- Evaluation ---------- */
  function evaluate(opt) {
    const c = s.constraints;
    const reasons = [];
    if (opt.cost > c.budget) reasons.push('Over budget');
    if (opt.lead > c.maxLead) reasons.push('Lead time too long');
    else if (opt.lead > D.MOVE_IN_WEEKS) reasons.push('Arrives after move-in');
    if (c.flexOnly && opt.flexible !== true) reasons.push('Does not fit a 12-month term');
    return { opt, reasons, eligible: reasons.length === 0 };
  }
  const evaluated = () => D.OPTIONS.map(evaluate);
  const flexRank = (o) => (o.flexible === true ? 0 : o.flexible === 'partial' ? 1 : 2);
  function ranked() {
    return evaluated()
      .filter((e) => e.eligible)
      .sort((a, b) => flexRank(a.opt) - flexRank(b.opt) || a.opt.lead - b.opt.lead || a.opt.cost - b.opt.cost);
  }
  const bestOption = () => (ranked()[0] || {}).opt || null;
  function selectedOption() {
    const eligible = ranked().map((e) => e.opt);
    return eligible.find((o) => o.id === s.selectedId) || eligible[0] || null;
  }

  const summary = (o) => `${o.name} — est. ${money(o.cost)} — ${o.lead}-week lead time — ${o.note}`;

  function reasonsFor(opt) {
    const c = s.constraints;
    return [
      `About ${money(opt.cost)}, within your ${money(c.budget)} furniture budget`,
      `${opt.lead}-week lead time, so it arrives ${D.MOVE_IN_WEEKS - opt.lead} week${D.MOVE_IN_WEEKS - opt.lead === 1 ? '' : 's'} before move-in`,
      opt.flexible === true
        ? 'Fits a 12-month lease: return or renew at the end'
        : opt.flexible === 'partial'
        ? 'Partly flexible: the purchased desks stay with you'
        : 'You own it, which is harder to move or resell on a short lease',
    ];
  }

  // Start-by timeline for the four vendor requests.
  function plan(sel) {
    const rows = [{ id: 'furniture', name: 'Furniture — ' + sel.name, lead: sel.lead }, ...D.VENDORS];
    return rows
      .map((r) => {
        const startInWeeks = D.MOVE_IN_WEEKS - r.lead;
        return { ...r, now: startInWeeks <= 0, date: addDays(Math.max(0, startInWeeks) * 7) };
      })
      .sort((a, b) => b.lead - a.lead);
  }

  function internetDraft() {
    const d = fmtLong(moveInDate());
    return `Subject: Internet service — new Boston office\n\nHi,\n\nWe need internet service installed and tested at our new Boston office (4,200 sq ft, 24 people) before ${d}. Please share available plans and your typical install lead time.\n\nThanks,\n[Your name]`;
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

  function detectedConstraints() {
    return [
      '24 people',
      '4,200 sq ft, Boston',
      '12-month lease',
      `Move-in ${fmt(moveInDate())} (${D.MOVE_IN_WEEKS} weeks out)`,
      `Furniture under ${money(D.DEFAULT_CONSTRAINTS.budget)}`,
      'Furniture, internet, access badges, insurance',
      'Vendor requests sent and deadlines added to calendar after approval',
    ];
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
      const c = s.constraints;
      const dc = D.DEFAULT_CONSTRAINTS;
      const adjusted = c.budget !== dc.budget || c.maxLead !== dc.maxLead || c.flexOnly;
      parts.push(
        section(
          'constraints',
          `<h3>Detected constraints</h3>
          <ul class="chips">${detectedConstraints().map((x) => `<li>${UI.Chip(x)}</li>`).join('')}</ul>
          ${
            adjusted
              ? `<p class="fine">Adjusted by you: furniture up to ${money(c.budget)}, lead time up to ${c.maxLead} weeks${
                  c.flexOnly ? ', 12-month-friendly terms only' : ''
                }.</p>`
              : ''
          }`
        )
      );
    }

    if (done > 1) {
      const rows = [
        { when: fmt(moveInDate()), what: 'Lease start and move-in day', state: 'Fixed', kind: 'muted' },
        { when: 'Before move-in', what: 'Building typically requires an insurance certificate and a freight elevator booking', state: 'Required', kind: 'warn' },
        { when: 'Next 2 weeks', what: 'Your calendar has open blocks for vendor calls', state: 'Free', kind: 'ok' },
      ];
      parts.push(
        section(
          'calendar',
          `<h3>Lease and calendar check <span class="tag">Sample data</span></h3>
          <ul class="rows">${rows
            .map((r) => `<li><span class="row-when">${UI.esc(r.when)}</span><span>${UI.esc(r.what)}</span><span class="badge badge-${r.kind}">${UI.esc(r.state)}</span></li>`)
            .join('')}</ul>`
        )
      );
    }

    if (done > 2) {
      parts.push(
        section('prefs', `<h3>Preference match</h3><ul class="checks">${D.PREFERENCE_MATCH.map((p) => `<li>${UI.esc(p)}</li>`).join('')}</ul>`)
      );
    }

    if (done > 3) {
      const best = bestOption();
      const sel = selectedOption();
      parts.push(
        section(
          'options',
          `<h3>Furniture options <span class="tag">Sample data</span></h3>
          <div class="options">${evaluated()
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
      const sel = selectedOption();
      if (sel) {
        const p = plan(sel);
        parts.push(
          section(
            'recommendation-' + sel.id,
            `<h3>Best fit: ${UI.esc(sel.name)}</h3>
            <ul class="checks">${reasonsFor(sel).map((r) => `<li>${UI.esc(r)}</li>`).join('')}</ul>
            <h3 class="sub">Move-in plan: 4 vendor requests, drafts ready</h3>
            <ul class="rows plan">${p
              .map(
                (r) => `<li><span class="row-when">${r.now ? 'Send now' : 'Start by ' + fmt(r.date)}</span><span>${UI.esc(r.name)}</span><span class="badge badge-${r.now ? 'warn' : 'muted'}">${r.now ? 'Start now' : 'Upcoming'}</span></li>`
              )
              .join('')}</ul>`
          )
        );
      } else {
        parts.push(
          section(
            'recommendation-none',
            `<h3>No option fits these constraints</h3>
            <p>Nothing in the sample set meets your budget, lead time, and lease-term settings together. Loosen one and Tandem will re-rank.</p>`
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
            text: `Ready to send 4 vendor requests (furniture: ${sel.name}, internet, access badges, insurance) and add 4 deadlines to your calendar.`,
            buttons: [
              { label: 'Approve and send requests', variant: 'primary', action: 'approve' },
              { label: s.panel === 'compare' ? 'Hide comparison' : 'Compare options', action: 'compare' },
              { label: s.panel === 'adjust' ? 'Hide constraints' : 'Adjust constraints', action: 'adjust' },
            ],
            note: 'Simulation only. Approving does not contact a vendor or touch a real calendar.',
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
        `<section class="result"><div class="approval approval-approved"><p class="eyebrow">Approved</p><p class="approval-text">You approved: send 4 vendor requests (furniture: ${UI.esc(
          sel.name
        )}, internet, access badges, insurance) and add 4 deadlines to your calendar.</p></div></section>`
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
      const p = plan(sel);
      parts.push(
        section(
          'complete',
          `<div class="complete">
            <h3>Vendor requests sent.</h3>
            <ul class="checks">
              <li>4 vendor requests sent.</li>
              <li>4 deadlines added to your calendar.</li>
              <li>Replies will be tracked in Tandem.</li>
            </ul>
            <div class="event" aria-label="Sample calendar deadlines">
              <p class="event-title">Calendar deadlines</p>
              <ul class="fine deadlines">${p
                .map((r) => `<li>${UI.esc('Follow up by ' + fmt(r.now ? addDays(3) : r.date))} · ${UI.esc(r.name)}</li>`)
                .join('')}</ul>
            </div>
            <details class="draft"><summary>See a sent request (internet service)</summary><pre>${UI.esc(internetDraft())}</pre></details>
            <p class="notice">This was a simulation. No vendor was contacted and no calendar event or message was actually created.</p>
            <div class="approval-actions">${UI.Button({ label: 'Run it again', action: 'reset' })}
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
    const flexText = (o) => (o.flexible === true ? 'Yes' : o.flexible === 'partial' ? 'Partly' : 'No');
    const rows = [
      ['Estimated total', (e) => money(e.opt.cost)],
      ['Lead time', (e) => e.opt.lead + ' weeks'],
      ['Arrives before move-in', (e) => (e.opt.lead < D.MOVE_IN_WEEKS ? `Yes, ${D.MOVE_IN_WEEKS - e.opt.lead} wk early` : e.opt.lead === D.MOVE_IN_WEEKS ? 'Just in time' : 'No')],
      ['Fits a 12-month lease', (e) => flexText(e.opt)],
      ['Fits your constraints', (e) => (e.eligible ? 'Yes' : e.reasons.join(', '))],
    ];
    return `<section class="result enter panel"><h3>Compare options <span class="tag">Sample data</span></h3>
      <div class="table-wrap" tabindex="0" role="region" aria-label="Furniture option comparison"><table class="compare compare-options">
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
        <div class="field"><label for="adj-budget">Furniture budget</label>
          <select id="adj-budget">${D.BUDGET_CHOICES.map((b) => `<option value="${b}"${b === c.budget ? ' selected' : ''}>Up to ${money(b)}</option>`).join('')}</select></div>
        <div class="field"><label for="adj-lead">Maximum lead time</label>
          <select id="adj-lead">${D.LEAD_CHOICES.map((w) => `<option value="${w}"${w === c.maxLead ? ' selected' : ''}>${w} weeks</option>`).join('')}</select></div>
        <label class="check"><input type="checkbox" id="adj-flex"${c.flexOnly ? ' checked' : ''}> Only options that fit a 12-month lease</label>
      </div>
      <div class="approval-actions">${UI.Button({ label: 'Apply and re-rank', variant: 'primary', action: 'apply-adjust' })}${UI.Button({
        label: 'Reset to original',
        action: 'reset-constraints',
      })}</div></section>`;
  }

  function renderUnsupported() {
    return `<div class="unsupported"><h3>This demo only simulates one task.</h3>
      <p>Right now it walks through planning a move-in after a lease is signed, end to end. Your request is the kind of thing we want to learn from.</p>
      <div class="approval-actions">${UI.Button({ label: 'Run the move-in example', variant: 'primary', action: 'run-example' })}${UI.Button({
        label: 'Tell us you would want this',
        action: 'request-task',
      })}</div></div>`;
  }

  function render() {
    if (s.phase === 'idle') {
      out.innerHTML = `<div class="placeholder"><p><strong>Run the task to watch Tandem plan a move-in.</strong></p>
        <p>You will see each step, then an approval request. Nothing here contacts a vendor, books, or pays for anything.</p></div>`;
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
      pending: sel ? `Send 4 vendor requests (furniture: ${sel.name}) and add 4 deadlines to calendar` : null,
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
    if (!input.value.trim()) input.value = D.DEMO_PROMPT;
    const prompt = input.value.trim();
    s.runId++;
    s = fresh();
    if (!/lease|move-?\s?in/i.test(prompt) || /dinner|lunch/i.test(prompt)) {
      s.phase = 'unsupported';
      render();
      announce('This demo only simulates the move-in example.');
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
    announce('Simulated: vendor requests sent, deadlines added, reply tracking set up.');
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
      maxLead: Number(document.getElementById('adj-lead').value),
      flexOnly: document.getElementById('adj-flex').checked,
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
