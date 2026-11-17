/* Zstore Ai — home page: switch תדמית ⇄ חנות in the offers section (tabs pattern). prefix hm- */
(function () {
  'use strict';
  var root = document.documentElement;

  /* motion gate: html.hm-on only while motion is allowed (OS setting + the site's a11y toggle) */
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var gate = function () {
    var on = !(mq.matches || root.classList.contains('a11y-motion'));
    if (root.classList.contains('hm-on') !== on) root.classList.toggle('hm-on', on);
  };
  gate();
  if (mq.addEventListener) mq.addEventListener('change', gate);
  new MutationObserver(gate).observe(root, { attributes: true, attributeFilter: ['class'] });

  var sec = document.querySelector('[data-hm-offers]');
  if (!sec) return;
  var list = sec.querySelector('[role="tablist"]');
  var tabs = list ? [].slice.call(list.querySelectorAll('[role="tab"]')) : [];
  var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
  if (tabs.length < 2 || panels.indexOf(null) > -1) return;

  panels.forEach(function (p, i) {
    p.setAttribute('role', 'tabpanel');
    p.setAttribute('aria-labelledby', tabs[i].id);
  });
  root.classList.add('hm-js');

  var cur = -1;
  var select = function (i) {
    if (i === cur) return;
    cur = i;
    tabs.forEach(function (t, j) {
      var on = j === i;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      panels[j].classList.toggle('is-on', on);
      /* the outgoing panel stays painted while it fades (visibility flips after .45s);
         inert takes it out of Tab order and the a11y tree right away */
      if (on) panels[j].removeAttribute('inert');
      else panels[j].setAttribute('inert', '');
    });
    sec.setAttribute('data-mode', panels[i].id === 'stores' ? 'store' : 'biz');
  };
  var indexOfHash = function () {
    var h;
    /* a malformed hash ("#%E0%A4%A") must not stop the switch from initialising */
    try { h = decodeURIComponent(location.hash.slice(1)); } catch (e) { return -1; }
    for (var i = 0; i < panels.length; i++) if (panels[i].id === h) return i;
    return -1;
  };
  /* user picks a tab: swap in place, keep the URL shareable, never scroll */
  var pick = function (i, focus) {
    select(i);
    if (focus) tabs[i].focus({ preventScroll: true });
    if (history.replaceState) history.replaceState(null, '', '#' + panels[i].id);
  };

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { pick(i, false); });
  });
  list.addEventListener('keydown', function (e) {
    var n = tabs.length, i = cur;
    var rtl = getComputedStyle(list).direction === 'rtl';
    if (e.key === 'ArrowLeft') i = rtl ? (cur + 1) % n : (cur - 1 + n) % n;
    else if (e.key === 'ArrowRight') i = rtl ? (cur - 1 + n) % n : (cur + 1) % n;
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = n - 1;
    else return;
    e.preventDefault();
    pick(i, true);
  });

  /* deep links /#tadmit and /#stores: open that panel and bring the switch + panel into view
     (the panel's scroll-margin leaves room for the header and the switch above it) */
  var follow = function () {
    var i = indexOfHash();
    if (i < 0) return;
    select(i);
    requestAnimationFrame(function () { panels[i].scrollIntoView({ block: 'start' }); });
  };
  var start = indexOfHash();
  select(start < 0 ? 0 : start);
  if (start > -1) {
    if (document.readyState === 'complete') follow();
    else window.addEventListener('load', follow, { once: true });
  }
  window.addEventListener('hashchange', follow);
})();
