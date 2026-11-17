// Signature component: "The first 90 days" scroll-driven roadmap: the rail fills and milestones check off as you read, synced to an abstract search-visibility curve, with a foundation filter and expandable milestone details
(function () {
  'use strict';
  var root = document.querySelector('.nws-road');
  var doc = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var hasIO = 'IntersectionObserver' in window;
  var motionOff = function () { return mq.matches || doc.classList.contains('a11y-motion') || !hasIO; };
  var all = function (sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); };

  /* small touches: CTA shine/arrow loop and the metrics chain only run while on screen */
  if (hasIO) {
    var onIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        e.target.classList.toggle('nws-on', e.isIntersecting);
        if (e.isIntersecting) e.target.classList.add('nws-seen');
      });
    }, { threshold: 0.3 });
    all('.nws-ctas, .nws-chain', document).forEach(function (el) { onIO.observe(el); });
  } else {
    all('.nws-chain', document).forEach(function (el) { el.classList.add('nws-seen'); });
  }
  if (!root) return;

  var items = all('.nws-ms');
  var nodes = items.map(function (li) { return li.querySelector('.nws-node'); });
  var marks = all('.nws-marks circle');
  var phases = all('.nws-phases li');
  var line = root.querySelector('.nws-line');
  var glow = root.querySelector('.nws-glow');
  var area = root.querySelector('.nws-area');
  var tip = root.querySelector('.nws-tip');
  var viz = root.querySelector('.nws-viz');

  /* ---- expandable milestone details (open in the HTML; collapsed once JS runs) ---- */
  items.forEach(function (li) {
    var btn = li.querySelector('.nws-more');
    var panel = li.querySelector('.nws-detail');
    if (!btn || !panel) return;
    var label = btn.querySelector('span');
    var set = function (open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) panel.removeAttribute('hidden'); else panel.setAttribute('hidden', 'until-found');
      if (label) label.textContent = open ? 'פחות פרטים' : 'מה בדיוק עושים';
    };
    set(false);
    btn.hidden = false;
    btn.addEventListener('click', function () {
      set(btn.getAttribute('aria-expanded') !== 'true');
      ask();
    });
    /* Ctrl+F finds text inside a collapsed panel: open it */
    panel.addEventListener('beforematch', function () { set(true); ask(); });
  });

  /* ---- foundation filter: highlight the milestones that build one foundation ---- */
  var pills = all('.nws-pill');
  var status = root.querySelector('.nws-status');
  var group = root.querySelector('.nws-pills');
  var hint = root.querySelector('.nws-hint');
  var tl = root.querySelector('.nws-tl');
  var names = { index: 'אינדוקס', pages: 'עמודים', content: 'תוכן', links: 'קישורים' };
  if (group && pills.length) {
    group.hidden = false;
    if (hint) hint.hidden = false;
    pills.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var p = btn.getAttribute('data-p');
        var on = btn.getAttribute('aria-pressed') !== 'true';
        var hits = [];
        pills.forEach(function (b) { b.setAttribute('aria-pressed', b === btn && on ? 'true' : 'false'); });
        if (tl) tl.classList.toggle('nws-filtering', on);
        items.forEach(function (li) {
          var hit = on && (' ' + li.getAttribute('data-p') + ' ').indexOf(' ' + p + ' ') > -1;
          li.classList.toggle('is-hit', hit);
          all('.nws-tags li', li).forEach(function (t) { t.classList.toggle('is-hit', on && t.getAttribute('data-p') === p); });
          var when = li.querySelector('.nws-when');
          if (hit && when) hits.push(when.textContent);
        });
        if (status) status.textContent = on ? 'על ' + names[p] + ' עובדים בשלבים: ' + hits.join(', ') : '';
      });
    });
  }

  /* ---- curve geometry: where each milestone marker sits along the path ---- */
  var total = 0;
  var mlen = [];
  try {
    total = line ? line.getTotalLength() : 0;
    marks.forEach(function (c) {
      var cx = +c.getAttribute('cx'), cy = +c.getAttribute('cy'), best = 0, bd = 1e9;
      for (var s = 0; s <= 160; s++) {
        var pt = line.getPointAtLength(total * s / 160);
        var d = (pt.x - cx) * (pt.x - cx) + (pt.y - cy) * (pt.y - cy);
        if (d < bd) { bd = d; best = s / 160; }
      }
      mlen.push(best);
    });
  } catch (err) { total = 0; }

  /* ---- scroll-driven state ---- */
  var live = false, visible = false, queued = false, target = 0, shown = 0, lastDone = -2, vizSeen = false;

  function ask() {
    if (!queued && live) { queued = true; requestAnimationFrame(frame); }
  }

  function drawCurve(v) {
    /* markers and phase labels light up as the drawn line actually reaches them */
    marks.forEach(function (c, i) {
      var on = !total || (v > 0.005 && v >= mlen[i] - 0.004);
      c.classList.toggle('is-lit', on);
      if (phases[i]) phases[i].classList.toggle('is-lit', on);
    });
    if (!total || !line || !glow || !area || !tip) return;
    var off = String(1 - v);
    line.style.strokeDashoffset = off;
    glow.style.strokeDashoffset = off;
    area.style.opacity = String(Math.min(1, v * 1.4));
    var pt = line.getPointAtLength(total * v);
    tip.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ')');
    tip.classList.toggle('is-off', v < 0.01);
  }

  function frame() {
    queued = false;
    if (!live) return;
    var anchor = window.innerHeight * 0.62;
    var ys = nodes.map(function (n) { var r = n.getBoundingClientRect(); return r.top + r.height / 2; });
    var done = -1, frac = 0;
    ys.forEach(function (y, i) {
      var f = 1;
      if (i < ys.length - 1) f = Math.max(0, Math.min(1, (anchor - y) / (ys[i + 1] - y)));
      items[i].style.setProperty('--f', f.toFixed(4));
      if (anchor >= y) { done = i; frac = f; }
    });
    if (done !== lastDone) {
      items.forEach(function (li, i) {
        li.classList.toggle('is-done', i <= done);
        li.classList.toggle('is-current', i === done);
      });
      lastDone = done;
    }
    if (done < 0) target = 0;
    else if (done >= mlen.length - 1) target = 1;
    else target = mlen[done] + (mlen[done + 1] - mlen[done]) * frac;
    var diff = target - shown;
    shown = Math.abs(diff) < 0.002 ? target : shown + diff * 0.12;
    drawCurve(shown);
    if (shown !== target) ask();
  }

  function onScroll() { ask(); }

  function enable() {
    if (live) return;
    live = true;
    lastDone = -2;
    root.classList.add('nws-live');
    if (visible) { window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll); }
    ask();
  }

  function disable() {
    live = false;
    root.classList.remove('nws-live');
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    items.forEach(function (li) { li.style.removeProperty('--f'); li.classList.remove('is-current'); });
    [line, glow].forEach(function (p) { if (p) p.style.strokeDashoffset = ''; });
    if (area) area.style.opacity = '';
    if (tip) { tip.setAttribute('transform', 'translate(30 34)'); tip.classList.remove('is-off'); }
    shown = target = 1;
  }

  if (!hasIO) return;

  /* run the scroll work (and the ambient loops) only while the section is near the viewport */
  new IntersectionObserver(function (es) {
    visible = es[0].isIntersecting;
    root.classList.toggle('nws-vis', visible);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    if (visible && live) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      ask();
    }
  }, { rootMargin: '120px 0px 120px 0px' }).observe(root);

  /* cards rise in once as they enter (cards already scrolled past, e.g. after a reload mid-page, just show) */
  var cardIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting || e.boundingClientRect.top < 0) { e.target.classList.add('is-in'); cardIO.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  items.forEach(function (li) { cardIO.observe(li); });

  /* phone layout: the chart sits below the timeline, so it draws itself in when first seen */
  if (viz) {
    var vizIO = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting || vizSeen) return;
      vizSeen = true;
      vizIO.disconnect();
      if (live && getComputedStyle(viz).position !== 'sticky') { shown = 0; drawCurve(0); ask(); }
    }, { threshold: 0.4 });
    vizIO.observe(viz);
  }

  var sync = function () { if (motionOff()) disable(); else enable(); };
  if (window.MutationObserver) new MutationObserver(sync).observe(doc, { attributes: true, attributeFilter: ['class'] });
  if (mq.addEventListener) mq.addEventListener('change', sync);
  sync();
})();
