/* Zstore Ai — main.js */
(function () {
  'use strict';

  /* flag JS availability — reveal-hiding styles only apply under html.js */
  document.documentElement.classList.add('js');

  /* ---------- header scroll state ---------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- mobile nav ---------- */
  var navToggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('main-nav');
  var closeNav = null;
  if (navToggle && nav) {
    // a history entry is pushed when the menu opens, so the device back
    // button closes the menu instead of leaving the page
    var menuStatePushed = false;
    var openNav = function () {
      nav.classList.add('open');
      navToggle.setAttribute('aria-expanded', 'true');
      try {
        history.pushState({ zsMenu: true }, '');
        menuStatePushed = true;
      } catch (err) { menuStatePushed = false; }
    };
    closeNav = function (viaHistory) {
      if (!nav.classList.contains('open')) return;
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      if (menuStatePushed && !viaHistory) {
        menuStatePushed = false;
        history.back();
      } else {
        menuStatePushed = false;
      }
    };
    navToggle.addEventListener('click', function () {
      if (nav.classList.contains('open')) closeNav(false);
      else openNav();
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        // navigation takes over — just close, leave history to the link
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        menuStatePushed = false;
      }
    });
    // tap anywhere outside the open menu closes it
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('open') && !nav.contains(e.target) && !navToggle.contains(e.target)) {
        closeNav(false);
      }
    });
    window.addEventListener('popstate', function () {
      if (nav.classList.contains('open')) closeNav(true);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        closeNav(false);
        navToggle.focus();
      }
    });
  }

  /* ---------- reveal on scroll (auto-attached site-wide) ---------- */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* motion is off when the OS asks for it OR the site's own accessibility toggle is on */
  var motionOff = function () {
    return reduced || document.documentElement.classList.contains('a11y-motion');
  };
  var autoTargets = document.querySelectorAll(
    '.section-head, .feat, .plan, .step, .faq-item, .split-media, .split-body, ' +
    '.showcase-card, .pkg-detail, .stat, .cta-final, .pkg-jump a, .footer-grid > *'
  );
  autoTargets.forEach(function (el, i) {
    if (!el.classList.contains('reveal')) {
      el.classList.add('reveal');
      el.style.transitionDelay = (i % 4) * 0.07 + 's';
    }
  });
  var revealEls = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- animated counters in the stats strip ---------- */
  var statEls = document.querySelectorAll('.stat b');
  if (!reduced && 'IntersectionObserver' in window && statEls.length) {
    var statIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        statIO.unobserve(entry.target);
        var el = entry.target;
        var m = /^(\d+)([+%]?)$/.exec(el.textContent.trim());
        if (!m) return;
        var target = parseInt(m[1], 10), suffix = m[2] || '';
        var t0 = null;
        var tick = function (ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / 1200, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    statEls.forEach(function (el) { statIO.observe(el); });
  }

  /* ---------- section titles: letter-by-letter reveal, re-triggered in both scroll directions ---------- */
  if (!reduced && 'IntersectionObserver' in window) {
    var titleEls = document.querySelectorAll('main h1, main h2, main .eyebrow, main .plan-name, main .plan-title');
    var toChars = function (str) {
      return Array.from ? Array.from(str) : str.split('');
    };
    var splitTitle = function (el) {
      var label = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      var chars = [];
      var walk = function (node) {
        if (node.nodeType === 3) {
          if (!node.nodeValue.trim()) return; // whitespace-only nodes stay untouched
          var frag = document.createDocumentFragment();
          node.nodeValue.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(' '));
              return;
            }
            // word wrapper keeps line-breaking intact once letters become inline-block
            var word = document.createElement('span');
            word.className = 'stw';
            // per-letter boxes break the browser's bidi ordering, so words are
            // rebuilt as direction runs: Hebrew runs stay rtl, Latin/digit runs
            // get dir="ltr" (otherwise "ChatGPT" renders reversed as "TPGtahC")
            var cs = toChars(part);
            var dirs = cs.map(function (ch) {
              if (/[֐-׿יִ-ﭏ]/.test(ch)) return 'r';
              if (/[A-Za-z0-9]/.test(ch)) return 'l';
              return 'n';
            });
            // neutrals (hyphens, punctuation) join equal neighbours, edges fall back to rtl
            for (var ni = 0; ni < dirs.length; ni++) {
              if (dirs[ni] !== 'n') continue;
              var nj = ni;
              while (nj < dirs.length && dirs[nj] === 'n') nj++;
              var prev = ni > 0 ? dirs[ni - 1] : null;
              var next = nj < dirs.length ? dirs[nj] : null;
              var resolved = (prev && prev === next) ? prev : 'r';
              for (; ni < nj; ni++) dirs[ni] = resolved;
            }
            var run = null, runDir = '';
            cs.forEach(function (ch, k) {
              if (!run || dirs[k] !== runDir) {
                runDir = dirs[k];
                run = document.createElement('span');
                run.className = 'str';
                run.dir = runDir === 'l' ? 'ltr' : 'rtl';
                word.appendChild(run);
              }
              var c = document.createElement('span');
              c.className = 'stc';
              c.textContent = ch;
              chars.push(c);
              run.appendChild(c);
            });
            frag.appendChild(word);
          });
          node.parentNode.replaceChild(frag, node);
        } else if (node.nodeType === 1 && node.nodeName.toLowerCase() !== 'svg') {
          Array.prototype.slice.call(node.childNodes).forEach(walk);
        }
      };
      // flex titles (like the eyebrow pills) must stay a single flex item,
      // otherwise every word becomes its own unwrappable item and the line
      // overflows on mobile — so the split lives inside one wrapper span
      var wrap = document.createElement('span');
      wrap.className = 'stx';
      while (el.firstChild) wrap.appendChild(el.firstChild);
      el.appendChild(wrap);
      Array.prototype.slice.call(wrap.childNodes).forEach(walk);
      if (!chars.length) return;
      // long titles get a tighter stagger so the whole reveal stays under ~0.9s
      var step = Math.min(30, Math.max(12, Math.round(620 / chars.length)));
      chars.forEach(function (c, i) { c.style.setProperty('--d', (i * step) + 'ms'); });
      if (label) el.setAttribute('aria-label', label);
      el.classList.add('st-split');
    };
    var titleIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('st-in', entry.isIntersecting);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
    titleEls.forEach(function (el) {
      // a failure in the splitter must never leave a title hidden or break the rest of the script
      try {
        splitTitle(el);
        if (el.classList.contains('st-split')) titleIO.observe(el);
      } catch (err) {
        el.classList.remove('st-split');
      }
    });
  }

  /* ---------- accessibility widget ---------- */
  var A11Y_KEY = 'zstore-a11y';
  var modes = ['fs-1', 'fs-2', 'contrast', 'dark', 'gray', 'links', 'motion', 'font', 'cursor'];
  var root = document.documentElement;

  function loadA11y() {
    try { return JSON.parse(localStorage.getItem(A11Y_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveA11y(state) {
    try { localStorage.setItem(A11Y_KEY, JSON.stringify(state)); } catch (e) { /* noop */ }
  }
  function applyA11y(state) {
    modes.forEach(function (m) { root.classList.toggle('a11y-' + m, !!state[m]); });
    document.querySelectorAll('.a11y-panel [data-a11y]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', state[btn.dataset.a11y] ? 'true' : 'false');
    });
  }

  var a11yState = loadA11y();
  applyA11y(a11yState);

  var a11yTriggers = Array.prototype.slice.call(
    document.querySelectorAll('.a11y-btn, .nav-a11y-mobile button')
  );
  var a11yPanel = document.querySelector('.a11y-panel');
  if (a11yTriggers.length && a11yPanel) {
    var setA11yExpanded = function (open) {
      a11yTriggers.forEach(function (t) { t.setAttribute('aria-expanded', open ? 'true' : 'false'); });
    };
    var lastA11yTrigger = null;
    var isFocusable = function (el) { return !!el && el.offsetParent !== null; };
    var closeA11yPanel = function (restoreFocus) {
      if (a11yPanel.hidden) return;
      a11yPanel.hidden = true;
      setA11yExpanded(false);
      if (!restoreFocus) return;
      // the trigger that opened the panel may be hidden by now: on mobile it lives inside
      // the hamburger menu, which closes behind the panel. focusing a hidden element fails
      // silently and strands the keyboard user, so fall back to something actually visible.
      var target = isFocusable(lastA11yTrigger) ? lastA11yTrigger : null;
      if (!target) {
        for (var i = 0; i < a11yTriggers.length; i++) {
          if (isFocusable(a11yTriggers[i])) { target = a11yTriggers[i]; break; }
        }
      }
      if (!target) target = document.querySelector('.nav-toggle');
      if (isFocusable(target)) target.focus();
    };
    a11yTriggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var willOpen = a11yPanel.hidden;
        a11yPanel.hidden = !willOpen;
        setA11yExpanded(willOpen);
        if (willOpen) {
          lastA11yTrigger = trigger;
          applyA11y(a11yState);
          // opening from the hamburger menu — close the menu behind it
          if (closeNav) closeNav(false);
          // the dialog receives keyboard focus so screen-reader and keyboard users land inside it
          var firstControl = a11yPanel.querySelector('button');
          if (firstControl) firstControl.focus();
        }
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !a11yPanel.hidden) {
        closeA11yPanel(true);
      }
    });
    document.addEventListener('click', function (e) {
      var onTrigger = a11yTriggers.some(function (t) { return t.contains(e.target); });
      if (!a11yPanel.hidden && !a11yPanel.contains(e.target) && !onTrigger) {
        closeA11yPanel(false);
      }
    });
    a11yPanel.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      if (btn.classList.contains('a11y-close')) {
        closeA11yPanel(true);
        return;
      }
      if (btn.classList.contains('a11y-reset')) {
        a11yState = {};
      } else if (btn.dataset.a11y) {
        var key = btn.dataset.a11y;
        // font sizes are mutually exclusive
        if (key === 'fs-1' && !a11yState['fs-1']) a11yState['fs-2'] = false;
        if (key === 'fs-2' && !a11yState['fs-2']) a11yState['fs-1'] = false;
        // contrast modes are mutually exclusive
        if (key === 'contrast' && !a11yState.contrast) { a11yState.dark = false; a11yState.gray = false; }
        if (key === 'dark' && !a11yState.dark) { a11yState.contrast = false; a11yState.gray = false; }
        if (key === 'gray' && !a11yState.gray) { a11yState.contrast = false; a11yState.dark = false; }
        a11yState[key] = !a11yState[key];
      }
      saveA11y(a11yState);
      applyA11y(a11yState);
    });
  }

  /* ---------- scroll progress bar ---------- */
  var progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);
  var progressTicking = false;
  var updateProgress = function () {
    progressTicking = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    progress.style.transform = 'scaleX(' + p + ')';
  };
  window.addEventListener('scroll', function () {
    if (!progressTicking) {
      progressTicking = true;
      requestAnimationFrame(updateProgress);
    }
  }, { passive: true });
  updateProgress();

  /* ---------- hero mouse parallax (desktop pointers only) ---------- */
  var hero = document.querySelector('.hero');
  var heroVisual = document.querySelector('.hero-visual');
  if (hero && heroVisual && !reduced && window.matchMedia('(pointer: fine)').matches) {
    heroVisual.classList.add('hero-parallax');
    var parallaxTicking = false;
    var px = 0, py = 0;
    hero.addEventListener('pointermove', function (e) {
      if (motionOff()) return;
      var r = hero.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width - 0.5;
      py = (e.clientY - r.top) / r.height - 0.5;
      if (!parallaxTicking) {
        parallaxTicking = true;
        requestAnimationFrame(function () {
          parallaxTicking = false;
          heroVisual.style.transform = 'translate3d(' + (px * -14) + 'px,' + (py * -10) + 'px,0)';
        });
      }
    });
    hero.addEventListener('pointerleave', function () {
      heroVisual.style.transform = 'translate3d(0,0,0)';
    });
  }

  /* ---------- back to top ---------- */
  var toTop = document.createElement('button');
  toTop.className = 'to-top';
  toTop.setAttribute('aria-label', 'חזרה לראש העמוד');
  toTop.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(toTop);
  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: motionOff() ? 'auto' : 'smooth' });
  });
  var toTopTicking = false;
  window.addEventListener('scroll', function () {
    if (!toTopTicking) {
      toTopTicking = true;
      requestAnimationFrame(function () {
        toTopTicking = false;
        toTop.classList.toggle('show', window.scrollY > 650);
      });
    }
  }, { passive: true });

  /* ---------- page transition fallback (browsers without view transitions) ---------- */
  var supportsVT = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('view-transition-name: x');
  if (!supportsVT && !reduced) {
    document.addEventListener('click', function (e) {
      if (motionOff()) return;
      var a = e.target.closest('a');
      if (!a || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== '_self') return;
      if (a.hasAttribute('download')) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
      // same-page anchors keep native smooth scrolling
      if (url.pathname === location.pathname && url.hash) return;
      e.preventDefault();
      document.documentElement.classList.add('page-leave');
      setTimeout(function () { location.href = url.href; }, 210);
    });
    // returning via back/forward cache — make sure the page is visible again
    window.addEventListener('pageshow', function () {
      document.documentElement.classList.remove('page-leave');
    });
  }

  /* ---------- current year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
