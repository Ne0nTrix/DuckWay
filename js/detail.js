/* DuckWay — toilet card (drawer), community actions, booking and "add a toilet" forms */
(function () {
  'use strict';
  const DW = window.DW, { $, $$, esc, icon } = DW;
  const S = DW.state, db = DW.db;
  const HOUR = 36e5;

  DW.changes = {}; // handlers for <input data-change="...">

  /* ---------- small building blocks ---------- */
  const stars = v => `<span class="stars" aria-label="${v.toFixed(1)} out of 5">${[1, 2, 3, 4, 5].map(n => icon('star', v >= n - 0.25 ? 'on' : v >= n - 0.75 ? 'half' : '')).join('')}</span>`;
  const photoEl = p => (p.src
    ? `<figure class="ph"><img src="${p.src}" alt="Photo added by a visitor" loading="lazy"></figure>`
    : `<figure class="ph">${DW.scene(p.scene)}<figcaption>Sample</figcaption></figure>`);
  const fact = (ic, label, value, tone = '', c = 'blue') => `<div class="fact c-${c} ${tone}"><span class="fact-ic">${icon(ic)}</span><div><small>${label}</small><b>${value}</b></div></div>`;
  const hoursText = h => (h.allDay ? 'Open 24 hours' : `${h.open} – ${h.close}`);

  DW.refresh = function () {
    DW.bump();
    DW.render();
    const t = S.selected && DW.byId(S.selected);
    if (t && !$('#drawer').hidden) DW.renderDrawer(t);
  };

  /* ---------- the toilet card ---------- */
  DW.renderDrawer = function (t) {
    const d = $('#drawer');
    const keepScroll = d.dataset.id === t.id && !d.hidden ? ($('.dr-scroll', d) || {}).scrollTop : 0;
    const st = DW.status(t), k = DW.KINDS[t.kind], rt = DW.rating(t), cs = DW.cleanScore(t), acc = DW.access(t), h = DW.hoursOf(t);
    const photos = DW.photosOf(t), conf = DW.confirmOf(t), reps = DW.reportsOf(t), revs = DW.reviewsOf(t);
    const pass = db.bookings.find(b => b.toiletId === t.id && Date.now() - b.ts < 2 * HOUR);
    const isPrivate = t.kind === 'private';
    const address = t.address || (isPrivate ? 'Exact address is shared after booking' : t._addrTried ? 'Address not available' : 'Finding the address…');

    const cover = photos[0] ? (photos[0].src ? `<img src="${photos[0].src}" alt="">` : DW.scene(photos[0].scene)) : `<div class="cover-blank">${icon(k.icon)}</div>`;

    const C = 2 * Math.PI * 26;
    const aiBlock = cs.score == null
      ? `<section class="ai-clean none"><div class="ai-txt"><span class="ai-kicker">${icon('sparkles')}AI Cleanliness Score</span><p>No reviews yet. Add the first one and help the next visitor.</p></div></section>`
      : `<section class="ai-clean ${cs.tone}">
          <div class="gauge"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" class="g-bg"/><circle cx="32" cy="32" r="26" class="g-fg" stroke-dasharray="${(cs.score / 100) * C} ${C}" transform="rotate(-90 32 32)"/></svg><b>${cs.score}</b></div>
          <div class="ai-txt">
            <span class="ai-kicker">${icon('sparkles')}AI Cleanliness Score</span>
            <h4>${cs.label}${cs.trend === 'up' ? ` <em class="up">${icon('trending-up')}improving</em>` : cs.trend === 'down' ? ` <em class="down">${icon('trending-down')}getting worse</em>` : ''}</h4>
            <p>From ${cs.n} review${cs.n === 1 ? '' : 's'}, newest ${DW.timeAgo(cs.latest)}. Recent visits weigh more than old ones. Confidence: ${cs.confidence.toLowerCase()}.</p>
            ${cs.why.map(w => `<p class="ai-why">${icon('triangle-alert')}${esc(w)}</p>`).join('')}
          </div>
        </section>`;

    const live = [];
    if (st.reported) live.push(`<li class="bad">${icon('door-closed')}<span><b>Reported closed</b> ${st.sub.replace('reported ', '')}. If it is open again, tap “Still open”.</span></li>`);
    if (conf) live.push(`<li class="ok">${icon('circle-check')}<span><b>Confirmed available</b> ${DW.timeAgo(conf.ts)} by ${conf.count} ${conf.count === 1 ? 'person' : 'people'}${conf.mine ? ' (including you)' : ''}.</span></li>`);
    reps.filter(r => r.type !== 'closed').forEach(r => live.push(`<li class="warn">${icon(DW.REPORTS[r.type].icon)}<span><b>${DW.REPORTS[r.type].short}</b> — reported ${DW.timeAgo(r.ts)}${r.mine ? ' by you' : ''}.</span></li>`));
    if (!live.length) live.push(`<li class="muted">${icon('info')}<span>No recent updates. Be the first to confirm it is open.</span></li>`);

    const hostBlock = !isPrivate ? '' : `
      <section class="host-card">
        <div class="host-top"><span class="avatar" style="${DW.hue(t.host.name)}">${esc((t.host.name || 'Y')[0])}</span>
          <div><b>Hosted by ${esc(t.host.name)}</b><small>${t.mine ? 'This is your listing' : `Host since ${t.host.since} · ${t.host.visits} visits · replies ${t.host.reply}`}</small></div>
        </div>
        ${t.note ? `<p>${esc(t.note)}</p>` : ''}
        ${(t.rules || []).length ? `<ul class="rules">${t.rules.map(r => `<li>${icon('check')}${esc(r)}</li>`).join('')}</ul>` : ''}
      </section>`;
    const passBlock = !pass ? '' : `
      <section class="pass">
        <span class="pass-ic">${icon('key-round')}</span>
        <div><small>Access granted · valid for 2 hours</small><b>Door code ${pass.code}</b><p>Ring the bell marked “DuckWay” and show this code to ${esc(pass.host)}.</p></div>
      </section>`;

    const primary = isPrivate && !t.mine && !pass
      ? `<button class="btn primary grow" data-action="book" data-id="${t.id}">${icon(t.instant ? 'zap' : 'hand')}${t.instant ? 'Get access' : 'Request access'} · ${DW.money(t.fee)}</button>
         <button class="btn icon-only" data-action="route" data-id="${t.id}" aria-label="Navigate me" title="Navigate me">${icon('navigation')}</button>
         <button class="btn icon-only" data-action="review" data-id="${t.id}" aria-label="Add review" title="Add review">${icon('star')}</button>`
      : `<button class="btn primary grow" data-action="route" data-id="${t.id}">${icon('navigation')}Navigate me</button>
         <button class="btn grow" data-action="review" data-id="${t.id}">${icon('star')}Add review</button>`;

    d.innerHTML = `
      <div class="dr-scroll">
        <div class="dr-cover">${cover}
          <div class="dr-cover-top">
            <span class="badge c-${k.c}">${icon(k.icon)}${esc(t.venueType || k.label)}</span>
            ${t.friendly ? `<span class="badge soft">${icon('hand-heart')}Friendly Venue</span>` : ''}
            <button class="iconbtn light" data-action="close-drawer" aria-label="Close">${icon('x')}</button>
          </div>
        </div>
        <div class="dr-body">
          <h2>${esc(t.name)}</h2>
          <p class="addr">${icon('map-pin')}<span id="dr-addr">${esc(address)}</span></p>

          <div class="quick">
            <div><b>${DW.fmtDist(t.d)}</b><span>${t.d < 8000 ? `${DW.fmtWalk(t.d)} walk` : 'away'}</span></div>
            <div class="${st.open ? 'ok' : 'bad'}"><b>${st.word}</b><span>${esc(st.sub)}</span></div>
            <div><b>${esc(DW.priceLabel(t))}</b><span>${t.fee > 0 ? (isPrivate ? 'per visit' : 'entry') : t.purchaseRequired ? 'buy something' : 'no entry fee'}</span></div>
            <div><b>${rt.avg ? rt.avg.toFixed(1) : '–'}</b><span>${rt.n ? `${rt.n} review${rt.n === 1 ? '' : 's'}` : 'no reviews'}</span></div>
          </div>

          ${passBlock}
          <div class="access ${acc.tone}">${icon(acc.icon)}<div><b>${acc.label}</b><span>${acc.detail}</span></div></div>
          ${hostBlock}
          ${aiBlock}

          <section>
            <h4>Good to know</h4>
            <div class="facts">
              ${fact('clock', `Opening hours${db.hours[t.id] ? ' · updated by you' : ''}`, hoursText(h), '', 'blue')}
              ${fact('coins', 'Entry price', t.fee > 0 ? `${DW.money(t.fee)}${t.payments.length ? ` · ${t.payments.join(', ')}` : ''}` : t.purchaseRequired ? 'Free with a purchase' : 'Free', '', 'yellow')}
              ${fact('accessibility', 'Wheelchair access', t.wheelchair ? 'Yes — step-free' : 'Not accessible', t.wheelchair ? 'yes' : 'no', 'blue')}
              ${fact('baby', 'Changing table', t.changing ? 'Available' : 'Not available', t.changing ? 'yes' : 'no', 'pink')}
              ${fact('key-round', 'Key needed', t.needsKey ? 'Yes — ask the staff' : t.receiptCode ? 'Code on the receipt' : 'No key needed', t.needsKey || t.receiptCode ? 'no' : 'yes', 'peach')}
              ${fact(t.gender === 'unisex' ? 'users' : 'person-standing', 'Rooms', t.gender === 'unisex' ? 'Unisex' : 'Women and men', '', 'lav')}
              ${t.kind === 'food' ? fact('shopping-bag', 'Purchase', t.purchaseRequired ? 'Required to use the toilet' : 'Not required', t.purchaseRequired ? 'no' : 'yes', 'pink') : ''}
            </div>
          </section>

          <section>
            <h4>Live status</h4>
            <ul class="live">${live.join('')}</ul>
            <div class="live-actions">
              <button class="c-mint" data-action="confirm" data-id="${t.id}">${icon('circle-check')}Still open<em>+${DW.POINTS.confirm}</em></button>
              <button class="c-peach" data-action="report" data-id="${t.id}">${icon('flag')}Report a problem<em>+${DW.POINTS.report}</em></button>
              <button class="c-blue" data-action="edit-hours" data-id="${t.id}">${icon('clock')}Update hours<em>+${DW.POINTS.hours}</em></button>
            </div>
          </section>

          <section>
            <h4>Photos</h4>
            <div class="photos">
              ${photos.map(photoEl).join('')}
              <label class="ph add">${icon('camera')}<span>Add photo</span><em>+${DW.POINTS.photo}</em><input type="file" accept="image/*" multiple hidden data-change="toilet-photo" data-id="${t.id}"></label>
            </div>
          </section>

          <section>
            <h4>Ratings</h4>
            ${rt.avg ? `<div class="ratings">
              <div class="rt-big"><b>${rt.avg.toFixed(1)}</b>${stars(rt.avg)}<small>${rt.n} review${rt.n === 1 ? '' : 's'}</small></div>
              <div class="rt-bars">${DW.CATS.map(c => `<div class="bar c-${c.c}"><span>${icon(c.icon)}${c.label}</span><i><u style="width:${(rt.cats[c.id] / 5) * 100}%"></u></i><b>${rt.cats[c.id].toFixed(1)}</b></div>`).join('')}</div>
            </div>` : '<p class="muted-p">Nobody has rated this toilet yet.</p>'}
          </section>

          <section>
            <h4>Reviews</h4>
            ${revs.length ? `<ul class="reviews">${revs.map(r => `
              <li>
                <div class="rv-head"><span class="avatar sm" style="${DW.hue(r.author)}">${esc((r.author || 'Y')[0])}</span><div><b>${esc(r.author)}${r.mine ? ' <em>you</em>' : ''}</b><small>${DW.timeAgo(r.ts)}</small></div>${stars((r.clean + r.comfort + r.smell + r.privacy) / 4)}</div>
                ${r.text ? `<p>${esc(r.text)}</p>` : ''}
                <div class="rv-cats">${DW.CATS.map(c => `<span>${c.label} <b>${r[c.id]}</b></span>`).join('')}</div>
                ${(r.photos || []).length ? `<div class="rv-photos">${r.photos.map(src => `<img src="${src}" alt="Review photo" loading="lazy">`).join('')}</div>` : ''}
              </li>`).join('')}</ul>` : '<p class="muted-p">No reviews yet — yours could be the first.</p>'}
          </section>
          ${t.sample || isPrivate ? '<p class="datanote">Sample place created for this demo.</p>' : t.osm ? '<p class="datanote">Location from OpenStreetMap. Details without an official source are sample data.</p>' : ''}
        </div>
      </div>
      <div class="dr-cta">${primary}</div>`;
    d.dataset.id = t.id;
    d.hidden = false;
    document.body.classList.add('has-drawer');
    $('.dr-scroll', d).scrollTop = keepScroll || 0;

    DW.reverse(t).then(addr => {
      const el = $('#dr-addr');
      if (S.selected === t.id && el && !isPrivate) el.textContent = addr || t.address || 'Address not available';
    });
  };

  DW.closeDrawer = function () {
    const d = $('#drawer');
    if (d.hidden) return;
    d.hidden = true;
    document.body.classList.remove('has-drawer');
    S.selected = null;
    if (!S.loading && S.view === 'explore') DW.render();
  };

  /* ---------- modal ---------- */
  DW.modal = function ({ title, sub, body }) {
    $('#modal-root').innerHTML = `
      <div class="modal-back" data-action="modal-back">
        <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
          <header><div><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div><button class="iconbtn" data-action="modal-close" aria-label="Close">${icon('x')}</button></header>
          <div class="modal-body">${body}</div>
        </div>
      </div>`;
    document.body.classList.add('has-modal');
    const first = $('#modal-root input[name="name"]');
    if (first && window.innerWidth > 900) first.focus();
  };
  DW.closeModal = function () {
    $('#modal-root').innerHTML = '';
    document.body.classList.remove('has-modal');
  };

  const field = (label, control) => `<label class="field"><span>${label}</span>${control}</label>`;
  const uploader = label => `
    <div class="uploader">
      <label class="upl-btn">${icon('image-plus')}${label}<input type="file" accept="image/*" multiple hidden data-change="form-photos"></label>
      <div class="thumbs"></div>
    </div>`;
  const hoursFields = h => `
    <label class="check"><input type="checkbox" name="allDay" ${h.allDay ? 'checked' : ''} data-change="allday"><span>Open 24 hours</span></label>
    <div class="row2 hours-row" ${h.allDay ? 'hidden' : ''}>
      ${field('Opens', `<input type="time" name="open" value="${h.open || '08:00'}">`)}
      ${field('Closes', `<input type="time" name="close" value="${h.close || '22:00'}">`)}
    </div>`;
  const readHours = fd => (fd.get('allDay') ? { allDay: true } : { open: fd.get('open') || '08:00', close: fd.get('close') || '22:00' });
  DW.changes.allday = el => { const row = $('.hours-row', el.closest('form')); if (row) row.hidden = el.checked; };

  DW.changes['form-photos'] = async function (el) {
    const form = el.closest('form');
    form._photos = form._photos || [];
    for (const file of Array.from(el.files).slice(0, 4 - form._photos.length)) {
      try { form._photos.push(await DW.compress(file)); } catch (e) { DW.toast('That file could not be read as an image.', { tone: 'warn' }); }
    }
    el.value = '';
    $('.thumbs', form).innerHTML = form._photos.map(src => `<img src="${src}" alt="Selected photo">`).join('');
  };

  /* ---------- review ---------- */
  const tri = (name, label) => `
    <div class="tri"><span>${label}</span>
      <label><input type="radio" name="${name}" value="yes"><i>${icon('check')}Yes</i></label>
      <label><input type="radio" name="${name}" value="no"><i>${icon('x')}No</i></label>
    </div>`;

  Object.assign(DW.actions, {
    'close-drawer'() { DW.closeDrawer(); },
    'modal-close'() { DW.closeModal(); },
    'modal-back'(el, e) { if (e.target === el) DW.closeModal(); },

    review(el) {
      const t = DW.byId(el.dataset.id);
      if (!t) return;
      DW.modal({
        title: 'Rate this toilet', sub: esc(t.name),
        body: `<form class="form" data-form="review" data-id="${t.id}">
          <div class="rate-rows">${DW.CATS.map(c => `
            <div class="rate-row c-${c.c}"><span>${icon(c.icon)}${c.label}</span>
              <div class="stars-in">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-action="star" data-v="${n}" aria-label="${c.label}: ${n} of 5">${icon('star')}</button>`).join('')}</div>
              <input type="hidden" name="${c.id}" value="0">
            </div>`).join('')}</div>
          <div class="tris"><p>Quick check <small>optional</small></p>${tri('paper', 'Toilet paper')}${tri('soap', 'Soap')}${tri('lock', 'Lock works')}</div>
          ${field('Your review <small>optional</small>', '<textarea name="text" rows="3" maxlength="400" placeholder="What should the next visitor know?"></textarea>')}
          ${uploader('Add photos')}
          <button class="btn primary wide" type="submit">Publish review<em>+${DW.POINTS.review} pts</em></button>
        </form>`
      });
    },
    star(el) {
      const row = el.closest('.rate-row'), v = +el.dataset.v;
      $('input', row).value = v;
      $$('.stars-in button', row).forEach(b => b.classList.toggle('on', +b.dataset.v <= v));
    },

    confirm(el) {
      const t = DW.byId(el.dataset.id), last = db.confirms[t.id];
      if (last && Date.now() - last.ts < HOUR) return DW.toast('You already confirmed this toilet in the last hour. Thanks!', { icon: 'circle-check' });
      db.confirms[t.id] = { ts: Date.now() };
      DW.award(DW.POINTS.confirm, `Confirmed ${t.name} is open`, 'confirm');
      DW.refresh();
    },
    report(el) {
      const t = DW.byId(el.dataset.id);
      DW.modal({
        title: 'Report a problem', sub: 'Your report shows up for everyone right away.',
        body: `<form class="form" data-form="report" data-id="${t.id}">
          <div class="opts">${Object.entries(DW.REPORTS).map(([id, r]) => `<label class="opt"><input type="checkbox" name="type" value="${id}"><span>${icon(r.icon)}${r.label}</span></label>`).join('')}</div>
          <p class="hint">${icon('info')}“Closed” hides this toilet from one-tap navigation for 12 hours, or until someone confirms it is open again.</p>
          <button class="btn primary wide" type="submit">Send report<em>+${DW.POINTS.report} pts</em></button>
        </form>`
      });
    },
    'edit-hours'(el) {
      const t = DW.byId(el.dataset.id);
      DW.modal({
        title: 'Update opening hours', sub: esc(t.name),
        body: `<form class="form" data-form="hours" data-id="${t.id}">${hoursFields(DW.hoursOf(t))}
          <button class="btn primary wide" type="submit">Save hours<em>+${DW.POINTS.hours} pts</em></button></form>`
      });
    },

    /* ----- private toilets: request access ----- */
    book(el) {
      const t = DW.byId(el.dataset.id);
      const pays = ['DuckWay wallet', 'Card'].concat(DW.CUR.blik ? ['BLIK'] : []);
      DW.modal({
        title: t.instant ? 'Get instant access' : 'Request access', sub: esc(t.name),
        body: `<form class="form" data-form="book" data-id="${t.id}">
          <div class="host-top"><span class="avatar" style="${DW.hue(t.host.name)}">${esc(t.host.name[0])}</span><div><b>${esc(t.host.name)}</b><small>Host since ${t.host.since} · ${t.host.visits} visits · replies ${t.host.reply}</small></div></div>
          <div class="seg-field"><span>When will you arrive?</span>
            <div class="seg">${['Right now', 'In 10 min', 'In 30 min'].map((x, i) => `<label><input type="radio" name="eta" value="${x}" ${i ? '' : 'checked'}><i>${x}</i></label>`).join('')}</div>
          </div>
          <div class="seg-field"><span>Pay with</span>
            <div class="seg">${pays.map((x, i) => `<label><input type="radio" name="pay" value="${x}" ${i ? '' : 'checked'}><i>${x}</i></label>`).join('')}</div>
          </div>
          <dl class="bill"><div><dt>One visit</dt><dd>${DW.money(t.fee)}</dd></div><div><dt>Service fee</dt><dd>${DW.money(0)}</dd></div><div class="total"><dt>Total</dt><dd>${DW.money(t.fee)}</dd></div></dl>
          <p class="hint">${icon('shield-check')}Demo mode — no real payment is taken. You only pay once the host lets you in.</p>
          <button class="btn primary wide" type="submit">${icon(t.instant ? 'zap' : 'send')}${t.instant ? 'Pay and get the door code' : 'Send request'} · ${DW.money(t.fee)}</button>
        </form>`
      });
    }
  });

  Object.assign(DW.forms, {
    review(form, fd) {
      const t = DW.byId(form.dataset.id);
      const clean = +fd.get('clean');
      if (!clean) return DW.toast('Please rate at least the cleanliness.', { tone: 'warn', icon: 'star' });
      const photos = form._photos || [];
      const rev = {
        id: 'u' + Date.now(), author: db.name || 'You', mine: true, ts: Date.now(), clean,
        comfort: +fd.get('comfort') || clean, smell: +fd.get('smell') || clean, privacy: +fd.get('privacy') || clean,
        text: String(fd.get('text') || '').trim(), photos
      };
      (db.reviews[t.id] = db.reviews[t.id] || []).unshift(rev);
      ['paper', 'soap', 'lock'].forEach(type => {
        if (fd.get(type) === 'no') (db.reports[t.id] = db.reports[t.id] || []).unshift({ type, ts: Date.now(), mine: true });
      });
      DW.closeModal();
      DW.award(DW.POINTS.review + (photos.length ? DW.POINTS.photo : 0), `Reviewed ${t.name}`, 'review');
      DW.refresh();
    },
    report(form, fd) {
      const t = DW.byId(form.dataset.id), types = fd.getAll('type');
      if (!types.length) return DW.toast('Pick at least one problem.', { tone: 'warn', icon: 'flag' });
      types.forEach(type => (db.reports[t.id] = db.reports[t.id] || []).unshift({ type, ts: Date.now(), mine: true }));
      if (types.includes('closed')) { delete db.confirms[t.id]; if (S.route && S.route.id === t.id) DW.endRoute(); }
      DW.closeModal();
      DW.award(DW.POINTS.report, `Reported a problem at ${t.name}`, 'report');
      DW.refresh();
    },
    hours(form, fd) {
      const t = DW.byId(form.dataset.id);
      db.hours[t.id] = readHours(fd);
      DW.closeModal();
      DW.award(DW.POINTS.hours, `Updated hours of ${t.name}`, 'hours');
      DW.refresh();
    },
    book(form, fd) {
      const t = DW.byId(form.dataset.id), eta = fd.get('eta');
      const body = $('.modal-body');
      body.innerHTML = `<div class="wait"><div class="looking-duck">${DW.duck('swim')}</div><h4>${t.instant ? 'Unlocking access…' : `Waiting for ${esc(t.host.name)} to accept…`}</h4><p>${t.instant ? 'Confirming your payment.' : 'Hosts usually answer within a couple of minutes.'}</p></div>`;
      setTimeout(() => {
        if (!$('.wait')) return; // the modal was closed
        const code = String(1000 + Math.floor(Math.random() * 9000));
        db.bookings.unshift({ id: 'b' + Date.now(), toiletId: t.id, name: t.name, host: t.host.name, fee: t.fee, ts: Date.now(), code, eta });
        DW.award(5, `Booked ${t.name}`);
        DW.party();
        DW.refresh();
        body.innerHTML = `<div class="wait done">
          <div class="done-duck">${DW.duck('hop')}</div>
          <h4>${esc(t.host.name)} is expecting you 🎉</h4>
          <p>Ring the bell marked “DuckWay” and show this code. It is valid for 2 hours.</p>
          <div class="code">${code.split('').map(c => `<b>${c}</b>`).join('')}</div>
          <button class="btn primary wide" data-action="book-go" data-id="${t.id}">${icon('navigation')}Navigate me there</button>
        </div>`;
      }, t.instant ? 1100 : 2300);
    }
  });
  DW.actions['book-go'] = el => { DW.closeModal(); DW.actions.route(el); };

  DW.changes['toilet-photo'] = async function (el) {
    const t = DW.byId(el.dataset.id);
    let added = 0;
    for (const file of Array.from(el.files).slice(0, 4)) {
      try { (db.photos[t.id] = db.photos[t.id] || []).unshift(await DW.compress(file)); added++; } catch (e) { /* skip unreadable files */ }
    }
    if (!added) return DW.toast('That file could not be read as an image.', { tone: 'warn' });
    DW.award(DW.POINTS.photo, `Added ${added > 1 ? `${added} photos` : 'a photo'} of ${t.name}`, 'photo');
    DW.refresh();
  };

  /* ---------- add a new toilet ---------- */
  function locRow(c, action) {
    const tmp = { lat: c.lat, lng: c.lng };
    DW.reverse(tmp).then(addr => {
      const el = $('#loc-addr'), form = el && el.closest('form');
      if (el && addr) { el.textContent = addr; form.dataset.addr = addr; }
    });
    return `<div class="loc-row">${icon('map-pin')}<div><small>Location</small><b id="loc-addr">${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}</b></div><button type="button" class="btn sm ghost" data-action="${action}">Change</button></div>`;
  }
  const check = (name, label, ic) => `<label class="opt"><input type="checkbox" name="${name}"><span>${icon(ic)}${label}</span></label>`;

  DW.openAddForm = function (c) {
    DW.modal({
      title: 'Add a toilet', sub: 'Help the next person in a hurry.',
      body: `<form class="form" data-form="add" data-lat="${c.lat}" data-lng="${c.lng}">
        ${locRow(c, 'add-toilet')}
        ${field('Name', '<input name="name" required maxlength="60" placeholder="e.g. Park entrance public toilet">')}
        <div class="row2">
          ${field('Type of place', `<select name="kind">${['public', 'mall', 'fuel', 'food'].map(k => `<option value="${k}">${DW.KINDS[k].label}</option>`).join('')}</select>`)}
          ${field(`Entry price (${DW.CUR.sym}) <small>0 = free</small>`, '<input name="fee" type="number" min="0" step="0.01" value="0" inputmode="decimal">')}
        </div>
        ${hoursFields({ allDay: true })}
        <div class="opts">
          ${check('wheelchair', 'Wheelchair accessible', 'accessibility')}
          ${check('changing', 'Changing table', 'baby')}
          ${check('unisex', 'Unisex', 'users')}
          ${check('needsKey', 'Key needed', 'key-round')}
          ${check('purchaseRequired', 'Purchase required', 'shopping-bag')}
        </div>
        ${uploader('Add a photo of the entrance')}
        <button class="btn primary wide" type="submit">Add toilet<em>+${DW.POINTS.add} pts</em></button>
      </form>`
    });
  };

  DW.forms.add = function (form, fd) {
    const name = String(fd.get('name') || '').trim();
    if (!name) return;
    const kind = fd.get('kind'), fee = Math.max(0, parseFloat(fd.get('fee')) || 0);
    const t = DW.newToilet({
      kind, name, lat: +form.dataset.lat, lng: +form.dataset.lng, address: form.dataset.addr || null,
      fee, payments: fee ? ['Cash', 'Card'] : [], hours: readHours(fd),
      wheelchair: !!fd.get('wheelchair'), changing: !!fd.get('changing'), gender: fd.get('unisex') ? 'unisex' : 'separate',
      needsKey: !!fd.get('needsKey'), purchaseRequired: !!fd.get('purchaseRequired'),
      friendly: kind === 'food' && !fd.get('purchaseRequired')
    });
    if (form._photos && form._photos.length) db.photos[t.id] = form._photos;
    db.added.push(t);
    DW.toilets.push(t);
    DW.closeModal();
    DW.award(DW.POINTS.add, `Added ${name} to the map`, 'add');
    DW.party();
    DW.bump();
    DW.select(t.id);
  };

  /* ---------- host: list your own toilet ---------- */
  DW.openListingForm = function (c) {
    const def = DW.CUR.priv[2];
    DW.modal({
      title: 'List your toilet', sub: 'Guests nearby can request access for a small fee.',
      body: `<form class="form" data-form="listing" data-lat="${c.lat}" data-lng="${c.lng}">
        ${locRow(c, 'host-new')}
        ${field('Listing title', '<input name="name" required maxlength="50" placeholder="e.g. Bright guest bathroom near the park">')}
        <div class="row2">
          ${field(`Price per visit (${DW.CUR.sym})`, `<input name="fee" type="number" min="0.1" step="0.01" value="${def}" inputmode="decimal" required>`)}
          ${field('Your first name', `<input name="host" maxlength="20" value="${esc(db.name || '')}" placeholder="How guests see you" required>`)}
        </div>
        ${hoursFields({ open: '08:00', close: '22:00' })}
        <div class="opts">
          <label class="opt"><input type="checkbox" name="instant" checked><span>${icon('zap')}Instant access (no approval)</span></label>
          ${check('wheelchair', 'Step-free access', 'accessibility')}
          ${check('changing', 'Changing table', 'baby')}
        </div>
        ${field('Note for guests <small>optional</small>', '<textarea name="note" rows="2" maxlength="200" placeholder="e.g. Ground floor, ring the bell marked DuckWay."></textarea>')}
        ${uploader('Add photos')}
        <p class="hint">${icon('shield-check')}Your exact address is only shown to guests after you accept them.</p>
        <button class="btn primary wide" type="submit">${icon('hand-coins')}Publish listing</button>
      </form>`
    });
  };

  DW.forms.listing = function (form, fd) {
    const name = String(fd.get('name') || '').trim(), host = String(fd.get('host') || '').trim() || 'You';
    if (!name) return;
    if (!db.name) db.name = host;
    const t = DW.newToilet({
      kind: 'private', name, lat: +form.dataset.lat, lng: +form.dataset.lng,
      fee: Math.max(0.1, parseFloat(fd.get('fee')) || DW.CUR.priv[2]), payments: ['In-app'], hours: readHours(fd),
      wheelchair: !!fd.get('wheelchair'), changing: !!fd.get('changing'), instant: !!fd.get('instant'),
      note: String(fd.get('note') || '').trim(), rules: ['Leave it as you found it', 'One guest per booking'],
      host: { name: host, since: new Date().getFullYear(), visits: 0, reply: '~2 min' }
    });
    if (form._photos && form._photos.length) db.photos[t.id] = form._photos;
    db.listings.push(t);
    DW.toilets.push(t);
    DW.save();
    DW.bump();
    DW.closeModal();
    DW.toast('Your toilet is live on the map!', { icon: 'party-popper', tone: 'ok' });
    DW.party();
    DW.checkBadges();
    DW.go('host');
    DW.render();
    DW.simulateRequest(9000);
  };
  DW.actions['host-new'] = () => DW.startPick('host');
})();
