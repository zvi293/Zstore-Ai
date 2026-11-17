// Signature component: "Two paths" — a platform⇄studio segmented switch that morphs the page's one 8-criteria comparison, plus a 3-question selector that recommends a path with reasons
(function () {
  'use strict';
  var root = document.querySelector('.cvs-paths');
  if (!root) return;
  var doc = document.documentElement;
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var still = function () { return mq.matches || doc.classList.contains('a11y-motion'); };
  var slice = function (list) { return Array.prototype.slice.call(list); };
  var hasIO = 'IntersectionObserver' in window;
  var names = { diy: 'בנייה עצמית בפלטפורמה', pro: 'אתר מסטודיו מקצועי' };

  /* ---------- the switch ---------- */
  var opts = slice(root.querySelectorAll('.cvs-opt'));
  var live = document.getElementById('cvs-live');
  root.classList.add('cvs-on');
  // stagger: rows cascade in (--cvs-r) and their texts morph one after another (--cvs-d)
  slice(root.querySelectorAll('.cvs-row')).forEach(function (r, i) {
    r.style.setProperty('--cvs-r', (i * 0.07).toFixed(2) + 's');
    r.style.setProperty('--cvs-d', (0.1 + i * 0.04).toFixed(2) + 's');
  });

  function setPath(p, announce) {
    root.setAttribute('data-path', p);
    opts.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-path') === p ? 'true' : 'false');
    });
    if (announce && live) live.textContent = 'מוצג עכשיו: ' + names[p];
  }
  opts.forEach(function (b, i) {
    b.addEventListener('click', function () {
      if (b.getAttribute('aria-pressed') !== 'true') setPath(b.getAttribute('data-path'), true);
    });
    // two options: either arrow moves to the other one; Home/End jump to the ends
    b.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') n = opts[1 - i];
      else if (e.key === 'Home') n = opts[0];
      else if (e.key === 'End') n = opts[opts.length - 1];
      if (!n) return;
      e.preventDefault();
      n.focus();
      n.click();
    });
  });

  /* rows cascade in the first time the card is seen */
  if (hasIO && !still()) {
    var rows = root.querySelector('.cvs-rows');
    root.classList.add('cvs-wait');
    var seen = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { root.classList.remove('cvs-wait'); seen.disconnect(); }
    }, { threshold: 0.12 });
    seen.observe(rows);
  }

  /* ---------- which path fits you ---------- */
  var form = document.querySelector('.cvs-qs');
  var res = document.querySelector('.cvs-res');
  var q = function (s) { return res ? res.querySelector(s) : null; };
  var title = q('.cvs-res-t'), text = q('.cvs-res-p'), why = q('.cvs-res-why');
  var tip = q('.cvs-res-tip'), act = q('.cvs-res-act'), go = q('.cvs-mini'), wa = q('.btn-wa');
  // a missing piece only disables the quiz; the switch and the CTA shine still run
  if (form && res && title && text && why && tip && act && go && wa) {
    var dots = slice(res.querySelectorAll('.cvs-dot'));
    var total = form.querySelectorAll('fieldset').length;
    var rec = '';

    var reset = function (n) {
      var left = total - n;
      title.textContent = n ? (left === 1 ? 'עוד שאלה אחת' : 'עוד ' + left + ' שאלות') : 'ענו על שלוש השאלות';
      text.textContent = 'ונראה לכם איזה מסלול מתאים לעסק שלכם עכשיו, ולמה.';
      why.textContent = '';
      res.removeAttribute('data-rec');
      tip.hidden = true; act.hidden = true;
      opts.forEach(function (b) { b.classList.remove('is-rec'); });
    };
    var item = function (txt, lead) {
      var li = document.createElement('li');
      if (lead) { var b = document.createElement('b'); b.textContent = lead; li.appendChild(b); li.appendChild(document.createTextNode(' ')); }
      li.appendChild(document.createTextNode(txt));
      why.appendChild(li);
    };

    var update = function () {
      var picked = slice(form.querySelectorAll('input:checked'));
      dots.forEach(function (d, i) { d.classList.toggle('is-on', i < picked.length); });
      if (picked.length < total) { reset(picked.length); return; }
      var diy = picked.filter(function (x) { return x.value === 'diy'; }).length;
      rec = diy * 2 > total ? 'diy' : 'pro';
      var clear = diy === 0 || diy === total;
      if (rec === 'diy') {
        title.textContent = clear ? 'כרגע, בנייה עצמית בפלטפורמה היא בחירה נבונה' : 'אתם נוטים לבנייה עצמית בפלטפורמה';
        text.textContent = clear ? 'זו לא פשרה: בשלב הזה פלטפורמה נותנת לכם בדיוק את מה שצריך.' : 'פלטפורמה היא התחלה הגיונית, עם נקודה אחת ששווה לזכור:';
      } else {
        title.textContent = clear ? 'אתר מסטודיו מקצועי יתאים לכם יותר' : 'אתם נוטים לאתר מסטודיו מקצועי';
        text.textContent = clear ? 'האתר הוא כלי עבודה בשבילכם, וכדאי שייבנה ככזה מהיום הראשון.' : 'אתר מקצועי ישרת אתכם טוב יותר, עם נקודה אחת ששווה לזכור:';
      }
      why.textContent = '';
      picked.forEach(function (x) { if (x.value === rec) item(x.getAttribute('data-why')); });
      picked.forEach(function (x) { if (x.value !== rec) item(x.getAttribute('data-why'), 'לזכור:'); });
      res.setAttribute('data-rec', rec);
      tip.hidden = rec !== 'diy';
      wa.hidden = rec !== 'pro';
      go.hidden = false;
      act.hidden = false;
      go.textContent = 'לראות את מסלול ה' + (rec === 'diy' ? 'בנייה העצמית' : 'סטודיו') + ' בהשוואה';
      opts.forEach(function (b) { b.classList.toggle('is-rec', b.getAttribute('data-path') === rec); });
    };

    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.addEventListener('change', update);
    go.addEventListener('click', function () {
      if (!rec) return;
      setPath(rec, true);
      root.scrollIntoView({ behavior: still() ? 'auto' : 'smooth', block: 'start' });
      var target = opts.filter(function (b) { return b.getAttribute('data-path') === rec; })[0];
      if (target) target.focus({ preventScroll: true });
    });
    update();
    // announce only after the silent first render, so nothing is read out on page load
    var lv = res.querySelector('.cvs-res-live');
    if (lv) { lv.setAttribute('aria-live', 'polite'); lv.setAttribute('aria-atomic', 'true'); }
  }

  /* ---------- CTA shine: one sweep when a button first comes into view ---------- */
  if (hasIO && !still()) {
    var shineIO = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        var el = x.target;
        // drop the class once the sweep ends, so it can never replay
        el.addEventListener('animationend', function done(e) {
          if (e.animationName !== 'cvs-sweep') return;
          el.classList.remove('cvs-lit');
          el.removeEventListener('animationend', done);
        });
        el.classList.add('cvs-lit');
        shineIO.unobserve(el);
      });
    }, { threshold: 0.8 });
    slice(document.querySelectorAll('.cvs-shine')).forEach(function (el) { shineIO.observe(el); });
  }
})();
