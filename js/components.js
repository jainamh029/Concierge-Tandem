/* Reusable UI components. Each returns an HTML string; all dynamic text is escaped. */
(function () {
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const money = (n) => '$' + n;

  function Button({ label, variant = 'secondary', type = 'button', action = '', id = '', attrs = '' }) {
    return `<button type="${type}" class="btn btn-${variant}"${id ? ` id="${id}"` : ''}${
      action ? ` data-action="${action}"` : ''
    } ${attrs}>${esc(label)}</button>`;
  }

  function Card({ eyebrow = '', title = '', body = '', className = '' }) {
    return `<div class="card ${className}">
      ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
      ${title ? `<h3>${esc(title)}</h3>` : ''}
      ${body}
    </div>`;
  }

  function Chip(text, { removable = false, index = 0 } = {}) {
    return `<span class="chip">${esc(text)}${
      removable
        ? `<button type="button" class="chip-x" data-remove="${index}" aria-label="Remove preference: ${esc(text)}">&times;</button>`
        : ''
    }</span>`;
  }

  // status: pending | active | waiting | done
  function WorkflowStep({ n, title, status, note }) {
    const icon =
      status === 'done' ? '&#10003;' : status === 'active' ? '<span class="spinner" aria-hidden="true"></span>' : status === 'waiting' ? '!' : n;
    const label = { pending: 'Pending', active: 'In progress', waiting: 'Needs your approval', done: 'Done' }[status];
    return `<li class="step step-${status}"${status === 'active' || status === 'waiting' ? ' aria-current="step"' : ''}>
      <span class="step-icon" aria-hidden="true">${icon}</span>
      <span class="step-body">
        <span class="step-title">${esc(title)}</span>
        <span class="step-note">${esc(note || label)}<span class="sr-only"> (${label})</span></span>
      </span>
    </li>`;
  }

  function OptionCard({ option, summary, badges = [], selected = false }) {
    return `<div class="option${selected ? ' option-selected' : ''}">
      <div class="option-head"><span class="option-label">${esc(option.label)}</span>${badges
        .map((b) => `<span class="badge badge-${b.kind}">${esc(b.text)}</span>`)
        .join('')}</div>
      <p class="option-summary">${esc(summary)}</p>
    </div>`;
  }

  function ApprovalPanel({ text, buttons = [], note = '' }) {
    return `<div class="approval" role="group" aria-label="Approval required">
      <p class="eyebrow">Approval required</p>
      <p class="approval-text">${esc(text)}</p>
      <div class="approval-actions">${buttons.map(Button).join('')}</div>
      ${note ? `<p class="fine">${esc(note)}</p>` : ''}
    </div>`;
  }

  function UseCaseCard({ tag, title, text }) {
    return Card({
      eyebrow: tag,
      title,
      body: `<p>${esc(text)}</p>`,
      className: 'usecase',
    });
  }

  function ComparisonTable({ columns, rows }) {
    const cell = (v) => `<span class="yn yn-${v.toLowerCase()}">${esc(v)}</span>`;
    return `<div class="table-wrap" tabindex="0" role="region" aria-label="Capability comparison">
      <table class="compare">
        <thead><tr>${columns
          .map((c, i) => `<th scope="col"${i === columns.length - 1 ? ' class="col-tandem"' : ''}>${esc(c)}</th>`)
          .join('')}</tr></thead>
        <tbody>${rows
          .map(
            (r) =>
              `<tr><th scope="row">${esc(r[0])}</th>${r
                .slice(1)
                .map((v, i, arr) => `<td${i === arr.length - 1 ? ' class="col-tandem"' : ''}>${cell(v)}</td>`)
                .join('')}</tr>`
          )
          .join('')}</tbody>
      </table>
    </div>`;
  }

  function Field({ id, label, type = 'text', required = false, optional = false, autocomplete = '', textarea = false, options = null, placeholder = '' }) {
    const labelHtml = `<label for="${id}">${esc(label)}${optional ? ' <span class="opt">(optional)</span>' : ''}</label>`;
    let control;
    if (options) {
      control = `<select id="${id}" name="${id}"${required ? ' required' : ''}><option value="">Select…</option>${options
        .map((o) => `<option>${esc(o)}</option>`)
        .join('')}</select>`;
    } else if (textarea) {
      control = `<textarea id="${id}" name="${id}" rows="3"${required ? ' required' : ''} placeholder="${esc(placeholder)}"></textarea>`;
    } else {
      control = `<input id="${id}" name="${id}" type="${type}"${required ? ' required' : ''}${
        autocomplete ? ` autocomplete="${autocomplete}"` : ''
      } placeholder="${esc(placeholder)}">`;
    }
    return `<div class="field">${labelHtml}${control}<p class="field-error" id="${id}-err" role="alert"></p></div>`;
  }

  window.TandemUI = { esc, money, Button, Card, Chip, WorkflowStep, OptionCard, ApprovalPanel, UseCaseCard, ComparisonTable, Field };
})();
