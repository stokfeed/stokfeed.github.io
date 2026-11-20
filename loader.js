/* Stokfeed — restrained logo-origin trace. No external dependencies. */
(() => {
  'use strict';
  const root = document.getElementById('sf-loader');
  if (!root) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const guide=root.querySelector('#sf-route-guide');
  const ribbon=root.querySelector('.sf-route-ribbon');
  // Build a true variable-width silhouette from the measured SVG path.
  // The first point is aligned with the green arrow tip in the original PNG.
  if (guide && ribbon && !reduced) {
    const length=guide.getTotalLength();
    const top=[];const bottom=[];
    const steps=240;
    for(let i=0;i<=steps;i++) {
      const distance=length*i/steps;
      const pt=guide.getPointAtLength(distance);
      const a=guide.getPointAtLength(Math.max(0,distance-0.7));
      const b=guide.getPointAtLength(Math.min(length,distance+0.7));
      const dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy)||1;
      const width=5.6*Math.pow(1-i/steps,1.2);
      top.push(`${(pt.x-dy/n*width).toFixed(2)},${(pt.y+dx/n*width).toFixed(2)}`);
      bottom.push(`${(pt.x+dy/n*width).toFixed(2)},${(pt.y-dx/n*width).toFixed(2)}`);
    }
    ribbon.setAttribute('d',`M${top.join(' L')} L${bottom.reverse().join(' L')} Z`);
  }
  const key = 'sf-loader-shown';
  let seen = false;
  try { seen = sessionStorage.getItem(key) === 'yes'; sessionStorage.setItem(key, 'yes'); } catch (_) { /* private mode */ }
  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    root.classList.add('sf-done');
    setTimeout(() => root.remove(), reduced || seen ? 0 : 300);
  }
  // Avoid masking every navigation with a loader. Only the first page view animates.
  if (reduced || seen) { close(); return; }
  const begun = performance.now();
  const safety = setTimeout(close, 2300);
  const ready = () => {
    const remaining = Math.max(0, 1550 - (performance.now() - begun));
    setTimeout(() => { clearTimeout(safety); close(); }, remaining);
  };
  if (document.readyState === 'complete') ready();
  else addEventListener('load', ready, { once: true });
  addEventListener('pageshow', e => { if (e.persisted) { clearTimeout(safety); close(); } }, { once: true });
})();
