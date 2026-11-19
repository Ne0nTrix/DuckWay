/* DuckWay — core helpers, local storage and trust points */
(function () {
  'use strict';
  const DW = (window.DW = window.DW || {});

  DW.actions = {}; // click handlers, keyed by data-action
  DW.forms = {};   // submit handlers, keyed by data-form

  /* ---------- DOM + formatting helpers ---------- */
  DW.$ = (s, r = document) => r.querySelector(s);
  DW.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  DW.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ESC[c]);
  DW.clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  DW.hash = function (str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  // Small deterministic random generator, so sample data is stable per place.
  DW.rng = function (seed) {
    let a = typeof seed === 'string' ? DW.hash(seed) : seed;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  DW.pick = (r, arr) => arr[Math.floor(r() * arr.length)];

  DW.dist = function (a, b) {
    const R = 6371000, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  };
  DW.fmtDist = m => (m < 950 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`);
  DW.walkMin = m => Math.max(1, Math.round((m * 1.25) / 80));
  DW.fmtWalk = function (m) {
    const min = DW.walkMin(m);
    return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
  };
  DW.timeAgo = function (ts) {
    const s = Math.max(0, (Date.now() - ts) / 1000);
    if (s < 90) return 'just now';
    if (s < 3600) return `${Math.round(s / 60)} min ago`;
    if (s < 86400) return `${Math.round(s / 3600)} h ago`;
    const d = Math.round(s / 86400);
    if (d < 31) return d === 1 ? 'yesterday' : `${d} days ago`;
    const mo = Math.round(d / 30);
    return mo === 1 ? 'a month ago' : `${mo} months ago`;
  };
  DW.toMin = hhmm => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0); };
  DW.debounce = function (fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  /* ---------- icons (Lucide) ---------- */
  DW.icon = (name, cls = '') => `<i data-lucide="${name}" class="${cls}"></i>`;
  const pascal = n => n.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
  DW.paint = function (root = document) {
    const L = window.lucide;
    if (!L || !L.icons) return;
    root.querySelectorAll('i[data-lucide]').forEach(el => {
      const node = L.icons[pascal(el.dataset.lucide)];
      if (!node) return;
      const svg = L.createElement(node);
      svg.setAttribute('class', `ic ${el.className || ''}`.trim());
      svg.setAttribute('aria-hidden', 'true');
      el.replaceWith(svg);
    });
  };
  // Any markup we render later gets its icons painted automatically.
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; DW.paint(); });
  }).observe(document.documentElement, { childList: true, subtree: true });

  /* ---------- currency (picked from the device time zone) ---------- */
  const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '');
  DW.CUR =
    tz === 'Europe/Warsaw' ? { sym: 'zł', after: true, pub: [2, 2.5, 3, 4], priv: [0.5, 0.8, 0.99, 1.5, 2], coffee: 12, blik: true }
    : tz === 'Europe/London' ? { sym: '£', pub: [0.3, 0.5, 0.5, 1], priv: [0.2, 0.3, 0.5, 0.75], coffee: 3 }
    : /^(America|US)\//.test(tz) ? { sym: '$', pub: [0.5, 0.5, 1, 1], priv: [0.25, 0.3, 0.5, 0.75], coffee: 4 }
    : { sym: '€', pub: [0.5, 0.5, 1, 1], priv: [0.2, 0.3, 0.5, 0.8], coffee: 3 };
  DW.money = v => (DW.CUR.after ? `${Number(v).toFixed(2)} ${DW.CUR.sym}` : `${DW.CUR.sym}${Number(v).toFixed(2)}`);

  /* ---------- local storage ---------- */
  const KEY = 'duckway.v1';
  const blank = () => ({
    name: '', points: 0,
    reviews: {}, reports: {}, confirms: {}, hours: {}, photos: {},
    added: [], listings: [], bookings: [], requests: [], activity: [],
    earnings: 0, hostVisits: 0,
    prefs: { accessible: false, changing: false, free: false, clean: false },
    counts: { review: 0, report: 0, confirm: 0, add: 0, photo: 0, hours: 0, route: 0 },
    badges: {}, quests: null, seenWelcome: false
  });
  let db;
  try { db = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); }
  catch (e) { db = blank(); }
  db.prefs = Object.assign(blank().prefs, db.prefs);
  db.counts = Object.assign(blank().counts, db.counts);
  DW.db = db;
  DW.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(db)); return true; }
    catch (e) { DW.toast('Browser storage is full — the last change may not be kept.', { tone: 'warn', icon: 'triangle-alert' }); return false; }
  };

  /* ---------- trust points and ranks ---------- */
  DW.RANKS = [
    { name: 'Hatchling', min: 0, icon: 'egg', note: 'Just getting started' },
    { name: 'Duckling', min: 40, icon: 'feather', note: 'Your reports show up for others' },
    { name: 'Paddler', min: 120, icon: 'waves', note: 'Reports count double' },
    { name: 'Navigator', min: 300, icon: 'compass', note: 'Can verify new toilets' },
    { name: 'Flock Leader', min: 600, icon: 'crown', note: 'Trusted instantly, city-wide' }
  ];
  DW.POINTS = { confirm: 5, report: 10, photo: 10, hours: 15, review: 20, add: 50 };
  DW.rank = function (points) {
    let i = 0;
    DW.RANKS.forEach((r, idx) => { if (points >= r.min) i = idx; });
    const current = DW.RANKS[i], next = DW.RANKS[i + 1] || null;
    const progress = next ? (points - current.min) / (next.min - current.min) : 1;
    return { current, next, progress, index: i };
  };
  DW.syncPoints = function () {
    const p = DW.$('#pts'), r = DW.$('#rank-name');
    if (p) p.textContent = db.points;
    if (r) r.textContent = DW.rank(db.points).current.name;
  };
  DW.award = function (pts, label, kind) {
    const before = DW.rank(db.points), old = db.points;
    db.points += pts;
    if (kind) db.counts[kind] = (db.counts[kind] || 0) + 1;
    db.activity.unshift({ ts: Date.now(), label, pts });
    db.activity = db.activity.slice(0, 40);
    DW.save();
    DW.toast(`<b>+${pts} trust points</b> · ${DW.esc(label)}`, { icon: 'star', tone: 'ok' });
    if (DW.fx) DW.fx.points(old, db.points, pts); else DW.syncPoints();
    const after = DW.rank(db.points);
    if (DW.fx) {
      DW.fx.after(kind);
      if (after.index > before.index) setTimeout(() => DW.fx.rankUp(after.current), 1500);
    }
  };

  // a stable pastel colour for an avatar, picked from the name
  const HUES = [['#8ec5ff', '#4d9bff'], ['#ffb3d9', '#ff7fbd'], ['#ffe27a', '#ffb92e'], ['#8fe6cb', '#3cc7a0'], ['#c7b8ff', '#9b7dff'], ['#ffc49b', '#ff9450']];
  DW.hue = function (name) {
    const h = HUES[DW.hash(String(name || '?')) % HUES.length];
    return `background:linear-gradient(135deg, ${h[0]}, ${h[1]})`;
  };

  /* ---------- toasts ---------- */
  DW.toast = function (html, opts = {}) {
    const box = DW.$('#toasts');
    if (!box) return;
    const el = document.createElement('div');
    el.className = `toast ${opts.tone || ''}`;
    el.innerHTML = `<i class="toast-ic">${DW.icon(opts.icon || 'info')}</i><span>${html}</span>`;
    box.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, opts.ms || 3600);
  };

  /* ---------- cache for derived values (ratings, AI scores) ---------- */
  DW._memo = new Map();
  DW.bump = () => DW._memo.clear();

  /* ---------- image compression for uploaded photos ---------- */
  DW.compress = function (file, max = 720) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = reject;
      fr.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * k);
          c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.72));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  };
})();
