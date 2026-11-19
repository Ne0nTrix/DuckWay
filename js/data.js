/* DuckWay — toilet data: real places from OpenStreetMap + sample community data */
(function () {
  'use strict';
  const DW = window.DW;
  const DAY = 864e5, HOUR = 36e5;

  DW.KINDS = {
    public: { label: 'City toilet', icon: 'toilet', c: 'blue' },
    mall: { label: 'Shopping mall', icon: 'store', c: 'lav' },
    fuel: { label: 'Gas station', icon: 'fuel', c: 'peach' },
    food: { label: 'Restaurant / café', icon: 'utensils', c: 'pink' },
    private: { label: 'Private host', icon: 'house', c: 'mint' }
  };

  DW.toilets = [];
  DW.source = 'osm';
  DW.byId = id => DW.toilets.find(t => t.id === id);

  /* ---------- sample content pools ---------- */
  const AUTHORS = ['Maya K.', 'Jonas B.', 'Aiko T.', 'Lucía R.', 'Piotr W.', 'Amara O.', 'Noah S.', 'Zofia M.', 'Mateo G.', 'Ines D.', 'Tomasz L.', 'Hana Y.', 'Oliver P.', 'Leila A.', 'Kasia N.', 'Ravi S.'];
  const TXT = {
    good: [
      'Spotless and well stocked. Would stop here again.',
      'Clean, bright and smelled fresh. Soap and paper available.',
      'Surprisingly nice — recently renovated and very tidy.',
      'Quick stop, everything worked and it was clean.',
      'Pristine. Someone clearly looks after this place.',
      'Fresh, tidy and no queue. Exactly what I needed.'
    ],
    mid: [
      'Okay for a quick visit. Floor was a bit wet.',
      'Decent, but the hand dryer was not working.',
      'Fine overall, a little crowded around lunchtime.',
      'Acceptable. Could use more frequent cleaning.',
      'Does the job. Nothing special, nothing terrible.'
    ],
    bad: [
      'Dirty floor and no paper when I visited.',
      'Bad smell and the lock was broken. Avoid if you can.',
      'Out of soap and quite filthy.',
      'Not cleaned in a while, sticky floor.',
      'Smelly and the sink was broken.'
    ]
  };
  const HOSTS = [
    ['Marta', 'guest bathroom'], ['Jonas', 'ground-floor WC'], ['Aiko', 'studio bathroom'], ['Lucía', 'garden-side toilet'],
    ['Piotr', 'apartment bathroom'], ['Amara', 'courtyard WC'], ['Noah', 'loft bathroom'], ['Zofia', 'guest toilet'], ['Mateo', 'workshop WC']
  ];
  const HOST_NOTES = [
    'Freshly cleaned every morning. Ring the bell marked “DuckWay”.',
    'Ground floor, no stairs. Soft towels and hand cream included.',
    'Quiet courtyard entrance. Please leave it as you found it.',
    'Bright and spotless. I work from home, so someone is always in.',
    'Separate guest toilet right by the entrance — quick in, quick out.'
  ];
  const DEMO_NAMES = {
    public: ['Central Park public toilet', 'Market Square WC', 'Riverside public toilet', 'Old Town restroom', 'Station Square toilet', 'Library public toilet', 'Promenade WC', 'Playground restroom', 'Town Hall public toilet', 'Bus Terminal WC', 'Botanic Garden toilet', 'Harbour restroom'],
    mall: ['Galleria Centre', 'Arcade Shopping Mall', 'Northgate Mall'],
    fuel: ['Orbit Fuel Station', 'Greenway Petrol', 'Circle Fuel 24'],
    food: ['Café Lumen', 'Bistro Nord', 'The Daily Grind', 'Pasta Corner', 'Blue Door Café', 'Noodle Yard', 'Bakery & Co.', 'Tapas Mar', 'Burger Dock', 'Tea House Mint']
  };

  /* ---------- sample "photos": small illustrated scenes ---------- */
  let sceneId = 0;
  const WALLS = [['#d9ebff', '#f3f9ff', '#b9dbff'], ['#ffe3f1', '#fff5fa', '#ffc6e2'], ['#dcf7ee', '#f3fdf9', '#b5ecd9'], ['#ece7ff', '#f8f5ff', '#d2c6ff'], ['#fff1cf', '#fffaea', '#ffe19a']];
  const miniDuck = (x, y) => `<g transform="translate(${x} ${y})"><ellipse cx="6" cy="7" rx="6" ry="4" fill="#ffd84a"/><circle cx="10" cy="3" r="3.200" fill="#ffd84a"/><path d="M12.600 2.600l3 .800-3 1z" fill="#ff9f43"/><circle cx="10.800" cy="2.400" r=".600" fill="#23305a"/></g>`;
  DW.scene = function (i) {
    const u = 'sc' + sceneId++, w = WALLS[i % WALLS.length];
    const tiles = `<pattern id="${u}" width="15" height="15" patternUnits="userSpaceOnUse"><rect width="15" height="15" fill="${w[0]}"/><path d="M15 0H0v15" fill="none" stroke="${w[1]}" stroke-width="1.400"/></pattern>`;
    const floor = `<rect y="70" width="120" height="20" fill="${w[2]}"/>`;
    const bodies = [
      `<rect width="120" height="90" fill="url(#${u})"/>${floor}
       <rect x="42" y="10" width="36" height="36" rx="18" fill="#f6fbff" stroke="#fff" stroke-width="3"/><path d="M52 22l8-6M54 30l14-11" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
       <rect x="58.500" y="48" width="3" height="7" rx="1.500" fill="#8fb4e6"/><rect x="56" y="48" width="8" height="2.600" rx="1.300" fill="#8fb4e6"/>
       <rect x="36" y="55" width="48" height="9" rx="4.500" fill="#fff"/><rect x="55" y="64" width="10" height="12" fill="#f4f8fd"/>
       <rect x="92" y="28" width="12" height="20" rx="4" fill="#ff8fc7"/><rect x="95.500" y="45" width="5" height="6" rx="1" fill="#fff"/>
       <path d="M16 70c0-10 3-16 6-22M22 70c0-9 3-13 7-17M19 70c-1-8-4-12-8-15" stroke="#4fd1ae" stroke-width="2.400" stroke-linecap="round" fill="none"/><rect x="13" y="68" width="13" height="9" rx="2.500" fill="#ffa15e"/>
       ${miniDuck(66, 46)}`,
      `<rect width="120" height="90" fill="${w[0]}"/><rect width="120" height="30" fill="${w[1]}"/>${floor}
       <rect x="40" y="14" width="40" height="62" rx="4" fill="#fff" stroke="${w[2]}" stroke-width="1.600"/><circle cx="73" cy="47" r="2.200" fill="#ffcf33"/>
       <rect x="51" y="23" width="18" height="18" rx="6" fill="#4d9bff"/><text x="60" y="35.200" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="8" fill="#fff">WC</text>
       <path d="M21 14v10" stroke="#fff" stroke-width="2"/><circle cx="21" cy="28" r="5" fill="#ffe27a"/>
       <rect x="92" y="52" width="14" height="24" rx="3" fill="#a48bff"/><rect x="95" y="56" width="8" height="5" rx="1.500" fill="#fff" opacity=".8"/>
       ${miniDuck(8, 62)}`,
      `<rect width="120" height="90" fill="url(#${u})"/>${floor}
       <rect x="50" y="28" width="26" height="19" rx="4" fill="#fff"/><rect x="59" y="25" width="8" height="4" rx="2" fill="#d7e6f8"/>
       <ellipse cx="63" cy="57" rx="15" ry="8" fill="#fff"/><ellipse cx="63" cy="56" rx="10" ry="4.500" fill="#e6f1fd"/><rect x="56" y="61" width="14" height="14" rx="3" fill="#f6faff"/>
       <circle cx="28" cy="46" r="6.500" fill="#fff" stroke="#ffd0e6" stroke-width="1.500"/><circle cx="28" cy="46" r="2" fill="#ffd0e6"/><rect x="24" y="50" width="8" height="9" fill="#fff"/>
       <rect x="88" y="22" width="20" height="16" rx="3" fill="#fff"/><circle cx="94" cy="28" r="3" fill="#ffcf33"/><path d="M89 36l6-5 4 3 4-4 4 6z" fill="#4fd1ae"/>
       ${miniDuck(54, 17)}`
    ];
    return `<svg viewBox="0 0 120 90" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Sample illustration"><defs>${tiles}</defs>${bodies[i % bodies.length]}</svg>`;
  };

  /* ---------- sample reviews ---------- */
  function makeReviews(r, q, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const age = r() * r() * 150 * DAY + r() * 5 * HOUR;
      const j = () => DW.clamp(Math.round(q + (r() - 0.5) * 1.9), 1, 5);
      const clean = j();
      const pool = clean >= 4 ? TXT.good : clean === 3 ? TXT.mid : TXT.bad;
      out.push({
        id: 's' + i, author: DW.pick(r, AUTHORS), ts: Date.now() - age,
        clean, comfort: j(), smell: j(), privacy: j(), text: DW.pick(r, pool), photos: []
      });
    }
    return out.sort((a, b) => b.ts - a.ts);
  }

  function parseHours(s) {
    if (!s) return null;
    if (/24\s*\/\s*7/.test(s)) return { allDay: true };
    const m = s.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
    if (!m) return null;
    const pad = (h, mm) => `${String(h).padStart(2, '0')}:${mm}`;
    const open = pad(m[1], m[2]);
    const close = +m[3] >= 24 ? '23:59' : pad(m[3], m[4]);
    if (open === '00:00' && (close === '23:59' || close === '00:00')) return { allDay: true };
    return { open, close };
  }

  /* Fill in everything a card needs. Real OSM tags win; gaps get stable sample values. */
  function decorate(t, tags) {
    tags = tags || {};
    const r = DW.rng(t.id), k = t.kind, C = DW.CUR;
    const yes = v => v === 'yes' || v === 'designated';

    // price
    const charge = (String(tags.charge || '').match(/(\d+(?:[.,]\d+)?)/) || [])[1];
    if (k === 'private') t.fee = DW.pick(r, C.priv);
    else if (k === 'food' || k === 'fuel') t.fee = 0;
    else if (tags.fee === 'no') t.fee = 0;
    else if (tags.fee === 'yes') t.fee = charge ? parseFloat(charge.replace(',', '.')) : DW.pick(r, C.pub);
    else t.fee = r() < (k === 'mall' ? 0.2 : 0.35) ? DW.pick(r, C.pub) : 0;
    if (t.fee > 0 && k !== 'private') {
      const pay = [];
      if (r() < 0.8) pay.push('Card');
      if (r() < 0.7) pay.push('Cash');
      if (C.blik && r() < 0.6) pay.push('BLIK');
      t.payments = pay.length ? pay : ['Cash'];
    } else t.payments = k === 'private' ? ['In-app'] : [];

    // accessibility and equipment
    t.wheelchair = tags.wheelchair ? yes(tags.wheelchair) : r() < (k === 'mall' ? 0.9 : k === 'private' ? 0.25 : 0.45);
    t.changing = tags.changing_table ? yes(tags.changing_table) : r() < (k === 'mall' ? 0.85 : k === 'private' ? 0.15 : 0.3);
    t.gender = k === 'private' || yes(tags.unisex) ? 'unisex' : (tags.male || tags.female) ? 'separate' : r() < 0.38 ? 'unisex' : 'separate';

    // access rules
    t.needsKey = k === 'fuel' ? r() < 0.45 : k === 'public' ? r() < 0.08 : false;
    t.purchaseRequired = k === 'food' ? (tags.toilets_access === 'customers' ? true : r() < 0.6) : false;
    t.receiptCode = t.purchaseRequired && r() < 0.4;
    t.friendly = k === 'food' && !t.purchaseRequired;

    // opening hours
    const oh = parseHours(tags.opening_hours);
    const hh = n => `${String(n).padStart(2, '0')}:00`;
    if (oh) { t.hours = oh; t.hoursSource = 'OpenStreetMap'; }
    else {
      t.hoursSource = 'community';
      if (k === 'public') t.hours = r() < 0.3 ? { allDay: true } : { open: hh(DW.pick(r, [6, 7, 8])), close: hh(DW.pick(r, [20, 21, 22, 23])) };
      else if (k === 'mall') t.hours = { open: hh(DW.pick(r, [9, 10])), close: hh(DW.pick(r, [21, 22])) };
      else if (k === 'fuel') t.hours = r() < 0.6 ? { allDay: true } : { open: '06:00', close: '22:00' };
      else if (k === 'food') t.hours = { open: hh(DW.pick(r, [8, 9, 10, 11])), close: hh(DW.pick(r, [21, 22, 23])) };
      else t.hours = { open: hh(DW.pick(r, [7, 8, 9])), close: hh(DW.pick(r, [21, 22, 23])) };
    }

    // community signals
    const q = DW.clamp(2.3 + r() * 2.6 + (k === 'mall' ? 0.3 : 0) + (k === 'private' ? 0.9 : 0), 1.6, 4.9);
    t.reviews = makeReviews(r, q, Math.floor(r() * r() * 9) + (k === 'public' || k === 'private' ? 1 : 0));
    t.photos = Array.from({ length: 1 + Math.floor(r() * 3) }, (_, i) => ({ scene: Math.floor(r() * 3) + i }));
    t.confirmed = r() < 0.5 ? { ts: Date.now() - (0.1 + r() * 6) * HOUR, count: 1 + Math.floor(r() * 4) } : null;
    t.reports = [];
    if (r() < 0.1) t.reports.push({ type: r() < 0.5 ? 'paper' : 'soap', ts: Date.now() - (0.5 + r() * 5) * HOUR });
    if (k !== 'private' && r() < 0.04) t.reports.push({ type: 'closed', ts: Date.now() - (0.3 + r() * 3) * HOUR });
    return t;
  }

  /* ---------- OpenStreetMap (Overpass API) ---------- */
  const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];

  // Ask the main server; if it is slow or fails, ask a mirror too and take whichever answers first.
  function fetchOSM(c) {
    const at = `${c.lat.toFixed(5)},${c.lng.toFixed(5)}`;
    const q = `[out:json][timeout:20];
nwr["amenity"="toilets"](around:2200,${at});out tags center 140;
nwr["shop"="mall"]["name"](around:2500,${at});out tags center 6;
nwr["amenity"~"^(cafe|restaurant|fast_food|fuel)$"]["name"](around:800,${at});out tags center 150;`;
    return new Promise(resolve => {
      let done = false, next = 0, live = 0;
      const ctls = [];
      const finish = v => {
        if (done) return;
        done = true;
        ctls.forEach(ctl => ctl.abort());
        resolve(v);
      };
      const launch = () => {
        if (done || next >= OVERPASS.length) return;
        const url = OVERPASS[next++];
        const ctl = new AbortController();
        ctls.push(ctl);
        live++;
        fetch(url, {
          method: 'POST', body: 'data=' + encodeURIComponent(q), signal: ctl.signal,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
          .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
          .then(json => { if (!Array.isArray(json.elements)) throw new Error('bad answer'); finish(json.elements); })
          .catch(() => { live--; if (next < OVERPASS.length) launch(); else if (!live) finish(null); });
      };
      launch();
      setTimeout(launch, 3500);
      setTimeout(() => finish(null), 14000);
    });
  }

  function fromOSM(el) {
    const tags = el.tags || {};
    const lat = el.lat != null ? el.lat : el.center && el.center.lat;
    const lng = el.lon != null ? el.lon : el.center && el.center.lon;
    if (lat == null || lng == null) return null;
    if (tags.access === 'private' || tags.access === 'no') return null;
    const id = `osm-${el.type[0]}${el.id}`;
    let kind, name, venueType = null;
    if (tags.amenity === 'toilets') {
      kind = 'public';
      name = tags.name || (tags.operator ? `Public toilet · ${tags.operator}` : 'Public toilet');
    } else {
      if (!tags.name) return null;
      name = tags.name;
      if (tags.shop === 'mall') kind = 'mall';
      else if (tags.amenity === 'fuel') kind = 'fuel';
      else {
        kind = 'food';
        venueType = tags.amenity === 'cafe' ? 'Café' : tags.amenity === 'fast_food' ? 'Fast food' : 'Restaurant';
        // keep a stable, map-friendly subset of venues
        if (tags.toilets !== 'yes' && DW.rng('keep' + id)() > 0.3) return null;
      }
    }
    const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');
    const address = [street, tags['addr:city']].filter(Boolean).join(', ') || null;
    return decorate({ id, kind, name, venueType, lat, lng, address, osm: true }, tags);
  }

  /* ---------- sample private hosts (always fictional) ---------- */
  function offset(c, r, min, max) {
    const ang = r() * Math.PI * 2, d = min + r() * (max - min);
    return {
      lat: c.lat + (d * Math.cos(ang)) / 111320,
      lng: c.lng + (d * Math.sin(ang)) / (111320 * Math.cos((c.lat * Math.PI) / 180))
    };
  }
  function makeHosts(c) {
    const cc = { lat: Math.round(c.lat * 100) / 100, lng: Math.round(c.lng * 100) / 100 };
    const r = DW.rng(`hosts:${cc.lat}:${cc.lng}`);
    const pool = HOSTS.slice().sort(() => r() - 0.5).slice(0, 7);
    return pool.map(([host, place], i) => {
      const p = offset(c, r, 160, 1250);
      const t = decorate({
        id: `host-${cc.lat}-${cc.lng}-${i}`, kind: 'private', name: `${host}’s ${place}`, lat: p.lat, lng: p.lng,
        address: null, sample: true
      });
      t.instant = r() < 0.55;
      t.host = { name: host, since: 2023 + Math.floor(r() * 3), visits: 12 + Math.floor(r() * 240), reply: DW.pick(r, ['~1 min', '~2 min', '~5 min']) };
      t.note = DW.pick(r, HOST_NOTES);
      t.rules = ['Leave it as you found it', 'One guest per booking', r() < 0.5 ? 'Shoes off at the door' : 'No smoking'];
      return t;
    });
  }

  /* ---------- offline / fallback sample toilets ---------- */
  function makeDemo(c) {
    const r = DW.rng(`demo:${c.lat.toFixed(2)}:${c.lng.toFixed(2)}`);
    const plan = [['public', 12], ['food', 10], ['mall', 3], ['fuel', 3]];
    const out = [];
    plan.forEach(([kind, n]) => {
      for (let i = 0; i < n; i++) {
        const p = offset(c, r, 90, 1700);
        const name = DEMO_NAMES[kind][i % DEMO_NAMES[kind].length];
        out.push(decorate({
          id: `demo-${kind}-${i}-${c.lat.toFixed(2)}-${c.lng.toFixed(2)}`, kind, name, lat: p.lat, lng: p.lng,
          venueType: kind === 'food' ? (/(Café|Grind|Bakery|Tea)/.test(name) ? 'Café' : 'Restaurant') : null,
          address: 'Sample location', sample: true
        }));
      }
    });
    return out;
  }

  /* ---------- load everything around a point ---------- */
  DW.loadArea = async function (c) {
    const key = `dw.area:${c.lat.toFixed(2)}:${c.lng.toFixed(2)}`;
    // Keep the last answer for each spot for a day, so a repeat visit is instant.
    let els = null;
    try {
      const hit = JSON.parse(localStorage.getItem(key) || 'null');
      if (hit && Date.now() - hit.ts < DAY) els = hit.els;
    } catch (e) { els = null; }
    if (!els) {
      els = await fetchOSM(c);
      if (els) {
        const slim = els.map(e => ({ type: e.type, id: e.id, lat: e.lat, lon: e.lon, center: e.center, tags: e.tags }));
        try {
          Object.keys(localStorage).filter(k => k.startsWith('dw.area:')).slice(0, -3).forEach(k => localStorage.removeItem(k));
          localStorage.setItem(key, JSON.stringify({ ts: Date.now(), els: slim }));
        } catch (e) { /* the cache is optional */ }
      }
    }
    let base;
    if (els) {
      const seen = new Set();
      base = els.map(fromOSM).filter(t => t && !seen.has(t.id) && seen.add(t.id));
      DW.source = 'osm';
    } else {
      base = makeDemo(c);
      DW.source = 'demo';
    }
    DW.toilets = [...base, ...makeHosts(c), ...DW.db.added, ...DW.db.listings];
    DW.bump();
    return DW.source;
  };

  /* Build a toilet from the "add toilet" / "list your toilet" forms. */
  DW.newToilet = function (f) {
    return Object.assign({
      id: `mine-${Date.now()}`, mine: true, address: null, venueType: null,
      fee: 0, payments: [], wheelchair: false, changing: false, gender: 'unisex',
      needsKey: false, purchaseRequired: false, receiptCode: false, friendly: false,
      hours: { allDay: true }, hoursSource: 'you', reviews: [], photos: [], reports: [],
      confirmed: { ts: Date.now(), count: 1 }
    }, f);
  };

  /* ---------- views over a toilet (sample data + what this user added) ---------- */
  const TTL = { closed: 12 * HOUR, paper: 24 * HOUR, soap: 24 * HOUR, lock: 48 * HOUR };
  DW.REPORTS = {
    closed: { label: 'Closed / out of order', short: 'Reported closed', icon: 'door-closed' },
    paper: { label: 'No toilet paper', short: 'No toilet paper', icon: 'scroll' },
    soap: { label: 'No soap', short: 'No soap', icon: 'droplets' },
    lock: { label: 'Lock is broken', short: 'Broken lock', icon: 'lock' }
  };
  DW.reviewsOf = t => [...(DW.db.reviews[t.id] || []), ...(t.reviews || [])].sort((a, b) => b.ts - a.ts);
  DW.hoursOf = t => DW.db.hours[t.id] || t.hours;
  DW.photosOf = function (t) {
    const mine = (DW.db.photos[t.id] || []).map(src => ({ src }));
    const fromReviews = (DW.db.reviews[t.id] || []).flatMap(r => (r.photos || []).map(src => ({ src })));
    return [...mine, ...fromReviews, ...(t.photos || [])];
  };
  DW.reportsOf = function (t) {
    const now = Date.now();
    return [...(DW.db.reports[t.id] || []), ...(t.reports || [])]
      .filter(x => now - x.ts < (TTL[x.type] || DAY))
      .sort((a, b) => b.ts - a.ts);
  };
  DW.confirmOf = function (t) {
    const mine = DW.db.confirms[t.id];
    const base = t.confirmed;
    if (mine && (!base || mine.ts >= base.ts)) return { ts: mine.ts, count: (base ? base.count : 0) + 1, mine: true };
    return base || null;
  };

  DW.status = function (t) {
    const closed = DW.reportsOf(t).find(x => x.type === 'closed');
    const conf = DW.confirmOf(t);
    if (closed && !(conf && conf.ts > closed.ts)) return { open: false, reported: true, word: 'Closed', label: 'Reported closed', sub: `reported ${DW.timeAgo(closed.ts)}` };
    const h = DW.hoursOf(t);
    if (h.allDay) return { open: true, word: 'Open', label: 'Open 24/7', sub: 'all day' };
    const now = new Date(), cur = now.getHours() * 60 + now.getMinutes();
    const o = DW.toMin(h.open), c = DW.toMin(h.close);
    const open = o <= c ? cur >= o && cur < c : cur >= o || cur < c;
    if (open) return { open: true, word: 'Open', label: `Open · closes ${h.close}`, sub: `closes ${h.close}`, soon: (c - cur + 1440) % 1440 <= 30 };
    return { open: false, word: 'Closed', label: `Closed · opens ${h.open}`, sub: `opens ${h.open}` };
  };

  DW.access = function (t) {
    if (t.kind === 'private') return t.instant
      ? { label: 'Instant access', detail: 'Pay in the app and walk in — the host has pre-approved guests.', icon: 'zap', tone: 'ok' }
      : { label: 'Host approval', detail: 'Send a request — the host usually answers within minutes.', icon: 'hand', tone: 'info' };
    if (t.purchaseRequired) return t.receiptCode
      ? { label: 'Customers only · receipt code', detail: 'You need to buy something — the door code is printed on the receipt.', icon: 'receipt', tone: 'warn' }
      : { label: 'Customers only', detail: 'You are expected to buy something to use the toilet.', icon: 'shopping-bag', tone: 'warn' };
    if (t.friendly) return { label: 'Friendly Venue · no purchase', detail: 'Part of the Friendly Venue programme — walk in, no purchase needed.', icon: 'hand-heart', tone: 'ok' };
    if (t.needsKey) return { label: 'Ask for the key', detail: 'Ask the staff for the key before you go.', icon: 'key-round', tone: 'warn' };
    return { label: 'Open to everyone', detail: 'Walk in — no key, no purchase.', icon: 'door-open', tone: 'ok' };
  };

  DW.priceLabel = t => (t.fee > 0 ? DW.money(t.fee) : t.purchaseRequired ? 'With purchase' : 'Free');
  // What it really costs you, used for "cheapest" sorting.
  DW.cost = t => (t.fee > 0 ? t.fee : t.purchaseRequired ? DW.CUR.coffee : 0);

  /* ---------- addresses ---------- */
  DW.reverse = async function (t) {
    if (t.address || t.sample || t.kind === 'private' || t._addrTried) return t.address;
    t._addrTried = true;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=en&lat=${t.lat}&lon=${t.lng}`);
      const j = await res.json();
      const a = j.address || {};
      const street = [a.road || a.pedestrian || a.footway || a.square || a.park || a.neighbourhood, a.house_number].filter(Boolean).join(' ');
      const city = a.city || a.town || a.village || a.suburb;
      t.address = [street, city].filter(Boolean).join(', ') || (j.display_name || '').split(',').slice(0, 2).join(',') || null;
    } catch (e) { /* address stays unknown */ }
    return t.address;
  };

  DW.geocode = async function (q) {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=en&q=${encodeURIComponent(q)}`);
    const list = await res.json();
    return list.map(p => {
      const parts = String(p.display_name || '').split(',').map(s => s.trim());
      return { lat: +p.lat, lng: +p.lon, name: p.name || parts[0], sub: parts.slice(1, 4).join(', ') };
    });
  };
})();
