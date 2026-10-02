/* Motion helpers: scroll reveal, animated bars, count-up numbers.
   Everything keys off data attributes so components stay declarative, and every
   effect is skipped (final state shown at once) under prefers-reduced-motion.

   data-reveal="key"   fade/rise in when scrolled into view (once per key)
   data-bkey + data-w  bar that grows to data-w% (re-renders tween from the last width)
   data-ckey + data-count  number that counts up to data-count (re-renders tween from the last value) */
(function () {
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lastW = new Map();
  const lastC = new Map();
  const revealed = new Set();
  const onceKeys = new Set();

  const initW = (key) => (lastW.has(key) ? lastW.get(key) : 0);
  const initC = (key) => (lastC.has(key) ? lastC.get(key) : 0);
  // True only the first time a key is seen: use to run one-off entrance animations.
  const once = (key) => {
    if (onceKeys.has(key)) return false;
    onceKeys.add(key);
    return !reduce;
  };

  const ease = (t) => 1 - Math.pow(1 - t, 3);

  function setBar(el) {
    const target = Number(el.dataset.w);
    lastW.set(el.dataset.bkey, target);
    if (reduce) el.style.transition = 'none';
    requestAnimationFrame(() => {
      el.style.width = target + '%';
    });
  }

  function setCount(el) {
    const key = el.dataset.ckey;
    const to = Number(el.dataset.count);
    const from = lastC.has(key) ? lastC.get(key) : Number(el.textContent) || 0;
    lastC.set(key, to);
    if (reduce || from === to) {
      el.textContent = to;
      return;
    }
    const start = performance.now();
    const dur = 900;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      el.textContent = Math.round(from + (to - from) * ease(t));
      if (t < 1 && el.isConnected) requestAnimationFrame(tick);
      else el.textContent = to;
    };
    requestAnimationFrame(tick);
  }

  function reveal(el) {
    revealed.add(el.dataset.reveal);
    el.classList.add('in');
  }

  const io =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((en) => {
              if (!en.isIntersecting) return;
              io.unobserve(en.target);
              const el = en.target;
              if (el.dataset.reveal) reveal(el);
              if (el.dataset.bkey) setBar(el);
              if (el.dataset.ckey) setCount(el);
            });
          },
          { threshold: 0.2, rootMargin: '0px 0px -6% 0px' }
        )
      : null;

  function scan(root) {
    root = root || document;
    root.querySelectorAll('[data-reveal],[data-bkey],[data-ckey]').forEach((el) => {
      if (el._fx) return;
      el._fx = true;
      // Reveal: already-seen content (a re-render) appears instantly, with no flash.
      if (el.dataset.reveal) {
        if (reduce || revealed.has(el.dataset.reveal) || !io) {
          el.classList.add('in', 'instant');
          revealed.add(el.dataset.reveal);
        } else io.observe(el);
      }
      // Bars and counters: known keys tween from their previous value right away;
      // new ones wait until they scroll into view.
      if (el.dataset.bkey) {
        if (reduce || !io || lastW.has(el.dataset.bkey)) setBar(el);
        else io.observe(el);
      }
      if (el.dataset.ckey) {
        if (reduce || !io || lastC.has(el.dataset.ckey)) setCount(el);
        else io.observe(el);
      }
    });
  }

  window.TandemFX = { scan, initW, initC, once, reduce };
})();
