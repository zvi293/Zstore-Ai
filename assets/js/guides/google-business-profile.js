// Signature component: "Local map pack" — a stylised city map where the searcher (blue dot) moves between three spots (radiogroup + tappable map spots) and a profile-strength range slider (missing → basic → full) re-ranks four businesses by relevance, distance and prominence; the top-3 list reorders with a FLIP animation, map pins get rank badges, a dashed route leads to #1 and a live verdict explains why.
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var still = function () { return (mq && mq.matches) || root.classList.contains('a11y-motion'); };
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  /* ---- touches: pins drop onto headings, NAP matches tick in (once, when in view) ---- */
  if ('IntersectionObserver' in window && !still()) {
    root.classList.add('gbp-ready');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        e.target.classList.add('gbp-in');
      });
    }, { threshold: 0.3, rootMargin: '0px 0px -40px 0px' });
    each(doc.querySelectorAll('.gbp-pin-h, .gbp-nap'), function (el) { io.observe(el); });
  }

  /* ---- signature: local map pack ---- */
  var box = doc.querySelector('.gbp-sim');
  if (!box) return;
  var q = function (s) { return box.querySelector(s); };
  var all = function (s) { return [].slice.call(box.querySelectorAll(s)); };
  var ctrl = q('.gbp-ctrl'), list = q('.gbp-list'), verdict = q('.gbp-verdict'), range = q('.gbp-level');
  var desc = q('.gbp-level-desc'), route = q('.gbp-route'), me = q('.gbp-me');
  var radios = all('.gbp-wb'), spots = all('.gbp-spot');
  var items = {}, pins = {};
  all('.gbp-biz').forEach(function (li) { items[li.getAttribute('data-biz')] = li; });
  all('.gbp-pin').forEach(function (g) { pins[g.getAttribute('data-biz')] = g; });
  var IDS = ['y', 'c1', 'c2', 'c3'];
  if (!ctrl || !list || !verdict || !range || !desc || !route || !me || radios.length !== 3 || spots.length !== 3 ||
      IDS.some(function (k) { return !items[k] || !pins[k] || !items[k].querySelector('.gbp-rank') || !items[k].querySelector('.gbp-sr'); })) return;

  // searcher spots + pin tips (SVG user units)
  var POS = [[306, 96], [168, 132], [96, 166]];
  var PIN = { y: [285, 70], c1: [150, 92], c2: [40, 206], c3: [226, 132] };
  // closeness per spot (3 = near), relevance + prominence per profile level (only "yours" changes)
  var D = { y: [3, 2, 1], c1: [1, 3, 2], c2: [1, 1, 3], c3: [2, 2, 1] };
  var R = { y: [1, 2, 3], c1: [3, 3, 3], c2: [2, 2, 2], c3: [1, 1, 1] };
  var P = { y: [0, 1, 3], c1: [2, 2, 2], c2: [3, 3, 3], c3: [2, 2, 2] };
  var LV = ['חסר', 'בסיסי', 'מלא ומתוחזק'];
  var DESC = [
    'חסר: בלי קטגוריה מדויקת, בלי שעות פעילות ובלי ביקורות.',
    'בסיסי: שם, קטגוריה ושעות, מעט תמונות וכמה ביקורות שלא קיבלו תגובה.',
    'מלא ומתוחזק: קטגוריות ושירותים מדויקים, תמונות עדכניות וביקורות שקיבלו תגובה.'
  ];
  var WORD = ['אפסית', 'נמוכה', 'בינונית', 'גבוהה'];
  var MSG = [
    ['העסק שלכם במרחק הליכה מהלקוח, ובכל זאת לא נכנס לשלוש התוצאות הראשונות. בפרופיל חסר אין לגוגל מספיק מידע כדי להבין שאתם רלוונטיים.',
     'מקום שלישי. הקרבה עזרה לכם להיכנס, אבל עסקים עם פרופיל עשיר יותר וביקורות רבות יותר עדיין לפניכם.',
     'מקום ראשון. כשהלקוח קרוב והפרופיל מלא ומתוחזק, כל שלושת הגורמים עובדים בשבילכם.'],
    ['מחוץ לשלוש הראשונות. הלקוח בשכונה אחרת, והפרופיל החסר לא נותן לגוגל סיבה להציג אתכם לפני עסקים קרובים יותר.',
     'עדיין מחוץ לשלוש הראשונות. פרופיל בסיסי לא מספיק כשמתחרים קרובים יותר ללקוח ומשקיעים בפרופיל שלהם.',
     'מקום ראשון, אף שעסק אחר קרוב יותר ללקוח. פרופיל מלא, מדויק ומתוחזק עוזר לפצות על מרחק בינוני.'],
    ['מחוץ לשלוש הראשונות. הלקוח בקצה השני של העיר, וגוגל מעדיפה עסקים שקרובים אליו ושהיא מכירה טוב יותר.',
     'מחוץ לשלוש הראשונות. במרחק כזה פרופיל בסיסי לא מספיק כדי להתחרות בעסקים שליד הלקוח.',
     'מקום שני, אף שהלקוח בקצה העיר. את המרחק אי אפשר לשנות, אבל פרופיל מלא ומתוחזק מחזיר אתכם לתמונה.']
  ];
  // NOTE: several combos are decided by the tie-break (prominence, then closeness); re-check all 9 MSG texts if D/R/P change
  var spot = 0, lvl = 1;

  function score(b) {
    var r = R[b][lvl], p = P[b][lvl], d = D[b][spot];
    return { b: b, r: r, p: p, d: d, t: r + p + d };
  }
  function curve(a, z) {
    var mx = (a[0] + z[0]) / 2, my = (a[1] + z[1]) / 2, dx = z[0] - a[0], dy = z[1] - a[1];
    return 'M' + a[0] + ' ' + a[1] + 'Q' + Math.round(mx - dy * 0.3) + ' ' + Math.round(my + dx * 0.3) + ' ' + z[0] + ' ' + z[1];
  }

  function render(animate) {
    var rows = IDS.map(score).sort(function (a, b) { return b.t - a.t || b.p - a.p || b.d - a.d; });
    var motion = animate && !still();
    var first = {};
    if (motion) IDS.forEach(function (k) { first[k] = items[k].getBoundingClientRect().top; });

    rows.forEach(function (s, i) {
      var li = items[s.b], out = i > 2, pin = pins[s.b];
      list.appendChild(li);
      li.classList.toggle('is-out', out);
      li.querySelector('.gbp-rank').textContent = out ? '–' : String(i + 1);
      each(li.querySelectorAll('.gbp-f'), function (f) { f.setAttribute('data-v', s[f.getAttribute('data-k')]); });
      li.querySelector('.gbp-sr').textContent = (out ? 'מחוץ לשלוש הראשונות. ' : 'מקום ' + (i + 1) + '. ') +
        'רלוונטיות ' + WORD[s.r] + ', קרבה ' + WORD[s.d] + ', בולטות ' + WORD[s.p] + '.';
      var badge = pin.querySelector('.gbp-pin-r'), txt = badge && badge.querySelector('text');
      var was = pin.getAttribute('data-rank');
      pin.setAttribute('data-rank', out ? '' : String(i + 1));
      pin.classList.toggle('is-top', !out);
      if (txt) txt.textContent = out ? '' : String(i + 1);
      if (badge && motion && !out && was !== String(i + 1)) {
        badge.classList.remove('is-pop');
        void badge.getBoundingClientRect();
        badge.classList.add('is-pop');
      }
    });
    items.y.querySelector('.gbp-biz-m').textContent = 'פרופיל ' + LV[lvl];

    if (motion) {
      IDS.forEach(function (k) {
        var li = items[k], dy = first[k] - li.getBoundingClientRect().top;
        if (!dy) return;
        li.style.transition = 'none';
        li.style.transform = 'translateY(' + dy + 'px)';
        void li.offsetHeight;
        li.style.transition = '';
        li.style.transform = '';
      });
    }

    var p = POS[spot], top = PIN[rows[0].b];
    me.style.transform = 'translate(' + p[0] + 'px,' + p[1] + 'px)';
    route.setAttribute("d", curve(p, [top[0], top[1] - 26]));
    spots.forEach(function (g, i) { g.classList.toggle('is-cur', i === spot); });
    radios.forEach(function (b, i) {
      b.setAttribute('aria-checked', i === spot ? 'true' : 'false');
      b.tabIndex = i === spot ? 0 : -1;
    });
    range.value = String(lvl);
    range.setAttribute('aria-valuetext', LV[lvl]);
    range.style.setProperty('--gbp-p', lvl * 50 + '%');
    box.setAttribute('data-lvl', String(lvl));
    desc.textContent = DESC[lvl];
    var msg = MSG[spot][lvl];
    if (verdict.textContent !== msg) {
      verdict.textContent = msg;
      if (motion) {
        verdict.classList.remove('is-new');
        void verdict.offsetWidth;
        verdict.classList.add('is-new');
      }
    }
  }

  function pick(i, focus) {
    i = (i + 3) % 3;
    if (i === spot) { if (focus) radios[i].focus(); return; }
    spot = i;
    render(true);
    if (focus) radios[i].focus();
  }

  radios.forEach(function (b, i) {
    b.addEventListener('click', function () { pick(i, false); });
    b.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      // RTL: the next option sits to the left
      if (k === 'ArrowLeft' || k === 'ArrowDown') n = spot + 1;
      else if (k === 'ArrowRight' || k === 'ArrowUp') n = spot - 1;
      else if (k === 'Home') n = 0;
      else if (k === 'End') n = 2;
      if (n === null) return;
      e.preventDefault();
      pick(n, true);
    });
  });
  spots.forEach(function (g, i) { g.addEventListener('click', function () { pick(i, false); }); });
  range.addEventListener('input', function () {
    var v = Math.max(0, Math.min(2, Math.round(+range.value)));
    if (v === lvl) return;
    lvl = v;
    render(true);
  });

  me.removeAttribute('transform');
  box.classList.add('gbp-noanim', 'gbp-live');
  ctrl.hidden = false;
  render(false);
  requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.remove('gbp-noanim'); }); });
})();
