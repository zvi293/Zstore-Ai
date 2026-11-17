// Signature component: "The journey of a payment" — a route diagram where a token travels an SVG path through six stations (checkout → payment page → clearing → approval → invoice → bank) and changes shape at each one (cart → card → arrows → shield → receipt → coins), with station tabs, play/pause/replay and an explanation panel per stop.
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var still = function () { return !!(mq && mq.matches) || root.classList.contains('a11y-motion'); };
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- small touches: heading accent bars, loops that park offscreen ---------- */
  var heads = doc.querySelectorAll('.osp-h');
  if (hasIO) {
    var hio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('osp-in'); hio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    heads.forEach(function (h) { hio.observe(h); });
    var lio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('osp-idle', !e.isIntersecting); });
    }, { rootMargin: '120px 0px' });
    doc.querySelectorAll('.osp-band, .osp-cta').forEach(function (el) { lio.observe(el); });
  } else {
    heads.forEach(function (h) { h.classList.add('osp-in'); });
  }

  /* ---------- the journey ---------- */
  var box = doc.querySelector('.osp-journey');
  if (!box) return;
  var rail = box.querySelector('.osp-rail'), ctrl = box.querySelector('.osp-ctrl'),
    list = box.querySelector('.osp-stops'), pnl = box.querySelector('.osp-panels');
  var tabs = [].slice.call(box.querySelectorAll('.osp-stop'));
  var panels = tabs.map(function (t) { return doc.getElementById(t.getAttribute('aria-controls')); });
  if (!rail || !ctrl || !list || !pnl || tabs.length < 2 || panels.indexOf(null) > -1) return;
  var svg = rail.querySelector('.osp-svg'), base = svg && svg.querySelector('.osp-base'),
    fill = svg && svg.querySelector('.osp-fill'), probe = svg && svg.querySelector('.osp-probe'),
    dot = rail.querySelector('.osp-dot'), play = ctrl.querySelector('.osp-play'),
    playT = play && play.querySelector('.osp-play-t'), countB = ctrl.querySelector('.osp-count b'),
    live = box.querySelector('.osp-sr');
  if (!svg || !base || !fill || !probe || !dot || !play || !playT || !countB ||
    tabs.some(function (t) { return !t.querySelector('.osp-ico'); })) return;
  var glyphs = [].slice.call(dot.querySelectorAll('svg'));
  var N = tabs.length, idx = 0, stops = [0], total = 0, cur = 0, raf = 0, timer = 0, gi = -1;
  var playing = false, paused = false, played = false, inView = false, autoDone = false;

  rail.hidden = false;
  ctrl.hidden = false;
  box.classList.add('osp-js');
  panels.forEach(function (p, i) {
    p.setAttribute('role', 'tabpanel');
    p.setAttribute('aria-labelledby', tabs[i].id);
    p.tabIndex = 0;
  });

  function say(t) { if (live) live.textContent = t; }

  /* the token takes the shape of the station it has reached */
  function shape(L) {
    var s = 0;
    while (s < N - 1 && stops[s + 1] <= L + 1) s++;
    if (s === gi || !glyphs[s]) return;
    gi = s;
    glyphs.forEach(function (g, j) { g.classList.toggle('is-on', j === s); });
  }

  function draw(L) {
    cur = L;
    if (!total) return;
    var pt = base.getPointAtLength(L);
    dot.style.transform = 'translate(' + pt.x.toFixed(1) + 'px,' + pt.y.toFixed(1) + 'px)';
    fill.style.strokeDashoffset = still() ? 0 : (total - L).toFixed(1);
    shape(L);
  }

  function halt() {
    cancelAnimationFrame(raf);
    box.classList.remove('osp-moving');
  }

  /* the route is drawn through the real centres of the station icons, so it fits
     any width: a soft wave across the row, scaled to the spacing between stations */
  function layout() {
    var r = rail.getBoundingClientRect();
    if (!r.width) return;
    svg.setAttribute('viewBox', '0 0 ' + Math.round(r.width) + ' ' + Math.round(r.height));
    var c = tabs.map(function (t) {
      var b = t.querySelector('.osp-ico').getBoundingClientRect();
      return [+(b.left - r.left + b.width / 2).toFixed(1), +(b.top - r.top + b.height / 2).toFixed(1)];
    });
    var row = Math.abs(c[1][1] - c[0][1]) < 4, d = 'M' + c[0][0] + ' ' + c[0][1];
    list.setAttribute('aria-orientation', row ? 'horizontal' : 'vertical');
    stops = [0];
    for (var i = 1; i < N; i++) {
      var p = c[i - 1], q = c[i], amp = Math.min(30, Math.abs(q[0] - p[0]) * 0.3);
      var seg = row
        ? ' Q' + ((p[0] + q[0]) / 2) + ' ' + (p[1] + (i % 2 ? -amp : amp)) + ' ' + q[0] + ' ' + q[1]
        : ' L' + q[0] + ' ' + q[1];
      probe.setAttribute('d', 'M' + p[0] + ' ' + p[1] + seg);
      stops.push(stops[i - 1] + probe.getTotalLength());
      d += seg;
    }
    base.setAttribute('d', d);
    fill.setAttribute('d', d);
    total = stops[N - 1];
    fill.style.strokeDasharray = total.toFixed(1) + ' ' + total.toFixed(1);
    halt();
    draw(stops[idx]);
  }

  function travel(to) {
    halt();
    var from = cur, target = stops[to];
    if (still() || from === target || !total) { draw(target); return; }
    var t0 = 0, dur = Math.min(1400, 450 + Math.abs(target - from) * 1.6);
    box.classList.add('osp-moving');
    raf = requestAnimationFrame(function step(now) {
      if (!t0) t0 = now;
      var k = Math.min(1, (now - t0) / dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      draw(from + (target - from) * e);
      if (k < 1) raf = requestAnimationFrame(step);
      else box.classList.remove('osp-moving');
    });
  }

  function select(i) {
    idx = i;
    tabs.forEach(function (t, j) {
      var on = j === i;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      t.classList.toggle('is-done', j < i);
      panels[j].classList.toggle('is-on', on);
    });
    countB.textContent = i + 1;
    box.classList.toggle('is-complete', i === N - 1);
    travel(i);
  }

  function setBtn() {
    play.classList.toggle('is-playing', playing);
    play.classList.toggle('is-replay', !playing && !paused && played);
    box.classList.toggle('is-playing', playing);
    playT.textContent = playing ? 'השהיה' : paused ? 'המשך' : played ? 'הפעלה מחדש' : 'הפעלה';
  }

  function stop(asPause) {
    playing = false;
    paused = !!asPause;
    clearTimeout(timer);
    setBtn();
  }

  /* slow enough to read each stop; any engagement with the text pauses it */
  function tick() {
    clearTimeout(timer);
    if (!playing || !inView) return;
    timer = setTimeout(function () {
      select(idx + 1);
      if (idx >= N - 1) {
        stop(false);
        say('ההדגמה הסתיימה: שלב ' + N + ' מתוך ' + N + ', הכסף מגיע לחשבון העסק.');
      } else tick();
    }, idx === 0 ? 2200 : 5200);
  }

  function start(fromTop) {
    if (fromTop) select(0);
    playing = true;
    paused = false;
    played = true;
    setBtn();
    tick();
  }

  play.addEventListener('click', function () {
    autoDone = true;
    if (playing) { stop(true); say('ההדגמה הושהתה.'); return; }
    start(!paused || idx >= N - 1);
    say('ההדגמה פועלת.');
  });

  ['pointerdown', 'focusin'].forEach(function (ev) {
    pnl.addEventListener(ev, function () {
      autoDone = true;
      if (playing) { stop(true); say('ההדגמה הושהתה.'); }
    });
  });

  /* stations behave as a tab list; in RTL ArrowLeft moves forward along the route */
  var keys = { ArrowLeft: 1, ArrowDown: 1, ArrowRight: -1, ArrowUp: -1 };
  function choose(i) {
    autoDone = true;
    if (playing || paused) stop(false);
    select(i);
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () {
      choose(i);
      var r = panels[i].getBoundingClientRect();
      if (r.top > window.innerHeight - 120) panels[i].scrollIntoView({ block: 'nearest', behavior: still() ? 'auto' : 'smooth' });
    });
    t.addEventListener('keydown', function (e) {
      var k = e.key, j = keys[k] ? i + keys[k] : k === 'Home' ? 0 : k === 'End' ? N - 1 : null;
      if (j === null) return;
      e.preventDefault();
      choose((j + N) % N);
      tabs[idx].focus();
    });
    t.addEventListener('focus', function () { if (playing) stop(true); });
  });

  var wasStill = null;
  function mode() {
    var s = still();
    if (s === wasStill) return;
    wasStill = s;
    box.classList.toggle('osp-still', s);
    play.hidden = s;
    if (s && playing) stop(true);
    halt();
    draw(stops[idx]);
  }
  new MutationObserver(mode).observe(root, { attributes: true, attributeFilter: ['class'] });
  if (mq && mq.addEventListener) mq.addEventListener('change', mode);

  var rq = 0;
  function relayout() { cancelAnimationFrame(rq); rq = requestAnimationFrame(layout); }
  if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(rail);
  else window.addEventListener('resize', relayout);

  layout();
  select(0);
  mode();
  setBtn();

  /* loops park while the card is offscreen; the demo plays once by itself only
     when the explanation panel itself is on screen, and its timer waits otherwise */
  if (hasIO) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { box.classList.toggle('osp-idle', !e.isIntersecting); });
    }).observe(box);
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        inView = e.isIntersecting && e.intersectionRatio >= 0.5;
        if (inView && !autoDone && !still()) { autoDone = true; start(true); return; }
        if (playing) tick(); else clearTimeout(timer);
      });
    }, { threshold: [0, 0.5] }).observe(pnl);
  } else {
    inView = true;
  }
})();
