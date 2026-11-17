// About page "Manifesto": draggable hero stickers, "clean the template" game, scroll-lit manifesto with a pen strike,
// live business-card status (Asia/Jerusalem hours), principles index with a cursor-following plate, build-track dots,
// vendor-questions counter + stamp, FAQ WhatsApp composer, magnetic CTA. html.ab-on (motion allowed) gates every
// hidden start state in about.css, so no-JS / reduced motion / a11y "stop animations" always show the final state.
(function () {
  'use strict';
  var d = document, W = window, root = d.documentElement;
  var mm = function (q) { return W.matchMedia ? W.matchMedia(q) : { matches: false }; };
  var red = mm('(prefers-reduced-motion: reduce)');
  var fine = mm('(hover: hover) and (pointer: fine)');
  var hasIO = 'IntersectionObserver' in W;
  var calm = function () { return red.matches || root.classList.contains('a11y-motion'); };
  var sync = function () { root.classList.toggle('ab-on', hasIO && !calm()); };
  sync();
  if (W.MutationObserver) new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
  if (red.addEventListener) red.addEventListener('change', sync);

  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || d).querySelectorAll(s)); };
  var add = function (el, c) { if (el) el.classList.add(c); };
  var raf = W.requestAnimationFrame ? W.requestAnimationFrame.bind(W) : function (f) { return setTimeout(f, 16); };
  var caf = W.cancelAnimationFrame ? W.cancelAnimationFrame.bind(W) : clearTimeout;
  // one-shot IntersectionObserver
  var once = function (el, cb, opts) {
    if (!el) return;
    if (!hasIO) { cb(el); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); } });
    }, opts || { threshold: 0.25 });
    io.observe(el);
  };
  // loops (bob, caret, pulse, conic) run only while their section is on screen
  var play = function (el) {
    if (el && hasIO) new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('ab-play', e.isIntersecting); });
    }).observe(el);
  };

  /* ---------- 1. hero stickers: drag (fine pointer only, never blocks touch scrolling) ---------- */
  play($('.ab-hero'));
  var vis = $('.ab-hero-vis');
  // once stamped, .is-set leaves only the bob loop in the CSS animation list, so nothing ever restarts the stamp
  $$('.ab-st', vis || d).forEach(function (st) {
    st.addEventListener('animationend', function (e) { if (e.animationName === 'ab-stamp') add(st, 'is-set'); });
  });
  if (vis && fine.matches) $$('.ab-st', vis).forEach(function (st) {
    var ox = 0, oy = 0, nx = 0, ny = 0, sx = 0, sy = 0, b = null, f = 0, id = null;
    var paint = function () { f = 0; st.style.translate = nx + 'px ' + ny + 'px'; };
    st.addEventListener('pointerdown', function (e) {
      if (calm() || e.button) return;
      e.preventDefault();
      id = e.pointerId;
      st.setPointerCapture(id);
      var v = vis.getBoundingClientRect(), r = st.getBoundingClientRect(), m = 40;
      b = [ox + v.left - m - r.left, ox + v.right + m - r.right, oy + v.top - m - r.top, oy + v.bottom + m - r.bottom];
      sx = e.clientX - ox; sy = e.clientY - oy; nx = ox; ny = oy;
      add(st, 'is-drag');
    });
    st.addEventListener('pointermove', function (e) {
      if (e.pointerId !== id) return;
      nx = Math.max(b[0], Math.min(b[1], e.clientX - sx));
      ny = Math.max(b[2], Math.min(b[3], e.clientY - sy));
      if (!f) f = raf(paint);
    });
    var end = function (e) {
      if (e.pointerId !== id) return;
      id = null; ox = nx; oy = ny;
      st.classList.remove('is-drag');
      // wobble through WAAPI: the CSS animation list never changes
      if (st.animate && !calm()) {
        var r = parseFloat(getComputedStyle(st).getPropertyValue('--r')) || 0;
        st.animate([{ rotate: r + 'deg' }, { rotate: (r - 6) + 'deg' }, { rotate: (r + 4) + 'deg' }, { rotate: r + 'deg' }], { duration: 300, easing: 'ease-out' });
      }
    };
    st.addEventListener('pointerup', end);
    st.addEventListener('pointercancel', end);
  });

  /* ---------- 2. clean the template ---------- */
  var cl = $('.ab-clean');
  var jb = cl ? $$('.ab-junk-b', cl) : [], mock = cl && $('.ab-mock', cl), done = cl && $('.ab-clean-done', cl), clive = cl && $('.ab-clean-live', cl);
  if (cl && mock && done && clive && jb.length) {
    play(cl);
    add(cl, 'ab-play-on');
    var gone = function (b) { return b.parentNode.classList.contains('is-gone'); };
    jb.forEach(function (b, i) {
      b.disabled = false;
      b.addEventListener('click', function () {
        if (gone(b)) return;
        add(b.parentNode, 'is-gone');
        var rest = jb.filter(function (x) { return !gone(x); }), n = rest.length;
        if (n) {
          (rest.filter(function (x) { return jb.indexOf(x) > i; })[0] || rest[0]).focus();
          clive.textContent = n === 1 ? 'נשאר עוד דבר מיותר אחד' : 'נשארו עוד ' + n + ' דברים מיותרים';
        } else {
          add(mock, 'is-clean');
          setTimeout(function () { done.focus(); }, 60);
          clive.textContent = 'האתר נקי. ככה מתחילים אצלנו.';
        }
        b.disabled = true;
      });
    });
    var rs = $('.ab-reset', cl);
    if (rs) rs.addEventListener('click', function () {
      jb.forEach(function (b) { b.parentNode.classList.remove('is-gone'); b.disabled = false; });
      mock.classList.remove('is-clean');
      clive.textContent = '';
      jb[0].focus();
    });
  }

  /* ---------- 3. manifesto: lines light up, pen strikes "תבנית", the last line blooms ---------- */
  var mf = $('.ab-mf');
  if (mf) {
    var l7 = $('.ab-mf-7', mf);
    $$('.ab-mf-line', mf).forEach(function (l) {
      once(l, function () {
        add(l, 'is-lit');
        if (l.classList.contains('ab-mf-6')) setTimeout(function () { add(l7, 'is-bloom'); }, calm() ? 0 : 950);
      }, { rootMargin: '0px 0px -38% 0px' });
    });
    once($('.ab-mf-quote', mf), function (q) { add(q, 'is-on'); }, { threshold: 0.5 });
  }

  /* ---------- 4. live status in Israel time (no holiday awareness, so never "available now") ---------- */
  var stEls = $$('[data-ab-status]');
  try {
    var p = {};
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
      .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), h = parseInt(p.hour, 10) % 24;
    if (stEls.length && day > -1 && h === h) {
      var wk = day < 5, open = wk && h >= 9 && h < 19;
      var txt = open ? 'עכשיו שעות הפעילות שלנו. כתבו לנו'
        : wk && h < 9 ? 'כתבו עכשיו, ונחזור אליכם היום מ־09:00'
        : day < 4 ? 'כתבו עכשיו, ונחזור אליכם מחר מ־09:00'
        : 'כתבו עכשיו, ונחזור אליכם ביום א׳ מ־09:00';
      stEls.forEach(function (s) { s.lastElementChild.textContent = txt; add(s, open ? 'is-open' : 'is-closed'); });
    }
  } catch (e) { /* keep the static hours */ }
  play($('.ab-founder'));
  once($('.ab-bcard'), function (c) { add(c, 'is-in'); });
  once($('.ab-nos'), function (c) { add(c, 'is-in'); }, { threshold: 0.6 });

  /* ---------- 5. principles index: one panel open at a time + desktop cursor plate ---------- */
  var ix = $('.ab-idx-sec');
  if (ix) {
    add(ix, 'ab-js');
    var rows = $$('.ab-idx-row', ix);
    var setRow = function (b, v) {
      b.setAttribute('aria-expanded', v ? 'true' : 'false');
      b.closest('.ab-idx-item').classList.toggle('is-open', v);
    };
    rows.forEach(function (b) {
      setRow(b, false);
      b.addEventListener('click', function () {
        var v = b.getAttribute('aria-expanded') !== 'true';
        // a panel above closes with a grid-rows animation, which bypasses scroll anchoring:
        // keep the tapped row where the finger left it for the length of the transition
        var t0 = b.getBoundingClientRect().top, t1 = Date.now();
        rows.forEach(function (x) { setRow(x, x === b && v); });
        var keep = function () {
          var dlt = b.getBoundingClientRect().top - t0;
          if (Math.abs(dlt) > 1) W.scrollBy({ top: dlt, left: 0, behavior: 'instant' });
          if (Date.now() - t1 < 520) raf(keep);
        };
        keep();
      });
    });
    var list = $('.ab-idx', ix), wide = mm('(min-width: 921px)');
    if (list && fine.matches) {
      var plate = null, pin = null, tx = 0, ty = 0, px = 0, py = 0, loop = 0, cur = null, live = false, edge = 0;
      var tick = function () {
        px += (tx - px) * 0.15; py += (ty - py) * 0.15;
        plate.style.transform = 'translate(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px)';
        loop = live ? raf(tick) : 0;
      };
      // follow the cursor, but stay in the empty lane beside the row's text so the plate never covers the word
      var aim = function (e) {
        tx = Math.max(16, edge ? Math.min(e.clientX - 130, edge - 284) : e.clientX - 130);
        ty = e.clientY - 95;
      };
      list.addEventListener('pointerenter', function (e) {
        if (calm() || !wide.matches || e.pointerType !== 'mouse') return;
        if (!plate) {
          plate = d.createElement('div'); plate.className = 'ab-plate'; plate.setAttribute('aria-hidden', 'true');
          pin = d.createElement('div'); pin.className = 'ab-plate-in';
          plate.appendChild(pin); d.body.appendChild(plate);
        }
        aim(e); px = tx; py = ty; live = true; cur = null;
        if (!loop) loop = raf(tick);
      });
      list.addEventListener('pointermove', function (e) {
        if (!live) return;
        aim(e);
        var row = e.target.closest ? e.target.closest('.ab-idx-row') : null;
        if (row === cur) return;
        cur = row;
        if (!row) { plate.classList.remove('is-on'); return; }
        var wd = $('.ab-idx-word', row), ln = $('.ab-idx-line', row), src = row.closest('.ab-idx-item').querySelector('.ab-idx-vis');
        if (!wd || !ln || !src) { cur = null; return; }
        edge = Math.min(wd.getBoundingClientRect().left, ln.getBoundingClientRect().left);
        aim(e);
        var v = src.cloneNode(true);
        $$('[id]', v).forEach(function (x) { x.removeAttribute('id'); });
        $$('img', v).forEach(function (im) { im.removeAttribute('loading'); });
        pin.textContent = '';
        pin.appendChild(v);
        add(plate, 'is-on');
      });
      // wheel scroll with a still mouse fires no pointermove: drop the plate until the next move re-resolves the row
      list.addEventListener('wheel', function () { cur = null; if (plate) plate.classList.remove('is-on'); }, { passive: true });
      list.addEventListener('pointerleave', function () {
        live = false; cur = null;
        if (plate) plate.classList.remove('is-on');
      });
    }
  }

  /* ---------- 6. build cards: entrance + mobile track dots ---------- */
  var track = $('.ab-bld-track');
  if (track) {
    var items = $$('li', track).filter(function (li) { return li.parentNode === track; }), dots = $$('.ab-bld-dots i');
    // observe the li: the card itself starts fully clipped (desktop wipe), which IntersectionObserver reads as invisible
    items.forEach(function (li) { once(li, function () { add(li.firstElementChild, 'is-in'); }, { threshold: 0.2 }); });
    if (hasIO && dots.length) {
      var dio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var k = items.indexOf(e.target);
          dots.forEach(function (x, j) { x.classList.toggle('is-on', j === k); });
        });
      }, { root: track, threshold: 0.6 });
      items.forEach(function (li) { dio.observe(li); });
    }
  }

  /* ---------- 7. how we work: rail fills, words ink in ---------- */
  once($('.ab-words'), function (o) { add(o, 'is-in'); }, { threshold: 0.4 });

  /* ---------- 8. four vendor questions: counter, progress, stamp ---------- */
  var ak = $('.ab-ask'), stamp = ak && $('.ab-stamp', ak), alive = ak && $('.ab-ask-live', ak),
    all = ak && $('.ab-ask-all', ak), num = ak && $('.ab-ask-n', ak), prog = ak && $('.ab-ask-prog', ak);
  if (ak && all && stamp && num && alive && prog) {
    add(ak, 'ab-js');
    var qs = $$('.ab-q', ak), seen = [], segs = $$('.ab-ask-bar span', ak);
    prog.hidden = false; all.hidden = false; stamp.hidden = false;
    var count = function (i) { if (seen.indexOf(i) > -1) return false; seen.push(i); return true; };
    var upd = function () {
      var n = seen.length;
      num.textContent = n;
      segs.forEach(function (s, j) { s.classList.toggle('is-on', j < n); });
      if (n === 4) { add(stamp, 'is-on'); alive.textContent = 'בדקתם את כל ארבע השאלות. עברנו את המבחן.'; }
      else alive.textContent = 'בדקתם ' + n + ' מתוך 4';
    };
    var setQ = function (b, v) {
      b.setAttribute('aria-expanded', v ? 'true' : 'false');
      b.closest('li').classList.toggle('is-open', v);
    };
    qs.forEach(function (b, i) {
      setQ(b, false);
      b.addEventListener('click', function () {
        var v = b.getAttribute('aria-expanded') !== 'true';
        setQ(b, v);
        if (v && count(i)) upd();
      });
    });
    all.addEventListener('click', function () {
      var ch = false;
      qs.forEach(function (b, i) { setQ(b, true); if (count(i)) ch = true; });
      if (ch) upd();
    });
  }

  /* ---------- 9. FAQ composer: builds a WhatsApp link, never submits (CSP form-action 'none') ---------- */
  var fm = $('.ab-ask-form');
  if (fm) {
    fm.hidden = false;
    fm.addEventListener('submit', function (e) {
      e.preventDefault();
      var inp = fm.querySelector('input'), v = ((inp && inp.value) || '').trim();
      W.open('https://wa.me/972587292029?text=' + encodeURIComponent('היי! יש לי שאלה על העבודה עם Zstore Ai' + (v ? ': ' + v : '')), '_blank', 'noopener');
    });
  }

  /* ---------- 10. CTA: conic glow runs on screen only, magnetic button on fine pointers ---------- */
  var cta = $('.ab-cta');
  play(cta);
  var mag = cta && $('.ab-mag', cta);
  if (mag && fine.matches) {
    var mx = 0, my = 0, mfr = 0;
    var pull = function () {
      mfr = 0;
      if (calm()) { mag.style.translate = ''; return; }
      var r = mag.getBoundingClientRect(), dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2);
      var R = 120 + r.width / 2, k = Math.sqrt(dx * dx + dy * dy) < R ? 8 / R : 0;
      mag.style.translate = (dx * k).toFixed(1) + 'px ' + (dy * k).toFixed(1) + 'px';
    };
    cta.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; if (!mfr) mfr = raf(pull); });
    cta.addEventListener('pointerleave', function () { if (mfr) { caf(mfr); mfr = 0; } mag.style.translate = ''; });
  }
})();
