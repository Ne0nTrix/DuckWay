/* DuckWay — the fun layer: Ducky the mascot, confetti, pop-ups, badges, daily quests, live updates */
(function () {
  'use strict';
  const DW = window.DW, { $, esc, icon } = DW, db = DW.db;
  const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = arr => arr[Math.floor(Math.random() * arr.length)];

  /* ---------- Ducky ---------- */
  DW.duck = (cls = '') => `<svg class="duck ${cls}" viewBox="0 0 120 104" aria-hidden="true">
    <ellipse cx="60" cy="98" rx="34" ry="5" fill="#23305a" opacity=".1"/>
    <path d="M22 62c-10-9-10-20-2-22 3 8 8 12 15 15z" fill="#ffc928"/>
    <ellipse cx="57" cy="70" rx="39" ry="26" fill="#ffd84a"/>
    <g class="duck-head">
      <circle cx="80" cy="38" r="23" fill="#ffd84a"/>
      <path d="M72 17c2-7 9-8 10-2-4 0-7 2-8 5z" fill="#ffc928"/>
      <path d="M98 36c9-2 17 0 19 4 1 3-7 7-18 6z" fill="#ff9f43"/>
      <path d="M99 44c6 2 12 2 16 0-2 4-9 6-16 4z" fill="#f07f2a"/>
      <g class="duck-eye"><circle cx="86" cy="32" r="4.200" fill="#23305a"/><circle cx="87.400" cy="30.600" r="1.400" fill="#fff"/></g>
      <circle cx="77" cy="46" r="5.200" fill="#ff9ec4" opacity=".8"/>
    </g>
    <path class="duck-wing" d="M34 68c8-14 26-16 38-4-6 16-28 20-38 4z" fill="#ffc21a"/>
  </svg>`;

  /* ---------- confetti ---------- */
  const COLORS = ['#4d9bff', '#ff8fc7', '#ffcf33', '#4fd1ae', '#a48bff', '#ffa15e'];
  let cv, ctx, parts = [], raf = null;
  function frame() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    parts = parts.filter(p => p.life > 0 && p.y < window.innerHeight + 30);
    parts.forEach(p => {
      p.vy += 0.2; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.min(1, p.life / 25);
      ctx.fillStyle = p.c;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 6.283); ctx.fill(); }
      else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore();
    });
    if (parts.length) raf = requestAnimationFrame(frame);
    else { raf = null; cv.style.display = 'none'; }
  }
  DW.confetti = function (x, y, n = 80, power = 1) {
    if (still()) return;
    if (!cv) {
      cv = document.createElement('canvas');
      cv.className = 'confetti';
      document.body.appendChild(cv);
      ctx = cv.getContext('2d');
    }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(window.innerWidth * dpr) || cv.height !== Math.round(window.innerHeight * dpr)) {
      cv.width = Math.round(window.innerWidth * dpr);
      cv.height = Math.round(window.innerHeight * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cv.style.display = 'block';
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, v = (4 + Math.random() * 9) * power;
      parts.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
        s: 6 + Math.random() * 8, c: rand(COLORS), round: Math.random() < 0.3, life: 70 + Math.random() * 50
      });
    }
    if (!raf) raf = requestAnimationFrame(frame);
  };
  DW.party = function () {
    const w = window.innerWidth, h = window.innerHeight;
    DW.confetti(w * 0.5, h * 0.42, 110, 1.25);
    setTimeout(() => DW.confetti(w * 0.25, h * 0.5, 60, 1.1), 180);
    setTimeout(() => DW.confetti(w * 0.75, h * 0.5, 60, 1.1), 320);
  };

  /* ---------- points: a coin flies to the counter, the counter ticks up ---------- */
  DW.lastClick = null;
  document.addEventListener('pointerdown', e => { DW.lastClick = { x: e.clientX, y: e.clientY }; }, true);

  DW.countUp = function (el, from, to, ms = 650) {
    if (!el) return;
    if (still() || from === to) { el.textContent = to; return; }
    let t0 = null;
    const tick = now => {
      if (t0 == null) t0 = now;
      const k = DW.clamp((now - t0) / ms, 0, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  /* ---------- small announcement banners (badges, quests) shown one at a time ---------- */
  const queue = [];
  let showing = false;
  function nextBanner() {
    if (showing || !queue.length) return;
    showing = true;
    const b = queue.shift();
    const el = document.createElement('div');
    el.className = `banner c-${b.color || 'yellow'}`;
    el.innerHTML = `<span class="sticker">${icon(b.icon)}</span><div><small>${b.kicker}</small><b>${b.title}</b></div>`;
    document.body.appendChild(el);
    const r = el.getBoundingClientRect();
    DW.confetti(r.left + r.width / 2, r.bottom, 40, 0.8);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => { el.remove(); showing = false; nextBanner(); }, 380);
    }, 3000);
  }
  DW.announce = b => { queue.push(b); nextBanner(); };

  /* ---------- celebration pop-ups ---------- */
  DW.closePop = function () { const p = $('#pop'); if (p) p.remove(); document.body.classList.remove('has-pop'); };
  DW.pop = function ({ art, title, text, actions = [], cls = '', body = '' }) {
    DW.closePop();
    const el = document.createElement('div');
    el.className = 'pop-back';
    el.id = 'pop';
    el.dataset.action = 'pop-back';
    el.innerHTML = `<div class="pop ${cls}" role="dialog" aria-modal="true" aria-label="${esc(title.replace(/<[^>]+>/g, ''))}">
      <button class="iconbtn pop-x" data-action="pop-close" aria-label="Close">${icon('x')}</button>
      <div class="pop-art">${art || DW.duck('hop')}</div>
      <h3>${title}</h3>
      <p>${text}</p>
      ${body}
      <div class="pop-actions">${actions.map(a => `<button class="btn ${a.primary ? 'primary' : ''}" data-action="${a.action}" ${a.id ? `data-id="${a.id}"` : ''}>${a.icon ? icon(a.icon) : ''}${a.label}</button>`).join('')}</div>
    </div>`;
    document.body.appendChild(el);
    document.body.classList.add('has-pop');
  };

  /* ---------- badges ---------- */
  DW.BADGES = [
    { id: 'first', name: 'First Quack', desc: 'Make your first contribution', icon: 'egg', color: 'yellow', test: () => db.activity.length > 0 },
    { id: 'critic', name: 'Loo Critic', desc: 'Rate a toilet', icon: 'star', color: 'pink', test: () => db.counts.review > 0 },
    { id: 'walk', name: 'Waddler', desc: 'Walk to a toilet with Ducky', icon: 'footprints', color: 'blue', test: () => (db.counts.route || 0) > 0 },
    { id: 'watch', name: 'Watchduck', desc: 'Report a problem', icon: 'flag', color: 'peach', test: () => db.counts.report > 0 },
    { id: 'snap', name: 'Paparazzi', desc: 'Add a photo', icon: 'camera', color: 'lav', test: () => db.counts.photo > 0 },
    { id: 'path', name: 'Pathfinder', desc: 'Put a new toilet on the map', icon: 'map-pin-plus', color: 'mint', test: () => db.counts.add > 0 },
    { id: 'vip', name: 'VIP Guest', desc: 'Book a private toilet', icon: 'key-round', color: 'lav', test: () => db.bookings.length > 0 },
    { id: 'host', name: 'Super Host', desc: 'List your own toilet', icon: 'house', color: 'mint', test: () => db.listings.length > 0 }
  ];
  DW.checkBadges = function () {
    let fresh = false;
    DW.BADGES.forEach(b => {
      if (db.badges[b.id] || !b.test()) return;
      db.badges[b.id] = Date.now();
      fresh = true;
      DW.announce({ icon: b.icon, color: b.color, kicker: 'Badge unlocked!', title: b.name });
    });
    if (fresh) DW.save();
  };

  /* ---------- daily quests ---------- */
  DW.QUESTS = [
    { id: 'route', label: 'Walk to a toilet with Ducky', icon: 'footprints', color: 'blue' },
    { id: 'confirm', label: 'Confirm a toilet is open', icon: 'circle-check', color: 'mint' },
    { id: 'review', label: 'Rate a toilet', icon: 'star', color: 'pink' }
  ];
  DW.QUEST_BONUS = 30;
  DW.quests = function () {
    const day = new Date().toDateString();
    if (!db.quests || db.quests.day !== day) db.quests = { day, done: [], bonus: false };
    return db.quests;
  };
  function questDone(kind) {
    const q = DW.quests(), def = DW.QUESTS.find(x => x.id === kind);
    if (!def || q.done.includes(kind)) return;
    q.done.push(kind);
    DW.save();
    DW.announce({ icon: def.icon, color: def.color, kicker: `Quest ${q.done.length} of ${DW.QUESTS.length} done`, title: def.label });
    if (q.done.length === DW.QUESTS.length && !q.bonus) {
      q.bonus = true;
      setTimeout(() => {
        DW.award(DW.QUEST_BONUS, 'Finished all daily quests');
        DW.party();
        DW.pop({
          cls: 'c-yellow', title: 'All quests done! 🎉', text: `Ducky is impressed. Here are <b>${DW.QUEST_BONUS} bonus points</b> — come back tomorrow for new quests.`,
          actions: [{ label: 'Yay!', action: 'pop-close', primary: true }]
        });
      }, 1600);
    }
  }

  /* ---------- hooks called by DW.award ---------- */
  DW.fx = {
    points(old, now, pts) {
      const pill = $('.points'), num = $('#pts');
      const from = DW.lastClick || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const land = () => {
        pill.classList.remove('bump');
        void pill.offsetWidth;
        pill.classList.add('bump');
        DW.countUp(num, old, now);
        $('#rank-name').textContent = DW.rank(now).current.name;
      };
      if (still()) return land();
      const r = pill.getBoundingClientRect();
      const coin = document.createElement('div');
      coin.className = 'coin';
      coin.textContent = `+${pts}`;
      coin.style.left = `${from.x}px`;
      coin.style.top = `${from.y}px`;
      document.body.appendChild(coin);
      DW.confetti(from.x, from.y, 28, 0.8);
      setTimeout(() => {
        coin.style.transform = `translate(${r.left + r.width / 2 - from.x}px, ${r.top + r.height / 2 - from.y}px) scale(.45)`;
        coin.style.opacity = '.3';
      }, 420);
      setTimeout(() => { coin.remove(); land(); }, 1250);
    },
    rankUp(rank) {
      // let an open pop-up (e.g. "All quests done") be read first
      if ($('#pop')) return setTimeout(() => DW.fx.rankUp(rank), 600);
      DW.party();
      DW.pop({
        cls: 'c-lav', art: `<div class="rank-art"><span class="sticker big c-lav">${icon(rank.icon)}</span>${DW.duck('hop')}</div>`,
        title: `You’re a ${rank.name} now!`, text: `${rank.note}. Keep helping others find a good loo.`,
        actions: [{ label: 'See my profile', action: 'pop-profile' }, { label: 'Quack yeah!', action: 'pop-close', primary: true }]
      });
    },
    after(kind) {
      if (kind) questDone(kind);
      DW.checkBadges();
    }
  };

  /* ---------- first-visit intro ---------- */
  const SLIDES = [
    { c: 'blue', icons: ['map-pin', 'navigation', 'clock'], title: 'Welcome to DuckWay!', text: 'When nature calls, Ducky answers. Find an open, clean toilet near you in two taps — with walking directions.' },
    { c: 'pink', icons: ['star', 'camera', 'sparkles'], title: 'Rate, snap and report', text: 'Tell others how it was: cleanliness, comfort, smell. Earn trust points, collect badges and climb the ranks.' },
    { c: 'mint', icons: ['house', 'hand-coins', 'key-round'], title: 'Share your bathroom', text: 'Got a spare loo? List it, set a tiny fee and earn pocket money every time a guest drops by.' }
  ];
  let slide = 0;
  function drawWelcome() {
    const s = SLIDES[slide], last = slide === SLIDES.length - 1;
    DW.pop({
      cls: `welcome c-${s.c}`,
      art: `<div class="welcome-art">${s.icons.map((ic, i) => `<span class="float-ic p${i}">${icon(ic)}</span>`).join('')}${DW.duck('hop')}</div>`,
      title: s.title, text: s.text,
      body: `<div class="dots">${SLIDES.map((_, i) => `<i class="${i === slide ? 'on' : ''}"></i>`).join('')}</div>`,
      actions: [last ? null : { label: 'Skip', action: 'welcome-done' }, { label: last ? 'Let’s go!' : 'Next', action: last ? 'welcome-done' : 'welcome-next', primary: true, icon: last ? 'party-popper' : 'arrow-right' }].filter(Boolean)
    });
  }
  DW.welcome = function () { slide = 0; drawWelcome(); };

  /* ---------- Ducky the helper: speech bubble with tips and live updates ---------- */
  let bubbleTimer = null;
  DW.say = function (html, opts = {}) {
    const b = $('#helper-bubble');
    if (!b) return;
    clearTimeout(bubbleTimer);
    b.className = `helper-bubble ${opts.id ? 'is-link' : ''}`;
    b.innerHTML = `${opts.kicker ? `<small>${opts.kicker}</small>` : ''}<span>${html}</span>`;
    if (opts.id) { b.dataset.action = 'open'; b.dataset.id = opts.id; } else { delete b.dataset.action; delete b.dataset.id; }
    b.hidden = false;
    const d = $('#helper-duck');
    d.classList.remove('quack'); void d.offsetWidth; d.classList.add('quack');
    bubbleTimer = setTimeout(() => { b.hidden = true; }, opts.ms || 6500);
  };

  const NAMES = ['Maya', 'Jonas', 'Aiko', 'Lucía', 'Piotr', 'Amara', 'Noah', 'Zofia', 'Mateo', 'Ines', 'Hana', 'Oliver', 'Leila', 'Kasia', 'Ravi'];
  const PRAISE = ['Spotless and smelled fresh. Lovely!', 'Clean, tidy and no queue.', 'Fresh and well stocked. Would visit again.', 'Pristine — someone really cares about this place.'];

  // A sample "someone nearby just did something" update; it also updates the sample data it talks about.
  function liveUpdate() {
    const S = DW.state;
    const pool = DW.toilets.filter(t => !t.mine && t.d != null).sort((a, b) => a.d - b.d).slice(0, 18);
    if (!pool.length) return false;
    const t = rand(pool), who = rand(NAMES), kind = rand(['confirm', 'confirm', 'rate', 'rate', 'walk']);
    let html;
    if (kind === 'confirm') {
      t.confirmed = { ts: Date.now(), count: ((t.confirmed && t.confirmed.count) || 0) + 1 };
      html = `<b>${who}</b> just confirmed <b>${esc(t.name)}</b> is open ✅`;
    } else if (kind === 'rate') {
      const n = Math.random() < 0.6 ? 5 : 4;
      t.reviews.unshift({ id: 'l' + Date.now(), author: `${who} ${rand('ABKLMRSTW'.split(''))}.`, ts: Date.now(), clean: n, comfort: n, smell: n, privacy: 4, text: rand(PRAISE), photos: [] });
      html = `<b>${who}</b> rated <b>${esc(t.name)}</b> ${'⭐'.repeat(n)}`;
    } else {
      html = `<b>${who}</b> is waddling to <b>${esc(t.name)}</b> 🦆`;
    }
    DW.bump();
    if (S.selected === t.id && !$('#drawer').hidden) DW.renderDrawer(t);
    DW.say(html, { kicker: 'Happening nearby · sample', id: t.id, ms: 7000 });
    return true;
  }

  function tip() {
    const list = DW.toilets.filter(t => t.d != null);
    const open = list.filter(t => DW.status(t).open);
    const q = DW.quests();
    const tips = [
      'Tap any pin to see photos, prices and reviews.',
      `Got a bathroom at home? List it in <b>Host</b> and earn ${DW.money(DW.CUR.priv[2])} per visit.`,
      'In a hurry? The big blue button takes you to the nearest open toilet.',
      'Try the search: <b>“free clean toilet nearby”</b> — I understand that!'
    ];
    if (open.length) tips.push(`<b>${open.length} toilets</b> are open around here right now.`);
    const clean = open.filter(t => DW.cleanScore(t).score != null).sort((a, b) => DW.cleanScore(b).score - DW.cleanScore(a).score)[0];
    if (clean) tips.push(`Psst… the cleanest one nearby is <b>${esc(clean.name)}</b> (${DW.cleanScore(clean).score}/100) ✨`);
    if (q.done.length < DW.QUESTS.length) tips.push(`${DW.QUESTS.length - q.done.length} daily ${DW.QUESTS.length - q.done.length === 1 ? 'quest' : 'quests'} left — finish them all for <b>+${DW.QUEST_BONUS} points</b>!`);
    DW.say(rand(tips), { kicker: 'Ducky says' });
  }

  let turn = 0;
  function chatter() {
    const S = DW.state;
    const busy = document.hidden || document.body.classList.contains('has-modal') || document.body.classList.contains('has-pop') ||
      !$('#helper-menu').hidden || S.loading || S.picking || $('#splash');
    if (busy) return;
    if (turn++ % 3 === 2 || !liveUpdate()) tip();
  }

  function menu(show) {
    const m = $('#helper-menu');
    if (!show) { m.hidden = true; return; }
    const q = DW.quests();
    $('#helper-bubble').hidden = true;
    m.innerHTML = `<b>Quack! Need a wing?</b>
      <button data-action="surprise" class="c-pink">${icon('dices')}<span>Surprise me<small>A lovely loo nearby</small></span></button>
      <button data-action="go-quests" class="c-yellow">${icon('target')}<span>Daily quests<small>${q.done.length} of ${DW.QUESTS.length} done</small></span></button>
      <button data-action="welcome" class="c-blue">${icon('book-open')}<span>Show the intro<small>What DuckWay can do</small></span></button>`;
    m.hidden = false;
  }

  Object.assign(DW.actions, {
    'pop-close'() { DW.closePop(); },
    'pop-back'(el, e) { if (e.target === el) DW.closePop(); },
    'pop-profile'() { DW.closePop(); DW.go('community'); },
    'pop-review'(el) { DW.closePop(); DW.actions.review(el); },
    'welcome-next'() { slide++; drawWelcome(); },
    'welcome-done'() {
      DW.closePop();
      if (!db.seenWelcome) { db.seenWelcome = true; DW.save(); }
      DW.party();
      setTimeout(() => DW.say('Hi, I’m <b>Ducky</b>! Tap the big blue button and I’ll walk you to the nearest loo.', { kicker: 'Ducky says', ms: 8000 }), 900);
    },
    welcome() { menu(false); DW.welcome(); },
    helper() {
      const d = $('#helper-duck');
      d.classList.remove('quack'); void d.offsetWidth; d.classList.add('quack');
      menu($('#helper-menu').hidden);
    },
    'go-quests'() {
      menu(false);
      DW.go('community');
      const el = $('#quests');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    surprise() {
      menu(false);
      const S = DW.state;
      if (S.loading) return;
      const pool = DW.toilets.filter(t => t.d != null && DW.status(t).open && DW.cleanScore(t).score != null)
        .sort((a, b) => a.d - b.d).slice(0, 25).sort((a, b) => DW.cleanScore(b).score - DW.cleanScore(a).score).slice(0, 5);
      if (!pool.length) return DW.say('Hmm, nothing open around here right now.', { kicker: 'Ducky says' });
      const t = rand(pool);
      DW.select(t.id);
      DW.confetti(window.innerWidth / 2, window.innerHeight / 2, 70);
      DW.say(`Ta-da! <b>${esc(t.name)}</b> — ${DW.cleanScore(t).label.toLowerCase()}, ${DW.fmtWalk(t.d)} away.`, { kicker: 'Ducky’s surprise', id: t.id });
    }
  });
  document.addEventListener('click', e => { if (!e.target.closest('#helper')) menu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { DW.closePop(); menu(false); } });

  /* ---------- start ---------- */
  DW.initFun = function () {
    $('#helper-duck').innerHTML = DW.duck();
    $('#cta-duck').innerHTML = DW.duck();
    $('#splash-duck').innerHTML = DW.duck('swim');
    DW.quests();
    setTimeout(() => {
      const s = $('#splash');
      if (s) { s.classList.add('out'); setTimeout(() => s.remove(), 600); }
      if (!db.seenWelcome) setTimeout(DW.welcome, 500);
      else setTimeout(() => DW.say('Welcome back! Where to today?', { kicker: 'Ducky says', ms: 5000 }), 1200);
    }, 1700);
    setInterval(chatter, 16000);
  };
})();
