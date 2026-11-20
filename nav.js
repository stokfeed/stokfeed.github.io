/* Accessible dropdown behavior: mouse, touch and keyboard. */
(() => {
  'use strict';
  const menus = [...document.querySelectorAll('.sf-nav details.nav-menu')];
  if (!menus.length) return;
  const closeExcept = active => menus.forEach(menu => { if (menu !== active) menu.open = false; });
  menus.forEach(menu => {
    menu.addEventListener('toggle', () => { if (menu.open) closeExcept(menu); });
    menu.addEventListener('keydown', e => {
      if (e.key === 'Escape') { menu.open = false; menu.querySelector('summary')?.focus(); }
    });
  });
  document.addEventListener('pointerdown', e => {
    if (!e.target.closest('.sf-nav')) closeExcept(null);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeExcept(null); });
  document.querySelectorAll('.sf-nav a').forEach(anchor => {
    try {
      const a = new URL(anchor.href);
      if (a.origin === location.origin && a.pathname === location.pathname) anchor.setAttribute('aria-current', 'page');
    } catch (_) { /* ignore external invalid URLs */ }
  });
})();
