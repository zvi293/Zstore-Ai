// Signature component: "How ready is your site?" self-check: tick the 12 checklist items and a segmented SVG score ring, verdict and a personal "fix first" list update live (saved in this browser only).
(function () {
  'use strict';
  var root = document.querySelector('.bwc-check');
  var score = root && root.querySelector('.bwc-score');
  if (!score) return;

  var html = document.documentElement;
  var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var still = function () { return (mq && mq.matches) || html.classList.contains('a11y-motion'); };
  var $ = function (s) { return score.querySelector(s); };
  var all = function (s, el) { return Array.prototype.slice.call((el || root).querySelectorAll(s)); };

  var inputs = all('.bwc-in'), groups = all('.bwc-group'), mini = root.querySelector('.bwc-mini');
  var TOTAL = inputs.length, KEY = 'zs-bwc-check';
  /* priority when choosing what to fix first: first screen and contact before everything else */
  var ORDER = [2, 1, 3, 4, 10, 5, 6, 11, 7, 8, 12, 9];
  var TIERS = [
    [12, 'מוכן להביא לקוחות', 'כל הסעיפים מסומנים. מכאן העבודה היא לשמור על האתר עדכני ולמדוד מה עובד.'],
    [9, 'כמעט שם', 'עוד כמה סעיפים, והאתר מוכן לעבוד בשבילכם.'],
    [5, 'יש בסיס טוב', 'חלק גדול מהיסודות כבר קיים. עכשיו הזמן לסגור את הפערים שנשארו.'],
    [1, 'התחלה טובה', 'כמה תיקונים ממוקדים יעשו הבדל גדול. התחילו מהרשימה שלמטה.'],
    [0, 'בואו נתחיל', 'סמנו את מה שכבר קיים באתר שלכם, והתוצאה תתעדכן כאן.']
  ];
  var ARROW = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
  var WA = 'https://wa.me/972587292029?text=';

  var numEl = $('.bwc-num'), lbl = $('.bwc-label'), sub = $('.bwc-sub'), live = $('[aria-live]'),
      fix = $('.bwc-fix'), fixT = $('.bwc-fix-t'), list = $('.bwc-fix-list'), more = $('.bwc-more'),
      wa = $('.btn-wa'), ring = $('.bwc-ring'), segG = $('svg g'), resetBtn = $('.bwc-reset');
  var mNum = mini && mini.querySelector('.bwc-mini-num'), mBar = mini && mini.querySelector('.bwc-mini-bar i'), mLbl = mini && mini.querySelector('.bwc-mini-lbl');
  if (!mNum || !mBar || !mLbl) mini = null;
  /* every part the card needs must exist, or the page stays in its readable no-JS state */
  if (!segG || !numEl || !lbl || !sub || !live || !fix || !fixT || !list || !more || !wa || !ring || !resetBtn || !inputs.length) return;

  /* confetti burst directions: x, y (px) and delay (s) per spark */
  var SPARK = [[-110, -60, 0], [104, -72, .05], [-96, 40, .1], [112, 30, .04], [-20, -112, .08], [34, 100, .12]];
  all('.bwc-spark i', score).forEach(function (s, n) {
    var p = SPARK[n];
    if (!p) return;
    s.style.setProperty('--x', p[0] + 'px');
    s.style.setProperty('--y', p[1] + 'px');
    s.style.animationDelay = p[2] + 's';
  });

  /* segmented ring: one rounded arc per checklist item, a dim track under each */
  var NS = 'http://www.w3.org/2000/svg', R = 52, C = 2 * Math.PI * R, step = C / TOTAL, gap = 13, segs = [];
  var arc = function (cls, i) {
    var c = document.createElementNS(NS, 'circle');
    c.setAttribute('class', cls);
    c.setAttribute('cx', '60'); c.setAttribute('cy', '60'); c.setAttribute('r', String(R));
    c.setAttribute('stroke-dasharray', (step - gap).toFixed(2) + ' ' + (C - step + gap).toFixed(2));
    c.setAttribute('stroke-dashoffset', (-(i * step + gap / 2)).toFixed(2));
    segG.appendChild(c);
    return c;
  };
  var i;
  for (i = 0; i < TOTAL; i++) arc('bwc-seg-t', i);
  for (i = 0; i < TOTAL; i++) segs.push(arc('bwc-seg', i));

  var shown = 0, raf = 0, liveT = 0, burstT = 0, prev = 0, lastKey = null;
  var setNum = function (n) { shown = n; numEl.textContent = n; };
  var tween = function (to) {
    cancelAnimationFrame(raf);
    if (still()) return setNum(to);
    var from = shown, t0 = 0;
    var tick = function (t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / 420);
      setNum(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var el = function (tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  };

  var update = function (animate, msg) {
    var on = {}, count = 0, j;
    inputs.forEach(function (inp) {
      inp.closest('.bwc-row').classList.toggle('is-on', inp.checked);
      if (inp.checked) { on[inp.value] = 1; count++; }
    });
    groups.forEach(function (gr) {
      var ins = gr.querySelectorAll('.bwc-in'), dots = gr.querySelectorAll('.bwc-dots i'), k = 0, d;
      for (d = 0; d < ins.length; d++) if (ins[d].checked) k++;
      for (d = 0; d < dots.length; d++) dots[d].classList.toggle('on', d < k);
      gr.classList.toggle('is-done', k === ins.length);
    });
    segs.forEach(function (s, n) {
      var lit = n < count;
      if (lit === s.classList.contains('on')) return;
      s.style.transitionDelay = animate ? Math.max(0, lit ? n - prev : prev - 1 - n) * 0.045 + 's' : '0s';
      s.classList.toggle('on', lit);
    });

    var tier = TIERS[TIERS.length - 1];
    for (j = 0; j < TIERS.length; j++) if (count >= TIERS[j][0]) { tier = TIERS[j]; break; }
    lbl.textContent = tier[1];
    sub.textContent = tier[2];
    if (animate) tween(count); else setNum(count);
    score.classList.toggle('is-full', count === TOTAL);
    if (animate && !still()) {
      ring.classList.remove('bump');
      void ring.offsetWidth; // restart the one-shot bump
      ring.classList.add('bump');
      if (count === TOTAL && prev < TOTAL) {
        score.classList.add('is-burst');
        clearTimeout(burstT);
        burstT = setTimeout(function () { score.classList.remove('is-burst'); }, 1300);
      }
    }

    /* personal "fix first" list: the top three unticked items, linked to their sections */
    var left = ORDER.filter(function (n) { return !on[n]; });
    var key = left.slice(0, 3).join(',');
    /* rebuild (and replay the fade-in) only when the top three actually change */
    if (key !== lastKey) {
      lastKey = key;
      list.textContent = '';
      left.slice(0, 3).forEach(function (n) {
        var li = el('li'), a = el('a'), ar = el('span', 'bwc-arr'), t = document.getElementById('bwc-t' + n);
        a.href = '#bwc-i' + n;
        a.appendChild(el('span', 'bwc-fn', pad(n)));
        a.appendChild(el('span', '', t ? t.textContent : ''));
        ar.setAttribute('aria-hidden', 'true');
        ar.innerHTML = ARROW;
        a.appendChild(ar);
        li.appendChild(a);
        list.appendChild(li);
      });
    }
    fix.hidden = !left.length;
    fixT.textContent = count ? 'מה לתקן קודם' : 'מאיפה מתחילים';
    var rest = left.length - 3;
    more.textContent = rest > 1 ? 'ועוד ' + rest + ' סעיפים ברשימה.' : rest === 1 ? 'ועוד סעיף אחד ברשימה.' : '';

    wa.href = WA + encodeURIComponent(count
      ? 'היי! עשיתי את הבדיקה העצמית במדריך וסימנתי ' + count + ' מתוך ' + TOTAL + '. אשמח שתעברו איתי על האתר שלי'
      : 'היי! עשיתי את הבדיקה העצמית במדריך ואשמח שתעברו איתי על האתר שלי');

    if (mini) {
      mNum.textContent = count + '/' + TOTAL;
      mBar.style.transform = 'scaleX(' + count / TOTAL + ')';
      mLbl.textContent = tier[1];
    }
    if (animate) {
      clearTimeout(liveT);
      liveT = setTimeout(function () {
        live.textContent = (msg || '') + 'סימנתם ' + count + ' מתוך ' + TOTAL + '. ' + tier[1] + '.';
      }, 350);
    }
    prev = count;
  };

  var save = function () {
    try {
      localStorage.setItem(KEY, JSON.stringify(inputs.filter(function (c) { return c.checked; }).map(function (c) { return c.value; })));
    } catch (e) { /* storage blocked: the check still works for this visit */ }
  };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (Array.isArray(saved)) inputs.forEach(function (c) { c.checked = saved.indexOf(c.value) > -1; });
  } catch (e) { /* no saved state */ }

  score.hidden = false;
  /* the slim meter is for phones/tablets only: on wide screens the score card sits beside the list */
  var wide = window.matchMedia && window.matchMedia('(min-width: 960px)');
  var syncMini = function () { if (mini) mini.hidden = !!(wide && wide.matches); };
  syncMini();
  if (wide) {
    if (wide.addEventListener) wide.addEventListener('change', syncMini);
    else if (wide.addListener) wide.addListener(syncMini);
  }
  root.classList.add('bwc-on');
  update(false);

  root.addEventListener('change', function (e) {
    if (e.target.classList && e.target.classList.contains('bwc-in')) { update(true); save(); }
  });
  resetBtn.addEventListener('click', function () {
    inputs.forEach(function (c) { c.checked = false; });
    update(true, 'הבדיקה אופסה. ');
    try { localStorage.removeItem(KEY); } catch (e) { /* noop */ }
  });

  /* phones: the slim sticky meter steps aside once the full score card is on screen */
  if (mini && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      mini.classList.toggle('is-away', en[0].isIntersecting);
    }, { rootMargin: '0px 0px -25% 0px' }).observe(score);
  }
})();
