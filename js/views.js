/* DuckWay — Host and Community screens */
(function () {
  'use strict';
  const DW = window.DW, { $, $$, esc, icon } = DW;
  const S = DW.state, db = DW.db;

  DW.go = function (view) {
    if (view !== 'explore') DW.closeDrawer();
    S.view = view;
    $$('.view').forEach(v => v.classList.toggle('is-active', v.id === 'view-' + view));
    $$('.mainnav button').forEach(b => b.classList.toggle('is-active', b.dataset.view === view));
    if (view === 'host') { $('.mainnav [data-view="host"]').classList.remove('has-dot'); DW.renderHost(); }
    if (view === 'community') DW.renderCommunity();
    if (view === 'explore') {
      if (!S.loading) DW.render();
      setTimeout(() => DW.map && DW.map.invalidateSize(), 40);
    }
    window.scrollTo(0, 0);
  };
  DW.actions.nav = el => DW.go(el.dataset.view);

  const stat = (ic, value, label, c) => `<div class="stat c-${c}"><span class="stat-ic">${icon(ic)}</span><b>${value}</b><small>${label}</small></div>`;

  /* ───────────── Host ───────────── */
  let simTimer = null;
  DW.simulateRequest = function (ms) {
    clearTimeout(simTimer);
    simTimer = setTimeout(() => {
      const l = db.listings[db.listings.length - 1];
      if (!l || db.requests.some(r => r.status === 'pending')) return;
      const r = DW.rng(String(Date.now()));
      const req = {
        id: 'q' + Date.now(), listingId: l.id, listing: l.name, fee: l.fee, ts: Date.now(),
        guest: DW.pick(r, ['Kuba', 'Emma', 'Liam', 'Sofia', 'Hugo', 'Mila', 'Oskar', 'Nina']),
        eta: DW.pick(r, ['2 min', '5 min', '8 min']), rating: (4.5 + r() * 0.5).toFixed(1),
        status: l.instant ? 'accepted' : 'pending'
      };
      db.requests.unshift(req);
      db.requests = db.requests.slice(0, 20);
      if (l.instant) {
        db.earnings += l.fee; db.hostVisits++;
        DW.toast(`<b>${req.guest}</b> used instant access · you earned ${DW.money(l.fee)}`, { icon: 'hand-coins', tone: 'ok', ms: 5200 });
        DW.confetti(window.innerWidth / 2, window.innerHeight - 80, 50);
      } else {
        DW.toast(`<b>New request!</b> ${req.guest} would like to use your toilet`, { icon: 'bell-ring', ms: 5200 });
      }
      DW.save();
      if (S.view === 'host') DW.renderHost();
      else $('.mainnav [data-view="host"]').classList.add('has-dot');
    }, ms);
  };

  DW.renderHost = function () {
    const mine = db.listings;
    const pending = db.requests.filter(r => r.status === 'pending');
    const past = db.requests.filter(r => r.status !== 'pending').slice(0, 6);
    $('#view-host').innerHTML = `<div class="page">
      <section class="hero">
        <div class="hero-txt">
          <span class="kicker">${icon('hand-coins')}DuckWay Host</span>
          <h1>Your bathroom can earn <em>pocket money</em>.</h1>
          <p>List your toilet, set a tiny fee and let people nearby request access. You approve every visit — or switch on instant access and earn without lifting a finger.</p>
          <button class="btn primary lg" data-action="host-new">${icon('plus')}List your toilet</button>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="art-frame">${DW.scene(0)}</div>
          <span class="float f1">${icon('hand-coins')}+ ${DW.money(DW.CUR.priv[2])}</span>
          <span class="float f2">${icon('star')}4.9 · “Spotless”</span>
          <span class="float f3">${icon('heart')}Thank you!</span>
          <div class="hero-duck">${DW.duck('hop')}</div>
        </div>
      </section>

      <div class="stats">
        ${stat('wallet', `<span id="earned">${DW.money(db.earnings)}</span>`, 'Earned so far', 'yellow')}
        ${stat('users', db.hostVisits, 'Guests hosted', 'pink')}
        ${stat('house', mine.length, mine.length === 1 ? 'Active listing' : 'Active listings', 'mint')}
      </div>

      ${pending.length ? `<section class="panel ring"><h2>Knock knock! 🚪</h2><p class="panel-sub">Someone nearby would like to use your toilet.</p>
        ${pending.map(r => `<div class="req">
          <span class="avatar" style="${DW.hue(r.guest)}">${esc(r.guest[0])}</span>
          <div class="req-txt"><b>${esc(r.guest)} <small>${icon('star')}${r.rating}</small></b><span>Arriving in ${r.eta} · ${esc(r.listing)}</span></div>
          <b class="req-fee">${DW.money(r.fee)}</b>
          <button class="btn sm ghost" data-action="req-decline" data-id="${r.id}">Decline</button>
          <button class="btn sm primary" data-action="req-accept" data-id="${r.id}">${icon('check')}Accept</button>
        </div>`).join('')}</section>` : ''}

      <section class="panel">
        <h2>Your listings</h2>
        ${mine.length ? mine.map(t => {
          const h = DW.hoursOf(t);
          return `<div class="listing">
            <span class="kind c-mint">${icon('house')}</span>
            <div class="listing-txt"><b>${esc(t.name)}</b><span>${DW.money(t.fee)} per visit · ${h.allDay ? 'Open 24 hours' : `${h.open} – ${h.close}`} · ${t.instant ? 'Instant access' : 'You approve each guest'}</span></div>
            <button class="btn sm" data-action="open" data-id="${t.id}">${icon('map')}View</button>
            <button class="btn sm ghost" data-action="listing-remove" data-id="${t.id}" aria-label="Remove listing">${icon('trash-2')}</button>
          </div>`;
        }).join('') : `<div class="empty small"><div class="empty-duck">${DW.duck()}</div><h3>No listings yet</h3><p>It takes about a minute. Drop a pin, set your price, done.</p></div>`}
      </section>

      <section class="steps">
        <div class="c-blue"><span>1</span><h3>Drop a pin</h3><p>Mark your place on the map. Guests only see the exact address after you accept them.</p></div>
        <div class="c-pink"><span>2</span><h3>Set price and hours</h3><p>Most hosts charge ${DW.money(DW.CUR.priv[0])}–${DW.money(DW.CUR.priv[DW.CUR.priv.length - 1])} per visit and host when they are home anyway.</p></div>
        <div class="c-mint"><span>3</span><h3>Accept and earn</h3><p>Approve each request or allow instant access. Guests rate the visit, you collect the fee.</p></div>
      </section>

      ${past.length ? `<section class="panel"><h2>Recent visits</h2><ul class="feed">${past.map(r => `
        <li><span class="feed-ic ${r.status === 'accepted' ? 'c-mint' : ''}">${icon(r.status === 'accepted' ? 'check' : 'x')}</span><div><b>${esc(r.guest)} · ${esc(r.listing)}</b><small>${r.status === 'accepted' ? 'Hosted' : 'Declined'} · ${DW.timeAgo(r.ts)}</small></div><em>${r.status === 'accepted' ? `+${DW.money(r.fee)}` : '—'}</em></li>`).join('')}</ul></section>` : ''}
      <p class="datanote">Demo mode — guest requests are simulated and no real money moves.</p>
    </div>`;
    if (mine.length && !pending.length && !simTimer) DW.simulateRequest(12000);
  };

  Object.assign(DW.actions, {
    'req-accept'(el) {
      const r = db.requests.find(x => x.id === el.dataset.id);
      if (!r) return;
      r.status = 'accepted';
      db.earnings += r.fee; db.hostVisits++;
      DW.save();
      const box = el.getBoundingClientRect();
      DW.confetti(box.left + box.width / 2, box.top, 70);
      DW.toast(`${esc(r.guest)} is on the way · <b>+${DW.money(r.fee)}</b>`, { icon: 'hand-coins', tone: 'ok' });
      DW.renderHost();
      DW.simulateRequest(20000);
    },
    'req-decline'(el) {
      const r = db.requests.find(x => x.id === el.dataset.id);
      if (!r) return;
      r.status = 'declined';
      DW.save();
      DW.renderHost();
      DW.simulateRequest(20000);
    },
    'listing-remove'(el) {
      const id = el.dataset.id;
      db.listings = db.listings.filter(t => t.id !== id);
      DW.toilets = DW.toilets.filter(t => t.id !== id);
      db.requests = db.requests.filter(r => !(r.listingId === id && r.status === 'pending'));
      delete db.photos[id];
      DW.save(); DW.bump();
      DW.toast('Listing removed.', { icon: 'trash-2' });
      DW.renderHost();
    }
  });

  /* ───────────── Community ───────────── */
  const LEADERS = [['Zofia M.', 1240], ['Jonas B.', 980], ['Aiko T.', 715], ['Mateo G.', 540], ['Leila A.', 310], ['Ravi S.', 150], ['Ines D.', 60]];
  const EARN = [
    ['circle-check', 'Confirm a toilet is open', 'confirm', 'mint'], ['flag', 'Report a closure, missing paper or soap', 'report', 'peach'],
    ['camera', 'Add a photo', 'photo', 'lav'], ['clock', 'Update opening hours', 'hours', 'blue'],
    ['star', 'Rate cleanliness, comfort, smell and privacy', 'review', 'pink'], ['map-pin-plus', 'Add a new toilet', 'add', 'yellow']
  ];
  const PREFS = [
    ['accessible', 'accessibility', 'I need step-free access', 'blue'], ['changing', 'baby', 'I need a changing table', 'pink'],
    ['free', 'gift', 'I prefer free toilets', 'yellow'], ['clean', 'sparkles', 'Cleanliness matters most', 'mint']
  ];
  const RANK_COLORS = ['yellow', 'pink', 'blue', 'mint', 'lav'];

  DW.renderCommunity = function () {
    const rk = DW.rank(db.points), c = db.counts, q = DW.quests();
    const board = [...LEADERS.map(([name, pts]) => ({ name, pts })), { name: db.name || 'You', pts: db.points, me: true }].sort((a, b) => b.pts - a.pts);
    const got = DW.BADGES.filter(b => db.badges[b.id]).length;
    $('#view-community').innerHTML = `<div class="page">
      <section class="profile">
        <div class="profile-main">
          <span class="avatar xl duck-av">${DW.duck()}</span>
          <div class="profile-txt">
            <input class="name-in" value="${esc(db.name)}" placeholder="Add your name" data-change="name" maxlength="20" aria-label="Your display name">
            <p><b>${rk.current.name}</b> · ${rk.current.note}</p>
          </div>
          <div class="profile-pts"><b>${db.points}</b><small>trust points</small></div>
        </div>
        <div class="progress"><i style="width:${Math.round(rk.progress * 100)}%"></i></div>
        <small class="progress-note">${rk.next ? `${rk.next.min - db.points} points to <b>${rk.next.name}</b>` : 'You reached the top rank.'}</small>
        <div class="ladder">${DW.RANKS.map((r, i) => `<div class="c-${RANK_COLORS[i]} ${i <= rk.index ? 'done' : ''} ${i === rk.index ? 'now' : ''}"><span>${icon(r.icon)}</span><b>${r.name}</b><small>${r.min} pts</small></div>`).join('')}</div>
      </section>

      <div class="stats four">
        ${stat('star', c.review, 'Reviews', 'pink')}
        ${stat('flag', c.report, 'Reports', 'peach')}
        ${stat('circle-check', c.confirm, 'Confirmations', 'mint')}
        ${stat('map-pin-plus', c.add, 'Toilets added', 'blue')}
      </div>

      <div class="cols">
        <section class="panel" id="quests">
          <h2>Daily quests 🎯</h2>
          <p class="panel-sub">Finish all three today for a <b>+${DW.QUEST_BONUS} point</b> bonus.</p>
          <ul class="quests">${DW.QUESTS.map(x => `<li class="c-${x.color} ${q.done.includes(x.id) ? 'done' : ''}"><span>${icon(x.icon)}</span>${x.label}<i>${icon(q.done.includes(x.id) ? 'check' : 'circle')}</i></li>`).join('')}</ul>
          <div class="quest-bar"><i style="width:${(q.done.length / DW.QUESTS.length) * 100}%"></i><span>${icon('gift')}</span></div>
        </section>

        <section class="panel">
          <h2>Badges <small>${got} of ${DW.BADGES.length}</small></h2>
          <p class="panel-sub">Collect them all — each one is a little thank-you from Ducky.</p>
          <div class="badges">${DW.BADGES.map(b => `<div class="badge-tile c-${b.color} ${db.badges[b.id] ? 'got' : ''}" title="${esc(b.desc)}"><span class="sticker">${icon(db.badges[b.id] ? b.icon : 'lock')}</span><b>${b.name}</b><small>${b.desc}</small></div>`).join('')}</div>
        </section>

        <section class="panel">
          <h2>Earn trust points</h2>
          <p class="panel-sub">Toilet data goes stale fast. Every confirmed update makes your reports count more.</p>
          <ul class="earn">${EARN.map(([ic, label, key, col]) => `<li><span class="c-${col}">${icon(ic)}</span>${label}<em>+${DW.POINTS[key]}</em></li>`).join('')}</ul>
          <button class="btn primary wide" data-action="add-toilet">${icon('map-pin-plus')}Add a toilet</button>
        </section>

        <section class="panel">
          <h2>Leaderboard 🏆</h2>
          <p class="panel-sub">Most trusted contributors this month.</p>
          <ol class="board">${board.map((u, i) => `<li class="${u.me ? 'me' : ''}"><i class="place p${i + 1}">${i + 1}</i><span class="avatar sm" style="${DW.hue(u.name)}">${esc(u.name[0])}</span><b>${esc(u.name)}${u.me && db.name ? ' <em>you</em>' : ''}</b><small>${DW.rank(u.pts).current.name}</small><u>${u.pts}</u></li>`).join('')}</ol>
        </section>

        <section class="panel">
          <h2>Your preferences</h2>
          <p class="panel-sub">Ducky uses these to choose a pick for you.</p>
          <div class="prefs">${PREFS.map(([key, ic, label, col]) => `<button class="pref c-${col} ${db.prefs[key] ? 'is-on' : ''}" data-action="pref" data-key="${key}" aria-pressed="${!!db.prefs[key]}">${icon(ic)}<span>${label}</span><i class="switch"></i></button>`).join('')}</div>
        </section>

        <section class="panel">
          <h2>Access passes</h2>
          <p class="panel-sub">Private toilets you booked.</p>
          ${db.bookings.length ? `<ul class="feed">${db.bookings.slice(0, 5).map(b => `<li><span class="feed-ic c-lav">${icon('key-round')}</span><div><b>${esc(b.name)}</b><small>Code ${b.code} · ${DW.timeAgo(b.ts)}</small></div><em>${DW.money(b.fee)}</em></li>`).join('')}</ul>` : `<div class="empty small">${icon('key-round')}<p>No passes yet. Look for the house pins on the map.</p></div>`}
        </section>

        <section class="panel span2">
          <h2>Recent activity</h2>
          ${db.activity.length ? `<ul class="feed">${db.activity.slice(0, 8).map(a => `<li><span class="feed-ic c-yellow">${icon('star')}</span><div><b>${esc(a.label)}</b><small>${DW.timeAgo(a.ts)}</small></div><em>+${a.pts}</em></li>`).join('')}</ul>` : `<div class="empty small"><div class="empty-duck">${DW.duck()}</div><p>Your contributions will show up here.</p></div>`}
        </section>
      </div>
      <p class="datanote">Everything you add is stored in this browser only. <button class="link" data-action="reset">Reset my data</button></p>
    </div>`;
  };

  DW.changes.name = el => { db.name = el.value.trim(); DW.save(); };
  DW.actions.pref = el => {
    const k = el.dataset.key;
    db.prefs[k] = !db.prefs[k];
    DW.save();
    DW.renderCommunity();
  };
  DW.actions.reset = () => {
    if (!window.confirm('Delete your reviews, reports, listings and points from this browser?')) return;
    localStorage.removeItem('duckway.v1');
    location.reload();
  };
})();
