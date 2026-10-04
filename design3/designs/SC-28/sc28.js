/* SC-28 option mockups: the page's theme, design system v3's own icons and mark, and the motion prototypes, in
   framer-motion 11.18.2 as the hosted pages load it. Each motion plays once when it comes into view, holds on its
   result, and offers Replay; under reduced motion it arrives in place. Nothing loops (WCAG 2.2.2). */
(function () {
  /* ---------- theme: ?theme=dark|light, else the device, toggled from the bar ---------- */
  var q = new URLSearchParams(location.search).get('theme');
  var dark = q ? q === 'dark' : window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  window.sc28Theme = function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
  };
})();

document.addEventListener('DOMContentLoaded', function () {
  var ICONS = window.SC3_ICONS || {};
  var n = 0;
  function icon(name, size, stroke) {
    return '<svg class="ic" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + stroke +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.circle || '') + '</svg>';
  }
  function mark(size) {
    var g = 'mk' + (n++);
    return '<svg class="mark" width="' + size + '" height="' + size + '" viewBox="0 0 64 64" aria-hidden="true"><defs>' +
      '<linearGradient id="' + g + 'g" x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2fbf7f"/><stop offset="0.55" stop-color="#178258"/><stop offset="1" stop-color="#0d5a3e"/></linearGradient>' +
      '<linearGradient id="' + g + 'h" x1="32" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z" fill="url(#' + g + 'g)"/>' +
      '<path d="M32 3C10.5 3 3 10.5 3 31.5 10 22 22 18 32 18s22 4 29 13.5C61 10.5 53.5 3 32 3Z" fill="url(#' + g + 'h)"/>' +
      '<path d="M43.5 19 H27 a7 7 0 0 0 0 14 h10 a7 7 0 0 1 0 14 H20.5" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="43.5" cy="19" r="3.4" fill="#0d5a3e" stroke="#fff" stroke-width="2.6"/><circle cx="20.5" cy="47" r="5.2" fill="#f7c04a" stroke="#fff" stroke-width="2.2"/></svg>';
  }
  document.querySelectorAll('[data-icon]').forEach(function (el) {
    el.outerHTML = icon(el.getAttribute('data-icon'), +(el.getAttribute('data-size') || 20), +(el.getAttribute('data-stroke') || 1.75));
  });
  document.querySelectorAll('[data-mark]').forEach(function (el) { el.outerHTML = mark(+(el.getAttribute('data-mark') || 36)); });

  if (!window.React || !window.Motion) return;
  var h = React.createElement, M = window.Motion, EASE = [0.22, 1, 0.36, 1];

  /* ---------- the nine stops, live: the batch walks the rail; each agent lights and says what it did ---------- */
  var STOPS = [
    { id: 'connect', t: 'Connect', text: "the distributor's stock export and one permission", who: ['Data'], live: 'stock export mapped · permission given' },
    { id: 'detect', t: 'Detect', text: 'shelf life checked against every gate at 09:00', who: ['Watcher'], live: "1,360 packs won't sell in the 47 days left" },
    { id: 'verify', t: 'Verify', text: 'the label photo read and matched', who: ['Vision'], live: 'label read · the date matches' },
    { id: 'value', t: 'Value', text: 'five exits priced, the bin included', who: ['Valuer'], live: 'five exits priced · the bin costs ₹26,330' },
    { id: 'decide', t: 'Decide', text: 'the batch split, with the reasons', who: ['Router'], live: '588 packs to 31 kiranas · 772 to one buyer' },
    { id: 'approve', t: 'Approve', text: 'one tap, with the money on screen', who: ['a person'], human: true, live: 'approved in one tap · ₹21,770 on screen' },
    { id: 'execute', t: 'Execute', text: 'listing, offers in Hindi, bids answered, pick-up', who: ['Lister', 'Outreach', 'Negotiator'], live: 'listed · offers sent · ₹13 bid countered to ₹14.20' },
    { id: 'settle', t: 'Settle', text: 'invoice, e-way bill, credit note, GST memo', who: ['Paperwork'], live: 'invoice, credit note and GST memo drafted' },
    { id: 'report', t: 'Report', text: 'a BRSR line after the return window', who: ['Impact'], live: '₹21,152 recovered · 218 kg kept out of landfill' }
  ];
  function Pipeline(props) {
    var ref = React.useRef(null);
    var reduce = M.useReducedMotion();
    var inView = M.useInView(ref, { once: true, amount: 0.4 });
    var _a = React.useState(reduce ? 9 : -1), k = _a[0], setK = _a[1];
    var _b = React.useState(0), run = _b[0], setRun = _b[1];
    React.useEffect(function () { if (reduce) { setK(9); return; } if (inView) setK(0); }, [inView, run, reduce]);
    // under five seconds in all: 470 ms a stop, and a beat on the human yes
    React.useEffect(function () {
      if (reduce || k < 0 || k >= 9) return;
      var t = setTimeout(function () { setK(k + 1); }, STOPS[k].human ? 980 : 470);
      return function () { clearTimeout(t); };
    }, [k, reduce]);
    var playing = k >= 0 && k < 9;
    return h('div', { className: 'stops-box', ref: ref },
      h('ol', { className: 'stops live' + (playing ? ' playing' : ''), 'aria-label': 'The nine stops' },
        h(M.motion.span, { className: 'stops-fill', 'aria-hidden': 'true', style: { height: 'calc(100% - 48px)' },
          initial: false, animate: { scaleY: k < 0 ? 0 : Math.min(1, k / 8) }, transition: { duration: reduce ? 0 : 0.45, ease: EASE } }),
        STOPS.map(function (s, i) {
          var done = i < k || k >= 9, now = i === k && playing;
          return h('li', { key: s.id, className: 'stop' + (s.human ? ' human' : '') + (done ? ' on' : '') + (now ? ' now' : '') },
            h('span', { className: 'st-dot', 'aria-hidden': 'true' },
              s.human ? h('span', { dangerouslySetInnerHTML: { __html: '<svg class="ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + (window.SC3_ICONS.hand || '') + '</svg>' } })
                : done ? h('span', { dangerouslySetInnerHTML: { __html: '<svg class="ic" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + (window.SC3_ICONS.check || '') + '</svg>' } }) : null),
            h('span', { className: 'st-main' },
              h('b', null, s.t), h('span', { className: 'st-text' }, s.text),
              h('span', { className: 'st-who' }, s.who.map(function (w) {
                return h('span', { key: w, className: 'chip-agent' + (s.human ? ' person' : '') + (done || now ? ' on' : '') }, h('i'), w);
              })),
              h(M.AnimatePresence, { initial: false }, (done || now) && h(M.motion.span, { key: 'live', className: 'st-live',
                initial: reduce ? false : { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.24, ease: EASE } }, s.live))));
        })),
      props.replay !== false && h('div', null, h('button', { type: 'button', className: 'replay', onClick: function () { setK(-1); setRun(run + 1); setTimeout(function () { setK(0); }, 30); } },
        h('span', { dangerouslySetInnerHTML: { __html: '<svg class="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (window.SC3_ICONS['rotate-ccw'] || '') + '</svg>' } }),
        k >= 9 ? 'Run the batch again' : 'Run the batch')));
  }

  /* ---------- how it works: the three steps rise in turn, then their agents start work one by one ---------- */
  function Steps(props) {
    var ref = React.useRef(null);
    var reduce = M.useReducedMotion();
    var inView = M.useInView(ref, { once: true, amount: 0.35 });
    var shown = reduce || inView;
    var total = props.steps.reduce(function (t, s) { return t + s.who.length; }, 0);
    var _a = React.useState(reduce ? total : 0), lit = _a[0], setLit = _a[1];
    React.useEffect(function () {
      if (reduce) { setLit(total); return; }
      if (!shown || lit >= total) return;
      var t = setTimeout(function () { setLit(lit + 1); }, lit === 0 ? 620 : 230);
      return function () { clearTimeout(t); };
    }, [shown, lit, reduce]);
    var idx = 0;
    return h('ol', { className: 'steps3' + (props.big ? ' big' : ''), ref: ref }, props.steps.map(function (s, i) {
      return h(M.motion.li, { key: s.t, className: 'step3' + (s.yes ? ' yes' : ''),
        initial: reduce ? false : { opacity: 0, y: 14 }, animate: shown ? { opacity: 1, y: 0 } : undefined,
        transition: { duration: 0.42, delay: reduce ? 0 : i * 0.18, ease: EASE } },
        h('img', { className: 'art', src: s.art, alt: '', width: 128, height: 128 }),
        h('span', { className: 'row tight' }, h('span', { className: 'st-n', 'aria-hidden': 'true' }, i + 1), h('h3', null, s.t)),
        h('p', null, s.text),
        h('span', { className: 'agents' }, s.who.map(function (w, j) {
          var on = idx++ < lit;
          return h('span', { key: w, className: 'chip-agent' + (s.yes && j === 0 ? ' person' : '') + (on ? ' on' : '') }, h('i'), w);
        })));
    }));
  }

  /* ---------- a clip that plays once in view and holds on its last frame ---------- */
  function playOnce(video) {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var btn = video.parentElement.querySelector('.clip-ctl');
    // under reduced motion the clip doesn't start by itself: it shows its last frame, the result, and Play offers the rest
    if (reduce) {
      video.removeAttribute('autoplay');
      if (video.dataset.endPoster) video.poster = video.dataset.endPoster;
      if (btn) { btn.lastChild.textContent = 'Play'; btn.hidden = false; btn.addEventListener('click', function () { video.currentTime = 0; video.play().catch(function () {}); btn.hidden = true; }); }
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); video.play().catch(function () {}); } });
    }, { threshold: 0.5 });
    io.observe(video);
    video.addEventListener('ended', function () { if (btn) btn.hidden = false; });
    if (btn) btn.addEventListener('click', function () { video.currentTime = 0; video.play().catch(function () {}); btn.hidden = true; });
  }

  /* ---------- product moments (option B): rows rise in turn and figures roll once, when a card comes into view ---------- */
  function reveal(root) {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var items = root.querySelectorAll('[data-rise]');
    var counts = root.querySelectorAll('[data-count]');
    if (reduce) { root.querySelectorAll('[data-light]').forEach(function (el) { el.classList.add('on'); }); return; }
    // the card (or strip) rises first, so it is never seen empty; then its rows follow it in turn
    root.style.opacity = '0'; root.style.transform = 'translateY(16px)';
    items.forEach(function (el) { el.style.opacity = '0'; el.style.transform = 'translateY(10px)'; });
    counts.forEach(function (el) { el.textContent = '0'; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.disconnect();
        root.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' });
        items.forEach(function (el, i) {
          el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 160 + i * 110, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' });
        });
        counts.forEach(function (el) {
          var to = +el.getAttribute('data-count'), t0 = null, d = 700, delay = 260;
          function step(ts) { if (t0 === null) t0 = ts + delay; var p = Math.max(0, Math.min(1, (ts - t0) / d)); var e2 = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(to * e2).toLocaleString('en-IN'); if (p < 1) requestAnimationFrame(step); }
          requestAnimationFrame(step);
        });
        root.querySelectorAll('[data-light]').forEach(function (el, i) { setTimeout(function () { el.classList.add('on'); }, 900 + i * 220); });
      });
    }, { threshold: 0.3 });
    io.observe(root);
  }
  document.querySelectorAll('[data-reveal]').forEach(reveal);

  document.querySelectorAll('[data-pipeline]').forEach(function (el) { ReactDOM.createRoot(el).render(h(Pipeline, {})); });
  document.querySelectorAll('[data-steps]').forEach(function (el) {
    var steps = JSON.parse(el.getAttribute('data-steps'));
    ReactDOM.createRoot(el).render(h(Steps, { steps: steps, big: el.hasAttribute('data-big') }));
  });
  document.querySelectorAll('video[data-once]').forEach(playOnce);

  /* the street as a swipe strip (phones and tablets): open on the taken exit, as the site does */
  document.querySelectorAll('.ex-pan').forEach(function (pan) {
    var on = pan.querySelector('.ex-chip.on');
    if (!on || pan.scrollWidth <= pan.clientWidth) return;
    var p = pan.getBoundingClientRect(), c = on.getBoundingClientRect();
    pan.scrollLeft += c.left + c.width / 2 - (p.left + p.width / 2);
  });
});
