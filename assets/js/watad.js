/* ==========================================================================
   وتد — Watad static theme · vanilla JS, no dependencies
   Every behaviour is opt-in through data-attributes, so Blade views only
   need to keep the attributes when looping over real data.
   Motion is progressive: with JS off, or with prefers-reduced-motion on,
   every state still works and nothing is left hidden.
   ========================================================================== */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var EASE_OUT = 'cubic-bezier(.16,1,.3,1)', EASE_IN = 'cubic-bezier(.55,0,1,.45)';

  /* Fade in what a filter or a view switch just revealed. Opacity only, and it
     never blocks the next click (a view transition would, for its whole run). */
  function reveal(els) {
    if (reduced.matches) return;
    els.forEach(function (el) { if (el && el.animate) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: EASE_OUT }); });
  }

  /* Results glide from where they were to where they land, after a view
     switch or a filter, matched by data-item (each view holds its own copy).
     Transform only, so it never blocks the next click; what had no place
     before, or would travel more than a screen, fades in instead. */
  function places(box) {
    var m = {};
    $$('[data-item]', box).forEach(function (el) { if (el.getAttribute('data-hidden') !== 'true' && el.getClientRects().length) m[el.getAttribute('data-item')] = el.getBoundingClientRect(); });
    return m;
  }
  function glide(box, before) {
    if (reduced.matches) return;
    var rtl = document.documentElement.getAttribute('dir') === 'rtl', vh = window.innerHeight, fresh = [];
    $$('[data-item]', box).forEach(function (el) {
      if (el.getAttribute('data-hidden') === 'true' || !el.getClientRects().length) return;
      var o = before[el.getAttribute('data-item')], n = el.getBoundingClientRect();
      if (n.bottom < 0 || n.top > vh) return;   // off screen: nothing to see
      var dx = o ? (rtl ? o.right - n.right : o.left - n.left) : 0, dy = o ? o.top - n.top : 0;
      if (!o || Math.abs(dy) > vh) { fresh.push(el); return; }
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      if (el.animate) el.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)', opacity: .5 }, { transform: 'none', opacity: 1 }], { duration: 560, easing: EASE_OUT });
    });
    reveal(fresh);
  }

  /* One sand line under the chosen tab, sliding from tab to tab. It follows
     the .tab.is-active in box; call the returned function after changing it. */
  function tabInk(box) {
    var ink = document.createElement('i');
    ink.className = 'tabs__ink'; ink.setAttribute('aria-hidden', 'true');
    box.appendChild(ink); box.classList.add('has-ink');
    function move() {
      var on = $('.tab.is-active', box);
      if (!on) return;
      var r = on.getBoundingClientRect(), p = box.getBoundingClientRect();
      ink.style.setProperty('--wn', r.width);
      ink.style.setProperty('--x', (r.left - p.left + box.scrollLeft) + 'px');
    }
    window.addEventListener('resize', move);
    // tabs change width when their web font arrives, which fonts.ready alone can miss (WebKit), and in
    // right-to-left a row that changes width moves every tab in it, so the row is watched as well
    if ('ResizeObserver' in window) { var ro = new ResizeObserver(function () { move(); }); ro.observe(box); $$('.tab', box).forEach(function (t) { ro.observe(t); }); }
    return move;
  }

  /* Keep Tab inside an open dialog */
  function trapFocus(box, e) {
    if (e.key !== 'Tab') return;
    var f = $$('a[href],button:not([disabled]),input:not([type="hidden"]),select,textarea', box).filter(function (x) { return x.getClientRects().length; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* 1. Mobile drawer ----------------------------------------------------- */
  function drawer() {
    var d = $('[data-drawer]');
    if (!d) return;
    var openers = $$('[data-drawer-open]'), back = null;
    var set = function (on) {
      d.classList.toggle('is-open', on);
      document.body.style.overflow = on ? 'hidden' : '';
      openers.forEach(function (b) { b.setAttribute('aria-expanded', on ? 'true' : 'false'); });
    };
    var open = function () { back = document.activeElement; set(true); var f = $('a', d); f && f.focus(); };
    var close = function () {
      if (!d.classList.contains('is-open')) return;
      set(false);
      if (back && back.focus) back.focus();
      back = null;
    };
    openers.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); b.addEventListener('click', open); });
    $$('[data-drawer-close]').forEach(function (b) { b.addEventListener('click', close); });
    d.addEventListener('keydown', function (e) { trapFocus(d, e); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* 2. Search overlay ---------------------------------------------------- */
  function searchOverlay() {
    var o = $('[data-search-overlay]');
    if (!o) return;
    var input = $('input', o), back = null;
    var open = function (e) {
      e && e.preventDefault();
      if (o.classList.contains('is-open')) return;
      back = document.activeElement;
      o.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      setTimeout(function () { input && input.focus(); }, 20);
    };
    var close = function () {
      if (!o.classList.contains('is-open')) return;
      o.classList.remove('is-open');
      document.body.style.overflow = '';
      if (back && back.focus) back.focus();
      back = null;
    };
    $$('[data-search-open]').forEach(function (b) { b.addEventListener('click', open); });
    $$('[data-search-close]').forEach(function (b) { b.addEventListener('click', close); });
    o.addEventListener('click', function (e) { if (e.target === o) close(); });
    o.addEventListener('keydown', function (e) { trapFocus(o, e); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
      var a = document.activeElement;
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !/input|textarea|select/i.test(a.tagName) && !a.isContentEditable) open(e);
    });
  }

  /* 3. Result views (list / grid / compact) ------------------------------ */
  function views() {
    var box = $('[data-results]');
    if (!box) return;
    var btns = $$('[data-view-btn]');
    var show = function (v) {
      box.setAttribute('data-view', v);
      btns.forEach(function (x) {
        var on = x.getAttribute('data-view-btn') === v;
        x.classList.toggle('is-active', on);
        x.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    };
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-view-btn');
        if (box.getAttribute('data-view') === v) return;
        var before = places(box);
        show(v);
        glide(box, before);
        var u = new URL(location.href); u.searchParams.set('view', v); history.replaceState(null, '', u);
      });
    });
    var q = new URL(location.href).searchParams.get('view');
    if (btns.some(function (x) { return x.getAttribute('data-view-btn') === q; })) show(q);
  }

  /* 4. Facet filtering --------------------------------------------------
     Options: <button data-facet="section" data-value="سياسة">
     Items:   <* data-item data-section="سياسة" data-type="تحليل">       */
  function facets() {
    var root = $('[data-facets]');
    if (!root) return;
    var state = {};
    var items = $$('[data-item]');
    var opts = $$('[data-facet]', root);
    var countEl = $('[data-result-count]');
    var empty = $('[data-filter-empty]');
    var box = $('[data-results]');
    function apply() {
      var shown = 0, seen = {}, back = [], before = box ? places(box) : {};
      items.forEach(function (it) {
        var ok = Object.keys(state).every(function (k) { return !state[k] || it.getAttribute('data-' + k) === state[k]; });
        it.setAttribute('data-hidden', ok ? 'false' : 'true');
        var id = it.getAttribute('data-item');
        if (ok && !seen[id]) { seen[id] = 1; shown++; }
      });
      if (countEl && countEl.textContent !== String(shown)) {
        countEl.textContent = shown;
        if (!reduced.matches && countEl.animate) countEl.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: EASE_OUT });
      }
      if (empty) { var was = empty.hidden; empty.hidden = shown !== 0; if (was && !empty.hidden) back.push(empty); }
      if (box) glide(box, before);
      reveal(back);
    }
    function mark(x, on) { x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    opts.forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-facet');
        state[k] = b.getAttribute('data-value') || '';
        opts.forEach(function (x) { if (x.getAttribute('data-facet') === k) mark(x, x === b); });
        apply();
      });
    });
    $$('[data-facets-reset]').forEach(function (b) {
      b.addEventListener('click', function () {
        state = {};
        opts.forEach(function (x) { mark(x, !x.getAttribute('data-value')); });
        apply();
      });
    });
  }

  /* 5. Tabs that filter a list (author page) ---------------------------- */
  function tabs() {
    $$('[data-tabs]').forEach(function (group) {
      var target = $(group.getAttribute('data-tabs'));
      if (!target) return;
      var btns = $$('[data-tab]', group);
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          var v = b.getAttribute('data-tab'), back = [];
          btns.forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); x.classList.toggle('is-active', x === b); });
          $$('[data-tab-item]', target).forEach(function (it) {
            var ok = !v || it.getAttribute('data-tab-item') === v;
            if (ok && it.getAttribute('data-hidden') === 'true') back.push(it);
            it.setAttribute('data-hidden', ok ? 'false' : 'true');
          });
          reveal(back);
        });
      });
    });
  }

  /* 6. Sort toggles (visual state only; server does the sort) ----------- */
  function chips() {
    $$('[data-chips]').forEach(function (g) {
      var cs = $$('.chip', g);
      var mark = function (c) { cs.forEach(function (x) { x.classList.toggle('is-active', x === c); x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); }); };
      cs.forEach(function (c) {
        c.setAttribute('aria-pressed', c.classList.contains('is-active') ? 'true' : 'false');
        c.addEventListener('click', function () { mark(c); });
      });
    });
  }

  /* 7. Archive months (collapse / expand) --------------------------------
     The body's height follows the click, and a second click mid-way reverses
     from wherever it is. */
  function months() {
    $$('[data-month]').forEach(function (m) {
      var t = $('[data-month-toggle]', m), body = $('.month__body', m), anim = null;
      if (!t) return;
      t.addEventListener('click', function () {
        var open = t.getAttribute('aria-expanded') !== 'true';
        t.setAttribute('aria-expanded', open ? 'true' : 'false');
        var lab = $('[data-month-label]', t);
        if (lab) lab.textContent = open ? 'اطو الشهر' : 'افتح الشهر';
        if (!body || !body.animate || reduced.matches) { m.setAttribute('data-open', open ? 'true' : 'false'); return; }
        var from = body.getBoundingClientRect().height;
        if (anim) { anim.cancel(); anim = null; }
        m.setAttribute('data-open', 'true');
        var to = open ? body.getBoundingClientRect().height : 0;
        body.style.overflow = 'hidden';
        anim = body.animate(
          [{ height: from + 'px', opacity: open ? 0 : 1 }, { height: to + 'px', opacity: open ? 1 : 0 }],
          { duration: open ? 520 : 300, easing: open ? EASE_OUT : EASE_IN }
        );
        anim.onfinish = function () {
          anim = null;
          body.style.overflow = '';
          if (!open) m.setAttribute('data-open', 'false');
        };
      });
    });
  }

  /* 8. Article table of contents: highlight the chapter in view ----------
     The chapter lit is the last one whose mark has gone above a line 30%
     down the screen. The observer's root reaches far above the screen, so
     scrolling back up (or jumping to the top) puts marks below the line
     again and the list follows; above the first chapter nothing is lit. */
  function toc() {
    var links = $$('[data-toc] a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var marks = [], passed = {};
    links.forEach(function (a) { var el = document.getElementById(a.getAttribute('href').slice(1)); if (el) marks.push({ el: el, a: a }); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { passed[e.target.id] = e.isIntersecting; });
      var on = null;
      marks.forEach(function (m) { if (passed[m.el.id]) on = m; });
      marks.forEach(function (m) { m.a.classList.toggle('is-active', m === on); });
    }, { rootMargin: '100000px 0px -70% 0px' });
    marks.forEach(function (m) { io.observe(m.el); });
  }

  /* 9. Follow button (demo state) ---------------------------------------- */
  function follow() {
    $$('[data-follow]').forEach(function (b) {
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') === 'true';
        $$('[data-follow]').forEach(function (x) {
          x.setAttribute('aria-pressed', on ? 'false' : 'true');
          ($('.follow__label', x) || x).textContent = on ? 'تابع الكاتبة' : 'تتابعها الان';
        });
      });
    });
  }

  /* 10. Echo ?q= into the page and toggle the filter panel on small screens */
  function query() {
    var q = new URL(location.href).searchParams.get('q');
    if (q) $$('[data-query]').forEach(function (el) { if (el.tagName === 'INPUT') el.value = q; else el.textContent = q; });
    $$('[data-filter-toggle]').forEach(function (b) {
      var panel = $(b.getAttribute('data-filter-toggle'));
      if (!panel) return;
      b.addEventListener('click', function () { var on = panel.classList.toggle('is-open'); b.setAttribute('aria-expanded', on ? 'true' : 'false'); });
    });
  }

  /* 11. Boards (الواح): a poster in a teal band lifts off the wall ---------
     It grows up from its base toward the reader and tilts after the pointer,
     the side under the pointer coming forward; the other boards in the band
     step back (CSS: .lift, .is-lifted, .has-lift). Mouse only, so touch and
     pen keep plain taps. With reduced motion it keeps the frame and the
     dimming but does not move. */
  function boards() {
    var fine = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 768px)');
    // leaning forward is capped lower than leaning back, so the rising top edge
    // does not climb into the text above the strip
    var TILT_X = 8, TILT_FWD = 3, TILT_BACK = 6, LIFT = 1.05;
    var stories = $$('.band .story').filter(function (s) { var f = s.firstElementChild; return f && f.classList.contains('poster'); });
    if (!stories.length) return;
    var epoch = 0;   // bumped on scroll/resize so a hovered board measures itself again, once
    var stale = function () { epoch++; };
    window.addEventListener('scroll', stale, { passive: true });
    window.addEventListener('resize', stale);
    stories.forEach(function (story) {
      var img = story.firstElementChild;
      story.classList.add('lift');
      var group = story.closest('.body') || story.parentNode;
      var cur = { x: 0, y: 0, s: 1 }, tgt = { x: 0, y: 0, s: 1 }, raf = 0, box = null, seen = -1;
      function measure() {
        var r = story.getBoundingClientRect();
        box = { cx: r.left + r.width / 2, hw: r.width / 2, cy: r.top + img.offsetTop + img.offsetHeight / 2, hh: img.offsetHeight / 2 || 1 };
        seen = epoch;
      }
      function frame() {
        cur.x += (tgt.x - cur.x) * 0.14;
        cur.y += (tgt.y - cur.y) * 0.14;
        cur.s += (tgt.s - cur.s) * 0.14;
        var settled = Math.abs(tgt.x - cur.x) < 0.02 && Math.abs(tgt.y - cur.y) < 0.02 && Math.abs(tgt.s - cur.s) < 0.0005;
        if (settled) { cur.x = tgt.x; cur.y = tgt.y; cur.s = tgt.s; }
        var rest = cur.s === 1 && !cur.x && !cur.y;
        img.style.transform = rest ? '' :
          'perspective(1000px) rotateX(' + cur.y.toFixed(2) + 'deg) rotateY(' + cur.x.toFixed(2) + 'deg) scale(' + cur.s.toFixed(4) + ')';
        if (rest) img.style.willChange = '';
        raf = settled ? 0 : requestAnimationFrame(frame);   // stops once it has settled
      }
      function kick() { if (!raf) raf = requestAnimationFrame(frame); }
      story.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse' || !fine.matches) return;
        clearTimeout(group._liftOff);
        story.classList.add('is-lifted');
        group.classList.add('has-lift');
        if (reduced.matches) return;
        measure();
        img.style.willChange = 'transform';   // only while it is in hand
        tgt.s = LIFT; kick();
      });
      story.addEventListener('pointermove', function (e) {
        if (!story.classList.contains('is-lifted') || reduced.matches) return;
        if (!box || seen !== epoch) measure();
        var nx = Math.max(-1, Math.min(1, (e.clientX - box.cx) / box.hw));
        var ny = Math.max(-1, Math.min(1, (e.clientY - box.cy) / box.hh));
        tgt.x = -nx * TILT_X;
        tgt.y = ny * (ny < 0 ? TILT_FWD : TILT_BACK);
        kick();
      });
      story.addEventListener('pointerleave', function () {
        if (!story.classList.contains('is-lifted')) return;
        story.classList.remove('is-lifted');
        tgt.x = 0; tgt.y = 0; tgt.s = 1; kick();
        // crossing the gap to the next board should not flash the others back to full
        group._liftOff = setTimeout(function () { if (!$('.is-lifted', group)) group.classList.remove('has-lift'); }, 90);
      });
    });
  }

  /* 12. Wedges are driven into the axis as they reach the reader ---------
     Marks already on screen play their CSS load animation; the ones below
     the fold are held back here and released when they scroll in. Blocks
     marked [data-grow] (bars) are released the same way. */
  function plant() {
    if (reduced.matches || !('IntersectionObserver' in window)) return;
    var land = function (es, obs) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        obs.unobserve(e.target);
      });
    };
    var io = new IntersectionObserver(land, { rootMargin: '0px 0px -12% 0px' });
    var edge = new IntersectionObserver(land);   // near the end of the page a mark can never climb 12% up the screen
    var fold = window.innerHeight, y = window.pageYOffset, end = document.documentElement.scrollHeight;
    // every read first, then every write, so the page lays out once
    var later = $$('.wedge,.ab-mark__art,[data-grow],.chapter').map(function (el) {
      var r = el.getClientRects().length ? el.getBoundingClientRect() : null;
      return r && r.top >= fold ? { el: el, nearEnd: end - (r.bottom + y) < fold * 0.3 } : null;
    }).filter(Boolean);
    later.forEach(function (m) { m.el.classList.add('is-waiting'); (m.nearEnd ? edge : io).observe(m.el); });
  }

  /* 13. Images fade in as they arrive instead of popping ----------------- */
  function images() {
    $$('img').forEach(function (im) {
      if (im.complete) return;
      im.classList.add('is-loading');
      var done = function () { im.classList.remove('is-loading'); };
      im.addEventListener('load', done, { once: true });
      im.addEventListener('error', done, { once: true });
    });
  }

  /* 14. Reading progress, a sand line along the top of the article -------
     It runs from the first chapter to the closing line. Where the browser has
     scroll timelines the compositor draws it and script only re-measures the
     range when layout can change; elsewhere a rAF-throttled scroll listener
     works from the same cached range. */
  function progress() {
    var toc = $('[data-toc]');
    if (!toc) return;
    var start = toc.closest('.section') || document.body, end = $('.closing') || start;
    var bar = document.createElement('div');
    bar.className = 'read-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var a = 0, b = 1;
    function measure() {
      var y = window.pageYOffset;
      a = Math.max(0, start.getBoundingClientRect().top + y - window.innerHeight * 0.2);
      b = Math.max(a + 1, end.getBoundingClientRect().bottom + y - window.innerHeight);
    }
    var timeline = window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()');
    var ticking = false;
    function draw() {
      ticking = false;
      var p = (window.pageYOffset - a) / (b - a);
      bar.style.transform = 'scaleX(' + Math.max(0, Math.min(1, p)).toFixed(4) + ')';
    }
    function remeasure() {
      measure();
      if (timeline) bar.style.animationRange = a + 'px ' + b + 'px';
      else draw();
    }
    if (timeline) bar.classList.add('is-timeline');
    else window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(draw); } }, { passive: true });
    window.addEventListener('resize', remeasure);
    window.addEventListener('load', remeasure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
    remeasure();
  }

  /* 15. Breaking news (عاجل) ----------------------------------------------
     <div class="ticker" data-ticker> with the headlines as links in
     .ticker__items. The headlines take turns; the CSS line on the current
     one is the clock (its animationend hands over), so every pause (hover,
     keyboard focus, off screen, hidden tab) is just animation-play-state, and
     the wedge beats once as each headline takes the lead. Below 1024px it is
     one slot with swipe, next and a "1 من 5" count; once the reader steps
     through it by hand it stops advancing on its own. With reduced motion
     nothing advances by itself. */
  function ticker() {
    var t = $('[data-ticker]');
    if (!t) return;
    var list = $('.ticker__items', t), items = $$('a', list), rail = $('.ticker__rail', t) || $('.rail', t);
    if (!list || items.length < 2 || !rail) return;
    var wide = window.matchMedia('(min-width: 1024px)');
    var DIR = document.documentElement.getAttribute('dir') === 'rtl' ? -1 : 1;
    var auto = !reduced.matches, hiddenTab = false, offscreen = false, i = 0;
    var live = $$('.ticker__live path', t);

    var ctrl = document.createElement('div');
    ctrl.className = 'ticker__ctrl';
    ctrl.innerHTML = '<span class="ticker__count" aria-hidden="true"></span>' +
      '<button class="ticker__btn" type="button" data-ticker-next aria-label="الخبر التالي"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>';
    rail.appendChild(ctrl);
    var count = $('.ticker__count', ctrl);

    // one heartbeat of the live wedge, with its echo
    function beat() {
      if (!auto || !live.length || !live[0].animate) return;
      live[1].animate([{ transform: 'none' }, { transform: 'scale(1.3)', offset: .22 }, { transform: 'scale(.94)', offset: .47 }, { transform: 'scale(1.14)', offset: .72 }, { transform: 'none' }], { duration: 820, easing: 'ease-out' });
      live[0].animate([{ opacity: .55, transform: 'none' }, { opacity: 0, transform: 'scale(3)' }], { duration: 1300, easing: EASE_OUT });
    }
    // the reader has taken the wheel: stop turning by itself
    function hold() { if (auto) { auto = false; t.classList.remove('is-auto'); } }
    function show(n) {
      n = (n + items.length) % items.length;
      if (n === i) return;
      var prev = items[i];
      prev.classList.remove('is-current', 'is-still');
      if (auto) prev.classList.add('is-leaving');
      i = n;
      items[i].classList.remove('is-leaving', 'is-still');
      items[i].classList.add('is-current');
      count.textContent = (i + 1) + ' من ' + items.length;
      beat();
    }

    t.classList.add('is-live');
    if (auto) t.classList.add('is-auto');
    items[0].classList.add('is-current', 'is-still');   // already on screen: no entrance for the first one
    count.textContent = '1 من ' + items.length;
    beat();
    $('[data-ticker-next]', ctrl).addEventListener('click', function () { hold(); show(i + 1); });

    list.addEventListener('animationend', function (e) {
      var name = e.animationName;
      if ((name === 'tick-run' || name === 'tick-run-x') && e.target === items[i]) show(i + 1);
      else if ((name === 'ink-out' || name === 'tick-out') && e.target.classList) e.target.classList.remove('is-leaving');
    });
    items.forEach(function (a, n) {
      a.addEventListener('mouseenter', function () { if (wide.matches) show(n); });   // the pointer takes the lead
      a.addEventListener('focus', function () { show(n); });                          // Tab walks the headlines, even in the single slot
    });

    // swipe on touch: toward the reading direction is "next"
    var sx = 0, sy = 0, swiped = false;
    list.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { sx = e.clientX; sy = e.clientY; swiped = false; } });
    list.addEventListener('pointerup', function (e) {
      if (e.pointerType === 'mouse') return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) { swiped = true; hold(); show(i + (dx * DIR < 0 ? 1 : -1)); }
    });
    list.addEventListener('click', function (e) { if (swiped) { e.preventDefault(); swiped = false; } }, true);

    // rest when nobody can see it
    var rest = function () { t.classList.toggle('is-offscreen', hiddenTab || offscreen); };
    document.addEventListener('visibilitychange', function () { hiddenTab = document.hidden; rest(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { offscreen = !es[0].isIntersecting; rest(); }).observe(t);
  }

  /* 16. Sticky header ------------------------------------------------------
     The header sticks with its brand row above the viewport, so only the
     sections row stays. Once the brand row is gone, that row brings a small
     logo and the search / menu buttons with it (CSS: .is-stuck). */
  function stickyHeader() {
    var h = $('[data-header]'), bar = h && $('.site-header__bar', h);
    if (!bar || !('IntersectionObserver' in window)) return;
    // the stuck bar ends exactly on the viewport's top edge, which still counts as touching
    new IntersectionObserver(function (es) { h.classList.toggle('is-stuck', !es[0].isIntersecting); }, { rootMargin: '-1px 0px 0px 0px' }).observe(bar);
  }

  /* 17. Popups --------------------------------------------------------------
     <button data-dialog-open="#id"> opens <dialog id="id" class="modal"> as a
     modal; [data-dialog-close] inside closes it, and so does a click on the
     veil. The native dialog keeps focus inside, closes on Esc and hands focus
     back to the button. */
  function dialogs() {
    $$('[data-dialog-open]').forEach(function (b) {
      var d = $(b.getAttribute('data-dialog-open'));
      if (d && d.showModal) b.addEventListener('click', function () { d.showModal(); });
    });
    $$('dialog.modal').forEach(function (d) {
      $$('[data-dialog-close]', d).forEach(function (b) { b.addEventListener('click', function () { d.close(); }); });
      d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    });
  }

  /* 18. خبر وتعليق: a post opens in a popup, its single page -----------------
     Each timeline post (li[data-news] with an id) carries everything the
     popup shows. The address gets #n-… so a post can be shared and opens on
     arrival; the arrows, and the arrow keys, walk the timeline inside it. */
  function newsModal() {
    var d = $('[data-news-modal]'), body = d && $('[data-news-body]', d), posts = $$('[data-news]');
    if (!body || !posts.length || !d.showModal) return;
    var DIR = document.documentElement.getAttribute('dir') === 'rtl' ? -1 : 1, at = 0;
    var el = function (tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
    function dayOf(p) { for (var n = p.previousElementSibling; n; n = n.previousElementSibling) if (n.classList.contains('tl__day')) return n.textContent; return ''; }
    function render(n, swap) {
      at = (n + posts.length) % posts.length;
      var p = posts[at], time = $('time', p), more = $('.post__more', p);
      body.textContent = '';
      var meta = el('p', 'nm__meta');
      meta.appendChild(el('b', '', $('.post__place', p).textContent));
      meta.appendChild(document.createTextNode(' — ' + time.textContent + '، ' + dayOf(p)));
      var h = el('h2', 'nm__news', $('.post__news', p).textContent); h.id = 'nm-title';
      var text = el('div', 'nm__text');
      if (more) $$('p', more).forEach(function (x) { text.appendChild(x.cloneNode(true)); });
      var c = el('div', 'nm__comment'), cc = el('div');
      c.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 52.46 69.13" width="30" height="40" aria-hidden="true"><path fill="#B9A779" d="M36.7,0C16.43,0,0,16.43,0,36.7v15.35h34.97s0,17.08,0,17.08c11.35-15.37,17.49-26.96,17.49-46.08V0h-15.76ZM34.97,34.97h-17.49c0-9.66,7.83-17.49,17.49-17.49v17.49Z"/></svg>');
      cc.appendChild(el('span', 'post__label', 'تعليق التحرير'));
      cc.appendChild(el('p', '', $('.post__comment p', p).textContent));
      c.appendChild(cc);
      var acts = el('div', 'nm__acts');
      if (more && $('a', more)) acts.appendChild($('a', more).cloneNode(true));
      $$('.post__acts [data-copy-link], .post__acts a', p).forEach(function (x) { acts.appendChild(x.cloneNode(true)); });
      [meta, h, text, c, acts].forEach(function (x) { body.appendChild(x); });
      history.replaceState(null, '', '#' + p.id);
      if (swap && !reduced.matches) { body.classList.remove('is-swap'); void body.offsetWidth; body.classList.add('is-swap'); d.scrollTop = 0; }
    }
    function open(n) { render(n); if (!d.open) d.showModal(); }
    posts.forEach(function (p, n) {
      $$('[data-news-open]', p).forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); open(n); }); });
    });
    $('[data-news-next]', d).addEventListener('click', function () { render(at + 1, true); });
    $('[data-news-prev]', d).addEventListener('click', function () { render(at - 1, true); });
    d.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var forward = (e.key === 'ArrowLeft') === (DIR === -1);   // "forward" follows the reading direction
      render(at + (forward ? 1 : -1), true);
    });
    d.addEventListener('close', function () { history.replaceState(null, '', location.pathname + location.search); });
    function fromHash() { for (var k = 0; k < posts.length; k++) if ('#' + posts[k].id === location.hash) { open(k); return; } }
    window.addEventListener('hashchange', fromHash);   // a link to another post on this same page
    fromHash();
  }

  /* 19. Copy a link: [data-copy-link="#id"] copies this page's address with
     that anchor, and says so for a moment. */
  function copyLinks() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-copy-link]');
      if (!b || !navigator.clipboard) return;
      var label = $('span', b) || b;
      if (!b.hasAttribute('data-label')) b.setAttribute('data-label', label.textContent);
      navigator.clipboard.writeText(location.href.split('#')[0] + b.getAttribute('data-copy-link')).then(function () {
        b.classList.add('is-done'); label.textContent = 'تم نسخ الرابط';
        clearTimeout(b._t);
        b._t = setTimeout(function () { b.classList.remove('is-done'); label.textContent = b.getAttribute('data-label'); }, 1600);
      }, function () {});
    });
  }

  /* 20. Archive by date -------------------------------------------------------
     Year tabs switch the month grid in place, under a sliding sand line, and
     the months step in. A month (from the grid, the jump form or ?y=&m=) is
     underlined, titled with its count, and its group on the page is opened
     and brought into view. Links marked [data-year-jump] (the years band)
     open their year here. On the server the same ?y=&m= renders that month;
     the static demo only holds Sep–Jul 2026. */
  function archiveNav() {
    var root = $('[data-arcal]');
    if (!root) return;
    var tabsEls = $$('[data-year]', root), grids = $$('[data-year-grid]', root);
    var years = $('.arcal__years', root), moveInk = years ? tabInk(years) : function () {};
    function showYear(y, animate) {
      var hit = grids.filter(function (g) { return g.getAttribute('data-year-grid') === String(y); })[0];
      if (!hit) return false;
      grids.forEach(function (g) { g.hidden = g !== hit; });
      tabsEls.forEach(function (t) {
        var on = t.getAttribute('data-year') === String(y);
        t.classList.toggle('is-active', on);
        if (on) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
      });
      moveInk();
      if (animate && !reduced.matches) $$('.arcal__m', hit).forEach(function (c, i) {
        if (c.animate) c.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: i * 28, easing: EASE_OUT, fill: 'backwards' });
      });
      return true;
    }
    function pick(y) {
      if (!showYear(y, true)) return false;
      var u = new URL(location.href); u.searchParams.set('y', y); u.searchParams.delete('m'); history.replaceState(null, '', u);
      return true;
    }
    tabsEls.forEach(function (t) {
      t.addEventListener('click', function (e) { e.preventDefault(); pick(t.getAttribute('data-year')); });
    });
    $$('[data-year-jump]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (!pick(a.getAttribute('data-year-jump'))) return;   // a year the page does not hold: follow the link
        e.preventDefault();
        (root.closest('.section') || root).scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
        var t = $('.tab.is-active', root);
        if (t) t.focus({ preventScroll: true });
      });
    });
    var q = new URL(location.href).searchParams, y = parseInt(q.get('y'), 10), m = parseInt(q.get('m'), 10);
    if (!y || !showYear(y)) return;
    var ys = $('select[name="y"]', root), ms = $('select[name="m"]', root);
    if (ys) ys.value = String(y);
    if (!(m >= 1 && m <= 12)) return;
    if (ms) ms.value = String(m);
    var cell = $$('.arcal__m', $('[data-year-grid="' + y + '"]', root))[m - 1];
    if (!cell) return;
    cell.setAttribute('aria-current', 'true');
    var n = parseInt($('.arcal__n', cell).textContent, 10) || 0;
    var unit = n === 0 ? 'لا مواد في هذا الشهر' : n === 1 ? 'مادة واحدة' : n === 2 ? 'مادتان' : n + (n > 10 ? ' مادة' : ' مواد');
    var result = $('[data-arcal-result]', root);
    $('[data-arcal-title]', result).textContent = $('.arcal__name', cell).textContent + ' ' + y;
    $('[data-arcal-count]', result).textContent = unit;
    result.hidden = false;
    var group = $('[data-key="' + y + '-' + (m < 10 ? '0' : '') + m + '"]');
    if (!group) { if (n) $('[data-arcal-empty]', root).hidden = false; return; }
    group.classList.add('is-picked');
    if (group.getAttribute('data-open') === 'false') { var tg = $('[data-month-toggle]', group); if (tg) tg.click(); }
    setTimeout(function () { group.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' }); }, 250);
  }

  /* 21. ثورة ويكي register (home) ------------------------------------------
     [data-wiki] holds year links [data-wiki-year][data-wiki-total], a search box
     [data-wiki-search] and a table of rows tr[data-year][data-img?]. A year
     shows its rows; typing searches every year (أ/إ/آ, ة/ه and ى/ي match each
     other). The row under the pointer or focus is shown in [data-wiki-preview]:
     its poster, or an index card built from the row when it has none. With
     real data, the year links render server-side and the search can query. */
  function wikiRegister() {
    var root = $('[data-wiki]');
    if (!root) return;
    var rows = $$('tbody tr[data-year]', root), chips = $$('[data-wiki-year]', root);
    var input = $('[data-wiki-search]', root), count = $('[data-wiki-count]', root), empty = $('[data-wiki-empty]', root);
    var pv = $('[data-wiki-preview]', root), frame = pv && $('.wk-preview__frame', pv), meta = pv && $('.wk-preview__meta', pv);
    if (!rows.length || !chips.length) return;
    var fine = window.matchMedia('(hover: hover)');
    var active = chips.filter(function (c) { return c.classList.contains('is-active'); })[0] || chips[0];
    var year = active.getAttribute('data-wiki-year'), q = '';
    var shownRow = rows.filter(function (r) { return !r.hidden; })[0] || null;
    var FOLD = { 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ة': 'ه', 'ى': 'ي', 'ؤ': 'و', 'ئ': 'ي' };
    var norm = function (s) { return s.replace(/[أإآةىؤئ]/g, function (ch) { return FOLD[ch]; }).replace(/[ً-ْ]/g, '').toLowerCase(); };
    var entries = function (n) { return n === 1 ? 'مدخل واحد' : n === 2 ? 'مدخلان' : n <= 10 ? n + ' مداخل' : n + ' مدخلا'; };
    var results = function (n) { return n === 1 ? 'نتيجة واحدة' : n === 2 ? 'نتيجتان' : n <= 10 ? n + ' نتائج' : n + ' نتيجة'; };
    var el = function (tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };

    function card(d) {
      var c = el('div', 'wk-card');
      c.appendChild(el('span', 'wk-card__label', 'ثورة ويكي'));
      c.appendChild(el('b', 'wk-card__n', d.n));
      c.appendChild(el('span', 'wk-card__type', d.type));
      c.appendChild(el('span', 'wk-card__title', d.title));
      c.appendChild(el('span', 'wk-card__by', d.author + ' — ' + d.year));
      c.insertAdjacentHTML('beforeend', '<svg class="wk-card__mark" viewBox="0 0 52.46 69.13" aria-hidden="true"><path d="M36.7,0C16.43,0,0,16.43,0,36.7v15.35h34.97s0,17.08,0,17.08c11.35-15.37,17.49-26.96,17.49-46.08V0h-15.76ZM34.97,34.97h-17.49c0-9.66,7.83-17.49,17.49-17.49v17.49Z"/></svg>');
      return c;
    }
    function preview(r) {
      rows.forEach(function (x) { x.classList.toggle('is-previewed', x === r); });
      if (!pv) return;
      pv.classList.toggle('is-empty', !r);   // nothing matches: the last entry steps back instead of standing in for a result
      if (!r || r === shownRow) return;
      shownRow = r;
      var cells = r.cells, a = $('a', r), img = r.getAttribute('data-img');
      var d = { n: cells[0].textContent, type: cells[1].textContent, title: a.textContent, author: cells[3].textContent, year: r.getAttribute('data-year') };
      frame.setAttribute('href', a.getAttribute('href'));
      frame.textContent = '';
      if (img) {
        var im = el('img', 'poster'); im.alt = ''; im.width = 540; im.height = 960; im.src = img;
        frame.appendChild(im);
      } else frame.appendChild(card(d));
      meta.children[0].textContent = 'المدخل ' + d.n + ' — ' + d.type;
      meta.children[1].textContent = d.title;
      meta.children[2].textContent = d.author + ' · ' + d.year;
      if (!reduced.matches) { pv.classList.remove('is-swap'); void pv.offsetWidth; pv.classList.add('is-swap'); }
    }
    function apply(animate) {
      var term = norm(q.trim()), shown = [];
      rows.forEach(function (r) {
        var ok = term ? norm(r.textContent).indexOf(term) !== -1 : r.getAttribute('data-year') === year;
        r.hidden = !ok;
        if (ok) shown.push(r);
      });
      chips.forEach(function (c) {
        var on = !term && c.getAttribute('data-wiki-year') === year;
        c.classList.toggle('is-active', on);
        if (on) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current');
      });
      count.textContent = '';
      if (term && shown.length) {
        count.appendChild(el('b', '', results(shown.length)));
        count.appendChild(document.createTextNode(' في كل السنوات'));
      } else if (!term) {
        var chip = chips.filter(function (c) { return c.getAttribute('data-wiki-year') === year; })[0];
        var total = parseInt(chip.getAttribute('data-wiki-total'), 10) || shown.length;
        count.appendChild(el('b', '', entries(total)));
        count.appendChild(document.createTextNode(' في ' + year + (total > shown.length ? '، هذه احدثها' : '')));
        if (total > shown.length) { var all = el('a', '', 'عرض الكل'); all.href = chip.getAttribute('href'); count.appendChild(document.createTextNode(' — ')); count.appendChild(all); }
      }
      if (empty) { empty.hidden = shown.length !== 0; $('[data-wiki-q]', empty).textContent = q.trim(); }
      if (animate && !reduced.matches) shown.slice(0, 8).forEach(function (r, i) {
        if (r.animate) r.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, delay: i * 40, easing: EASE_OUT, fill: 'backwards' });
      });
      preview(shown[0] || null);
    }
    function reset(focus) { if (input) input.value = ''; q = ''; apply(true); if (focus && input) input.focus(); }

    chips.forEach(function (c) {
      c.addEventListener('click', function (e) {
        e.preventDefault();
        year = c.getAttribute('data-wiki-year');
        reset(false);
      });
    });
    if (input) {
      input.addEventListener('input', function () { q = input.value; apply(false); });
      input.addEventListener('keydown', function (e) { if (e.key === 'Escape' && input.value) { e.stopPropagation(); reset(false); } });
    }
    $$('[data-wiki-clear]', root).forEach(function (b) { b.addEventListener('click', function () { reset(true); }); });
    rows.forEach(function (r) {
      r.addEventListener('mouseenter', function () { if (fine.matches) preview(r); });
      r.addEventListener('focusin', function () { preview(r); });
    });
    rows.forEach(function (x) { x.classList.toggle('is-previewed', x === shownRow); });
  }

  /* 22. Archive: filter by section and type (demo) --------------------------
     The القسم / النوع chips ([data-archive-filter] > [data-value]) filter the
     month rows by their kicker ("سياسة — تحليل"), and ?section= / ?type=
     arrive from links such as "كل مداخل ثورة ويكي". With real data, send the
     same parameters to the server instead. */
  function archiveFilter() {
    var groups = $$('[data-archive-filter]');
    if (!groups.length) return;
    var rows = $$('.month .arow'), state = {}, params = new URL(location.href).searchParams;
    rows.forEach(function (r) {
      var k = $('.kicker', r), parts = k ? k.textContent.split('—') : [];
      r.setAttribute('data-section', (parts[0] || '').trim());
      r.setAttribute('data-type', (parts[1] || '').trim());
    });
    var box = groups[0].closest('.arcal__filters') || groups[0].parentNode;
    var note = document.createElement('p');
    note.className = 'arcal__note';
    note.setAttribute('aria-live', 'polite');
    note.hidden = true;
    box.appendChild(note);
    function mark() {
      groups.forEach(function (g) {
        var k = g.getAttribute('data-archive-filter');
        $$('[data-value]', g).forEach(function (b) {
          var on = b.getAttribute('data-value') === (state[k] || '');
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      });
    }
    function apply() {
      var any = !!(state.section || state.type), total = 0;
      rows.forEach(function (r) {
        var ok = (!state.section || r.getAttribute('data-section') === state.section) && (!state.type || r.getAttribute('data-type') === state.type);
        r.setAttribute('data-hidden', ok ? 'false' : 'true');
        if (ok) total++;
      });
      $$('.ar-strip').forEach(function (s) { s.setAttribute('data-hidden', any ? 'true' : 'false'); });
      $$('.month').forEach(function (m) {
        var body = $('.month__body', m);
        if (!body) return;
        var none = $('.month__none', body);
        if (!none) { none = document.createElement('p'); none.className = 'month__none'; none.textContent = 'لا مواد بهذا التصنيف في هذا الشهر.'; body.insertBefore(none, body.firstChild); }
        none.hidden = !any || $$('.arow', body).some(function (r) { return r.getAttribute('data-hidden') !== 'true'; });
      });
      note.hidden = !any;
      if (any) {
        note.textContent = '';
        var b = document.createElement('b');
        b.textContent = [state.section, state.type].filter(Boolean).join(' — ');
        note.appendChild(b);
        note.appendChild(document.createTextNode('، ' + total + (total === 1 ? ' مادة' : total === 2 ? ' مادتان' : total <= 10 ? ' مواد' : ' مادة') + ' في الشهور المعروضة. '));
        var clear = document.createElement('button');
        clear.type = 'button'; clear.className = 'link-quiet'; clear.textContent = 'امسح التصفية';
        clear.addEventListener('click', function () { state = {}; mark(); apply(); });
        note.appendChild(clear);
      }
      var u = new URL(location.href);
      ['section', 'type'].forEach(function (k) { if (state[k]) u.searchParams.set(k, state[k]); else u.searchParams.delete(k); });
      history.replaceState(null, '', u);
    }
    groups.forEach(function (g) {
      g.addEventListener('click', function (e) {
        var b = e.target.closest('[data-value]');
        if (!b) return;
        state[g.getAttribute('data-archive-filter')] = b.getAttribute('data-value');
        mark(); apply();
      });
    });
    state.section = params.get('section') || '';
    state.type = params.get('type') || '';
    mark(); apply();
  }

  /* 23. Article: the page axis fills with sand down to where the reader is ------
     [data-axis-fill] sits on the axis. Its end follows the middle of the
     screen, from the first screen to the end of the page. Scroll timelines
     run it on the compositor; elsewhere a rAF-throttled listener does the
     same from numbers measured once. */
  function axisFill() {
    var f = $('[data-axis-fill]');
    if (!f) return;
    var box = f.parentNode, top = 0, H = 1, vh = 1, ticking = false;
    var timeline = window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()');
    function draw() {
      ticking = false;
      var p = (window.pageYOffset + vh * 0.5 - top) / H;
      f.style.transform = 'scaleY(' + Math.max(0, Math.min(1, p)).toFixed(4) + ')';
    }
    function measure() {
      var r = box.getBoundingClientRect(), y = window.pageYOffset;
      top = r.top + y; H = r.height || 1; vh = window.innerHeight;
      var max = Math.max(1, document.documentElement.scrollHeight - vh);
      var clamp = function (v) { return Math.max(0, Math.min(1, v)).toFixed(4); };
      if (timeline) {
        f.style.setProperty('--from', clamp((vh * 0.5 - top) / H));
        f.style.setProperty('--to', clamp((max + vh * 0.5 - top) / H));
      } else draw();
    }
    if (timeline) f.classList.add('is-timeline');
    else window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(draw); } }, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    measure();
  }

  /* 24. Figures tally up as they come into view -----------------------------
     [data-count] holds the final figure ("1.246", "-62"). The visible number
     counts from 0 with the same decimals and sign; assistive tech reads the
     final figure from a hidden copy the whole time. */
  function counters() {
    var els = $$('[data-count]');
    if (!els.length || reduced.matches || !('IntersectionObserver' in window)) return;
    function run(el) {
      var shown = $('.count-anim', el), final = el.getAttribute('data-final'), v = parseFloat(final);
      var dec = (final.split('.')[1] || '').length, t0 = null, D = 1400;
      function step(t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / D), n = v * (1 - Math.pow(1 - k, 3));
        if (Math.abs(n) < Math.pow(10, -dec) / 2) n = 0;
        shown.textContent = k < 1 ? n.toFixed(dec) : final;
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting) return; io.unobserve(e.target); run(e.target); });
    }, { threshold: 0.6 });
    els.forEach(function (el) {
      var final = el.textContent.trim(), dec = (final.split('.')[1] || '').length;
      el.setAttribute('data-final', final);
      el.textContent = '';
      var a = document.createElement('span'); a.className = 'count-anim'; a.setAttribute('aria-hidden', 'true'); a.textContent = (0).toFixed(dec);
      var r = document.createElement('span'); r.className = 'sr-only'; r.textContent = final;
      el.appendChild(a); el.appendChild(r);
      io.observe(el);
    });
  }

  /* 25. Ink: the thesis and the closing line darken word by word as they are
     read. [data-ink] paragraphs are split into words, inside any inline
     element they hold (a phrase in sand stays in sand); the scroll drives
     them where the browser has view timelines, and they fade in turn as the
     paragraph arrives elsewhere. */
  function inkWords() {
    var els = $$('[data-ink]');
    if (!els.length || reduced.matches) return;
    var timeline = window.CSS && CSS.supports && CSS.supports('animation-timeline: view()');
    var io = !timeline && 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -25% 0px' }) : null;
    function split(node, n) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 1) { split(ch, n); return; }
        if (ch.nodeType !== 3) return;
        var frag = document.createDocumentFragment();
        ch.nodeValue.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var s = document.createElement('span');
          s.className = 'iw'; s.style.setProperty('--i', n.i++); s.textContent = part;
          frag.appendChild(s);
        });
        node.replaceChild(frag, ch);
      });
    }
    els.forEach(function (el) {
      if (el.querySelector('.iw')) return;
      var n = { i: 0 };
      split(el, n);
      el.style.setProperty('--n', n.i);
      if (timeline) el.classList.add('is-inked');
      else if (io) { el.classList.add('is-inked-io'); io.observe(el); }
    });
  }

  /* 26. Citations preview their source -----------------------------------------
     .cite > a[href="#src-N"] shows that source in a small panel on hover or
     keyboard focus; a click jumps to it in the sources list, which flashes
     (CSS :target). */
  function cites() {
    var links = $$('.cite a[href^="#src-"]');
    if (!links.length) return;
    var pop = document.createElement('div'), current = null;
    pop.className = 'cite-pop'; pop.id = 'cite-pop'; pop.hidden = true; pop.setAttribute('role', 'tooltip');
    document.body.appendChild(pop);
    function show(a) {
      var src = document.getElementById(a.getAttribute('href').slice(1));
      if (!src) return;
      pop.textContent = '';
      var b = document.createElement('b'); b.textContent = 'المصدر ' + a.textContent;
      pop.appendChild(b); pop.appendChild(document.createTextNode(src.textContent));
      pop.hidden = false;
      if (current && current !== a) current.classList.remove('is-open');
      current = a; a.classList.add('is-open'); a.setAttribute('aria-describedby', 'cite-pop');
      var r = a.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight, vw = document.documentElement.clientWidth;
      var top = r.top - h - 10;
      if (top < 80) top = r.bottom + 10;   // under the sticky header there is no room above
      pop.style.left = Math.max(16, Math.min(vw - w - 16, r.left + r.width / 2 - w / 2)) + 'px';
      pop.style.top = top + 'px';
    }
    function hide() {
      if (!current) return;
      pop.hidden = true; current.classList.remove('is-open'); current.removeAttribute('aria-describedby'); current = null;
    }
    links.forEach(function (a) {
      a.addEventListener('mouseenter', function () { show(a); });
      a.addEventListener('mouseleave', hide);
      a.addEventListener('focus', function () { show(a); });
      a.addEventListener('blur', hide);
      a.addEventListener('click', hide);
    });
    window.addEventListener('scroll', hide, { passive: true });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
  }

  /* 27. Quote a passage: select text in the article to post it or copy it with
     the title and address. Pointer devices only; phones keep their own menu. */
  function quoteShare() {
    var scope = $$('.art-body, .prose, .statement, .closing');
    if (!scope.length || !window.getSelection || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var h1 = $('h1'), title = h1 ? (h1.getAttribute('aria-label') || h1.textContent).trim() : document.title, text = '';
    var bar = document.createElement('div');
    bar.className = 'quote-bar'; bar.hidden = true; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'الاقتباس');
    bar.innerHTML = '<button type="button" data-q="x"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>اقتبس على اكس</button>' +
      '<button type="button" data-q="copy"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8h11v11H8z"/><path d="M5 16V5h11"/></svg><span>انسخ الاقتباس</span></button>';
    document.body.appendChild(bar);
    var within = function (n) { return n && scope.some(function (s) { return s.contains(n); }); };
    function place() {
      var sel = window.getSelection();
      if (!sel.rangeCount || sel.isCollapsed) { bar.hidden = true; return; }
      var t = sel.toString().replace(/\s+/g, ' ').trim();
      if (t.length < 12 || t.length > 320 || !within(sel.anchorNode) || !within(sel.focusNode)) { bar.hidden = true; return; }
      text = t;
      var r = sel.getRangeAt(0).getBoundingClientRect();
      bar.hidden = false;
      var w = bar.offsetWidth, vw = document.documentElement.clientWidth;
      bar.style.left = Math.max(w / 2 + 12, Math.min(vw - w / 2 - 12, r.left + r.width / 2)) + 'px';
      bar.style.top = Math.max(r.top, 120) + 'px';
    }
    document.addEventListener('mouseup', function () { setTimeout(place, 10); });
    document.addEventListener('keyup', function (e) { if (e.shiftKey) place(); });
    document.addEventListener('selectionchange', function () { var s = window.getSelection(); if (!s || s.isCollapsed) bar.hidden = true; });
    window.addEventListener('scroll', function () { bar.hidden = true; }, { passive: true });
    bar.addEventListener('mousedown', function (e) { e.preventDefault(); });   // keep the selection while pressing
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-q]');
      if (!b) return;
      var quote = '«' + text + '»', url = location.href.split('#')[0];
      if (b.getAttribute('data-q') === 'x') {
        window.open('https://x.com/intent/post?text=' + encodeURIComponent(quote + ' — ' + title) + '&url=' + encodeURIComponent(url), '_blank', 'noopener');
        bar.hidden = true;
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(quote + '\n— ' + title + '، وتد\n' + url).then(function () {
          var s = $('span', b); s.textContent = 'تم النسخ';
          setTimeout(function () { s.textContent = 'انسخ الاقتباس'; bar.hidden = true; }, 1200);
        }, function () {});
      }
    });
  }

  /* 28. Time left, under the contents -------------------------------------------
     Counted from the article's words (about 180 a minute) and the reading
     position between the first chapter and the closing line. */
  function timeLeft() {
    var out = $('[data-time-left]'), toc = $('[data-toc]');
    if (!out || !toc) return;
    var words = 0;
    $$('.prose p, .closing p, .statement').forEach(function (p) { if (!p.closest('.statement') || p.classList.contains('statement')) words += p.textContent.trim().split(/\s+/).length; });
    var total = Math.max(1, Math.round(words / 180)), start = toc.closest('.section') || document.body, end = $('.closing') || start;
    var a = 0, b = 1, last = '', ticking = false;
    var minutes = function (n) { return n === 1 ? 'دقيقة' : n === 2 ? 'دقيقتان' : n <= 10 ? n + ' دقائق' : n + ' دقيقة'; };
    function measure() {
      var y = window.pageYOffset;
      a = Math.max(0, start.getBoundingClientRect().top + y - window.innerHeight * 0.2);
      b = Math.max(a + 1, end.getBoundingClientRect().bottom + y - window.innerHeight);
      draw();
    }
    function draw() {
      ticking = false;
      var p = Math.max(0, Math.min(1, (window.pageYOffset - a) / (b - a)));
      var txt = p < 0.02 ? 'قراءة ' + minutes(total) : p > 0.97 ? 'انتهيت من القراءة' : 'بقي نحو ' + minutes(Math.max(1, Math.ceil(total * (1 - p))));
      if (txt !== last) { out.textContent = txt; last = txt; }
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(draw); } }, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    measure();
  }

  /* 29. Share links take the page's real address and title */
  function shareLinks() {
    var links = $$('[data-share]');
    if (!links.length) return;
    var url = location.href.split('#')[0], h1 = $('h1'), title = h1 ? (h1.getAttribute('aria-label') || h1.textContent).trim() : document.title;
    links.forEach(function (a) {
      var k = a.getAttribute('data-share');
      if (k === 'x') a.href = 'https://x.com/intent/post?text=' + encodeURIComponent(title) + '&url=' + encodeURIComponent(url);
      if (k === 'telegram') a.href = 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(title);
    });
  }

  /* 30. Lists that filter, sort and page in place (demo) ------------------------
     [data-works] holds [data-works-filter] tabs, optional [data-works-sort]
     chips, a [data-works-list] of rows with data-date and the attribute named
     by data-works-by ("section" unless set), and an optional [data-works-pager].
     data-works-per sets the rows a page, 8 unless set; 0 leaves paging to the
     server and its own pager. The chosen tab is underlined by one sand line
     that slides between tabs. The state is kept in ?section= (or ?type= …)
     &sort=&page=, which is also what the server should read when the list is
     real; tabs may be links to that address, and then work without script.
     Blocks marked [data-works-all] show only while no filter is on: an
     editors' pick between the tabs and the list steps aside so the result sits
     under the tabs, and the server's pager for the whole section goes with it. */
  function worksList() {
    $$('[data-works]').forEach(function (root) {
      var list = $('[data-works-list]', root), rows = list ? $$(':scope > [data-date]', list) : [], tabsBox = $('.works-tabs', root);
      var filters = $$('[data-works-filter]', root), sorts = $$('[data-works-sort]', root);
      var pager = $('[data-works-pager]', root), countEl = $('[data-works-count]', root), leads = $$('[data-works-all]', root);
      if (!rows.length) return;
      var BY = root.getAttribute('data-works-by') || 'section';
      var PER = parseInt(root.getAttribute('data-works-per') || '8', 10) || 0, q = new URL(location.href).searchParams;
      var valid = function (v) { return filters.some(function (b) { return (b.getAttribute('data-works-filter') || '') === v; }); };
      var state = { key: valid(q.get(BY) || '') ? q.get(BY) || '' : '', sort: q.get('sort') === 'old' ? 'old' : 'new', page: PER ? Math.max(1, parseInt(q.get('page'), 10) || 1) : 1 };
      var amount = function (n) { return n === 1 ? 'مادة واحدة' : n === 2 ? 'مادتان' : n <= 10 ? n + ' مواد' : n + ' مادة'; };
      var here = location.pathname.split('/').pop() || 'index.html';

      var moveInk = tabsBox ? tabInk(tabsBox) : function () {};
      function mark(b, on) {
        b.classList.toggle('is-active', on);
        if (b.tagName === 'A') { if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); }
        else b.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
      function link(label, page, cls, current) {
        var a = document.createElement('a'), u = new URL(location.href);
        u.searchParams.set('page', page);
        a.href = here + u.search; a.textContent = label; a.setAttribute('data-page', page);
        if (cls) a.className = cls;
        if (current) a.setAttribute('aria-current', 'page');
        return a;
      }
      function buildPager(pages) {
        if (!pager || !PER) return;
        pager.textContent = '';
        if (state.page > 1) pager.appendChild(link('السابق', state.page - 1, 'pager__prev'));
        else { var d = document.createElement('span'); d.className = 'pager__prev'; d.setAttribute('aria-disabled', 'true'); d.textContent = 'السابق'; pager.appendChild(d); }
        for (var i = 1; i <= pages; i++) pager.appendChild(link(String(i), i, '', i === state.page));
        if (state.page < pages) pager.appendChild(link('التالي', state.page + 1, 'pager__next'));
        var info = document.createElement('span'); info.className = 'pager__info'; info.textContent = 'الصفحة ' + state.page + ' من ' + pages;
        pager.appendChild(info);
      }
      function render(animate, scroll) {
        var pool = rows.filter(function (r) { return !state.key || r.getAttribute('data-' + BY) === state.key; });
        pool.sort(function (a, b) { var x = a.getAttribute('data-date'), y = b.getAttribute('data-date'); return (x < y ? 1 : x > y ? -1 : 0) * (state.sort === 'new' ? 1 : -1); });
        var pages = PER ? Math.max(1, Math.ceil(pool.length / PER)) : 1;
        state.page = Math.min(state.page, pages);
        var shown = PER ? pool.slice((state.page - 1) * PER, state.page * PER) : pool;
        pool.forEach(function (r) { list.appendChild(r); });
        rows.forEach(function (r) { r.setAttribute('data-hidden', shown.indexOf(r) === -1 ? 'true' : 'false'); });
        filters.forEach(function (b) { mark(b, (b.getAttribute('data-works-filter') || '') === state.key); });
        sorts.forEach(function (b) { mark(b, b.getAttribute('data-works-sort') === state.sort); });
        if (countEl) countEl.textContent = amount(pool.length);
        leads.forEach(function (el) {
          var was = el.getAttribute('data-hidden') === 'true';
          el.setAttribute('data-hidden', state.key ? 'true' : 'false');
          if (was && !state.key && animate) reveal([el]);
        });
        buildPager(pages);
        moveInk();
        if (animate && !reduced.matches) shown.forEach(function (r, i) {
          r.classList.add('is-in');   // a filtered row is shown now, whatever the scroll reveal was waiting for
          if (r.animate) r.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: Math.min(i, 8) * 45, easing: EASE_OUT, fill: 'backwards' });
        });
        var u = new URL(location.href);
        [[BY, state.key], ['sort', state.sort === 'new' ? '' : 'old'], ['page', PER && state.page > 1 ? state.page : '']].forEach(function (kv) {
          if (kv[1]) u.searchParams.set(kv[0], kv[1]); else u.searchParams.delete(kv[0]);
        });
        history.replaceState(null, '', u);
        if (scroll) (list.closest('.section') || root).scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
      }
      filters.forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.preventDefault();
          var v = b.getAttribute('data-works-filter') || '';
          if (v === state.key) return;
          state.key = v; state.page = 1; render(true, false);
        });
      });
      sorts.forEach(function (b) { b.addEventListener('click', function () { if (state.sort === b.getAttribute('data-works-sort')) return; state.sort = b.getAttribute('data-works-sort'); state.page = 1; render(true, false); }); });
      if (pager && PER) pager.addEventListener('click', function (e) {
        var a = e.target.closest('[data-page]');
        if (!a) return;
        e.preventDefault();
        state.page = parseInt(a.getAttribute('data-page'), 10) || 1;
        render(true, true);
      });
      render(false, false);
    });
  }

  /* 31. Lists arrive: rows and cards below the fold rise into place as they
     reach the reader, a beat apart when several come in together. Children of
     [data-arrive]; nothing is hidden unless this has run. */
  function arrive() {
    if (reduced.matches || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      var k = 0;
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.setProperty('--k', Math.min(k++, 6));
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    var fold = window.innerHeight, items = [];
    $$('[data-arrive]').forEach(function (box) { items = items.concat(Array.prototype.slice.call(box.children)); });
    // every read first, then every write, so the page lays out once
    items.filter(function (el) { return el.getClientRects().length && el.getBoundingClientRect().top >= fold; })
      .forEach(function (el) { el.classList.add('is-waiting'); io.observe(el); });
  }

  /* 32. Search: the words searched for are marked in the results -----------------
     Titles and deks under [data-results] get <mark class="hit"> around each
     word of the query (?q=, or the page's own), with أ/إ/آ, ة/ه and ى/ي
     matching each other. The server can print the same marks instead. */
  function hits() {
    var box = $('[data-results]');
    if (!box) return;
    var h = $('h1[data-query]'), q = new URL(location.href).searchParams.get('q') || (h ? h.textContent : '');
    var FOLD = { 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ة': 'ه', 'ى': 'ي', 'ؤ': 'و', 'ئ': 'ي' };
    var fold = function (s) { return s.replace(/[أإآةىؤئ]/g, function (c) { return FOLD[c]; }); };   // one letter for one, so positions hold
    var words = fold(q.trim()).split(/\s+/).filter(function (w) { return w.length > 1; });
    if (!words.length) return;
    var re = new RegExp(words.map(function (w) { return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|'), 'g');
    $$('.story__title, .dek', box).forEach(function (el) {
      var walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [];
      while (walk.nextNode()) nodes.push(walk.currentNode);
      nodes.forEach(function (node) {
        var text = node.nodeValue, f = fold(text), m, last = 0, frag = null;
        re.lastIndex = 0;
        while ((m = re.exec(f))) {
          frag = frag || document.createDocumentFragment();
          if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          var mark = document.createElement('mark');
          mark.className = 'hit'; mark.textContent = text.slice(m.index, m.index + m[0].length);
          frag.appendChild(mark);
          last = m.index + m[0].length;
        }
        if (!frag) return;
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      });
    });
  }

  /* 33. خبر وتعليق: the days beside the timeline ------------------------------------
     [data-tl-days] links to each day (li.tl__day[id]). The day whose posts
     cross the middle of the screen is marked; a click glides to that day's
     first post, clear of the sticky header and the day label. */
  function newsDays() {
    var nav = $('[data-tl-days]');
    if (!nav) return;
    var links = $$('a[href^="#"]', nav), items = $$('.tl__item');
    var dayOf = function (it) { for (var n = it.previousElementSibling; n; n = n.previousElementSibling) if (n.classList.contains('tl__day')) return n.id; return ''; };
    function mark(id) {
      if (!id) return;
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) mark(dayOf(e.target)); });
      }, { rootMargin: '-38% 0px -58% 0px' });
      items.forEach(function (it) { io.observe(it); });
    }
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var day = document.getElementById(a.getAttribute('href').slice(1)), first = day && day.nextElementSibling;
        if (!first) return;
        e.preventDefault();
        var head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--stick-h')) || 46;
        window.scrollTo({ top: first.getBoundingClientRect().top + window.pageYOffset - head - day.offsetHeight - 18, behavior: reduced.matches ? 'auto' : 'smooth' });
        mark(day.id);
        history.replaceState(null, '', '#' + day.id);   // replace, not assign: a hash change would reach the post popup
      });
    });
  }

  /* 34. About: the mark, part by part ----------------------------------------------
     Pointing at (or focusing) a [data-part] beside the logo sets data-show on
     .ab-mark, and CSS brings that part forward while the rest steps back. */
  function markParts() {
    $$('.ab-mark').forEach(function (m) {
      $$('[data-part]', m).forEach(function (el) {
        var on = function () { m.setAttribute('data-show', el.getAttribute('data-part')); };
        var off = function () { if (m.getAttribute('data-show') === el.getAttribute('data-part')) m.removeAttribute('data-show'); };
        el.addEventListener('pointerenter', on); el.addEventListener('pointerleave', off);
        el.addEventListener('focus', on); el.addEventListener('blur', off);
      });
    });
  }

  /* 35. Writers: find a writer by name or field as you type ---------------------------
     [data-writers] holds a [data-writers-search] input and cards [data-writer]
     (name and field). أ/إ/آ, ة/ه and ى/ي match each other and short vowels are
     ignored; [data-writers-count] and [data-writers-empty] follow the result. */
  function writersFind() {
    $$('[data-writers]').forEach(function (root) {
      var input = $('[data-writers-search]', root), cards = $$('[data-writer]', root);
      var count = $('[data-writers-count]', root), empty = $('[data-writers-empty]', root);
      if (!input || !cards.length) return;
      var FOLD = { 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ة': 'ه', 'ى': 'ي', 'ؤ': 'و', 'ئ': 'ي' };
      var norm = function (s) { return s.replace(/[ً-ْ]/g, '').replace(/[أإآةىؤئ]/g, function (c) { return FOLD[c]; }); };
      var label = function (n) { return n === 1 ? 'كاتب واحد' : n === 2 ? 'كاتبان' : n <= 10 ? n + ' كتاب' : n + ' كاتبا'; };
      var keys = cards.map(function (c) { return norm(c.getAttribute('data-writer')); });
      function apply() {
        var q = norm(input.value.trim()), n = 0, back = [];
        cards.forEach(function (c, i) {
          var ok = !q || keys[i].indexOf(q) !== -1;
          if (ok && c.getAttribute('data-hidden') === 'true') back.push(c);
          c.setAttribute('data-hidden', ok ? 'false' : 'true');
          if (ok) { n++; c.classList.add('is-in'); }
        });
        if (count) count.textContent = q ? label(n) + ' من ' + cards.length : label(n);
        if (empty) empty.hidden = n !== 0;
        reveal(back);
      }
      input.addEventListener('input', apply);
      input.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' || !input.value) return;
        e.preventDefault(); e.stopPropagation();   // the first Escape clears the search, it does not close the popup
        input.value = ''; apply();
      });
      $$('[data-writers-clear]', root).forEach(function (b) { b.addEventListener('click', function () { input.value = ''; apply(); input.focus(); }); });
    });
  }

  /* 36. Rows that scroll sideways (tabs, the header's sections) --------------------------
     When a row is wider than the screen it fades on the side that still has
     more (data-more="start|end", CSS 42), and on arrival its chosen item is
     brought into view, so the current section is never the one hidden. The
     row is watched for its own width too: when the header sticks, the logo
     and the buttons take part of the sections row, and the current section
     is brought back out from under them. */
  function scrollHints() {
    var bars = $$('.site-header__secs, .tabs');
    if (!bars.length) return;
    function mark(b) {
      var max = b.scrollWidth - b.clientWidth;
      if (max < 2) { b.removeAttribute('data-more'); return; }
      var pos = Math.abs(b.scrollLeft), more = [];   // right to left: scrollLeft runs from 0 at the start to -max at the end
      if (pos > 2) more.push('start');
      if (pos < max - 2) more.push('end');
      b.setAttribute('data-more', more.join(' '));
    }
    function reveal(b) {
      var on = $('[aria-current], .is-active', b);
      if (!on || b.scrollWidth <= b.clientWidth + 2) return;
      var br = b.getBoundingClientRect(), r = on.getBoundingClientRect();
      if (r.left < br.left + 32 || r.right > br.right - 32) b.scrollLeft += (r.left + r.width / 2) - (br.left + br.width / 2);
    }
    bars.forEach(function (b) {
      reveal(b); mark(b);
      b.addEventListener('scroll', function () { mark(b); }, { passive: true });
    });
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(function (es) { es.forEach(function (e) { reveal(e.target); mark(e.target); }); });
      bars.forEach(function (b) { ro.observe(b); });
    } else window.addEventListener('resize', function () { bars.forEach(mark); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { bars.forEach(function (b) { reveal(b); mark(b); }); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    [query, stickyHeader, drawer, searchOverlay, views, facets, tabs, chips, months, toc, follow, boards, plant, images, progress, ticker, dialogs, newsModal, copyLinks, archiveNav, archiveFilter, wikiRegister, axisFill, counters, inkWords, cites, quoteShare, timeLeft, shareLinks, worksList, hits, newsDays, markParts, writersFind, scrollHints, arrive].forEach(function (fn) {
      try { fn(); } catch (err) { if (window.console) console.error(err); }   // one broken block must not take the rest down
    });
  });
})();
