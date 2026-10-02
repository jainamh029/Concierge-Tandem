/* Analytics placeholder. Replace the body of `track` with your provider
   (PostHog, Segment, GA4, ...). Until then events go to dataLayer and the console. */
(function () {
  window.dataLayer = window.dataLayer || [];

  function track(name, props) {
    const event = { event: name, ...(props || {}), ts: new Date().toISOString() };
    window.dataLayer.push(event);
    if (window.console && console.debug) console.debug('[tandem:analytics]', event);
  }

  window.Tandem = window.Tandem || {};
  window.Tandem.track = track;
  window.Tandem.EVENTS = {
    SEARCH_STARTED: 'office_search_started',
    DISCOVERY_COMPLETED: 'discovery_completed',
    SPACE_SHORTLISTED: 'space_shortlisted',
    COMPARISON_OPENED: 'comparison_opened',
    TOUR_REQUESTED: 'tour_requested',
    ADVISOR_CTA: 'advisor_cta_clicked',
  };
})();
