// Signature component: "See the difference" lab: a live mock web section with four lenses (keyboard focus, contrast, 200% zoom reflow, alt text), each with an aria-pressed before/after fix switch, a travelling focus-ring Tab demo and a fix-progress meter.
(function () {
  'use strict';
  var lab = document.querySelector('.wac-lab');
  if (!lab) return;
  var html = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var still = function () { return (mq && mq.matches) || html.classList.contains('a11y-motion'); };
  var $ = function (s) { return lab.querySelector(s); };
  var $$ = function (s) { return [].slice.call(lab.querySelectorAll(s)); };

  var tabsBox = $('.wac-tabs'), tabs = $$('.wac-tab'), panels = $$('.wac-panel');
  var glide = $('.wac-glide'), caps = $$('.wac-c'), view = $('.wac-view'), scan = $('.wac-scan'), cap = $('.wac-cap');
  var zoomEl = $('.wac-zoom'), stateEl = $('.wac-state'), stops = $$('.wac-f'), corners = $$('.wac-ring i');
  var fname = $('.wac-fname'), live = $('p.sr-only[aria-live]'), score = $('.wac-score'), scoreT = $('.wac-score-t');
  var segs = $$('.wac-segs i'), where = $('.wac-where'), keyBtn = $('.wac-key');
  if (!tabsBox || !tabs.length || tabs.length !== panels.length || !view || !glide || !score || !scoreT || !live ||
      !zoomEl || !stateEl || corners.length !== 4) return;

  var lenses = tabs.map(function (t) { return t.getAttribute('data-lens'); });
  var names = stops.map(function (s) { return s.textContent.trim(); });
  var ok = {}, cur = 0, fi = -1, placed = false;

  function replay(el) {
    if (!el || still()) return;
    el.classList.remove('wac-go');
    void el.offsetWidth;
    el.classList.add('wac-go');
  }

  // corner brackets hug the focused element of the mock (transform only)
  function place() {
    if (fi < 0 || lenses[cur] !== 'kbd') return;
    var v = view.getBoundingClientRect(), r = stops[fi].getBoundingClientRect(), p = 5, s = 12;
    var x1 = r.left - v.left - p, y1 = r.top - v.top - p, x2 = r.right - v.left + p - s, y2 = r.bottom - v.top + p - s;
    // first placement snaps into place instead of flying in from the far corner
    if (!placed) corners.forEach(function (c) { c.style.transition = 'none'; });
    [[x1, y1], [x2, y1], [x1, y2], [x2, y2]].forEach(function (pt, i) {
      corners[i].style.transform = 'translate(' + pt[0].toFixed(1) + 'px,' + pt[1].toFixed(1) + 'px)';
    });
    if (!placed) {
      void view.offsetWidth;
      corners.forEach(function (c) { c.style.transition = ''; });
      placed = true;
    }
  }

  function whereText() {
    if (fi < 0) return 'המיקוד עוד לא נכנס להדמיה.';
    var n = '״' + names[fi] + '״';
    return ok.kbd ? 'המיקוד על ' + n + ', ומסומן במסגרת בולטת.' : 'המיקוד עבר אל ' + n + ', אבל על המסך אין לזה שום סימן.';
  }

  function render(sweep) {
    var lens = lenses[cur], fixed = !!ok[lens];
    var key = lens + (fixed ? '-a' : '-b');
    var ck = lens === 'kbd' && fi < 0 ? 'kbd-n' : key;
    lab.setAttribute('data-lens', lens);
    lab.setAttribute('data-v', key);
    lab.classList.toggle('wac-fixed', fixed);
    caps.forEach(function (c) { c.hidden = c.getAttribute('data-c') !== ck; });
    zoomEl.textContent = lens === 'zoom' ? '200%' : '100%';
    stateEl.textContent = fixed ? 'אחרי התיקון' : 'לפני התיקון';
    panels[cur].classList.toggle('wac-on', fixed);
    var w = whereText();
    if (where && where.textContent !== w) where.textContent = w;
    place();
    if (sweep) replay(scan);
    replay(cap);
  }

  function tally() {
    var n = 0;
    lenses.forEach(function (l, i) {
      if (ok[l]) n++;
      if (segs[i]) segs[i].classList.toggle('wac-y', !!ok[l]);
    });
    var done = n === lenses.length;
    score.classList.toggle('wac-done', done);
    scoreT.textContent = done ? 'כל ארבעת התיקונים פעילים: ככה מרגיש אתר שכל אחד יכול להשתמש בו.' : 'הפעלתם ' + n + ' מתוך ' + lenses.length + ' תיקונים.';
    return scoreT.textContent;
  }

  function select(i, focus, sweep) {
    cur = i;
    tabs.forEach(function (t, j) {
      var on = j === i;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
    });
    if (focus) tabs[i].focus();
    glide.style.transform = 'translateX(' + (-100 * i) + '%)';
    render(sweep);
  }

  // progressive enhancement: the static page already shows every lens as a card
  lab.classList.add('wac-js');
  tabsBox.hidden = false;
  tabsBox.setAttribute('role', 'tablist');
  tabsBox.setAttribute('aria-label', 'נושאי ההדמיה');
  score.hidden = false;

  tabs.forEach(function (t, i) {
    var p = panels[i], sw = p.querySelector('.wac-sw'), box = p.querySelector('.wac-do');
    t.setAttribute('role', 'tab');
    t.setAttribute('aria-controls', p.id);
    p.setAttribute('role', 'tabpanel');
    p.setAttribute('aria-labelledby', t.id);
    if (box) box.hidden = false;
    t.addEventListener('click', function () { select(i, false, true); });
    if (!sw) return;
    sw.addEventListener('click', function () {
      var l = lenses[i], v = !ok[l], line = p.querySelector(v ? '.wac-a' : '.wac-b');
      ok[l] = v;
      sw.setAttribute('aria-pressed', v ? 'true' : 'false');
      t.classList.toggle('wac-ok', v);
      var srs = t.querySelector('.sr-only');
      if (srs) srs.textContent = v ? ' (התיקון פעיל)' : '';
      render(true);
      var said = line ? line.textContent.replace(/^\s*(לפני|אחרי)/, '').trim() : '';
      live.textContent = 'בהדמיה: ' + said + ' ' + tally();
    });
  });

  // roving tabindex; in RTL the left arrow moves to the next tab
  tabsBox.addEventListener('keydown', function (e) {
    var n = tabs.length, i = cur, k = e.key;
    if (k === 'ArrowLeft') i = (cur + 1) % n;
    else if (k === 'ArrowRight') i = (cur - 1 + n) % n;
    else if (k === 'Home') i = 0;
    else if (k === 'End') i = n - 1;
    else return;
    e.preventDefault();
    select(i, true, true);
  });

  if (keyBtn && stops.length) {
    keyBtn.addEventListener('click', function () {
      keyBtn.classList.add('wac-used');
      fi = (fi + 1) % stops.length;
      stops.forEach(function (s, i) { s.classList.toggle('wac-f-on', i === fi); });
      lab.classList.add('wac-has-f');
      if (fname) fname.textContent = '״' + names[fi] + '״';
      render(false);
      live.textContent = whereText();
    });
  }

  // keep the brackets glued to their target when the layout changes (rotate, font size modes)
  var queued = false;
  var relayout = function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; place(); });
  };
  if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(view);
  else window.addEventListener('resize', relayout);

  // the hint pulse on the Tab key rests while the lab is offscreen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      lab.classList.toggle('wac-idle', !es[0].isIntersecting);
    }, { rootMargin: '120px 0px' }).observe(lab);
  }

  tally();
  select(0, false, false);
})();
