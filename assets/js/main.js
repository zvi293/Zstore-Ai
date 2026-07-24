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
  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  /* ---------- reveal on scroll ---------- */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- accessibility widget ---------- */
  var A11Y_KEY = 'zstore-a11y';
  var modes = ['fs-1', 'fs-2', 'contrast', 'links', 'motion', 'font'];
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

  var a11yBtn = document.querySelector('.a11y-btn');
  var a11yPanel = document.querySelector('.a11y-panel');
  if (a11yBtn && a11yPanel) {
    a11yBtn.addEventListener('click', function () {
      var willOpen = a11yPanel.hidden;
      a11yPanel.hidden = !willOpen;
      a11yBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      if (willOpen) applyA11y(a11yState);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !a11yPanel.hidden) {
        a11yPanel.hidden = true;
        a11yBtn.setAttribute('aria-expanded', 'false');
        a11yBtn.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (!a11yPanel.hidden && !a11yPanel.contains(e.target) && !a11yBtn.contains(e.target)) {
        a11yPanel.hidden = true;
        a11yBtn.setAttribute('aria-expanded', 'false');
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
        a11yState[key] = !a11yState[key];
      }
      saveA11y(a11yState);
      applyA11y(a11yState);
    });
  }

  /* ---------- current year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
