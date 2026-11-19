/* DuckWay — Explore screen: map, search, filters, list, one-tap navigation */
(function () {
  'use strict';
  const DW = window.DW, { $, esc, icon } = DW;

  const S = (DW.state = {
    view: 'explore',
    origin: { lat: 52.2319, lng: 21.0067, label: 'central Warsaw' }, // used until we know where you are
    user: null, located: false, usingSearch: false,
    filters: new Set(), sort: 'nearest', kind: null, maxDist: null,
    selected: null, route: null, loading: true, picking: null,
    ai: null, limit: 18, recId: null, fresh: true
  });

  let map, markerLayer, routeLayer, userMarker, originMarker, duckMarker, duckRaf, lastLoad = null;
  const markers = new Map();
  let loadSeq = 0, routeSeq = 0;
  const wide = () => window.innerWidth > 900;

  /* ---------- map ---------- */
  DW.initMap = function () {
    map = DW.map = L.map('map', { zoomControl: false }).setView([S.origin.lat, S.origin.lng], 15);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20, maxNativeZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);
    map.on('moveend', () => {
      if (!lastLoad || S.loading || S.picking) return;
      const far = DW.dist(pt(map.getCenter()), lastLoad) >= 1100;
      $('#btn-area').hidden = !far;
      if (far) $('#btn-retry').hidden = true;
    });
    map.on('click', hideSuggest);
  };
  const pt = ll => ({ lat: ll.lat, lng: ll.lng });

  function pinIcon(t, i) {
    const st = DW.status(t);
    const cls = ['pin', `c-${DW.KINDS[t.kind].c}`, st.open ? '' : 'is-closed', t.id === S.selected ? 'is-sel' : '', t.id === S.recId ? 'is-rec' : ''].join(' ');
    return L.divIcon({
      className: 'pin-wrap', iconSize: [36, 36], iconAnchor: [18, 43],
      html: `<div class="pin-in ${S.fresh ? 'drop' : ''}" style="--d:${Math.min(i, 40) * 22}ms"><div class="${cls}">${icon(DW.KINDS[t.kind].icon)}</div>${t.id === S.recId ? `<span class="pin-star">${icon('sparkles')}</span>` : ''}</div>`
    });
  }

  DW.renderMarkers = function (list) {
    markerLayer.clearLayers();
    markers.clear();
    const sel = S.selected && DW.byId(S.selected);
    const all = sel && !list.includes(sel) ? [...list, sel] : list;
    all.forEach((t, i) => {
      const m = L.marker([t.lat, t.lng], { icon: pinIcon(t, i), keyboard: false, zIndexOffset: t.id === S.selected ? 1000 : t.id === S.recId ? 500 : 0 });
      m.on('click', () => DW.select(t.id));
      m.bindTooltip(`<b>${esc(t.name)}</b><span>${DW.fmtDist(t.d)} · ${esc(DW.status(t).word)} · ${esc(DW.priceLabel(t))}</span>`, { direction: 'top', offset: [0, -46], className: 'pin-tip' });
      m.addTo(markerLayer);
      markers.set(t.id, m);
    });
  };

  function placeUser() {
    if (!S.user) return;
    if (userMarker) userMarker.remove();
    userMarker = L.marker([S.user.lat, S.user.lng], {
      interactive: false, zIndexOffset: 2000,
      icon: L.divIcon({ className: 'me-wrap', iconSize: [22, 22], iconAnchor: [11, 11], html: '<div class="me-dot"></div>' })
    }).addTo(map);
  }
  function placeOrigin() {
    if (originMarker) { originMarker.remove(); originMarker = null; }
    if (!S.usingSearch) return;
    originMarker = L.marker([S.origin.lat, S.origin.lng], {
      interactive: false, zIndexOffset: 1500,
      icon: L.divIcon({ className: 'me-wrap', iconSize: [18, 18], iconAnchor: [9, 9], html: '<div class="place-dot"></div>' })
    }).addTo(map);
  }

  /* ---------- data loading ---------- */
  DW.reload = async function (c) {
    const seq = ++loadSeq;
    S.loading = true;
    S.limit = 18;
    $('#loading-pill').hidden = false;
    $('#btn-area').hidden = true;
    $('#btn-retry').hidden = true;
    DW.renderList();
    const src = await DW.loadArea(c);
    if (seq !== loadSeq) return;
    lastLoad = { lat: c.lat, lng: c.lng };
    S.loading = false;
    S.fresh = true;
    $('#loading-pill').hidden = true;
    DW.render();
    $('#btn-retry').hidden = src !== 'demo';
    if (src === 'demo' && !S.demoWarned) {
      S.demoWarned = true;
      DW.toast('Could not reach OpenStreetMap — showing sample toilets instead.', { tone: 'warn', icon: 'triangle-alert', ms: 5200 });
    }
  };

  DW.locate = function (initial) {
    const fail = msg => { if (!initial) DW.toast(msg, { tone: 'warn', icon: 'locate-fixed' }); };
    let started = false;
    const startDefault = () => { if (initial && !started) { started = true; DW.reload(S.origin); } };
    if (!navigator.geolocation) { startDefault(); fail('This browser cannot share your location.'); return; }
    const timer = initial ? setTimeout(startDefault, 4500) : null;
    navigator.geolocation.getCurrentPosition(pos => {
      clearTimeout(timer);
      started = true;
      S.user = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      S.located = true;
      S.usingSearch = false;
      S.origin = { lat: S.user.lat, lng: S.user.lng, label: 'you' };
      placeUser(); placeOrigin(); syncHome();
      map.setView([S.user.lat, S.user.lng], 16, { animate: false });
      DW.reload(S.origin);
    }, () => {
      clearTimeout(timer);
      if (initial && !started) DW.toast('Location is off — showing central Warsaw. Search any place to explore.', { icon: 'locate-fixed', ms: 5200 });
      startDefault();
      fail('Could not get your location. Check the browser permission.');
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  };

  function syncHome() { $('#back-home').hidden = !S.usingSearch; }

  DW.goPlace = function (p) {
    S.usingSearch = true;
    S.origin = { lat: p.lat, lng: p.lng, label: p.name };
    S.ai = null;
    DW.endRoute();
    DW.closeDrawer();
    placeOrigin(); syncHome();
    map.setView([p.lat, p.lng], 15, { animate: false });
    DW.reload(S.origin);
  };

  /* ---------- filtering + sorting ---------- */
  DW.visible = function () {
    DW.toilets.forEach(t => { t.d = DW.dist(S.origin, t); });
    let list = DW.toilets.filter(t => [...S.filters].every(f => DW.FILTER[f].test(t)));
    if (S.kind) list = list.filter(t => t.kind === S.kind);
    if (S.maxDist) list = list.filter(t => t.d <= S.maxDist);
    return list.sort(DW.sorters[S.sort] || DW.sorters.nearest);
  };

  DW.renderFilters = function () {
    const bar = $('#filterbar'), left = bar.scrollLeft;
    const on = id => S.filters.has(id);
    const extra =
      (S.kind ? `<button class="chip is-on c-${DW.KINDS[S.kind].c}" data-action="clear-kind">${icon(DW.KINDS[S.kind].icon)}${DW.KINDS[S.kind].label}${icon('x', 'x')}</button>` : '') +
      (S.maxDist ? `<button class="chip is-on c-blue" data-action="clear-dist">${icon('footprints')}Within ${DW.fmtDist(S.maxDist)}${icon('x', 'x')}</button>` : '');
    const chips = DW.FILTERS.map(f =>
      `<button class="chip c-${f.c} ${on(f.id) ? 'is-on' : ''}" data-action="filter" data-id="${f.id}" aria-pressed="${on(f.id)}">${icon(f.icon)}${f.label}</button>`).join('');
    const any = S.filters.size || S.kind || S.maxDist;
    bar.innerHTML = `<span class="filter-lead">${icon('sliders-horizontal')}Filters</span>${extra}${chips}${any ? '<button class="chip clear" data-action="clear-filters">Clear all</button>' : ''}`;
    bar.scrollLeft = left;
    $('#sort').value = S.sort;
  };

  /* ---------- list ---------- */
  function tags(t) {
    const a = DW.access(t), out = [`<span class="tag ${a.tone}">${icon(a.icon)}${a.label}</span>`];
    if (t.wheelchair) out.push(`<span class="tag">${icon('accessibility')}Accessible</span>`);
    if (t.changing) out.push(`<span class="tag">${icon('baby')}Changing table</span>`);
    out.push(`<span class="tag">${icon(t.gender === 'unisex' ? 'users' : 'person-standing')}${t.gender === 'unisex' ? 'Unisex' : 'Women / Men'}</span>`);
    DW.reportsOf(t).filter(r => r.type !== 'closed').slice(0, 1).forEach(r => out.push(`<span class="tag warn">${icon('triangle-alert')}${DW.REPORTS[r.type].short}</span>`));
    return out.join('');
  }

  DW.card = function (t, i = 0) {
    const st = DW.status(t), k = DW.KINDS[t.kind], rt = DW.rating(t), cs = DW.cleanScore(t);
    const free = DW.cost(t) === 0;
    return `<article class="card c-${k.c} ${st.open ? '' : 'is-closed'} ${S.selected === t.id ? 'is-sel' : ''}" style="--i:${Math.min(i, 14)}" data-action="open" data-id="${t.id}" tabindex="0" role="button" aria-label="${esc(t.name)}">
      <div class="card-top">
        <span class="kind">${icon(k.icon)}</span>
        <div class="card-title">
          <h3>${esc(t.name)}</h3>
          <p>${esc(t.venueType || k.label)}${t.mine ? ' · added by you' : ''}</p>
        </div>
        <span class="price ${free ? 'free' : ''}">${esc(DW.priceLabel(t))}</span>
      </div>
      <div class="card-meta">
        <span class="dist"><b>${DW.fmtDist(t.d)}</b>${t.d < 8000 ? ` · ${DW.fmtWalk(t.d)} walk` : ''}</span>
        <span class="status ${st.open ? 'ok' : 'bad'}"><i class="dot"></i>${esc(st.label)}</span>
      </div>
      <div class="card-tags">${tags(t)}</div>
      <div class="card-foot">
        <span class="rate">${rt.avg ? `${icon('star')}<b>${rt.avg.toFixed(1)}</b><small>(${rt.n})</small>` : '<small>No reviews yet</small>'}</span>
        ${cs.score != null ? `<span class="clean ${cs.tone}" title="AI Cleanliness Score">${icon('sparkles')}${cs.score}<small>${cs.label}</small></span>` : ''}
        <button class="go" data-action="route" data-id="${t.id}" aria-label="Navigate to ${esc(t.name)}">${icon('navigation')}Navigate</button>
      </div>
    </article>`;
  };

  function smartSlot(list) {
    let html = '';
    if (S.ai) {
      html += `<div class="aibar">
        <span class="aibar-ic">${icon('sparkles')}</span>
        <div><small>You asked: “${esc(S.ai.q)}”</small><p>${S.ai.html}</p></div>
        <button class="iconbtn" data-action="clear-ai" aria-label="Clear smart search">${icon('x')}</button>
      </div>`;
    }
    const rec = list.length > 1 ? DW.recommend(list) : null;
    S.recId = rec ? rec.t.id : null;
    if (rec) {
      const t = rec.t;
      html += `<div class="smart">
        <div class="smart-duck">${DW.duck()}</div>
        <div class="smart-main" data-action="open" data-id="${t.id}" tabindex="0" role="button">
          <span class="smart-badge">${icon('sparkles')}Ducky’s pick for you</span>
          <h3>${esc(t.name)}</h3>
          <p class="reasons">${rec.reasons.map(r => `<span>${esc(r)}</span>`).join('')}</p>
        </div>
        <button class="btn primary" data-action="route" data-id="${t.id}">${icon('navigation')}Navigate</button>
      </div>`;
    }
    $('#smart').innerHTML = html;
  }

  DW.renderList = function () {
    const box = $('#list'), sub = $('#list-sub');
    if (S.loading) {
      sub.textContent = 'Looking for toilets nearby…';
      $('#smart').innerHTML = '';
      box.classList.remove('fresh');
      box.innerHTML = `<div class="looking"><div class="looking-duck">${DW.duck('swim')}</div><b>Ducky is looking around…</b></div>` +
        Array.from({ length: 3 }, () => '<div class="card skeleton"><i></i><i></i><i></i></div>').join('');
      return [];
    }
    const list = DW.visible();
    const where = S.usingSearch || !S.located ? `near ${S.origin.label}` : 'near you';
    const openN = list.filter(t => DW.status(t).open).length;
    sub.textContent = `${list.length} ${list.length === 1 ? 'place' : 'places'} ${where} · ${openN} open now${DW.source === 'demo' ? ' · sample data' : ''}`;
    smartSlot(list);
    hello(where);
    box.classList.toggle('fresh', !!S.fresh);
    if (!list.length) {
      box.innerHTML = `<div class="empty"><div class="empty-duck">${DW.duck()}</div><h3>No toilets match these filters</h3><p>Try removing a filter or searching a different area.</p><button class="btn" data-action="clear-filters">Clear filters</button></div>`;
    } else {
      box.innerHTML = list.slice(0, S.limit).map((t, i) => DW.card(t, i)).join('') +
        (list.length > S.limit ? `<button class="more" data-action="more">Show ${Math.min(18, list.length - S.limit)} more</button>` : '');
    }
    return list;
  };

  // greeting strip above the map, with three live counters that double as filters
  let helloKey = '';
  function hello(where) {
    const h = new Date().getHours();
    const greet = h < 5 ? 'Up late?' : h < 12 ? 'Good morning!' : h < 18 ? 'Good afternoon!' : 'Good evening!';
    const all = DW.toilets;
    const n = { open: all.filter(t => DW.status(t).open).length, free: all.filter(t => DW.cost(t) === 0).length, clean: all.filter(t => (DW.cleanScore(t).score || 0) >= 70).length };
    $('#hello-title').innerHTML = `${greet} Need a loo? <span class="wave">👋</span>`;
    $('#hello-sub').textContent = `Ducky found ${all.length} toilets ${where}${DW.source === 'demo' ? ' (sample data)' : ''}.`;
    const pills = [['open', 'mint', 'clock', 'open now'], ['free', 'yellow', 'gift', 'free'], ['clean', 'pink', 'sparkles', 'sparkling clean']];
    const key = JSON.stringify(n);
    $('#hello-stats').innerHTML = pills.map(([id, c, ic, label]) =>
      `<button class="hstat c-${c} ${S.filters.has(id) ? 'is-on' : ''}" data-action="filter" data-id="${id}" aria-pressed="${S.filters.has(id)}"><span>${icon(ic)}</span><b data-n="${n[id]}">${n[id]}</b><small>${label}</small></button>`).join('');
    if (key !== helloKey) {
      helloKey = key;
      DW.$$('#hello-stats b').forEach(b => DW.countUp(b, 0, +b.dataset.n, 900));
    }
  }

  DW.render = function () {
    DW.renderFilters();
    const list = DW.renderList();
    if (!S.loading) { DW.renderMarkers(list); S.fresh = false; }
  };

  /* ---------- selection ---------- */
  DW.select = function (id, opts = {}) {
    const t = DW.byId(id);
    if (!t) return;
    S.selected = id;
    if (S.view !== 'explore') DW.go('explore');
    DW.render();
    DW.renderDrawer(t);
    if (opts.pan !== false) {
      const z = Math.max(map.getZoom(), 16);
      const p = map.project([t.lat, t.lng], z);
      if (wide()) p.x += 220;
      map.flyTo(map.unproject(p, z), z, { duration: 0.55 });
    }
  };

  /* ---------- navigation ---------- */
  function drawRoute(coords, exact) {
    if (routeLayer) routeLayer.remove();
    routeLayer = L.layerGroup([
      L.polyline(coords, { color: '#ffffff', weight: 10, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }),
      L.polyline(coords, { color: '#4d9bff', weight: 6, lineCap: 'round', lineJoin: 'round' }),
      L.polyline(coords, { color: '#ffffff', weight: 2.5, opacity: 0.9, lineCap: 'round', dashArray: '2 12', className: 'route-dash' })
    ]).addTo(map);
    walkDuck(coords);
    const drawerOpen = !$('#drawer').hidden && wide();
    map.fitBounds(L.latLngBounds(coords), { paddingTopLeft: [50, 96], paddingBottomRight: [drawerOpen ? 480 : 50, 120], maxZoom: 17 });
  }
  // Ducky waddles along the route, again and again, until you arrive
  function stopDuck() {
    cancelAnimationFrame(duckRaf);
    if (duckMarker) { duckMarker.remove(); duckMarker = null; }
  }
  function walkDuck(coords) {
    stopDuck();
    const pts = coords.map(c => L.latLng(c[0], c[1])), cum = [0];
    for (let i = 1; i < pts.length; i++) cum[i] = cum[i - 1] + pts[i - 1].distanceTo(pts[i]);
    const total = cum[cum.length - 1];
    if (!total) return;
    duckMarker = L.marker(pts[0], {
      interactive: false, zIndexOffset: 3000,
      icon: L.divIcon({ className: 'duck-wrap', iconSize: [44, 40], iconAnchor: [22, 34], html: `<div class="duck-walk">${DW.duck()}</div>` })
    }).addTo(map);
    const dur = DW.clamp(total * 14, 4500, 10000);
    let start = null;
    const step = ts => {
      if (!duckMarker) return;
      if (start == null) start = ts;
      const k = Math.min(1, ((ts - start) % (dur + 1600)) / dur), d = k * total;
      let i = 1;
      while (i < cum.length - 1 && cum[i] < d) i++;
      const f = (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1), a = pts[i - 1], b = pts[i];
      duckMarker.setLatLng([a.lat + (b.lat - a.lat) * f, a.lng + (b.lng - a.lng) * f]);
      const el = duckMarker.getElement();
      if (el && b.lng !== a.lng) el.classList.toggle('left', b.lng < a.lng);
      duckRaf = requestAnimationFrame(step);
    };
    duckRaf = requestAnimationFrame(step);
  }

  function showNav(t, meters, secs) {
    const a = S.origin;
    const gm = `https://www.google.com/maps/dir/?api=1&origin=${a.lat},${a.lng}&destination=${t.lat},${t.lng}&travelmode=walking`;
    const min = Math.max(1, Math.round(secs / 60));
    $('#navbar').innerHTML = `
      <span class="nav-ic">${icon('navigation')}</span>
      <div class="nav-txt"><b>${min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`} · ${DW.fmtDist(meters)}</b><span>Walking to ${esc(t.name)}</span></div>
      <button class="btn sm primary" data-action="arrived" data-id="${t.id}">${icon('party-popper')}I’m here!</button>
      <a class="btn sm icon-only" href="${gm}" target="_blank" rel="noopener" aria-label="Open in Google Maps" title="Open in Google Maps">${icon('external-link')}</a>
      <button class="iconbtn" data-action="end-route" aria-label="End navigation">${icon('x')}</button>`;
    $('#navbar').hidden = false;
    $('#btn-nearest').hidden = true;
  }

  DW.startRoute = async function (t) {
    const a = S.origin, seq = ++routeSeq;
    S.route = { id: t.id };
    drawRoute([[a.lat, a.lng], [t.lat, t.lng]], false);
    showNav(t, t.d * 1.25, DW.walkMin(t.d) * 60);
    if (!wide()) { DW.closeDrawer(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    if (t.d > 30000) return; // too far to walk — keep the straight line
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 7000);
    try {
      const res = await fetch(`https://routing.openstreetmap.de/routed-foot/route/v1/foot/${a.lng},${a.lat};${t.lng},${t.lat}?overview=full&geometries=geojson`, { signal: ctl.signal });
      const j = await res.json();
      const r = j.routes && j.routes[0];
      if (seq !== routeSeq || !r) return;
      drawRoute(r.geometry.coordinates.map(([x, y]) => [y, x]), true);
      showNav(t, r.distance, r.duration);
    } catch (e) { /* the straight line stays as a fallback */ }
    finally { clearTimeout(timer); }
  };

  DW.endRoute = function () {
    routeSeq++;
    S.route = null;
    stopDuck();
    if (routeLayer) { routeLayer.remove(); routeLayer = null; }
    $('#navbar').hidden = true;
    $('#btn-nearest').hidden = false;
  };

  /* ---------- AI + search ---------- */
  DW.applyAI = function (a) {
    S.filters = new Set(a.filters);
    S.kind = a.kind;
    S.maxDist = a.maxDist;
    S.sort = a.sort || (a.p.nearest || a.p.urgent ? 'nearest' : S.sort);
    S.ai = { q: a.q, html: a.html };
    if (S.view !== 'explore') DW.go('explore');
    const best = a.results[0];
    if (!best) { DW.render(); return; }
    DW.select(best.id);
    if (a.p.nearest || a.p.urgent) DW.startRoute(best);
  };

  DW.ask = function (q) {
    DW.toilets.forEach(t => { t.d = DW.dist(S.origin, t); });
    return DW.answer(q);
  };

  const input = () => $('#q');
  let sgSeq = 0, sgPlaces = [];
  function hideSuggest() { const b = $('#suggest'); if (b) b.hidden = true; }

  function drawSuggest(q, p, local, places, pending) {
    const rows = [];
    if (p.understood) rows.push(`<button data-action="sg-ai">${icon('sparkles')}<span><b>Smart search</b><small>Find toilets matching “${esc(q)}”</small></span></button>`);
    local.forEach(t => rows.push(`<button data-action="open" data-id="${t.id}">${icon(DW.KINDS[t.kind].icon)}<span><b>${esc(t.name)}</b><small>${DW.fmtDist(t.d)} · ${esc(DW.KINDS[t.kind].label)}</small></span></button>`));
    (places || []).forEach((pl, i) => rows.push(`<button data-action="sg-place" data-i="${i}">${icon('map-pin')}<span><b>${esc(pl.name)}</b><small>${esc(pl.sub)}</small></span></button>`));
    if (pending) rows.push(`<div class="sg-note"><span class="spin"></span>Searching places…</div>`);
    if (p.understood) rows.push(`<button data-action="sg-geo">${icon('search')}<span><b>Search “${esc(q)}” as a place</b></span></button>`);
    else if (!pending && places && !places.length && !local.length) rows.push('<div class="sg-note">No places found.</div>');
    const box = $('#suggest');
    box.innerHTML = rows.join('');
    box.hidden = !rows.length;
  }

  const updateSuggest = DW.debounce(async function () {
    const q = input().value.trim(), seq = ++sgSeq;
    if (q.length < 2) return hideSuggest();
    const p = DW.parseQuery(q), lq = q.toLowerCase();
    const local = DW.toilets.filter(t => t.name.toLowerCase().includes(lq)).sort((a, b) => a.d - b.d).slice(0, 3);
    sgPlaces = [];
    const wantPlaces = !p.understood && q.length >= 3;
    drawSuggest(q, p, local, null, wantPlaces);
    if (!wantPlaces) return;
    try { sgPlaces = await DW.geocode(q); } catch (e) { sgPlaces = []; }
    if (seq === sgSeq) drawSuggest(q, p, local, sgPlaces, false);
  }, 320);

  async function searchPlace(q) {
    hideSuggest();
    try {
      const places = await DW.geocode(q);
      if (places[0]) { input().value = places[0].name; DW.goPlace(places[0]); }
      else DW.toast(`No place found for “${esc(q)}”.`, { icon: 'search' });
    } catch (e) { DW.toast('Place search is unavailable right now.', { tone: 'warn', icon: 'triangle-alert' }); }
  }

  DW.submitSearch = function (q) {
    q = String(q || '').trim();
    if (!q) return;
    sgSeq++;
    hideSuggest();
    if (DW.parseQuery(q).understood) { DW.applyAI(DW.ask(q)); input().blur(); }
    else searchPlace(q);
  };

  DW.initSearch = function () {
    const el = input();
    el.addEventListener('input', updateSuggest);
    el.addEventListener('focus', () => { if (el.value.trim().length >= 2) updateSuggest(); });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); DW.submitSearch(el.value); }
      if (e.key === 'Escape') hideSuggest();
    });
    document.addEventListener('click', e => { if (!e.target.closest('#search')) hideSuggest(); });
    $('#sort').addEventListener('change', e => { S.sort = e.target.value; S.fresh = true; DW.render(); });
  };

  /* ---------- voice search ---------- */
  let rec = null;
  DW.listen = function (btn) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return DW.toast('Voice search works in Chrome, Edge and Safari.', { tone: 'warn', icon: 'mic-off' });
    if (rec) { rec.stop(); return; }
    const el = $('#' + btn.dataset.target);
    const ph = el.placeholder;
    let finalText = '';
    rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    btn.classList.add('is-live');
    el.value = '';
    el.placeholder = 'Listening… try “Where is the nearest toilet?”';
    rec.onresult = e => {
      const txt = Array.from(e.results).map(r => r[0].transcript).join(' ').trim();
      el.value = txt;
      if (e.results[e.results.length - 1].isFinal) finalText = txt;
    };
    rec.onerror = e => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') DW.toast('Microphone access is blocked for this page.', { tone: 'warn', icon: 'mic-off' });
      else if (e.error === 'no-speech') DW.toast('I did not catch that — tap the microphone and try again.', { icon: 'mic' });
    };
    rec.onend = () => {
      btn.classList.remove('is-live');
      el.placeholder = ph;
      rec = null;
      const txt = (finalText || el.value).trim();
      if (!txt) return;
      if (btn.dataset.target === 'q') DW.submitSearch(txt); else DW.submitAsk(txt);
    };
    try { rec.start(); } catch (e) { rec = null; btn.classList.remove('is-live'); el.placeholder = ph; }
  };

  /* ---------- "place a pin" mode, used when adding or listing a toilet ---------- */
  DW.startPick = function (purpose) {
    DW.closeDrawer();
    DW.closeModal();
    if (S.view !== 'explore') DW.go('explore');
    S.picking = purpose;
    $('#picker-text').textContent = purpose === 'host' ? 'Move the map to where your toilet is' : 'Move the map to where the toilet is';
    $('#picker').hidden = false;
    $('#map-stage').classList.add('is-picking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (map.getZoom() < 17) map.setView([S.origin.lat, S.origin.lng], 17, { animate: false });
    setTimeout(() => map.invalidateSize(), 60);
  };
  function stopPick() {
    S.picking = null;
    $('#picker').hidden = true;
    $('#map-stage').classList.remove('is-picking');
  }

  /* ---------- actions ---------- */
  Object.assign(DW.actions, {
    nearest() {
      if (S.loading) return DW.toast('Still loading toilets — one moment.', { icon: 'loader-circle' });
      const usable = t => DW.status(t).open && !(t.kind === 'private' && !t.instant) && !t.purchaseRequired;
      let pool = DW.visible().filter(usable), relaxed = false;
      if (!pool.length) { pool = DW.toilets.filter(usable); relaxed = S.filters.size > 0 || !!S.kind || !!S.maxDist; }
      if (!pool.length) pool = DW.toilets.filter(t => DW.status(t).open);
      if (!pool.length) return DW.toast('No open toilets found around here.', { tone: 'warn', icon: 'triangle-alert' });
      pool.sort((a, b) => a.d - b.d);
      if (relaxed) DW.toast('Nothing open matches your filters — taking you to the nearest open toilet.', { icon: 'navigation' });
      DW.select(pool[0].id, { pan: false });
      DW.startRoute(pool[0]);
    },
    locate() {
      if (S.user && !S.usingSearch) { map.flyTo([S.user.lat, S.user.lng], 16, { duration: 0.5 }); }
      DW.locate(false);
    },
    'back-home'() {
      input().value = '';
      if (!S.user) { S.usingSearch = false; syncHome(); placeOrigin(); return DW.locate(false); }
      S.usingSearch = false;
      S.origin = { lat: S.user.lat, lng: S.user.lng, label: 'you' };
      placeOrigin(); syncHome(); DW.endRoute();
      map.setView([S.user.lat, S.user.lng], 16, { animate: false });
      DW.reload(S.origin);
    },
    area() {
      const c = pt(map.getCenter());
      S.usingSearch = true;
      S.origin = { lat: c.lat, lng: c.lng, label: 'this area' };
      placeOrigin(); syncHome(); DW.endRoute();
      DW.reload(S.origin);
    },
    retry() { DW.reload(S.origin); },
    open(el) { hideSuggest(); DW.select(el.dataset.id); },
    route(el) {
      const t = DW.byId(el.dataset.id || S.selected);
      if (!t) return;
      DW.select(t.id, { pan: false });
      DW.startRoute(t);
    },
    'end-route'() { DW.endRoute(); },
    arrived(el) {
      const t = DW.byId(el.dataset.id);
      DW.endRoute();
      if (!t) return;
      DW.party();
      DW.award(5, `Walked to ${t.name}`, 'route');
      DW.pop({
        cls: 'c-mint', title: 'You made it! 🎉', text: `Hope <b>${esc(t.name)}</b> is a good one. Tell others how it was and earn <b>+${DW.POINTS.review} points</b>.`,
        actions: [{ label: 'Maybe later', action: 'pop-close' }, { label: 'Rate this toilet', action: 'pop-review', id: t.id, primary: true, icon: 'star' }]
      });
    },
    filter(el) {
      const id = el.dataset.id, f = DW.FILTER[id];
      if (S.filters.has(id)) S.filters.delete(id);
      else { S.filters.add(id); if (f.excl) S.filters.delete(f.excl); }
      S.limit = 18;
      S.fresh = true;
      DW.render();
    },
    'clear-filters'() { S.filters.clear(); S.kind = null; S.maxDist = null; S.ai = null; S.fresh = true; DW.render(); },
    'clear-kind'() { S.kind = null; DW.render(); },
    'clear-dist'() { S.maxDist = null; DW.render(); },
    'clear-ai'() { S.ai = null; S.filters.clear(); S.kind = null; S.maxDist = null; input().value = ''; DW.render(); },
    more() { S.limit += 18; DW.renderList(); },
    voice(el) { DW.listen(el); },
    'sg-ai'() { DW.submitSearch(input().value); },
    'sg-geo'() { searchPlace(input().value.trim()); },
    'sg-place'(el) { const p = sgPlaces[+el.dataset.i]; if (p) { hideSuggest(); input().value = p.name; DW.goPlace(p); } },
    'add-toilet'() { DW.startPick('add'); },
    'pick-cancel'() { stopPick(); },
    'pick-ok'() {
      const c = pt(map.getCenter()), purpose = S.picking;
      stopPick();
      if (purpose === 'host') DW.openListingForm(c); else DW.openAddForm(c);
    }
  });
})();
