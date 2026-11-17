// online-stores "המדף והעגלה": catalog-size picker, aisle tabs, hang-tag shelf (add to cart),
// perforated packing slip that sends the cart to WhatsApp. html.mk-js = enhanced layout,
// html.mk-on = motion allowed (gates every animated start state in online-stores.css).
(function () {
 'use strict';
 var d = document, W = window, root = d.documentElement;
 root.classList.add('mk-js');
 var red = W.matchMedia ? W.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
 var hasIO = 'IntersectionObserver' in W;
 var on = function () { return !red.matches && !root.classList.contains('a11y-motion'); };
 var sync = function () { var want = hasIO && on(); if (root.classList.contains('mk-on') !== want) root.classList.toggle('mk-on', want); };
 sync();
 if (W.MutationObserver) new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
 if (red.addEventListener) red.addEventListener('change', sync);

 var $ = function (s, c) { return (c || d).querySelector(s); };
 var $$ = function (s, c) { return [].slice.call((c || d).querySelectorAll(s)); };
 var beh = function () { return on() ? 'smooth' : 'auto'; };
 // one-shot: when `watch` enters the screen, `el` gets `cls`
 var once = function (watch, el, cls) {
  if (!watch || !el) return;
  if (!hasIO) { el.classList.add(cls); return; }
  var io = new IntersectionObserver(function (es) {
   if (es[0].isIntersecting) { io.disconnect(); el.classList.add(cls); }
  }, { threshold: 0.35 });
  io.observe(watch);
 };
 // packing-list ticks pop in row by row as each row reaches the screen
 var kl = $$('.mk-kit-list li');
 if (hasIO) {
  var kio = new IntersectionObserver(function (es) {
   var n = 0;
   es.forEach(function (e) {
    if (!e.isIntersecting) return;
    e.target.style.setProperty('--k', n++); e.target.classList.add('mk-in'); kio.unobserve(e.target);
   });
  }, { threshold: 0.6 });
  kl.forEach(function (li) { kio.observe(li); });
 } else kl.forEach(function (li) { li.classList.add('mk-in'); });
 once($('.mk-box'), $('.mk-kit'), 'mk-in');
 once($('.mk-signs'), $('.mk-how'), 'mk-in');

 /* ---------- the shop ---------- */
 var store = $('[data-mk-store]');
 if (!store) return;
 var aisles = $$('.mk-aisle', store), tags = $$('.mk-tag', store);
 var live = $('[data-mk-live]', store), countEl = $('[data-mk-count]', store), list = $('[data-mk-list]', store);
 var empty = $('[data-mk-empty]', store), wa = $('[data-mk-wa]', store), slipSize = $('[data-mk-slipsize]', store);
 var clearBtn = $('[data-mk-clear]', store), hint = $('[data-mk-hint]', store), slipWrap = $('[data-mk-slipwrap]', store), slipTitle = $('#mk-slip-title');
 ['[data-mk-bar]', '[data-mk-size]', '[data-mk-slipwrap]'].forEach(function (s) { var el = $(s, store); if (el) el.hidden = false; });

 var NAMES = {}, byKey = {}, cart = [], size = '', cur = 0;
 var SIZE = { small: 'קטלוג ממוקד', mid: 'קטלוג מתרחב', large: 'קטלוג גדול' };
 var REC = { mid: ['unlimited', 'variants', 'filters'], large: ['unlimited', 'variants', 'filters', 'search'] };
 var HINT = {
  '': hint.textContent,
  small: 'לקטלוג ממוקד, ערכת הפתיחה עושה את רוב העבודה. הוסיפו מהמדף רק את מה שחסר לכם.',
  mid: 'סימנו לכם על המדף מה מומלץ לקטלוג מתרחב. להוסיף או לא, ההחלטה שלכם.',
  large: 'סימנו לכם על המדף מה מומלץ לקטלוג גדול. להוסיף או לא, ההחלטה שלכם.'
 };
 var say = function (t) { live.textContent = ''; setTimeout(function () { live.textContent = t; }, 60); };
 var ico = function (cls, p) { return '<svg class="' + cls + '" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="' + p + '"/></svg>'; };
 // horizontal-only reveal inside a scroll row (never scrolls the page)
 var hscroll = function (sc, el) {
  if (!sc || sc.scrollWidth <= sc.clientWidth + 1) return;
  var r = el.getBoundingClientRect(), s = sc.getBoundingClientRect(), pad = 16, dx = 0;
  // only when the element is really cut off (a snapped card sits ~14px from the edge; a 2px nudge made scroll-snap jump a card back)
  if (r.right > s.right + 2) dx = r.right - s.right + pad;
  else if (r.left < s.left - 2) dx = r.left - s.left - pad;
  if (dx) sc.scrollBy({ left: dx, behavior: beh() });
 };

 tags.forEach(function (li) {
  var k = li.getAttribute('data-pick'), name = $('.mk-name', li).textContent.trim(), card = $('.mk-card', li);
  NAMES[k] = name; byKey[k] = li;
  var rec = d.createElement('span');
  rec.className = 'mk-rec'; rec.hidden = true; rec.textContent = 'מומלץ לקטלוג שלכם';
  card.appendChild(rec);
  var b = d.createElement('button');
  b.type = 'button'; b.className = 'mk-add';
  b.setAttribute('aria-pressed', 'false');
  b.setAttribute('aria-label', 'להוסיף לעגלה: ' + name);
  b.innerHTML = '<span class="mk-add-ico">' + ico('mk-n', 'M12 6v12M6 12h12') + ico('mk-y', 'm6 12 4 4 8-8') +
   '</span><span class="mk-n">להוסיף לעגלה</span><span class="mk-y">בעגלה</span>';
  b.addEventListener('click', function () { toggle(k); });
  card.appendChild(b);
 });

 /* aisle tabs (roving tabindex, automatic activation) + a "next aisle" hook at the end of every shelf */
 var bar = d.createElement('div');
 bar.className = 'mk-tabs';
 bar.setAttribute('role', 'tablist');
 bar.setAttribute('aria-label', 'מעברים במדף');
 var aisleName = function (sec) { return $('h3', sec).textContent.split('·')[1].trim(); };
 var tabs = aisles.map(function (sec, i) {
  var id = 'mk-tab-' + (i + 1), pid = 'mk-aisle-' + (i + 1), last = i === aisles.length - 1;
  sec.id = pid;
  sec.setAttribute('role', 'tabpanel');
  sec.setAttribute('aria-labelledby', id);
  var t = d.createElement('button');
  t.type = 'button'; t.className = 'mk-tab'; t.id = id;
  t.setAttribute('role', 'tab');
  t.setAttribute('aria-controls', pid);
  t.innerHTML = '<span class="mk-tab-no" aria-hidden="true">' + (i + 1) + '</span><span>' +
   $('h3', sec).innerHTML.split('·')[1].trim() + '</span><span class="sr-only" hidden>, יש המלצה</span><span class="mk-tab-count" hidden></span>';
  t.addEventListener('click', function () { select(i); });
  bar.appendChild(t);
  var nx = d.createElement('li');
  nx.className = 'mk-next';
  nx.innerHTML = '<button type="button" class="mk-next-btn"><span>' + (last ? 'לעגלה' : 'למעבר הבא') +
   ' <span aria-hidden="true">←</span></span><small></small></button>';
  $('small', nx).textContent = last ? 'לסכם ולשלוח בוואטסאפ' : aisleName(aisles[i + 1]);
  $('button', nx).addEventListener('click', function () {
   if (last) { goSlip(); return; }
   select(i + 1);
   var f = $('.mk-add', aisles[i + 1]);
   if (f) f.focus({ preventScroll: true });
   say('מעבר ' + (i + 2) + ': ' + aisleName(aisles[i + 1]));
  });
  $('.mk-shelf', sec).appendChild(nx);
  return t;
 });
 $('.mk-top', store).appendChild(bar);

 /* "the whole shelf in one list": drops the tabs and shows every aisle (no horizontal scroll) */
 var allBtn = d.createElement('button'), all = false;
 allBtn.type = 'button'; allBtn.className = 'mk-all-btn';
 allBtn.setAttribute('aria-pressed', 'false');
 allBtn.innerHTML = '<span class="mk-all-sw" aria-hidden="true"></span>לראות את כל המדף ברשימה אחת';
 allBtn.addEventListener('click', function () {
  all = !all;
  allBtn.setAttribute('aria-pressed', all ? 'true' : 'false');
  store.classList.toggle('mk-all', all);
  bar.hidden = all;
  aisles.forEach(function (a, j) {
   if (all) { a.hidden = false; a.removeAttribute('role'); a.setAttribute('aria-labelledby', 'mk-a' + (j + 1)); }
   else { a.setAttribute('role', 'tabpanel'); a.setAttribute('aria-labelledby', tabs[j].id); }
  });
  if (!all) select(cur);
  say(all ? 'כל המדף מוצג ברשימה אחת.' : 'המדף מוצג לפי מעברים.');
 });
 $('.mk-top', store).appendChild(allBtn);

 function select(i, focus) {
  cur = i;
  tabs.forEach(function (t, j) {
   var s = j === i;
   t.setAttribute('aria-selected', s ? 'true' : 'false');
   t.tabIndex = s ? 0 : -1;
   aisles[j].hidden = !s;
  });
  var sh = $('.mk-shelf', aisles[i]);
  if (sh) sh.scrollLeft = 0;
  if (focus) tabs[i].focus();
  hscroll(bar, tabs[i]);
 }
 bar.addEventListener('keydown', function (e) {
  var n = tabs.length, i = cur, rtl = W.getComputedStyle(bar).direction === 'rtl', k = e.key;
  if (k === 'ArrowLeft') i += rtl ? 1 : -1;
  else if (k === 'ArrowRight') i += rtl ? -1 : 1;
  else if (k === 'Home') i = 0;
  else if (k === 'End') i = n - 1;
  else return;
  e.preventDefault();
  select((i + n) % n, true);
 });
 store.addEventListener('focusin', function (e) {
  var li = e.target.closest && e.target.closest('.mk-shelf > li');
  if (li) hscroll(li.parentNode, li);
 });

 function goSlip() {
  slipWrap.scrollIntoView({ block: 'start', behavior: beh() });
  slipTitle.focus({ preventScroll: true });
 }

 function msg() {
  var s = size ? SIZE[size] : '';
  if (!cart.length) return 'היי! אשמח לחנות אונליין עם ערכת הפתיחה, ולשמוע מה עוד מתאים לי.' + (s ? '\nגודל הקטלוג: ' + s : '');
  return 'היי! מילאתי באתר עגלה לחנות שלי.\nגודל הקטלוג: ' + (s || 'עוד לא בטוחים') + '\nמה בעגלה:\n' +
   cart.map(function (k) { return '• ' + NAMES[k]; }).join('\n') + '\nאשמח להצעת מחיר אישית.';
 }

 function render(nk) {
  countEl.textContent = cart.length;
  list.textContent = '';
  cart.forEach(function (k) {
   var li = d.createElement('li'), sp = d.createElement('span'), x = d.createElement('button');
   if (k === nk) li.className = 'is-new';
   sp.textContent = NAMES[k];
   x.type = 'button'; x.className = 'mk-x'; x.textContent = '×';
   x.setAttribute('aria-label', 'הסרה מהעגלה: ' + NAMES[k]);
   x.addEventListener('click', function () { drop(k); });
   li.appendChild(sp); li.appendChild(x);
   list.appendChild(li);
  });
  empty.hidden = cart.length > 0;
  tabs.forEach(function (t, j) {
   var c = $$('.mk-tag.is-in', aisles[j]).length, b = $('.mk-tab-count', t);
   b.hidden = !c; b.innerHTML = c + '<span class="sr-only"> בעגלה</span>';
  });
  clearBtn.hidden = !cart.length;
  slipSize.textContent = size ? SIZE[size] : 'נבחר יחד';
  wa.href = 'https://wa.me/972587292029?text=' + encodeURIComponent(msg());
 }

 function bump() {
  if (!on() || !countEl.animate) return;
  countEl.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.4)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
 }

 function toggle(k, quiet) {
  var at = cart.indexOf(k), li = byKey[k], add = at < 0;
  if (add) cart.push(k); else cart.splice(at, 1);
  li.classList.toggle('is-in', add);
  $('.mk-add', li).setAttribute('aria-pressed', add ? 'true' : 'false');
  if (add && !quiet && on() && li.animate) {
   li.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(4deg)' }, { transform: 'rotate(-1deg)' }, { transform: 'rotate(2deg)' }],
    { duration: 700, easing: 'ease-out' });
  }
  render(add && !quiet ? k : null);
  if (quiet) return;
  bump();
  say(add ? 'נוסף לעגלה: ' + NAMES[k] + '. בעגלה ' + cart.length + '.' : 'הוסר מהעגלה: ' + NAMES[k] + '.');
 }

 // removing from the slip keeps keyboard focus inside the slip
 function drop(k) {
  var i = cart.indexOf(k);
  toggle(k);
  var xs = $$('.mk-x', list);
  (xs[i] || xs[i - 1] || slipTitle).focus();
 }

 clearBtn.addEventListener('click', function () {
  if (!cart.length) return;
  cart.slice().forEach(function (k) { toggle(k, true); });
  say('העגלה רוקנה. ערכת הפתיחה עדיין כלולה.');
 });

 function setSize(v, quiet) {
  if (!SIZE[v]) return;
  size = v;
  $$('.mk-size-opt', store).forEach(function (l) {
   var inp = $('input', l), sel = inp.value === v;
   if (sel) inp.checked = true;
   l.classList.toggle('is-on', sel);
  });
  var rec = REC[v] || [];
  tags.forEach(function (li) { $('.mk-rec', li).hidden = rec.indexOf(li.getAttribute('data-pick')) < 0; });
  aisles.forEach(function (a, j) {
   var r = !!$('.mk-rec:not([hidden])', a);
   tabs[j].classList.toggle('has-rec', r); $('.sr-only', tabs[j]).hidden = !r;
  });
  hint.textContent = HINT[v];
  render(null);
  if (!quiet) say('גודל הקטלוג: ' + SIZE[v] + '.' + (rec.length ? ' סימנו על המדף מה מומלץ.' : ''));
 }
 $$('input[name="mk-size"]', store).forEach(function (r) {
  r.addEventListener('change', function () { if (r.checked) setSize(r.value); });
 });

 /* deep links from the home quiz: ?size=small|mid|large&pick=key1,key2 */
 if (W.URLSearchParams) {
  var q = new URLSearchParams(location.search);
  setSize(q.get('size') || '', true);
  (q.get('pick') || '').split(',').forEach(function (k) {
   k = k.trim();
   if (byKey[k] && cart.indexOf(k) < 0) toggle(k, true);
  });
 }
 render(null);
 select(0);
})();
