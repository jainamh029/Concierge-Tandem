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
    HERO_CTA: 'hero_cta_clicked',
    DEMO_STARTED: 'task_demo_started',
    DEMO_COMPLETED: 'task_demo_completed',
    APPROVAL: 'approval_button_clicked',
    FORM_STARTED: 'waitlist_form_started',
    FORM_SUBMITTED: 'waitlist_form_submitted',
  };
})();
