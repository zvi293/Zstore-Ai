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
     busy across the whole page height — a big source of scroll jank on phones */
  if ('IntersectionObserver' in window) {
    var loopers = document.querySelectorAll(
      '.hero, .marquee-row, .ticker-x, .orb, .deco-tile, .hotspots, ' +
      '.plan-featured, .pkg-detail.featured, .pkg-jump, .cta-final, .stats-strip, .ai-section'
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
    // the outgoing transition) and only once the title is well offscreen —
    // the staggered rise-in still replays every time it scrolls back in
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
      // only once the title is a full 90px outside the viewport, so the two can
      // never fight and edge-of-screen jitter triggers nothing.
      var showIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.classList.add('st-in');
        });
      }, { rootMargin: '0px 0px -6% 0px' });
      var resetIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) entry.target.classList.remove('st-in');
        });
      }, { rootMargin: '90px 0px 90px 0px' });
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
