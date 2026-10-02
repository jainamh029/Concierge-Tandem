# Tandem — personal operations concierge (interactive prototype)

Live: https://jainamh029.github.io/Concierge-Tandem/

A static prototype that shows one believable workflow end to end: a founder asks for a client dinner, Tandem checks constraints, applies saved preferences, compares options, and **asks for approval** before the (simulated) reservation and calendar invite.

All restaurants, prices, walking times, calendars, and activity are **sample data**. Nothing is booked, sent, or paid for.

## Structure

```
index.html          Page structure and section mount points
css/styles.css      Design tokens and styles
js/data.js          All mock data and copy for the demo (edit content here)
js/analytics.js     Event placeholders: Tandem.track(name, props)
js/components.js    Reusable components: Button, Card, Chip, WorkflowStep,
                    OptionCard, ApprovalPanel, UseCaseCard, ComparisonTable, Field
js/demo.js          Task simulation state machine (7 stages, compare, adjust, approve)
js/main.js          Page wiring, trust panel, early-access form
move-in/            The earlier move-in coordination dashboard (kept for reference)
```

No build step. Scripts are classic (not ES modules), so `index.html` also works when opened directly from disk.

## Analytics events

Pushed to `window.dataLayer` and logged with `console.debug`. Swap the body of `track()` in `js/analytics.js` for your provider.

`hero_cta_clicked`, `task_demo_started`, `task_demo_completed`, `approval_button_clicked`, `waitlist_form_started`, `waitlist_form_submitted`

## Receiving early-access submissions

There is no backend. Submissions are saved to `localStorage` in the visitor's browser only. To collect them, set `CONFIG.waitlistEndpoint` in `js/data.js` to a form endpoint (for example Formspree). The form will POST JSON and the "saved in this browser only" note disappears.

## Run locally

```bash
python3 -m http.server 8000
```
