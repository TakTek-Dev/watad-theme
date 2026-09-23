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
        show(v);
        reveal([$('.res-' + v, box)]);
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
    function apply() {
      var shown = 0, seen = {}, back = [];
      items.forEach(function (it) {
        var ok = Object.keys(state).every(function (k) { return !state[k] || it.getAttribute('data-' + k) === state[k]; });
        if (ok && it.getAttribute('data-hidden') === 'true') back.push(it);
        it.setAttribute('data-hidden', ok ? 'false' : 'true');
        var id = it.getAttribute('data-item');
        if (ok && !seen[id]) { seen[id] = 1; shown++; }
      });
      if (countEl) countEl.textContent = shown;
      if (empty) { var was = empty.hidden; empty.hidden = shown !== 0; if (was && !empty.hidden) back.push(empty); }
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

  /* 8. Article table of contents: highlight the chapter in view ---------- */
  function toc() {
    var links = $$('[data-toc] a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) { var el = document.getElementById(a.getAttribute('href').slice(1)); if (el) map[el.id] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (a) { a.classList.remove('is-active'); });
          map[e.target.id] && map[e.target.id].classList.add('is-active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* 9. Follow button (demo state) ---------------------------------------- */
  function follow() {
    $$('[data-follow]').forEach(function (b) {
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') === 'true';
        $$('[data-follow]').forEach(function (x) {
          x.setAttribute('aria-pressed', on ? 'false' : 'true');
          x.textContent = on ? 'تابع الكاتبة' : 'تتابعها الان';
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
     the fold are held back here and released when they scroll in. */
  function plant() {
    if (reduced.matches || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    var fold = window.innerHeight;
    // every read first, then every write, so the page lays out once
    var later = $$('.wedge,.ab-mark__art').filter(function (el) { return el.getClientRects().length && el.getBoundingClientRect().top >= fold; });
    later.forEach(function (el) { el.classList.add('is-waiting'); io.observe(el); });
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
     Year tabs switch the month grid in place. A month (from the grid, the
     jump form or ?y=&m=) is underlined, titled with its count, and its group
     on the page is opened and brought into view. On the server the same
     ?y=&m= renders that month; the static demo only holds Sep–Jul 2026. */
  function archiveNav() {
    var root = $('[data-arcal]');
    if (!root) return;
    var tabsEls = $$('[data-year]', root), grids = $$('[data-year-grid]', root);
    function showYear(y) {
      var hit = grids.filter(function (g) { return g.getAttribute('data-year-grid') === String(y); })[0];
      if (!hit) return false;
      grids.forEach(function (g) { g.hidden = g !== hit; });
      tabsEls.forEach(function (t) {
        var on = t.getAttribute('data-year') === String(y);
        t.classList.toggle('is-active', on);
        if (on) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
      });
      return true;
    }
    tabsEls.forEach(function (t) {
      t.addEventListener('click', function (e) {
        e.preventDefault();
        var y = t.getAttribute('data-year');
        if (!showYear(y)) return;
        var u = new URL(location.href); u.searchParams.set('y', y); u.searchParams.delete('m'); history.replaceState(null, '', u);
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

  document.addEventListener('DOMContentLoaded', function () {
    [query, stickyHeader, drawer, searchOverlay, views, facets, tabs, chips, months, toc, follow, boards, plant, images, progress, ticker, dialogs, newsModal, copyLinks, archiveNav].forEach(function (fn) {
      try { fn(); } catch (err) { if (window.console) console.error(err); }   // one broken block must not take the rest down
    });
  });
})();
