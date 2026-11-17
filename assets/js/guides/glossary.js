// Glossary page only: the live search (wired in main.js) ships hidden so it never shows without JS; reveal it once scripts run.
(function () {
  'use strict';
  var search = document.querySelector('[data-glossary-search]');
  var tools = search && search.closest('.gl-tools');
  if (tools) tools.hidden = false;
})();
