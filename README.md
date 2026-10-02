# Tandem Search Workspace — interactive prototype

Live: https://jainamh029.github.io/Concierge-Tandem/

An independent concept (not an official Tandem product) showing how an AI-native office-leasing workflow could help a growing team go from vague needs to a tour-ready shortlist, while keeping a human advisor where judgment and trust matter.

**All offices, prices, availability, scores, and recommendations are sample data.** Nothing is booked and no one is contacted.

## What it demonstrates

1. **Discovery** — nine pre-filled questions turn a vague need into structured requirements and an assembled brief, including what Tandem noticed and what an advisor would ask next.
2. **Shortlist** — four sample spaces with a *Tandem fit score — based on your stated priorities*. The score is explainable (six weighted factors) and adjustable; it is not presented as objective truth.
3. **Comparison** — up to three spaces side by side with a decision memo that states its own limits.
4. **Tour coordination** — a seven-step flow with owners (you / Tandem / advisor), a sample itinerary, and a simulated "tour request prepared" state.
5. **Human + AI boundary** — what software handles and what a local advisor handles.
6. **Product learning** — an illustrative insight that, when applied, changes the discovery flow and the weighting (labeled as example, not Tandem data).

Default answers reproduce the example scenario: scores 91 / 87 / 85 for Flatiron / NoMad / Chelsea.

## Structure

```
index.html          Page structure and mount points
css/styles.css      Design tokens and styles
js/data.js          All mock data and copy (listings, questions, factors, itinerary)
js/model.js         Pure logic: scoring, brief text, itinerary, decision memo
js/components.js    Reusable components: Hero, DiscoveryStep, AIBrief, ListingCard,
                    MatchExplanation, ComparisonTable, DecisionMemo, TourItinerary,
                    TourPlanner, HumanAIBoundary, InsightCard, CtaForm
js/app.js           State and event wiring
js/analytics.js     Event placeholders
move-in/            Earlier prototype: post-lease move-in coordination
```

No build step. Scripts are classic (not ES modules), so `index.html` also works when opened from disk.

## Analytics events

Pushed to `window.dataLayer` and logged with `console.debug`. Swap `track()` in `js/analytics.js` for your provider.

`office_search_started`, `discovery_completed`, `space_shortlisted`, `comparison_opened`, `tour_requested`, `advisor_cta_clicked`

## Receiving advisor requests

There is no backend; requests are saved to `localStorage` in the visitor's browser. Set `CONFIG.endpoint` in `js/data.js` to a form endpoint (for example Formspree) to receive them.

## Run locally

```bash
python3 -m http.server 8000
```
