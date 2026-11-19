/* DuckWay — start-up and global event wiring */
(function () {
  'use strict';
  const DW = window.DW, { $ } = DW;

  // One listener each for clicks, form submits and input changes.
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const fn = DW.actions[el.dataset.action];
    if (fn) fn(el, e);
  });
  document.addEventListener('submit', e => {
    const form = e.target.closest('[data-form]');
    if (!form) return;
    e.preventDefault();
    const fn = DW.forms[form.dataset.form];
    if (fn) fn(form, new FormData(form));
  });
  document.addEventListener('change', e => {
    const el = e.target.closest('[data-change]');
    if (el && DW.changes[el.dataset.change]) DW.changes[el.dataset.change](el, e);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (document.body.classList.contains('has-modal')) DW.closeModal();
      else if (!$('#drawer').hidden) DW.closeDrawer();
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-action]')) {
      e.preventDefault();
      e.target.click();
    }
  });

  function start() {
    DW.paint();
    DW.syncPoints();
    DW.initFun();
    if (!window.L) {
      $('#list').innerHTML = '<div class="empty"><h3>The map could not load</h3><p>DuckWay needs an internet connection for map tiles. Check your connection and reload.</p></div>';
      $('#list-sub').textContent = 'Offline';
      return;
    }
    DW.initMap();
    DW.initSearch();
    DW.renderFilters();
    DW.renderList();
    DW.locate(true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
