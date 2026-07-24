/* Zstore Ai — main.js */
(function () {
  'use strict';

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
    a11yTriggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var willOpen = a11yPanel.hidden;
        a11yPanel.hidden = !willOpen;
        setA11yExpanded(willOpen);
        if (willOpen) {
          applyA11y(a11yState);
          // opening from the hamburger menu — close the menu behind it
          if (closeNav) closeNav(false);
        }
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !a11yPanel.hidden) {
        a11yPanel.hidden = true;
        setA11yExpanded(false);
        a11yTriggers[0].focus();
      }
    });
    document.addEventListener('click', function (e) {
      var onTrigger = a11yTriggers.some(function (t) { return t.contains(e.target); });
      if (!a11yPanel.hidden && !a11yPanel.contains(e.target) && !onTrigger) {
        a11yPanel.hidden = true;
        setA11yExpanded(false);
      }
    });
    a11yPanel.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
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

  /* ---------- current year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
