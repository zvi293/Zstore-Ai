/* Zstore Ai — main.js */
(function () {
  'use strict';

  /* flag JS availability — reveal-hiding styles only apply under html.js */
  document.documentElement.classList.add('js');

  /* ---------- "scrolled past N px" flags without a scroll listener ---------- */
  /* an invisible block covers the top N px of the page; once it has left the
     viewport the page is past N. IntersectionObserver reports that after the
     frame, so nothing reads scrollY while the finger moves — on phones every
     such read forced a full style recalc in the middle of the scroll */
  var whenPast = function (px, onChange) {
    if (!('IntersectionObserver' in window)) {
      var ticking = false;
      var check = function () { ticking = false; onChange(window.scrollY > px); };
      window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(check); }
      }, { passive: true });
      check();
      return;
    }
    var probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:' + px + 'px;visibility:hidden;pointer-events:none';
    document.body.appendChild(probe);
    new IntersectionObserver(function (entries) {
      onChange(!entries[entries.length - 1].isIntersecting);
    }).observe(probe);
  };

  /* ---------- header scroll state ---------- */
  var header = document.querySelector('.site-header');
  if (header) {
    whenPast(8, function (past) { header.classList.toggle('scrolled', past); });
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
    '.section-head, .plan, .step, .faq-item, .split-media, .split-body, ' +
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

  /* ---------- long-running animations pause while offscreen ---------- */
  /* marquees, tickers, blurred orbs and glow loops otherwise keep the compositor
     busy across the whole page height — a big source of scroll jank on phones.
     every running loop is also re-styled on each frame, so even the tiny ones
     (eyebrow pulse dots, floating collage images and order pops) park offscreen */
  if ('IntersectionObserver' in window) {
    var loopers = document.querySelectorAll(
      '.hero, .marquee-row, .ticker-x, .orb, .deco-tile, .hotspots, ' +
      '.plan-featured, .pkg-detail.featured, .pkg-sum, .pkg-jump, .cta-final, .stats-strip, .ai-section, ' +
      '.eyebrow, .split-media, .pkg-hero-media, .pkg-link, .chat-demo'
    );
    if (loopers.length) {
      var loopIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle('anim-idle', !entry.isIntersecting);
        });
      }, { rootMargin: '160px 0px 160px 0px' });
      loopers.forEach(function (el) { loopIO.observe(el); });
    }
  }

  /* ---------- chat demo: the conversation replays on every re-entry ---------- */
  /* two watchers with disjoint boundaries (same pattern as the title reveals):
     show at the first visible sliver, reset only once fully offscreen, so the
     staged bubbles type themselves again in BOTH scroll directions */
  var chatDemo = document.querySelector('.chat-demo');
  if (chatDemo && !reduced && 'IntersectionObserver' in window) {
    var chatShow = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.25 });
    var chatReset = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        /* with the widget's stop-animations toggle on, the demo stays a static picture */
        if (motionOff()) return;
        if (!entry.isIntersecting) entry.target.classList.remove('visible');
      });
    }, { rootMargin: '120px 0px 120px 0px' });
    chatShow.observe(chatDemo);
    chatReset.observe(chatDemo);
  }

  /* ---------- animated counters in the stats strip ---------- */
  var statEls = document.querySelectorAll('.stat b');
  if (!reduced && 'IntersectionObserver' in window && statEls.length) {
    var statIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        statIO.unobserve(entry.target);
        /* the widget's "stop animations" toggle must silence the counters too —
           the markup already holds the final value, so skipping is enough */
        if (motionOff()) return;
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

  /* ---------- why-us hotspots (tablist: click / hover / arrows, auto-cycles until touched) ---------- */
  var hotspots = document.querySelector('.hotspots');
  if (hotspots) {
    var pins = [].slice.call(hotspots.querySelectorAll('.hs-pin'));
    var panels = [].slice.call(hotspots.querySelectorAll('.hs-panel'));
    var lines = [].slice.call(hotspots.querySelectorAll('.hs-line'));
    var active = 0;
    var cycle = null;
    var userTouched = false;

    var setActive = function (i, focusPin) {
      active = (i + pins.length) % pins.length;
      pins.forEach(function (pin, k) {
        var on = k === active;
        pin.classList.toggle('is-active', on);
        pin.setAttribute('aria-selected', on ? 'true' : 'false');
        pin.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (panel, k) { panel.classList.toggle('is-active', k === active); });
      lines.forEach(function (line, k) { line.classList.toggle('is-live', k === active); });
      if (focusPin) pins[active].focus();
    };

    var stopCycle = function () {
      if (!cycle) return;
      clearInterval(cycle);
      cycle = null;
    };
    /* the carousel is a hint that the pins are live — any real interaction ends it for good */
    var endCycle = function () { userTouched = true; stopCycle(); };
    var startCycle = function () {
      if (cycle || userTouched || motionOff()) return;
      cycle = setInterval(function () { setActive(active + 1); }, 4200);
    };

    pins.forEach(function (pin, i) {
      pin.addEventListener('click', function () { endCycle(); setActive(i); });
      pin.addEventListener('mouseenter', function () { endCycle(); setActive(i); });
      pin.addEventListener('keydown', function (e) {
        var step = 0;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') step = 1;
        else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') step = -1;
        else if (e.key === 'Home') { e.preventDefault(); endCycle(); setActive(0, true); return; }
        else if (e.key === 'End') { e.preventDefault(); endCycle(); setActive(pins.length - 1, true); return; }
        if (!step) return;
        e.preventDefault();
        endCycle();
        setActive(active + step, true);
      });
    });

    setActive(0);
    /* only cycle while the section is actually on screen */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) startCycle();
          else stopCycle();
        });
      }, { threshold: 0.35 }).observe(hotspots);
    }
  }

  /* ---------- section titles: letter-by-letter reveal, re-triggered in both scroll directions ---------- */
  if (!reduced && 'IntersectionObserver' in window) {
    var titleEls = document.querySelectorAll('main h1, main h2, main .eyebrow, main .plan-name, main .plan-title');
    var toChars = function (str) {
      return Array.from ? Array.from(str) : str.split('');
    };
    var splitTitle = function (el) {
      // textContent skips layout (innerText forces a reflow per title), but it
      // drops the implicit break of <br> — restore it via a throwaway clone
      var labelSrc = el.cloneNode(true);
      Array.prototype.slice.call(labelSrc.querySelectorAll('br')).forEach(function (br) {
        br.parentNode.replaceChild(document.createTextNode(' '), br);
      });
      var label = (labelSrc.textContent || '').replace(/\s+/g, ' ').trim();
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
      if (label) {
        if (el.tagName === 'P') {
          // aria-label is not supported on paragraphs — hide the char spans
          // from assistive tech and give it one plain text copy instead
          wrap.setAttribute('aria-hidden', 'true');
          var sr = document.createElement('span');
          sr.className = 'sr-only';
          sr.textContent = label;
          el.appendChild(sr);
        } else {
          el.setAttribute('aria-label', label);
        }
      }
      el.classList.add('st-split');
    };
    // titles replay in both scroll directions everywhere. Desktop also melts the
    // letters away as a title leaves; on touch screens that outgoing transition
    // storm janks fast flicks, so phones reset instantly (a mobile CSS rule strips
    // the outgoing transition) and only once the title is far offscreen —
    // the staggered rise-in still replays whenever it comes back from afar
    var meltAway = window.matchMedia('(min-width: 921px) and (pointer: fine)').matches;
    var observeTitle;
    if (meltAway) {
      var titleIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle('st-in', entry.isIntersecting);
        });
      }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
      observeTitle = function (el) { titleIO.observe(el); };
    } else {
      // phones: two watchers with disjoint boundaries, no ratio thresholds —
      // threshold-0 crossings fire reliably in BOTH scroll directions, where a
      // fractional threshold can report a hair under its own value at the exact
      // crossing moment and silently skip the reveal.
      // showIO arms the reveal at the first visible sliver; resetIO disarms it
      // only once the title is a screen and a half outside the viewport. A short
      // scroll back therefore finds the title still standing — resetting at the
      // edge made titles blank out and redraw in view (the flicker on phones)
      var showIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.classList.add('st-in');
        });
      }, { rootMargin: '0px 0px -6% 0px' });
      var resetIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) entry.target.classList.remove('st-in');
        });
      }, { rootMargin: '150% 0px 150% 0px' });
      observeTitle = function (el) { showIO.observe(el); resetIO.observe(el); };
    }
    titleEls.forEach(function (el) {
      // a failure in the splitter must never leave a title hidden or break the rest of the script
      try {
        splitTitle(el);
        if (el.classList.contains('st-split')) observeTitle(el);
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
    // role=dialog expects contained focus: when Tab walks out of the open panel, close it
    a11yPanel.addEventListener('focusout', function () {
      requestAnimationFrame(function () {
        if (!a11yPanel.hidden && !a11yPanel.contains(document.activeElement)) {
          closeA11yPanel(false);
        }
      });
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
  /* where supported, a CSS scroll-driven animation moves the bar on the
     compositor with no JS at all (style.css); this fallback serves the rest */
  var progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);
  var cssProgress = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('animation-timeline: scroll()');
  if (!cssProgress) {
    // the scroll range is cached and refreshed only when the page resizes,
    // so each frame reads nothing but scrollY (scrollHeight forced a layout)
    var maxScroll = 0;
    var measureMax = function () {
      maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    };
    var progressTicking = false;
    var updateProgress = function () {
      progressTicking = false;
      var p = maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0;
      progress.style.transform = 'scaleX(' + p + ')';
    };
    measureMax();
    if ('ResizeObserver' in window) new ResizeObserver(measureMax).observe(document.body);
    window.addEventListener('resize', measureMax, { passive: true });
    window.addEventListener('scroll', function () {
      if (!progressTicking) {
        progressTicking = true;
        requestAnimationFrame(updateProgress);
      }
    }, { passive: true });
    updateProgress();
  }

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

  /* ---------- floating package tabs (package pages) ---------- */
  /* a sticky pill bar over the packages area: shows which package is on screen
     and jumps between them. Built from the hero's .pkg-jump links, so every
     package page gets it with zero markup changes */
  var pkgStage = document.querySelector('.pkg-stage');
  if (pkgStage) {
    var pkgTabs = [];
    var tabsBar = pkgStage.querySelector('.pkg-tabs');
    if (tabsBar) {
      /* the bar ships as static HTML on the package pages (no layout shift on load) —
         just index its tabs and wire the scrollspy below */
      [].slice.call(tabsBar.querySelectorAll('.pkg-tab')).forEach(function (tab) {
        var id = (tab.getAttribute('href') || '').slice(1);
        var target = id && document.getElementById(id);
        if (target) pkgTabs.push({ id: id, tab: tab, target: target });
      });
    } else {
      /* fallback for pages without static markup: build it from the hero's .pkg-jump links */
      tabsBar = document.createElement('nav');
      tabsBar.className = 'pkg-tabs';
      tabsBar.setAttribute('aria-label', 'ניווט בין חבילות');
      var tabsInner = document.createElement('div');
      tabsInner.className = 'pkg-tabs-in';
      tabsBar.appendChild(tabsInner);
      [].slice.call(document.querySelectorAll('.pkg-jump a')).forEach(function (link) {
        var id = (link.getAttribute('href') || '').slice(1);
        var target = id && document.getElementById(id);
        if (!target) return;
        var parts = ((link.querySelector('span') || link).textContent || '')
          .replace('⭐', '').split('·');
        var tab = document.createElement('a');
        tab.href = '#' + id;
        tab.className = 'pkg-tab';
        if (link.classList.contains('featured')) {
          tab.classList.add('featured');
          tab.insertAdjacentHTML('beforeend',
            '<svg class="pkg-tab-crown" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 7.5l4.6 3.9L12 4.5l4.4 6.9L21 7.5l-1.7 10.4a1.6 1.6 0 0 1-1.6 1.35H6.3a1.6 1.6 0 0 1-1.6-1.35L3 7.5z"/></svg>');
        }
        var tier = document.createElement('b');
        tier.textContent = (parts[0] || '').trim();
        tab.appendChild(tier);
        if (parts[1]) {
          var nick = document.createElement('span');
          nick.className = 'pkg-tab-name';
          nick.textContent = parts[1].trim();
          tab.appendChild(nick);
        }
        tabsInner.appendChild(tab);
        pkgTabs.push({ id: id, tab: tab, target: target });
      });
      if (pkgTabs.length > 1) pkgStage.insertBefore(tabsBar, pkgStage.firstChild);
    }
    if (pkgTabs.length > 1) {
      var setPkgTab = function (id) {
        pkgTabs.forEach(function (t) {
          var on = t.id === id;
          t.tab.classList.toggle('is-active', on);
          if (on) t.tab.setAttribute('aria-current', 'true');
          else t.tab.removeAttribute('aria-current');
        });
      };
      setPkgTab(pkgTabs[0].id);
      if ('IntersectionObserver' in window) {
        /* scrollspy: whichever package covers the band around the viewport's
           centre is the active one; in the gaps the last choice simply holds */
        var pkgSpy = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) setPkgTab(entry.target.id);
          });
        }, { rootMargin: '-42% 0px -52% 0px' });
        pkgTabs.forEach(function (t) { pkgSpy.observe(t.target); });
      }
    }
  }

  /* ---------- guide pages: reading progress + floating table of contents (built from the page's h2s) ---------- */
  if (/^\/guides\/(?!glossary\/)[^/]+\/?$/.test(location.pathname)) {
    var tocMain = document.querySelector('main');
    var tocHeads = tocMain ? [].slice.call(tocMain.querySelectorAll('h2')).filter(function (h) {
      return !h.closest('.cta-final, .guide-related') && h.textContent.trim();
    }) : [];
    if (tocHeads.length >= 3) {
      /* top progress bar */
      var rp = document.createElement('div');
      rp.className = 'read-progress';
      rp.setAttribute('aria-hidden', 'true');
      rp.innerHTML = '<span></span>';
      document.body.appendChild(rp);
      var rpFill = rp.firstChild;

      /* floating button with a progress ring + panel */
      var tocWrap = document.createElement('div');
      tocWrap.className = 'toc-float';
      tocWrap.innerHTML =
        '<button type="button" class="toc-btn" aria-expanded="false" aria-controls="toc-panel">' +
          '<svg class="toc-ring" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="19"></circle><circle class="toc-ring-fill" cx="22" cy="22" r="19"></circle></svg>' +
          '<svg class="toc-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>' +
          '<span class="toc-label">תוכן עניינים</span>' +
        '</button>' +
        '<nav class="toc-panel" id="toc-panel" aria-label="תוכן עניינים" hidden><p class="toc-title">במדריך הזה</p><ol></ol></nav>';
      document.body.appendChild(tocWrap);
      var tocBtn = tocWrap.querySelector('.toc-btn');
      var tocPanel = tocWrap.querySelector('.toc-panel');
      var tocList = tocPanel.querySelector('ol');
      var ring = tocWrap.querySelector('.toc-ring-fill');
      var RING = 2 * Math.PI * 19;
      ring.style.strokeDasharray = RING;
      ring.style.strokeDashoffset = RING;

      var tocLinks = tocHeads.map(function (h, i) {
        if (!h.id) h.id = 'toc-' + (i + 1);
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent.replace(/\s+/g, ' ').trim();
        li.appendChild(a);
        tocList.appendChild(li);
        a.addEventListener('click', function (e) {
          e.preventDefault();
          closeToc(false);
          var y = h.getBoundingClientRect().top + window.pageYOffset - 110;
          window.scrollTo({ top: y, behavior: motionOff() ? 'auto' : 'smooth' });
          h.setAttribute('tabindex', '-1');
          h.focus({ preventScroll: true });
        });
        return a;
      });

      var openToc = function () {
        tocPanel.hidden = false;
        tocBtn.setAttribute('aria-expanded', 'true');
        tocWrap.classList.add('is-open');
        var cur = tocList.querySelector('[aria-current]') || tocLinks[0];
        cur.focus();
      };
      var closeToc = function (refocus) {
        if (tocPanel.hidden) return;
        tocPanel.hidden = true;
        tocBtn.setAttribute('aria-expanded', 'false');
        tocWrap.classList.remove('is-open');
        if (refocus) tocBtn.focus();
        /* lets the floating-buttons logic below re-check whether it should step aside */
        tocWrap.dispatchEvent(new Event('tocclose'));
      };
      tocBtn.addEventListener('click', function () { if (tocPanel.hidden) openToc(); else closeToc(true); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeToc(true); });
      document.addEventListener('click', function (e) { if (!tocWrap.contains(e.target)) closeToc(false); });

      /* active section */
      if ('IntersectionObserver' in window) {
        var tocIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            var i = tocHeads.indexOf(en.target);
            tocLinks.forEach(function (a, k) {
              if (k === i) a.setAttribute('aria-current', 'true');
              else a.removeAttribute('aria-current');
            });
          });
        }, { rootMargin: '-15% 0px -70% 0px' });
        tocHeads.forEach(function (h) { tocIO.observe(h); });
      }

      /* progress: one rAF per scroll burst, transform-only */
      var rpTick = false;
      var rpUpdate = function () {
        rpTick = false;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var p = max > 0 ? Math.min(1, Math.max(0, window.pageYOffset / max)) : 0;
        rpFill.style.transform = 'scaleX(' + p + ')';
        ring.style.strokeDashoffset = RING * (1 - p);
      };
      window.addEventListener('scroll', function () {
        if (!rpTick) { rpTick = true; requestAnimationFrame(rpUpdate); }
      }, { passive: true });
      rpUpdate();
      whenPast(520, function (past) { tocWrap.classList.toggle('show', past); if (!past) closeToc(false); });
    }
  }

  /* ---------- home: "which site fits you?" quiz (questions live in the HTML; JS turns them into steps) ---------- */
  var quiz = document.querySelector('[data-quiz]');
  if (quiz) {
    var qSteps = [].slice.call(quiz.querySelectorAll('[data-qz-step]'));
    var qBar = quiz.querySelector('[data-qz-bar]');
    var qCount = quiz.querySelector('[data-qz-count]');
    var qLive = quiz.querySelector('[data-qz-live]');
    var qNav = quiz.querySelector('[data-qz-nav]');
    var qBack = quiz.querySelector('[data-qz-back]');
    var qNext = quiz.querySelector('[data-qz-next]');
    var qRes = quiz.querySelector('[data-qz-result]');
    var qAt = 0;
    /* one offer, no packages: the answers pick a site type, a scope track and the services worth choosing */
    var TYPE = { biz: 'אתר תדמית', store: 'חנות אונליין', both: 'חנות + עמודי תדמית' };
    var TRACK = { biz: ['מסלול ממוקד', 'מסלול מתרחב', 'מסלול רחב'], store: ['קטלוג ממוקד', 'קטלוג מתרחב', 'קטלוג גדול'] };
    TRACK.both = TRACK.store;
    var WHY = {
      biz: ['כמה עמודים מדויקים שמציגים את העסק ומביאים פניות, עם כל הבסיס שתמיד כלול.', 'יותר עמודים ובלוג שממשיך להביא תנועה מגוגל, כדי שהאתר יביא לקוחות באופן קבוע.', 'הרבה תוכן, בלוג ועמודי אזור, כדי להופיע בכל מקום שהלקוחות שלכם מחפשים.'],
      store: ['חנות קטנה שמתחילה למכור מהר, עם סליקה, חשבונית וניהול מלאי מהיום הראשון.', 'עשרות מוצרים, וריאציות וסינון, כדי שהלקוח ימצא מה שהוא מחפש בשתי לחיצות.', 'בלי תקרת מוצרים, עם חיפוש וסינון מתקדמים וכלים שמגדילים את הסל.'],
      both: ['אתר אחד שמציג את העסק ומוכר כמה מוצרים נבחרים, עם סליקה וחשבונית אוטומטית.', 'אתר שמציג את השירותים ומוכר עשרות מוצרים, עם וריאציות, סינון ובלוג.', 'אתר רחב שמשלב תדמית וקטלוג גדול בלי תקרה, עם חיפוש, סינון וקידום מלא.']
    };
    var KEY = { 'בלוג עסקי': 'blog', 'עמודי אזור': 'regional', 'מחקר מילות מפתח': 'kw', 'Schema מורחב': 'schema', 'סכמת ישויות': 'entity', 'דוח אזכורים חודשי': 'ai-report', 'עדכונים בשירות מלא': 'wa-updates', 'פאנל ניהול אישי': 'panel', 'ניהול לידים': 'leads', 'בקשות שינוי חודשיות': 'changes', 'וריאציות מוצר': 'variants', 'קטגוריות וסינון': 'filters', 'מוצרים ללא הגבלה': 'unlimited', 'חיפוש פנימי': 'search', 'Google Shopping': 'shopping', 'מילות מפתח מסחריות': 'kw-com', 'מיפוי הקטלוג ל-AI': 'catalog-ai', 'התראות מלאי': 'stock-alerts', 'אוטומציה מלאה 24/7': 'automation' };
    var SIZE = ['small', 'mid', 'large'];
    /* each answer adds a group of picks (listed most important first); `order` is the display order.
       Over 6, the biggest group gives up its least important pick (ties: the later group), so every answer keeps a voice */
    var picksFor = function (type, k, s, u) {
      var g = [], order;
      if (type === 'biz') {
        g.push(['בלוג עסקי', 'עמודי אזור'].slice(0, k));
        g.push(s === 2 ? ['מחקר מילות מפתח', 'דוח אזכורים חודשי', 'סכמת ישויות', 'Schema מורחב'] : s === 1 ? ['מחקר מילות מפתח', 'Schema מורחב'] : []);
        g.push([['עדכונים בשירות מלא'], ['פאנל ניהול אישי', 'ניהול לידים'], ['פאנל ניהול אישי', 'בקשות שינוי חודשיות']][u]);
        order = ['בלוג עסקי', 'עמודי אזור', 'מחקר מילות מפתח', 'Schema מורחב', 'סכמת ישויות', 'דוח אזכורים חודשי', 'עדכונים בשירות מלא', 'פאנל ניהול אישי', 'ניהול לידים', 'בקשות שינוי חודשיות'];
      } else {
        g.push(k === 2 ? ['מוצרים ללא הגבלה', 'וריאציות מוצר', 'קטגוריות וסינון', 'חיפוש פנימי'] : k === 1 ? ['וריאציות מוצר', 'קטגוריות וסינון'] : []);
        if (type === 'both') g.push(k >= 1 ? ['בלוג עסקי'] : []);
        g.push(s === 2 ? ['מיפוי הקטלוג ל-AI', 'Google Shopping', 'מילות מפתח מסחריות'] : s === 1 ? ['Google Shopping', 'מילות מפתח מסחריות'] : []);
        g.push([['בקשות שינוי חודשיות'], ['התראות מלאי'], ['אוטומציה מלאה 24/7']][u]);
        order = ['וריאציות מוצר', 'קטגוריות וסינון', 'מוצרים ללא הגבלה', 'חיפוש פנימי', 'בלוג עסקי', 'Google Shopping', 'מילות מפתח מסחריות', 'מיפוי הקטלוג ל-AI', 'בקשות שינוי חודשיות', 'התראות מלאי', 'אוטומציה מלאה 24/7'];
      }
      g = g.map(function (x) { return x.slice(); });
      var total = function () { return g.reduce(function (n, x) { return n + x.length; }, 0); };
      while (total() > 6) {
        var big = 0;
        g.forEach(function (x, i) { if (x.length >= g[big].length) big = i; });
        g[big].pop();
      }
      var all = [].concat.apply([], g);
      return order.filter(function (n) { return all.indexOf(n) > -1; });
    };
    var val = function (name) {
      var el = quiz.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : null;
    };
    var label = function (name) {
      var el = quiz.querySelector('input[name="' + name + '"]:checked');
      return el ? el.closest('.qz-opt').querySelector('b').textContent : '';
    };
    var show = function (i, focus) {
      qAt = i;
      qSteps.forEach(function (st, k) { st.hidden = k !== i; });
      qRes.hidden = true;
      qNav.hidden = false;
      qBack.disabled = i === 0;
      qBack.style.visibility = i === 0 ? 'hidden' : 'visible';
      qNext.disabled = !val(qSteps[i].querySelector('input').name);
      qNext.lastChild.textContent = '';
      qNext.firstChild.textContent = i === qSteps.length - 1 ? ' לקבלת ההמלצה ' : ' הבא ';
      var pct = (i / qSteps.length) * 100;
      qBar.style.transform = 'scaleX(' + (pct / 100) + ')';
      qCount.textContent = (i + 1) + ' / ' + qSteps.length;
      qLive.textContent = 'שאלה ' + (i + 1) + ' מתוך ' + qSteps.length;
      if (focus) qSteps[i].querySelector('legend').focus();
    };
    var result = function () {
      var t = val('q1');
      var type = t === 'store' ? 'store' : (t === 'mixed' ? 'both' : 'biz');
      var k = +val('q2') || 0, sc = +val('q3') || 0, u = +val('q4') || 0, when = val('q5');
      var title = TYPE[type] + ' · ' + TRACK[type][k];
      var picks = picksFor(type, k, sc, u);
      var soon = when === 'fast' ? (type === 'biz' ? 'רוצים מהר? אתר תדמית עולה לאוויר בדרך כלל תוך \u20667–14\u2069 ימי עסקים.' : 'רוצים מהר? חנות עולה לאוויר בדרך כלל תוך \u20662–4\u2069 שבועות.') :
        (when === 'look' ? 'אין לחץ: שלחו לנו את התשובות ונחזור אליכם עם הצעה מסודרת לעיון.' : '');
      quiz.querySelector('[data-qz-title]').textContent = title;
      quiz.querySelector('[data-qz-why]').textContent = WHY[type][k] + (t === 'unsure' ? ' זו נקודת פתיחה לפי מה שסיפרתם, ונדייק יחד בשיחה.' : '') + (soon ? ' ' + soon : '');
      var ul = quiz.querySelector('[data-qz-points]');
      ul.innerHTML = '';
      (picks.length ? picks : ['הבסיס שתמיד כלול עושה כאן את העבודה']).forEach(function (x) { var li = document.createElement('li'); li.textContent = x; ul.appendChild(li); });
      var keys = picks.map(function (n) { return KEY[n]; }).filter(function (x) { return x && (type === 'biz' || x !== 'blog'); }).join(',');
      var go = quiz.querySelector('[data-qz-pkg]');
      if (type === 'biz') {
        go.href = '/business-sites/' + (keys ? '?pick=' + keys : '') + '#offer';
        go.textContent = 'לבחור מה האתר יכלול';
      } else {
        go.href = '/online-stores/?size=' + SIZE[k] + (keys ? '&pick=' + keys : '') + '#offer';
        go.textContent = 'לבחור מה בחנות';
      }
      var msg = 'היי! מילאתי את השאלון באתר. ההמלצה: ' + title + '.\n' +
        'מה שהתאים לנו: ' + (picks.length ? picks.join(', ') : 'הבסיס') + '.\n' +
        'מה חשוב לנו: ' + label('q1') + '\nהיקף: ' + label('q2') + '\nקידום: ' + label('q3') +
        '\nעדכונים: ' + label('q4') + '\nמתי: ' + label('q5') + '\nאשמח לשמוע פרטים ולקבל הצעת מחיר אישית.';
      quiz.querySelector('[data-qz-wa]').href = 'https://wa.me/972587292029?text=' + encodeURIComponent(msg);
      qSteps.forEach(function (st) { st.hidden = true; });
      qNav.hidden = true;
      qRes.hidden = false;
      qBar.style.transform = 'scaleX(1)';
      qCount.textContent = '✓';
      qLive.textContent = 'ההמלצה שלנו: ' + title;
      qRes.focus();
    };
    var advance = function () {
      if (!val(qSteps[qAt].querySelector('input').name)) return;
      if (qAt < qSteps.length - 1) show(qAt + 1, true); else result();
    };
    quiz.addEventListener('change', function (e) {
      if (e.target.type === 'radio') qNext.disabled = false;
    });
    /* a pointer pick moves on by itself; keyboard users change their pick with arrows and go on with Enter / "הבא" */
    quiz.addEventListener('click', function (e) {
      var opt = e.target.closest('.qz-opt');
      if (opt && e.detail > 0) setTimeout(advance, motionOff() ? 0 : 380);
    });
    quiz.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.type === 'radio') { e.preventDefault(); advance(); }
    });
    qNext.addEventListener('click', advance);
    qBack.addEventListener('click', function () { if (qAt > 0) show(qAt - 1, true); });
    quiz.querySelector('[data-qz-restart]').addEventListener('click', function () {
      quiz.reset();
      show(0, true);
    });
    quiz.addEventListener('submit', function (e) { e.preventDefault(); advance(); });
    quiz.classList.add('is-ready');
    show(0, false);
  }

  /* ---------- glossary: live search (filters terms + letter index, works on name and definition) ---------- */
  var glSearch = document.querySelector('[data-glossary-search]');
  if (glSearch) {
    var glTerms = [].slice.call(document.querySelectorAll('.gl-term'));
    var glGroups = [].slice.call(document.querySelectorAll('.gl-group'));
    var glEmpty = document.querySelector('[data-glossary-empty]');
    var glLetters = [].slice.call(document.querySelectorAll('.gl-letters a'));
    var glNorm = function (t) { return (t || '').toLowerCase().replace(/[״"׳'\-–]/g, '').replace(/\s+/g, ' ').trim(); };
    glTerms.forEach(function (t) { t.setAttribute('data-gl-text', glNorm(t.textContent)); });
    var glTimer = null;
    var glRun = function () {
      var q = glNorm(glSearch.value);
      var any = false;
      glTerms.forEach(function (t) {
        var on = !q || t.getAttribute('data-gl-text').indexOf(q) > -1;
        t.hidden = !on;
        if (on) any = true;
      });
      glGroups.forEach(function (g) {
        var has = g.querySelector('.gl-term:not([hidden])');
        g.hidden = !has;
        var link = glLetters.filter(function (a) { return a.getAttribute('href') === '#' + g.id; })[0];
        if (link) link.classList.toggle('is-empty', !has);
      });
      if (glEmpty) glEmpty.hidden = any;
    };
    glSearch.addEventListener('input', function () {
      clearTimeout(glTimer);
      glTimer = setTimeout(glRun, 120);
    });
    glSearch.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { glSearch.value = ''; glRun(); }
    });
  }

  /* ---------- floating WhatsApp (phones): appears only after the visitor has
     scrolled past the hero's own WhatsApp button, and steps aside while an
     interactive zone sits in the bottom band of the screen where it floats
     (quiz, offer builder, tabs, FAQ, a WhatsApp CTA card, the final CTA, or
     anything marked [data-hide-wa-float]) so it never covers a card, a cart
     button, a tab, a question row or a result line ---------- */
  var waFloat = document.querySelector('.wa-float');
  if (waFloat && 'IntersectionObserver' in window) {
    var waMq = window.matchMedia('(max-width: 760px)');
    var waHero = document.querySelector('.hero-ctas .btn-wa');
    var waPast = !waHero;
    var waZones = new Set();
    /* guides: the floating table-of-contents button sits in the same bottom band,
       so it steps aside for the same zones (unless its panel is open or it has focus) */
    var tocFloat = document.querySelector('.toc-float');
    var waSync = function () {
      var hide = waMq.matches && (!waPast || waZones.size > 0);
      /* never pull the button out from under keyboard focus */
      if (hide && document.activeElement === waFloat) hide = false;
      waFloat.classList.toggle('wa-hide', hide);
      if (hide) { waFloat.setAttribute('tabindex', '-1'); waFloat.setAttribute('aria-hidden', 'true'); }
      else { waFloat.removeAttribute('tabindex'); waFloat.removeAttribute('aria-hidden'); }
      if (tocFloat) {
        var tocHide = waMq.matches && waZones.size > 0 && !tocFloat.classList.contains('is-open') && !tocFloat.contains(document.activeElement);
        tocFloat.classList.toggle('toc-hide', tocHide);
        var tocBtnEl = tocFloat.querySelector('.toc-btn');
        if (tocBtnEl) { if (tocHide) tocBtnEl.setAttribute('tabindex', '-1'); else tocBtnEl.removeAttribute('tabindex'); }
      }
    };
    if (waHero) {
      /* the root reaches far below the screen, so "not intersecting" means fully
         scrolled above its top. Unlike a plain viewport observer this also flips
         on a jump that never shows the button (an #anchor link, a restored scroll
         position, a hero button that starts below the fold) */
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { waPast = !en.isIntersecting; });
        waSync();
      }, { rootMargin: '0px 0px 1000000px 0px', threshold: 0 }).observe(waHero);
    }
    var waZoneEls = document.querySelectorAll('[data-hide-wa-float], form[data-quiz], section#offer, [role="tablist"], [role="tabpanel"], .faq-list, .faq-cta-card, .cta-final');
    if (waZoneEls.length) {
      /* root = the bottom 14% of the screen (about 118px on a phone): the band the button occupies */
      var waZoneIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) waZones.add(en.target); else waZones.delete(en.target);
        });
        waSync();
      }, { rootMargin: '-86% 0px 0px 0px', threshold: 0 });
      waZoneEls.forEach(function (el) { waZoneIo.observe(el); });
    }
    waFloat.addEventListener('blur', waSync);
    if (tocFloat) { tocFloat.addEventListener('focusout', waSync); tocFloat.addEventListener('tocclose', waSync); }
    if (waMq.addEventListener) waMq.addEventListener('change', waSync);
    waSync();
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
  whenPast(650, function (past) { toTop.classList.toggle('show', past); });

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

  /* ---------- guides hub: topic filter (buttons + counts are built from the cards' data-category,
     so a guide with a new topic adds its own button automatically) ---------- */
  var gRows = [].slice.call(document.querySelectorAll('[data-guide-filter]'));
  var gGrid = document.getElementById('guides-grid');
  if (gRows.length && gGrid) {
    var gCards = [].slice.call(gGrid.querySelectorAll('[data-category]'));
    var gStatus = document.querySelector('[data-guide-status]');
    var gCats = [];
    gCards.forEach(function (c) {
      var k = c.getAttribute('data-category');
      if (k && gCats.indexOf(k) < 0) gCats.push(k);
    });
    var gCount = function (key) {
      return gCards.filter(function (c) { return !key || c.getAttribute('data-category') === key; }).length;
    };
    var gBtns = [];
    var gApply = function (key, fromRow) {
      var shown = 0;
      gBtns.forEach(function (b) {
        var on = b.getAttribute('data-key') === key;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        /* phones: the row scrolls sideways — keep the chosen chip in view without moving the page */
        if (on && b.parentNode.scrollWidth > b.parentNode.clientWidth) {
          var row = b.parentNode;
          row.scrollTo({ left: b.offsetLeft - (row.clientWidth - b.offsetWidth) / 2, behavior: motionOff() ? 'auto' : 'smooth' });
        }
      });
      gCards.forEach(function (c) {
        var on = !key || c.getAttribute('data-category') === key;
        c.hidden = !on;
        if (on) { shown++; c.classList.add('visible'); }
      });
      if (gStatus) gStatus.textContent = (shown === 1 ? 'מוצג מדריך אחד' : 'מוצגים ' + shown + ' מדריכים') + (key ? ' בנושא ' + key : '');
      /* clicked in a row far from the cards (the hero): bring the results into view, leaving room for the sticky header */
      if (fromRow) {
        var top = gGrid.getBoundingClientRect().top;
        if (top > window.innerHeight * 0.7 || top < 0) {
          window.scrollTo({ top: top + window.pageYOffset - 120, behavior: motionOff() ? 'auto' : 'smooth' });
        }
      }
    };
    gRows.forEach(function (row) {
      [''].concat(gCats).forEach(function (key) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'guide-filter-btn';
        b.setAttribute('aria-pressed', key ? 'false' : 'true');
        b.setAttribute('data-key', key);
        var name = document.createElement('span');
        name.textContent = key || 'הכול';
        var num = document.createElement('b');
        num.className = 'guide-filter-count';
        num.textContent = gCount(key);
        var sr = document.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = gCount(key) === 1 ? ' מדריך' : ' מדריכים';
        b.appendChild(name);
        b.appendChild(num);
        b.appendChild(sr);
        b.addEventListener('click', function () { gApply(key, row); });
        row.appendChild(b);
        gBtns.push(b);
      });
      row.hidden = false;
    });
  }

  /* ---------- current year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
