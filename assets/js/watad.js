/* ==========================================================================
   وتد — Watad static theme · vanilla JS, no dependencies
   Every behaviour is opt-in through data-attributes, so Blade views only
   need to keep the attributes when looping over real data.
   ========================================================================== */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* 1. Mobile drawer ----------------------------------------------------- */
  function drawer() {
    var d = $('[data-drawer]');
    if (!d) return;
    var open = function () { d.classList.add('is-open'); document.body.style.overflow = 'hidden'; var f = $('a', d); f && f.focus(); };
    var close = function () { d.classList.remove('is-open'); document.body.style.overflow = ''; };
    $$('[data-drawer-open]').forEach(function (b) { b.addEventListener('click', open); });
    $$('[data-drawer-close]').forEach(function (b) { b.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* 2. Search overlay ---------------------------------------------------- */
  function searchOverlay() {
    var o = $('[data-search-overlay]');
    if (!o) return;
    var input = $('input', o);
    var open = function (e) { e && e.preventDefault(); o.classList.add('is-open'); setTimeout(function () { input && input.focus(); }, 20); };
    var close = function () { o.classList.remove('is-open'); };
    $$('[data-search-open]').forEach(function (b) { b.addEventListener('click', open); });
    $$('[data-search-close]').forEach(function (b) { b.addEventListener('click', close); });
    o.addEventListener('click', function (e) { if (e.target === o) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
      if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) open(e);
    });
  }

  /* 3. Result views (list / grid / compact) ------------------------------ */
  function views() {
    var box = $('[data-results]');
    if (!box) return;
    $$('[data-view-btn]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-view-btn');
        box.setAttribute('data-view', v);
        $$('[data-view-btn]').forEach(function (x) {
          var on = x === b;
          x.classList.toggle('is-active', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        var u = new URL(location.href); u.searchParams.set('view', v); history.replaceState(null, '', u);
      });
    });
    var q = new URL(location.href).searchParams.get('view');
    if (q) { var btn = $('[data-view-btn="' + q + '"]'); btn && btn.click(); }
  }

  /* 4. Facet filtering --------------------------------------------------
     Options: <button data-facet="section" data-value="سياسة">
     Items:   <* data-item data-section="سياسة" data-type="تحليل">       */
  function facets() {
    var root = $('[data-facets]');
    if (!root) return;
    var state = {};
    var items = $$('[data-item]');
    var countEl = $('[data-result-count]');
    function apply() {
      var shown = 0, seen = {};
      items.forEach(function (it) {
        var ok = Object.keys(state).every(function (k) { return !state[k] || it.getAttribute('data-' + k) === state[k]; });
        it.setAttribute('data-hidden', ok ? 'false' : 'true');
        var id = it.getAttribute('data-item');
        if (ok && !seen[id]) { seen[id] = 1; shown++; }
      });
      if (countEl) countEl.textContent = shown;
      var empty = $('[data-filter-empty]');
      if (empty) empty.hidden = shown !== 0;
    }
    $$('[data-facet]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-facet'), v = b.getAttribute('data-value') || '';
        state[k] = v;
        $$('[data-facet="' + k + '"]', root).forEach(function (x) { x.classList.toggle('is-active', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        apply();
      });
    });
    $$('[data-facets-reset]').forEach(function (b) {
      b.addEventListener('click', function () {
        state = {};
        $$('[data-facet]', root).forEach(function (x) { var first = !x.getAttribute('data-value'); x.classList.toggle('is-active', first); });
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
          var v = b.getAttribute('data-tab');
          btns.forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); x.classList.toggle('is-active', x === b); });
          $$('[data-tab-item]', target).forEach(function (it) {
            var ok = !v || it.getAttribute('data-tab-item') === v;
            it.setAttribute('data-hidden', ok ? 'false' : 'true');
          });
        });
      });
    });
  }

  /* 6. Sort toggles (visual state only; server does the sort) ----------- */
  function chips() {
    $$('[data-chips]').forEach(function (g) {
      var cs = $$('.chip', g);
      cs.forEach(function (c) { c.addEventListener('click', function () { cs.forEach(function (x) { x.classList.toggle('is-active', x === c); }); }); });
    });
  }

  /* 7. Archive months (collapse / expand) -------------------------------- */
  function months() {
    $$('[data-month]').forEach(function (m) {
      var t = $('[data-month-toggle]', m);
      if (!t) return;
      t.addEventListener('click', function () {
        var open = m.getAttribute('data-open') === 'true';
        m.setAttribute('data-open', open ? 'false' : 'true');
        t.setAttribute('aria-expanded', open ? 'false' : 'true');
        var lab = $('[data-month-label]', t);
        if (lab) lab.textContent = open ? 'افتح الشهر' : 'اطو الشهر';
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
      b.addEventListener('click', function () { var on = panel.classList.toggle('is-open'); b.setAttribute('aria-expanded', on ? 'true' : 'false'); });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    query(); drawer(); searchOverlay(); views(); facets(); tabs(); chips(); months(); toc(); follow();
  });
})();
