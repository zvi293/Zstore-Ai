// Signature component: "Signal mixer" — six aria-pressed signal switches (entity, consistency, Schema, direct answers, third-party mentions, crawler access) drive a light AI-answer card for 3 example businesses: few signals = "not enough info", some = vague options with competitor sources, all = your business named and cited with "האתר שלכם", plus a live "what's missing" line.
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var hasIO = 'IntersectionObserver' in window;
  var still = function () { return !hasIO || (mq && mq.matches) || root.classList.contains('a11y-motion'); };
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  /* ---- small touches: heading underline + source map (reveal once in view) ---- */
  if (!still()) {
    root.classList.add('geo-ready');
    var once = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        once.unobserve(e.target);
        if (e.target.classList.contains('geo-map')) {
          each(e.target.children, function (li, i) { setTimeout(function () { li.classList.add('geo-in'); }, i * 90); });
        } else {
          e.target.classList.add('geo-in');
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });
    each(doc.querySelectorAll('.geo-uline, .geo-map'), function (el) { once.observe(el); });
  }

  /* ---- signature: signal mixer ---- */
  var box = doc.querySelector('.geo-mix');
  if (!box) return;
  var q = function (s) { return box.querySelector(s); };
  var all = function (s) { return [].slice.call(box.querySelectorAll(s)); };
  var bar = q('.geo-tabs'), con = q('.geo-console'), card = q('.geo-card'), allBtn = q('.geo-all');
  var meterT = q('.geo-meter-t'), live = q('[aria-live]'), miss = q('.geo-miss'), chip = q('.geo-card-state');
  var tabs = all('.geo-tab'), panels = all('.geo-ex'), sws = all('.geo-sw'), bars = all('.geo-bars i');
  if (!bar || !con || !card || !allBtn || !meterT || !live || !miss || !chip || !sws.length ||
      sws.some(function (s) { return !s.querySelector('span'); }) ||
      !tabs.length || tabs.length !== panels.length ||
      panels.some(function (p) { return p.querySelectorAll('.geo-state').length !== 3; })) return;

  var SENT = ['אות חלש: ה-AI לא מוצא מספיק מידע כדי להמליץ', 'אות חלקי: ה-AI מכיר את התחום, אבל לא בטוח בכם', 'אות חזק: ה-AI ממליץ עליכם ומצטט את האתר'];
  var CHIP = ['לא בטוח', 'כללי', 'ממליץ עליכם'];
  var ALL = allBtn.textContent, RESET = 'לאפס ולהתחיל מחדש';
  var DEF = sws.map(function (s) { return s.getAttribute('aria-pressed') === 'true'; });
  var cur = 0;
  var isOn = function (s) { return s.getAttribute('aria-pressed') === 'true'; };
  var name = function (s) { return s.querySelector('span').textContent; };

  function render(announce) {
    var n = sws.filter(isOn).length, total = sws.length;
    var L = n === total ? 2 : n >= 3 ? 1 : 0;
    panels.forEach(function (p) {
      each(p.querySelectorAll('.geo-state'), function (s, k) { s.classList.toggle('is-cur', k === L); });
    });
    card.classList.toggle('is-full', L === 2);
    bars.forEach(function (b, i) { b.classList.toggle('is-on', i < n); });
    meterT.textContent = SENT[L];
    chip.textContent = CHIP[L];
    allBtn.textContent = n === total ? RESET : ALL;
    var missing = sws.filter(function (s) { return !isOn(s); });
    miss.hidden = L === 2;
    if (L < 2) {
      miss.textContent = '';
      var b = doc.createElement('b');
      b.textContent = 'מה חסר כדי שה-AI ימליץ עליכם? ';
      miss.appendChild(b);
      miss.appendChild(doc.createTextNode(missing.map(name).join(' · ')));
    }
    // a gentle pulse invites the first click (only before any interaction, motion allowed)
    sws.forEach(function (s) { s.classList.remove('geo-nudge'); });
    if (missing.length) missing[0].classList.add('geo-nudge');
    if (announce) live.textContent = n + ' מתוך ' + total + ' אותות פעילים. ' + SENT[L] + '.';
  }

  function select(i, focus) {
    cur = i;
    tabs.forEach(function (t, k) {
      var on = k === i;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      panels[k].classList.toggle('is-off', !on);
    });
    bar.style.setProperty('--geo-i', i);
    if (focus) tabs[i].focus();
  }

  var touched = function () { box.classList.remove('geo-hint'); };

  /* ---- init ---- */
  panels.forEach(function (p, i) {
    p.setAttribute('role', 'tabpanel');
    p.setAttribute('aria-labelledby', tabs[i].id);
    p.tabIndex = 0;
  });
  box.classList.add('geo-on');
  bars.forEach(function (b, i) { b.style.height = (30 + i * 14) + '%'; });
  bar.hidden = false;
  con.hidden = false;
  select(0);
  render(false);
  if (!still()) box.classList.add('geo-hint');

  sws.forEach(function (s) {
    s.addEventListener('click', function () {
      s.setAttribute('aria-pressed', isOn(s) ? 'false' : 'true');
      touched();
      render(true);
    });
  });
  allBtn.addEventListener('click', function () {
    var full = sws.every(isOn);
    sws.forEach(function (s, i) { s.setAttribute('aria-pressed', full ? String(DEF[i]) : 'true'); });
    touched();
    render(true);
  });
  tabs.forEach(function (t, i) { t.addEventListener('click', function () { select(i); }); });
  bar.addEventListener('keydown', function (e) {
    var n = tabs.length, i;
    if (e.key === 'ArrowLeft') i = (cur + 1) % n; // RTL: left moves forward
    else if (e.key === 'ArrowRight') i = (cur - 1 + n) % n;
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = n - 1;
    else return;
    e.preventDefault();
    select(i, true);
  });

  // pause the hint pulse offscreen
  if (hasIO) {
    new IntersectionObserver(function (entries) {
      box.classList.toggle('geo-idle', !entries[0].isIntersecting);
    }).observe(box);
  }
  // motion preference can change live (OS setting or the site's "stop animations" toggle)
  var onMotion = function () { if (still()) touched(); };
  if (window.MutationObserver) new MutationObserver(onMotion).observe(root, { attributes: true, attributeFilter: ['class'] });
  if (mq && mq.addEventListener) mq.addEventListener('change', onMotion);
})();
