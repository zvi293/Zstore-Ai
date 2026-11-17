// Business sites "Blueprint builder": 6 tabbed groups of toggles draw layers on a live site blueprint,
// a scope ruler shows which track the picks land in (never numbers), and a title-block summary sends the plan
// to WhatsApp. html.bp-js = enhanced layout; html.bp-on = motion allowed (OS setting + the a11y "stop animations" toggle).
(function () {
  'use strict';
  var d = document, W = window, root = d.documentElement;
  var red = W.matchMedia ? W.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var hasIO = 'IntersectionObserver' in W;
  var calm = function () { return red.matches || root.classList.contains('a11y-motion'); };
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || d).querySelectorAll(s)); };

  // pathLength=1 lets the CSS draw any line with stroke-dashoffset, whatever its real length
  $$('.bp-hv-w > *').forEach(function (el, i) { el.setAttribute('pathLength', 1); el.style.setProperty('--i', i); });
  $$('.bp-bp [data-layer] *').forEach(function (el) { el.setAttribute('pathLength', 1); });
  $$('.bp-bricks li').forEach(function (li, i) { li.style.setProperty('--i', i); });
  root.classList.add('bp-js');
  var sync = function () { root.classList.toggle('bp-on', hasIO && !calm()); };
  sync();
  if (W.MutationObserver) new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
  if (red.addEventListener) red.addEventListener('change', sync);

  // one-shot entrances (sheets straighten, bricks rise, plates join)
  ['.bp-sheets', '.bp-bricks', '.bp-plates'].forEach(function (s) {
    var el = $(s);
    if (!el) return;
    if (!hasIO) { el.classList.add('is-in'); return; }
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); el.classList.add('is-in'); }
    }, { threshold: 0.2 });
    io.observe(el);
  });

  /* ---------- the drafting table ---------- */
  var box = $('.bp-builder');
  if (!box) return;
  var board = $('.bp-board', box), picker = $('.bp-picker', box), sum = $('.bp-summary', box), live = $('.bp-live', box);
  var svg = $('.bp-bp', box), groupsEl = $('.bp-groups', box), groups = $$('.bp-group', box);
  var chips = $('.bp-chips', sum), send = $('.bp-send', sum), empty = $('.bp-empty', sum);
  var zones = $$('.bp-zones li', box), slide = $('.bp-slide', box);
  var TR = ['מסלול ממוקד', 'מסלול מתרחב', 'מסלול רחב'];
  var items = [], byKey = Object.create(null), picked = Object.create(null), cur = 0;
  // --header-h is a max() expression, so read it resolved: the tab bar's scroll-margin-top is calc(var(--header-h) + 12px)
  var headerH = function () { return parseFloat(W.getComputedStyle(bar).scrollMarginTop) || 90; };
  var lead = $('.bp-lead', box);
  if (lead) lead.textContent = 'סמנו את מה שנכון לעסק. השרטוט מתעדכן איתכם, ובסוף שולחים לנו את התוכנית בוואטסאפ.';
  var go = function (el, block) { el.scrollIntoView({ block: block, behavior: calm() ? 'auto' : 'smooth' }); };

  // legend rail: a dashed slot behind every service icon, solid once that service is picked
  $$('.bp-r', svg).forEach(function (g) {
    var m = g.transform.baseVal.consolidate().matrix, r = d.createElementNS('http://www.w3.org/2000/svg', 'rect');
    [['class', 'bp-slot'], ['data-k', g.getAttribute('data-layer')], ['x', m.e - 18], ['y', m.f - 14], ['width', 36], ['height', 28], ['rx', 5]].forEach(function (a) { r.setAttribute(a[0], a[1]); });
    g.parentNode.insertBefore(r, g);
  });

  // phones: the board sits above the tabs, so a live mini copy of it rides at the end of the open category
  var peek = d.createElement('div'), mini = svg.cloneNode(true);
  mini.removeAttribute('role');
  mini.removeAttribute('aria-label');
  mini.setAttribute('aria-hidden', 'true');
  mini.setAttribute('focusable', 'false');
  $$('[id]', mini).forEach(function (el) { el.removeAttribute('id'); });
  $$('defs', mini).forEach(function (el) { el.remove(); });
  mini.classList.add('bp-mini');
  peek.className = 'bp-peek';
  peek.innerHTML = '<div class="bp-peek-art"></div><p class="bp-peek-t">נבחרו <b class="bp-peek-n">0</b> · <span class="bp-peek-tr"></span></p><button type="button" class="bp-peek-go">לשרטוט המלא <svg class="bp-ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg></button>';
  $('.bp-peek-art', peek).appendChild(mini);
  $('.bp-peek-go', peek).addEventListener('click', function () { go(board, 'start'); });
  var arts = [svg, mini];

  // tabs (roving tabindex, automatic activation)
  var bar = d.createElement('div');
  bar.className = 'bp-tabs';
  bar.setAttribute('role', 'tablist');
  bar.setAttribute('aria-label', 'קטגוריות לבחירה');
  var select = function (i, focus) {
    cur = (i + groups.length) % groups.length;
    tabs.forEach(function (t, j) {
      t.setAttribute('aria-selected', j === cur);
      t.tabIndex = j === cur ? 0 : -1;
      groups[j].hidden = j !== cur;
    });
    groups[cur].insertBefore(peek, $('.bp-next', groups[cur]));
    if (focus) tabs[cur].focus();
  };
  var goSum = function () { go(sum, 'nearest'); sum.focus({ preventScroll: true }); };
  var tabs = groups.map(function (g, i) {
    var key = g.getAttribute('data-group'), t = d.createElement('button'), nx = d.createElement('button');
    var last = i === groups.length - 1;
    t.type = 'button';
    t.className = 'bp-tab';
    t.id = 'bp-tab-' + key;
    g.id = 'bp-p-' + key;
    t.setAttribute('role', 'tab');
    t.setAttribute('aria-controls', g.id);
    t.innerHTML = $('h3', g).innerHTML + '<span class="bp-count" aria-hidden="true" hidden></span><span class="sr-only bp-cnt"></span>';
    g.setAttribute('role', 'tabpanel');
    g.setAttribute('aria-labelledby', t.id);
    bar.appendChild(t);
    nx.type = 'button';
    nx.className = 'btn btn-ghost bp-next';
    nx.innerHTML = (last ? 'לסיכום התוכנית' : 'לקטגוריה הבאה') + ' <svg class="bp-ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
    nx.addEventListener('click', function () {
      if (last) { goSum(); return; }
      select(i + 1, true);
      if (bar.getBoundingClientRect().top < headerH()) go(bar, 'start');
    });
    g.appendChild(nx);
    return t;
  });
  groupsEl.parentNode.insertBefore(bar, groupsEl);
  bar.addEventListener('click', function (e) {
    var t = e.target.closest('.bp-tab');
    if (t) select(tabs.indexOf(t));
  });
  bar.addEventListener('keydown', function (e) {
    var i = tabs.indexOf(e.target), k = e.key;
    if (i < 0) return;
    // RTL: the next tab sits to the left
    var n = k === 'ArrowLeft' ? i + 1 : k === 'ArrowRight' ? i - 1 : k === 'Home' ? 0 : k === 'End' ? tabs.length - 1 : null;
    if (n === null) return;
    e.preventDefault();
    select(n, true);
  });

  // every list item becomes a pressable card
  $$('.bp-item', box).forEach(function (li) {
    var key = li.getAttribute('data-pick'), nm = $('.bp-name', li), ds = $('.bp-desc', li), b = d.createElement('button');
    nm.id = 'bp-n-' + key;
    ds.id = 'bp-d-' + key;
    b.type = 'button';
    b.className = 'bp-tog';
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-labelledby', nm.id);
    b.setAttribute('aria-describedby', ds.id);
    b.innerHTML = '<span class="bp-box" aria-hidden="true"></span>';
    b.appendChild(nm);
    b.appendChild(ds);
    li.appendChild(b);
    var it = { key: key, name: nm.textContent.replace(/\s+/g, ' ').trim(), btn: b, g: groups.indexOf(li.closest('.bp-group')) };
    items.push(it);
    byKey[key] = it;
    b.addEventListener('click', function () { toggle(key, !picked[key]); });
    b.addEventListener('animationend', function () { b.classList.remove('bp-snap'); });
  });

  var render = function (it, on) {
    var list = items.filter(function (x) { return picked[x.key]; }), n = list.length;
    var tr = picked.regional || n >= 10 ? 2 : (picked.blog || picked.pages || n >= 4 ? 1 : 0);
    var f = Math.min(n / [4, 10, 24][tr], 1);
    // the marker always lands inside its own track's third (clamped so the label never clips at the ends)
    slide.style.setProperty('--pos', Math.max(0.17, Math.min(0.83, (tr + 0.25 + 0.5 * f) / 3)).toFixed(3));
    zones.forEach(function (z, j) { z.classList.toggle('is-on', j === tr); });
    $('.bp-scope b', box).textContent = $('.bp-tr', sum).textContent = TR[tr];
    $('.bp-n', sum).textContent = $('.bp-peek-n', peek).textContent = n;
    $('.bp-peek-tr', peek).textContent = TR[tr];
    tabs.forEach(function (t, j) {
      var c = list.filter(function (x) { return x.g === j; }).length, badge = $('.bp-count', t);
      badge.textContent = c;
      badge.hidden = !c;
      $('.bp-cnt', t).textContent = c ? ', נבחרו ' + c : '';
    });
    chips.innerHTML = '';
    list.forEach(function (x) {
      var li = d.createElement('li'), s = d.createElement('span'), b = d.createElement('button');
      s.textContent = x.name;
      b.type = 'button';
      b.textContent = '×';
      b.setAttribute('data-k', x.key);
      b.setAttribute('aria-label', 'הסרה: ' + x.name);
      if (on && x === it) li.className = 'bp-new';
      li.appendChild(s);
      li.appendChild(b);
      chips.appendChild(li);
    });
    chips.hidden = !n;
    empty.hidden = !!n;
    send.href = 'https://wa.me/972587292029?text=' + encodeURIComponent(n
      ? 'היי! בניתי באתר תוכנית לאתר התדמית שלי.\nמה בחרתי:\n' + list.map(function (x) { return '• ' + x.name; }).join('\n') + '\nהיקף משוער: ' + TR[tr] + '\nאשמח להצעת מחיר אישית.'
      : 'היי! אשמח לאתר תדמית עם הבסיס, ולשמוע מה עוד מתאים לעסק שלי.');
    if (it) live.textContent = (on ? 'נוסף לתוכנית: ' : 'הוסר מהתוכנית: ') + it.name + '. נבחרו ' + n + '.';
  };
  var toggle = function (key, on, quiet) {
    var it = byKey[key];
    if (!it) return;
    if (on) picked[key] = 1; else delete picked[key];
    it.btn.setAttribute('aria-pressed', !!on);
    if (!quiet && root.classList.contains('bp-on')) it.btn.classList.add('bp-snap');
    arts.forEach(function (a) {
      $$('[data-layer="' + key + '"], .bp-slot[data-k="' + key + '"]', a).forEach(function (el) { el.classList.toggle('on', !!on); });
    });
    if (!quiet) render(it, on);
  };

  chips.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    var i = $$('button', chips).indexOf(b);
    toggle(b.getAttribute('data-k'), false);
    var nb = $$('button', chips);
    (nb[i] || nb[i - 1] || send).focus();
  });
  $('.bp-clear', sum).addEventListener('click', function () {
    items.forEach(function (x) { toggle(x.key, false, true); });
    render();
    live.textContent = 'התוכנית נוקתה. הבסיס תמיד כלול.';
  });

  // the title block always follows the picks (DOM order = reading and Tab order); on desktop the board is the sticky column beside them
  board.hidden = false;
  sum.hidden = false;

  // ?pick=blog,panel preselects (keys from the inventory only; unknown keys are ignored)
  var first = 0, q = /[?&]pick=([^&#]*)/.exec(location.search);
  if (q) {
    try { decodeURIComponent(q[1]).split(',').forEach(function (k) { toggle(k.trim(), true, true); }); } catch (err) { /* malformed query: start empty */ }
    for (var i = 0; i < items.length; i++) if (picked[items[i].key]) { first = items[i].g; break; }
  }
  render();
  select(first);
})();
