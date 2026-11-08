/* MANEX Inc. · site behaviour
   1. Elements fly in as they scroll into view.
   2. Scrolling down at the bottom of a page moves on to the next page in the nav order. */
(function () {
  var doc = document.documentElement;
  // Arrived from the Ctrl+K menu? Skip entrance animations on this page.
  try { if (sessionStorage.getItem('mx-instant')) { sessionStorage.removeItem('mx-instant'); doc.classList.add('instant'); } } catch (e) {}
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

  /* ---------- 3. Scroll progress line ---------- */
  var progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);
  var ticking = false;
  function updateProgress() {
    var max = doc.scrollHeight - window.innerHeight;
    var v = max > 0 ? window.scrollY / max : 0;
    progress.style.setProperty('--sp', Math.max(0, Math.min(1, v)).toFixed(4));
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  updateProgress();

  /* ---------- 4. Cursor-following light in the hero ---------- */
  var hero = document.getElementById('hero');
  if (hero && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
      hero.classList.add('has-cursor');
    });
    hero.addEventListener('pointerleave', function () { hero.classList.remove('has-cursor'); });
  }

  /* ---------- 5. Motion layer ---------- */
  function addIn(sel, cls, once) {
    if (!('IntersectionObserver' in window)) { document.querySelectorAll(sel).forEach(function (e) { e.classList.add(cls); }); return; }
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add(cls); if (once) o.unobserve(en.target); } });
    }, { threshold: 0.25 });
    document.querySelectorAll(sel).forEach(function (e) { o.observe(e); });
  }
  addIn('.principles, .steps, .timeline', 'drawn', true);
  addIn('.anniv-panel, .volt', 'in-view', true);

  // Count the anniversary numeral up
  var num = document.querySelector('.anniv-num');
  if (num && !reduceMotion) {
    var target = parseInt(num.textContent, 10) || 0, shown = false;
    new IntersectionObserver(function (es, ob) {
      if (!es[0].isIntersecting || shown) return; shown = true; ob.disconnect();
      var t0 = performance.now();
      (function tick(t) { var p = Math.min(1, (t - t0) / 1200); num.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); })(t0);
    }, { threshold: 0.5 }).observe(num);
  }

  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    // Spotlight that follows the cursor inside tiles and cards
    document.querySelectorAll('.app, .grid .card').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--x', (e.clientX - r.left) + 'px');
        el.style.setProperty('--y', (e.clientY - r.top) + 'px');
      });
    });
    // Hero screenshot leans toward the pointer
    var shot = document.querySelector('.hero-shot');
    if (hero && shot) {
      var spot = document.createElement('div'); spot.className = 'hero-spot'; spot.setAttribute('aria-hidden', 'true'); hero.appendChild(spot);
      hero.addEventListener('pointermove', function (e) {
        var r = shot.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth, dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
        shot.style.setProperty('--ry', (dx * 10).toFixed(2) + 'deg');
        shot.style.setProperty('--rx', (-dy * 8).toFixed(2) + 'deg');
      });
      hero.addEventListener('pointerleave', function () { shot.style.setProperty('--ry', '0deg'); shot.style.setProperty('--rx', '0deg'); });
    }
  }

  /* ---------- 6. v9: split headlines, magnetic buttons, page transitions ---------- */
  if (!reduceMotion) {
    document.querySelectorAll('.section-head h2, .anniv-panel h2, .volt h2, .cta-banner h2, .page-title').forEach(function (h) {
      if (h.children.length) return;
      var words = h.textContent.trim().split(/\s+/);
      h.setAttribute('aria-label', h.textContent.trim());
      h.innerHTML = words.map(function (w, i) { return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + w + '</span></span>'; }).join(' ');
      h.classList.add('split');
      if ('IntersectionObserver' in window) {
        var so = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('go'); so.unobserve(en.target); } }); }, { threshold: 0.4 });
        so.observe(h);
      } else { h.classList.add('go'); }
    });
    if (window.matchMedia('(pointer: fine)').matches) {
      document.querySelectorAll('.btn-primary, .nav-cta').forEach(function (b) {
        b.classList.add('magnet');
        b.addEventListener('pointermove', function (e) {
          var r = b.getBoundingClientRect();
          b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px)';
        });
        b.addEventListener('pointerleave', function () { b.style.transform = ''; });
      });
    }
    // Smooth fade between pages
    document.querySelectorAll('a[href$=".html"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
        e.preventDefault(); document.body.classList.add('leaving');
        setTimeout(function () { window.location.href = a.href; }, 260);
      });
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) document.body.classList.remove('leaving'); });
  }

  /* ---------- 7. v10: palette, dock, cursor, tilt ---------- */
  (function () {
    var items = [
      ['Home', 'index.html', 'Page'], ['Products', 'products.html', 'Page'], ['Releases', 'releases.html', 'Page'],
      ['About', 'about.html', 'Page'], ['Community', 'community.html', 'Page'], ['Cation', 'cation.html', 'Page'],
      ['Download', 'download.html', 'Page'], ['Open Volt', 'https://volt-manex.vercel.app', 'Volt AI'],
      ['Join the Discord', 'https://discord.gg/GRSvEkccnQ', 'Community'], ['GitHub', 'https://github.com/MANEX-Inc', 'Code'],
      ['Privacy', 'privacy.html', 'Legal'], ['Terms', 'terms.html', 'Legal']
    ];
    function go(h) {
      if (/^https?:/.test(h)) { window.open(h, '_blank', 'noopener'); return; }
      // Instant jump: no fade-out, no delay. The next page skips its entrance animations too.
      try { sessionStorage.setItem('mx-instant', '1'); } catch (e) {}
      window.location.href = h;
    }
    var back = document.createElement('div');
    back.className = 'pal-back';
    back.innerHTML = '<div class="pal" role="dialog" aria-modal="true" aria-label="Jump to a page"><input type="text" placeholder="Jump to a page or app" aria-label="Search pages" autocomplete="off" spellcheck="false"><ul role="listbox"></ul></div>';
    document.body.appendChild(back);
    var input = back.querySelector('input'), list = back.querySelector('ul'), shown = [], cur = 0, lastFocus = null;
    function render() {
      var q = input.value.trim().toLowerCase();
      shown = items.filter(function (i) { return !q || i[0].toLowerCase().indexOf(q) > -1 || i[2].toLowerCase().indexOf(q) > -1; });
      if (cur >= shown.length) cur = 0;
      list.innerHTML = shown.length ? '' : '<div class="pal-empty">Nothing matches that. Try Products or Download.</div>';
      shown.forEach(function (it, n) {
        var li = document.createElement('li'); li.setAttribute('role', 'option');
        li.className = n === cur ? 'act' : ''; li.innerHTML = '<span>' + it[0] + '</span><small>' + it[2] + '</small>';
        li.addEventListener('pointermove', function () { if (cur !== n) { cur = n; render(); } });
        li.addEventListener('click', function () { close(); go(it[1]); });
        list.appendChild(li);
      });
    }
    function open() { lastFocus = document.activeElement; input.value = ''; cur = 0; render(); back.classList.add('open'); setTimeout(function () { input.focus(); }, 30); }
    function close() { back.classList.remove('open'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
    back.addEventListener('click', function (e) { if (e.target === back) close(); });
    input.addEventListener('input', function () { cur = 0; render(); });
    window.addEventListener('keydown', function (e) {
      var isOpen = back.classList.contains('open');
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); isOpen ? close() : open(); return; }
      if (!isOpen) return;
      if (e.key === 'Escape') { close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); cur = (cur + 1) % Math.max(shown.length, 1); render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); cur = (cur - 1 + shown.length) % Math.max(shown.length, 1); render(); }
      else if (e.key === 'Enter' && shown[cur]) { var h = shown[cur][1]; close(); go(h); }
    });

    // Dock: back to top and jump button
    var dock = document.createElement('div'); dock.className = 'dock';
    var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    dock.innerHTML = '<button class="to-top" type="button" aria-label="Back to top">\u2191</button><button class="jump" type="button">Jump to <kbd>' + (isMac ? '\u2318K' : 'Ctrl K') + '</kbd></button>';
    document.body.appendChild(dock);
    var top = dock.querySelector('.to-top');
    dock.querySelector('.jump').addEventListener('click', open);
    top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });
    window.addEventListener('scroll', function () { top.classList.toggle('show', window.scrollY > 700); }, { passive: true });

    if (reduceMotion || !window.matchMedia('(pointer: fine)').matches) return;

    // Glass cursor ring that trails the pointer and swells over links
    var ring = document.createElement('div'); ring.className = 'cursor-ring'; ring.setAttribute('aria-hidden', 'true'); document.body.appendChild(ring);
    var tx = 0, ty = 0, rx = 0, ry = 0, run = false;
    function loop() { rx += (tx - rx) * 0.2; ry += (ty - ry) * 0.2; ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)'; requestAnimationFrame(loop); }
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY; ring.classList.add('on');
      if (!run) { run = true; rx = tx; ry = ty; loop(); }
      ring.classList.toggle('big', !!e.target.closest('a, button, summary, .btn, .chip, input'));
    }, { passive: true });
    document.addEventListener('pointerleave', function () { ring.classList.remove('on'); });

    // Gentle 3D tilt on app tiles
    document.querySelectorAll('.app').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--ty', (((e.clientX - r.left) / r.width - 0.5) * 6).toFixed(2) + 'deg');
        el.style.setProperty('--tx', (-((e.clientY - r.top) / r.height - 0.5) * 6).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', function () { el.style.setProperty('--tx', '0deg'); el.style.setProperty('--ty', '0deg'); });
    });
  })();

  /* ---------- 8. v12: extra orb + click ripple ---------- */
  var heroBanner = document.querySelector('.hero-banner');
  if (heroBanner && !reduceMotion) {
    var oc = document.createElement('span'); oc.className = 'orb orb-c'; oc.setAttribute('aria-hidden', 'true'); heroBanner.appendChild(oc);
  }
  if (!reduceMotion) {
    document.querySelectorAll('.btn, .nav-cta').forEach(function (b) {
      b.addEventListener('pointerdown', function (e) {
        var r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
        var rip = document.createElement('span');
        rip.style.cssText = 'position:absolute;border-radius:50%;pointer-events:none;background:rgba(255,255,255,.35);transform:scale(0);opacity:1;z-index:0;' +
          'width:' + d + 'px;height:' + d + 'px;left:' + (e.clientX - r.left - d / 2) + 'px;top:' + (e.clientY - r.top - d / 2) + 'px;transition:transform .6s cubic-bezier(.2,.7,.2,1),opacity .6s';
        b.appendChild(rip);
        requestAnimationFrame(function () { rip.style.transform = 'scale(1)'; rip.style.opacity = '0'; });
        setTimeout(function () { rip.remove(); }, 650);
      });
    });
  }

  /* ---------- 2. Scroll past the bottom to go to the next page ---------- */
  var pages = [
    ['index.html', 'Home'],
    ['products.html', 'Products'],
    ['releases.html', 'Releases'],
    ['about.html', 'About'],
    ['community.html', 'Community'],
    ['cation.html', 'Cation'],
    ['download.html', 'Download']
  ];
  var file = (location.pathname.split('/').pop() || 'index.html');
  var idx = -1;
  pages.forEach(function (p, i) { if (p[0] === file) idx = i; });
  var next = (idx > -1 && idx < pages.length - 1) ? pages[idx + 1] : null;
  // Page-to-page scrolling is navigation, not decoration, so it works even when reduced motion is on.
  if (!next) return;

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
