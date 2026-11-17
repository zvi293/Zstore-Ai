// Signature component: "Anatomy of a store that sells" - a guided spotlight tour of a real store screenshot: a feathered SVG spotlight and a loupe glide along the customer journey (search to payment), with a stories-style progress bar, an optional auto-advancing tour, an accessible tablist and an explanation card.
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.add('osb-js');
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var still = function () { return (mq && mq.matches) || root.classList.contains('a11y-motion'); };
  var hasIO = 'IntersectionObserver' in window;
  var CROP_X = 258, CROP_Y = 104, FEATHER = 124; // screen crop origin in the 1280px photo; clear diameter of the spotlight circle (62/1400 of r=1400)

  /* reveal-once helper (band + heading rails) */
  function once(els, cls) {
    if (!els.length) return;
    if (!hasIO || still()) { els.forEach(function (el) { el.classList.add(cls); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add(cls); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });
    els.forEach(function (el) { io.observe(el); });
  }
  var list = function (sel, ctx) { return [].slice.call((ctx || d).querySelectorAll(sel)); };

  if (!still()) list('.osb-checks li').forEach(function (li, i) { li.style.setProperty('--d', (i * 0.06).toFixed(2) + 's'); });
  once(list('.osb-band'), 'osb-in');
  once(list('.osb-h'), 'osb-in');

  var box = d.querySelector('[data-osb-anat]');
  if (!box) return;
  var tabs = list('.osb-tab', box);
  var pins = list('.osb-pin', box);
  var panels = tabs.map(function (t) { return d.getElementById(t.getAttribute('aria-controls')); });
  if (!tabs.length || panels.indexOf(null) > -1) return;
  var nav = box.querySelector('.osb-nav'), head = box.querySelector('.osb-head');
  var hole = box.querySelector('.osb-hole'), halo = box.querySelector('.osb-halo');
  var lens = box.querySelector('.osb-lens'), lensImg = lens && lens.querySelector('img');
  var segWrap = box.querySelector('.osb-seg'), segs = list('.osb-seg i', box);
  var stage = box.querySelector('.osb-screen'), orbit = box.querySelector('.osb-orbit'), spin = 0;
  var tour = box.querySelector('.osb-tour'), hint = d.querySelector('.osb-hint');
  var touring = false, hover = false, focusIn = false;
  var countEl = box.querySelector('.osb-count b');
  var status = box.querySelector('.osb-status');
  var card = box.querySelector('.osb-card');
  var n = tabs.length, cur = 0;

  panels.forEach(function (p, i) {
    p.setAttribute('role', 'tabpanel');
    p.setAttribute('aria-labelledby', tabs[i].id);
    p.tabIndex = 0;
  });
  nav.hidden = false;
  if (head) head.hidden = false;
  box.classList.add('osb-ready');

  function num(t, k) { return parseFloat(t.getAttribute('data-' + k)) || 0; }

  function moveLens() {
    if (!lensImg) return;
    // at least 1.8x the size the photo is shown on the stage, so the loupe is a real close-up
    var t = tabs[cur], L = lens.clientWidth || 74, S = ((stage && stage.clientWidth) || 782) / 782;
    var k = Math.max((L * 1.15) / num(t, 'd'), S * 1.8);
    lensImg.style.transform = 'translate(' + (L / 2 - num(t, 'x') * k).toFixed(1) + 'px,' +
      (L / 2 - num(t, 'y') * k).toFixed(1) + 'px) scale(' + k.toFixed(3) + ')';
  }

  function select(i, opts) {
    opts = opts || {};
    cur = (i + n) % n;
    tabs.forEach(function (t, k) {
      var on = k === cur;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      panels[k].classList.toggle('is-on', on);
      if (pins[k]) pins[k].classList.toggle('is-on', on);
    });
    segs.forEach(function (s, k) { s.classList.toggle('is-on', k <= cur); s.classList.toggle('is-cur', k === cur); });
    if (countEl) countEl.textContent = cur + 1;
    var t = tabs[cur];
    // SVG user units = source pixels of the cropped screen, so no resize math is needed
    var tr = 'translate(' + (num(t, 'x') - CROP_X) + 'px,' + (num(t, 'y') - CROP_Y) + 'px) scale(' + (num(t, 'd') / FEATHER).toFixed(3) + ')';
    if (hole) hole.style.transform = tr;
    if (halo) halo.style.transform = tr;
    if (orbit && !still()) { spin += 120; orbit.style.transform = 'rotate(' + spin + 'deg)'; }
    moveLens();
    if (opts.focus) t.focus();
    if (opts.say && status) {
      var h = panels[cur].querySelector('h3');
      status.textContent = 'חלק ' + (cur + 1) + ' מתוך ' + n + ': ' + (h ? h.textContent : '');
    }
    // phones: the card sits under the stage; bring it into view after a tap on the screenshot
    if (opts.reveal && card) {
      var r = card.getBoundingClientRect();
      if (r.top > window.innerHeight - 140) card.scrollIntoView({ block: 'nearest', behavior: still() ? 'auto' : 'smooth' });
    }
  }

  /* guided tour: the current progress segment fills over 5s (CSS), its animationend advances.
     Held while reading (mouse over the card / focus inside), paused offscreen, stopped by any manual choice. */
  function hold() { box.classList.toggle('osb-hold', touring && (hover || focusIn)); }
  function setTour(on) {
    touring = !!on && !still();
    box.classList.toggle('osb-touring', touring);
    if (tour) tour.setAttribute('aria-pressed', touring ? 'true' : 'false');
    hold();
  }
  function stop() { if (touring) setTour(false); }
  function sync() {
    var off = still();
    if (off) stop();
    if (tour) tour.hidden = off;
    var txt = off ? 'בחרו חלק ברשימה או מספר על המסך.' : 'לחצו על \u25B6\uFE0E לסיור, או בחרו חלק ברשימה.';
    if (hint && hint.textContent !== txt) hint.textContent = txt;
  }
  sync();
  if (mq) { if (mq.addEventListener) mq.addEventListener('change', sync); else if (mq.addListener) mq.addListener(sync); }
  if (window.MutationObserver) new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
  if (tour) tour.addEventListener('click', function () {
    if (touring) return setTour(false);
    if (cur === n - 1) select(0, { say: true });
    setTour(true);
  });
  if (segWrap) segWrap.addEventListener('animationend', function (e) {
    if (!touring || e.animationName !== 'osb-fill') return;
    if (still() || cur >= n - 1) return setTour(false);
    select(cur + 1, { say: true });
  });
  if (card) {
    card.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hover = true; hold(); } });
    card.addEventListener('pointerleave', function () { hover = false; hold(); });
  }
  box.addEventListener('focusin', function (e) { focusIn = e.target !== tour; hold(); });
  box.addEventListener('focusout', function () { focusIn = false; hold(); });

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { stop(); select(i); });
  });
  nav.addEventListener('keydown', function (e) {
    var k = e.key, to = null;
    if (k === 'ArrowLeft') to = cur + 1;       // RTL: left = forward
    else if (k === 'ArrowRight') to = cur - 1;
    else if (k === 'Home') to = 0;
    else if (k === 'End') to = n - 1;
    if (to === null) return;
    e.preventDefault();
    stop();
    select(to, { focus: true });
  });
  pins.forEach(function (p) {
    p.addEventListener('click', function () { stop(); select(+p.getAttribute('data-i'), { say: true, reveal: true }); });
  });
  var prev = box.querySelector('.osb-prev'), next = box.querySelector('.osb-next');
  if (prev) prev.addEventListener('click', function () { stop(); select(cur - 1, { say: true }); });
  if (next) next.addEventListener('click', function () { stop(); select(cur + 1, { say: true }); });

  select(0);
  // enable transitions only after the first position is painted (no glide in from 0,0)
  requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.add('osb-anim'); }); });

  var raf = 0;
  window.addEventListener('resize', function () {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; moveLens(); });
  }, { passive: true });
  if (lensImg && !lensImg.complete) lensImg.addEventListener('load', moveLens);

  // spotlight fades in the first time the stage is seen; the tour timer runs only while on screen
  if (!hasIO || !stage) { box.classList.add('osb-on', 'osb-live'); return; }
  new IntersectionObserver(function (entries) {
    var vis = entries[0].isIntersecting;
    if (vis) box.classList.add('osb-on');
    box.classList.toggle('osb-live', vis);
  }, { threshold: 0.3 }).observe(stage);
})();
