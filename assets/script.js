/* MANEX Inc. · site behaviour
   1. Elements fly in as they scroll into view.
   2. Scrolling down at the bottom of a page moves on to the next page in the nav order. */
(function () {
  var doc = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Scroll fly-in ---------- */
  var targets = [
    ['.section-head', 'reveal'],
    ['.principle', 'reveal'],
    ['.app', 'reveal'],
    ['.step', 'reveal'],
    ['.grid .card', 'reveal'],
    ['.timeline li', 'reveal'],
    ['.faq details', 'reveal'],
    ['.product-shot', 'reveal'],
    ['.anniv-panel, .cta-banner, .volt, .discord-embed', 'reveal'],
    ['.showcase:not(.reverse) .showcase-text', 'reveal-left'],
    ['.showcase:not(.reverse) .showcase-visual', 'reveal-right'],
    ['.showcase.reverse .showcase-text', 'reveal-right'],
    ['.showcase.reverse .showcase-visual', 'reveal-left']
  ];

  if (!reduceMotion && 'IntersectionObserver' in window) {
    doc.classList.add('js');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('in');
        io.unobserve(el);
        // Drop the helper classes once settled so hover effects work normally again.
        setTimeout(function () { el.classList.remove('reveal', 'reveal-left', 'reveal-right', 'in'); el.style.transitionDelay = ''; }, 1600);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    targets.forEach(function (pair) {
      var nodes = document.querySelectorAll(pair[0]);
      var seen = {};
      nodes.forEach(function (el) {
        // Stagger siblings that sit in the same parent.
        var key = el.parentElement ? el.parentElement : el;
        seen[key] = (seen[key] || 0);
        var step = Math.min(seen[key], 4);
        seen[key] += 1;
        el.classList.add(pair[1]);
        el.style.transitionDelay = (step * 0.09) + 's';
        io.observe(el);
      });
    });
  }

  /* ---------- 2. Scroll past the bottom to go to the next page ---------- */
  var pages = [
    ['index.html', 'Home'],
    ['products.html', 'Products'],
    ['about.html', 'About'],
    ['community.html', 'Community'],
    ['cation.html', 'Cation'],
    ['download.html', 'Download']
  ];
  var file = (location.pathname.split('/').pop() || 'index.html');
  var idx = -1;
  pages.forEach(function (p, i) { if (p[0] === file) idx = i; });
  var next = (idx > -1 && idx < pages.length - 1) ? pages[idx + 1] : null;
  if (!next || reduceMotion) return;

  var WHEEL_THRESHOLD = 900;   // accumulated wheel distance at the bottom
  var TOUCH_THRESHOLD = 220;   // swipe distance at the bottom, in px
  var acc = 0, idle = null, touchStartY = 0, leaving = false;

  // Page veil used for a soft fade out before navigating
  var veil = document.createElement('div');
  veil.className = 'page-veil';
  document.body.appendChild(veil);

  // Hint shown while scrolling past the bottom
  var hint = document.createElement('div');
  hint.className = 'next-hint';
  hint.setAttribute('aria-hidden', 'true');
  hint.textContent = 'Keep scrolling: ' + next[1];
  document.body.appendChild(hint);

  function scrollable() { return doc.scrollHeight > window.innerHeight + 60; }
  function atBottom() { return window.scrollY + window.innerHeight >= doc.scrollHeight - 2; }
  function setProgress(v) {
    v = Math.max(0, Math.min(1, v));
    hint.style.setProperty('--p', v);
    hint.classList.toggle('show', v > 0);
  }
  function reset() { acc = 0; setProgress(0); }
  function go() {
    if (leaving) return;
    leaving = true;
    veil.classList.add('on');
    setTimeout(function () { window.location.href = next[0]; }, 360);
  }

  window.addEventListener('wheel', function (e) {
    if (leaving || !scrollable()) return;
    if (!atBottom() || e.deltaY <= 0) { reset(); return; }
    acc += e.deltaY;
    setProgress(acc / WHEEL_THRESHOLD);
    clearTimeout(idle);
    idle = setTimeout(reset, 450);
    if (acc >= WHEEL_THRESHOLD) go();
  }, { passive: true });

  window.addEventListener('touchstart', function (e) {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', function (e) {
    if (leaving || !scrollable() || !atBottom()) return;
    var dy = touchStartY - e.touches[0].clientY;
    if (dy <= 0) { reset(); return; }
    setProgress(dy / TOUCH_THRESHOLD);
    if (dy >= TOUCH_THRESHOLD) go();
  }, { passive: true });

  window.addEventListener('touchend', reset, { passive: true });
})();
