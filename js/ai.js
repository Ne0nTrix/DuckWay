/* DuckWay — on-device "AI": cleanliness score, smart recommendation, natural-language search */
(function () {
  'use strict';
  const DW = window.DW;
  const DAY = 864e5, HOUR = 36e5;

  function cached(key, fn) {
    if (DW._memo.has(key)) return DW._memo.get(key);
    const v = fn();
    DW._memo.set(key, v);
    return v;
  }

  /* ---------- ratings ---------- */
  DW.CATS = [
    { id: 'clean', label: 'Cleanliness', icon: 'sparkles', c: 'mint' },
    { id: 'comfort', label: 'Comfort', icon: 'armchair', c: 'pink' },
    { id: 'smell', label: 'Smell', icon: 'wind', c: 'blue' },
    { id: 'privacy', label: 'Privacy', icon: 'lock', c: 'lav' }
  ];
  DW.rating = t => cached('r:' + t.id, () => {
    const revs = DW.reviewsOf(t);
    if (!revs.length) return { avg: null, n: 0, cats: null };
    const cats = { clean: 0, comfort: 0, smell: 0, privacy: 0 };
    revs.forEach(r => { for (const k in cats) cats[k] += r[k] || r.clean; });
    for (const k in cats) cats[k] /= revs.length;
    return { avg: (cats.clean + cats.comfort + cats.smell + cats.privacy) / 4, n: revs.length, cats };
  });

  /* ---------- AI Cleanliness Score ----------
     Weighted by recency (a review loses half its weight every 30 days),
     nudged by the wording of the review and by live reports. */
  const POS = /\b(spotless|clean|fresh|tidy|well stocked|renovated|pristine|hygienic|sparkling)\b/g;
  const NEG = /\b(not (very )?clean|dirty|filthy|bad smell|smelly|stinks?|sticky|no (toilet )?paper|no soap|out of soap|broken|disgusting|gross|avoid)\b/g;

  DW.cleanScore = t => cached('c:' + t.id, () => {
    const revs = DW.reviewsOf(t), now = Date.now();
    if (!revs.length) return { score: null, label: 'Not rated yet', tone: 'none', n: 0, why: [], confidence: 'none' };
    let w = 0, s = 0, recentS = 0, recentW = 0, oldS = 0, oldW = 0;
    revs.forEach(r => {
      const age = (now - r.ts) / DAY;
      const wt = Math.pow(0.5, age / 30);
      const txt = String(r.text || '').toLowerCase();
      const pos = Math.min(2, (txt.match(POS) || []).length), neg = Math.min(2, (txt.match(NEG) || []).length);
      const v = DW.clamp(r.clean + pos * 0.3 - neg * 0.5, 1, 5);
      s += v * wt; w += wt;
      if (age <= 21) { recentS += v; recentW++; } else { oldS += v; oldW++; }
    });
    // a little prior, so one harsh (or glowing) review does not swing the score to an extreme
    const PRIOR = 3.4, PRIOR_W = 0.6;
    let score = (((s + PRIOR * PRIOR_W) / (w + PRIOR_W) - 1) / 4) * 100;
    const why = [];
    DW.reportsOf(t).forEach(rep => {
      if (rep.type === 'paper' || rep.type === 'soap') { score -= 6; why.push(`${DW.REPORTS[rep.type].short} reported ${DW.timeAgo(rep.ts)}`); }
    });
    const conf = DW.confirmOf(t);
    if (conf && now - conf.ts < 3 * HOUR) score += 2;
    score = Math.round(DW.clamp(score, 3, 99));
    let trend = 'stable';
    if (recentW && oldW) {
      const d = recentS / recentW - oldS / oldW;
      trend = d > 0.5 ? 'up' : d < -0.5 ? 'down' : 'stable';
    }
    const label = score >= 85 ? 'Spotless' : score >= 70 ? 'Clean' : score >= 50 ? 'Fair' : score >= 30 ? 'Needs care' : 'Avoid';
    const tone = score >= 70 ? 'ok' : score >= 50 ? 'mid' : 'bad';
    const confidence = w >= 2.2 ? 'High' : w >= 1.1 ? 'Medium' : 'Low';
    return { score, label, tone, n: revs.length, latest: revs[0].ts, trend, confidence, why };
  });

  /* ---------- filters ---------- */
  DW.FILTERS = [
    { id: 'open', label: 'Open now', icon: 'clock', phrase: 'are open now', test: t => DW.status(t).open },
    { id: 'free', label: 'Free', icon: 'gift', phrase: 'are free', test: t => DW.cost(t) === 0, excl: 'paid' },
    { id: 'paid', label: 'Paid', icon: 'coins', phrase: 'are paid', test: t => t.fee > 0, excl: 'free' },
    { id: 'accessible', label: 'Accessible', icon: 'accessibility', phrase: 'are wheelchair accessible', test: t => t.wheelchair },
    { id: 'changing', label: 'Changing table', icon: 'baby', phrase: 'have a changing table', test: t => t.changing },
    { id: 'unisex', label: 'Unisex', icon: 'users', phrase: 'are unisex', test: t => t.gender === 'unisex', excl: 'separate' },
    { id: 'separate', label: 'Women / Men', icon: 'person-standing', phrase: 'have separate women’s and men’s rooms', test: t => t.gender === 'separate', excl: 'unisex' },
    { id: 'clean', label: 'Clean', icon: 'sparkles', phrase: 'are rated clean', test: t => (DW.cleanScore(t).score || 0) >= 70 },
    { id: 'nokey', label: 'No key', icon: 'key-round', phrase: 'need no key', test: t => !t.needsKey && !t.receiptCode },
    { id: 'nopurchase', label: 'No purchase', icon: 'shopping-bag', phrase: 'need no purchase', test: t => !t.purchaseRequired },
    { id: 'private', label: 'Private hosts', icon: 'house', phrase: 'are hosted privately', test: t => t.kind === 'private' }
  ];
  const FILTER_COLORS = { open: 'mint', free: 'yellow', paid: 'peach', accessible: 'blue', changing: 'pink', unisex: 'lav', separate: 'lav', clean: 'mint', nokey: 'yellow', nopurchase: 'pink', private: 'mint' };
  DW.FILTERS.forEach(f => { f.c = FILTER_COLORS[f.id]; });
  DW.FILTER = Object.fromEntries(DW.FILTERS.map(f => [f.id, f]));

  DW.accScore = t =>
    (t.wheelchair ? 3 : 0) + (t.changing ? 1 : 0) + (!t.needsKey && !t.receiptCode ? 1 : 0) +
    (!t.purchaseRequired ? 1 : 0) + (t.gender === 'unisex' ? 0.5 : 0) + (DW.status(t).open ? 1.5 : 0) +
    (t.kind === 'private' ? -1 : 0);

  DW.sorters = {
    nearest: (a, b) => a.d - b.d,
    rating: (a, b) => (DW.rating(b).avg || 0) - (DW.rating(a).avg || 0) || a.d - b.d,
    cheapest: (a, b) => DW.cost(a) - DW.cost(b) || a.d - b.d,
    accessible: (a, b) => DW.accScore(b) - DW.accScore(a) || a.d - b.d
  };

  /* ---------- Smart Toilet Recommendation ---------- */
  DW.scoreFor = function (t) {
    const st = DW.status(t), cs = DW.cleanScore(t), p = DW.db.prefs;
    let s = 42 * Math.exp(-t.d / 550);
    if (!st.open) s -= 60;
    const cost = DW.cost(t);
    s += cost === 0 ? 14 : 14 * Math.max(0, 1 - cost / DW.CUR.coffee) - (p.free ? 14 : 0);
    s += ((cs.score == null ? 55 : cs.score) / 100) * (p.clean ? 36 : 24);
    if (t.needsKey || t.receiptCode) s -= 4;
    if (t.purchaseRequired) s -= 6;
    if (t.kind === 'private') s -= t.instant ? 8 : 13;
    if (p.accessible) s += t.wheelchair ? 14 : -35;
    if (p.changing) s += t.changing ? 12 : -30;
    const conf = DW.confirmOf(t);
    if (conf && Date.now() - conf.ts < 2 * HOUR) s += 4;
    return s;
  };
  DW.reasons = function (t) {
    const st = DW.status(t), cs = DW.cleanScore(t), p = DW.db.prefs, conf = DW.confirmOf(t), out = [];
    out.push(`${DW.fmtWalk(t.d)} walk`);
    if (st.open) out.push('Open now');
    out.push(DW.priceLabel(t));
    if (cs.score != null && cs.score >= 70) out.push(`${cs.label} · ${cs.score}/100`);
    if (p.accessible && t.wheelchair) out.push('Wheelchair accessible');
    if (p.changing && t.changing) out.push('Changing table');
    if (conf && Date.now() - conf.ts < 2 * HOUR) out.push('Confirmed recently');
    return out.slice(0, 5);
  };
  DW.recommend = function (list) {
    let best = null, bs = -Infinity;
    list.forEach(t => { const s = DW.scoreFor(t); if (s > bs) { bs = s; best = t; } });
    return best ? { t: best, score: bs, reasons: DW.reasons(best) } : null;
  };

  /* ---------- AI Toilet Assistant: understand a plain-language request ---------- */
  const RULES = [
    [/\b(free|no fee|gratis|without paying|darmow\w*)\b/, p => p.filters.add('free')],
    [/\b(paid|płatn\w*)/, p => p.filters.add('paid')],
    [/\b(cheap\w*|lowest price|najtańsz\w*)/, p => { p.sort = 'cheapest'; }],
    [/\b(clean\w*|spotless|hygienic|sanitary|czyst\w*)/, p => p.filters.add('clean')],
    [/\b(changing (table|station|room)|baby|babies|diaper|nappy|infant|stroller|przewijak\w*)/, p => p.filters.add('changing')],
    [/\b(wheelchair|accessible|accessibility|disabled|disability|niepełnosprawn\w*)/, p => p.filters.add('accessible')],
    [/\b(unisex|gender.?neutral|all.?gender)\b/, p => p.filters.add('unisex')],
    [/\b(women|womens|ladies|female|men|mens|gents|male|separate)\b|damsk|męsk/, p => p.filters.add('separate')],
    [/\b(open|right now|otwart\w*)\b/, p => p.filters.add('open')],
    [/\b(no key|without (a )?key|keyless|bez klucza)\b/, p => p.filters.add('nokey')],
    [/\b(no purchase|without buying|(don'?t|do not) (want|have|need) to buy|not buy(ing)?|no need to buy|nothing to buy)\b/, p => p.filters.add('nopurchase')],
    [/\b(private|host(ed)?|someone'?s (home|house|flat|apartment)|rent)\b/, p => p.filters.add('private')],
    [/\b(restaurants?|caf[eé]|fast.?food|bistro)/, p => { p.kind = 'food'; }],
    [/\b(mall|shopping (centre|center))\b/, p => { p.kind = 'mall'; }],
    [/\b(gas station|petrol|fuel)\b/, p => { p.kind = 'fuel'; }],
    [/\b(public|city toilet|municipal)\b/, p => { p.kind = 'public'; }],
    [/\b(best|top.?rated|best.?rated|highest rated|nicest|najlepsz\w*)/, p => { p.sort = 'rating'; }],
    [/\b(nearest|closest|najbliższ\w*)/, p => { p.nearest = true; }],
    [/\b(near me|nearby|near|close by|around here|w pobliżu)/, p => { p.near = true; }],
    [/\b(urgent\w*|asap|emergency|hurry|desperate|can'?t wait|quick\w*)\b/, p => { p.urgent = true; }]
  ];
  const TOPIC = /\b(toilets?|restrooms?|bathrooms?|loo|wc|pee|washrooms?|lavatory|toalet\w*)\b/;

  DW.parseQuery = function (raw) {
    const p = { raw, filters: new Set(), sort: null, kind: null, near: false, nearest: false, urgent: false, maxDist: null };
    let q = ` ${String(raw || '').toLowerCase()} `.replace(/step[\s-]?free/g, 'accessible').replace(/24\s*\/\s*7/g, 'open');
    const m = q.match(/(\d+(?:[.,]\d+)?)\s*(km|kilomet\w+|min\w*|m|met\w+)\b/);
    if (m) {
      const n = parseFloat(m[1].replace(',', '.'));
      p.maxDist = /^k/.test(m[2]) ? n * 1000 : /^min/.test(m[2]) ? n * 64 : n;
      q = q.replace(m[0], ' ');
    }
    RULES.forEach(([re, fn]) => { if (re.test(q)) fn(p); });
    if (p.filters.has('free')) p.filters.delete('paid');
    if (p.filters.has('unisex')) p.filters.delete('separate');
    p.understood = !!(p.filters.size || p.sort || p.kind || p.near || p.nearest || p.urgent || p.maxDist || TOPIC.test(q));
    return p;
  };

  const joinAnd = arr => (arr.length < 2 ? arr.join('') : `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`);

  DW.answer = function (q) {
    const p = DW.parseQuery(q);
    const out = { q, p, results: [], filters: [], kind: null, maxDist: null, sort: p.sort, total: 0 };
    if (!p.understood) {
      out.html = 'I look for toilets — tell me what matters to you. For example: <i>“free, clean toilet with a changing table nearby”</i> or <i>“nearest accessible toilet that is open now”</i>.';
      return out;
    }
    let filters = [...p.filters], kind = p.kind, maxDist = p.maxDist;
    const dropped = [];
    const run = () => DW.toilets.filter(t =>
      filters.every(f => DW.FILTER[f].test(t)) && (!kind || t.kind === kind) && (!maxDist || t.d <= maxDist));
    let res = run();
    if (!res.length && maxDist) { dropped.push(`within ${DW.fmtDist(maxDist)}`); maxDist = null; res = run(); }
    if (!res.length && kind) { dropped.push(DW.KINDS[kind].label.toLowerCase()); kind = null; res = run(); }
    while (!res.length && filters.length) { dropped.push(DW.FILTER[filters.pop()].label.toLowerCase()); res = run(); }

    if (p.sort) res.sort(DW.sorters[p.sort]);
    else if (p.nearest || p.urgent) res.sort((a, b) => (DW.status(b).open - DW.status(a).open) || a.d - b.d);
    else res.sort((a, b) => DW.scoreFor(b) - DW.scoreFor(a));

    Object.assign(out, { results: res.slice(0, 3), total: res.length, filters, kind, maxDist });
    if (!res.length) { out.html = 'I could not find any toilets around this spot. Try searching another area on the map.'; return out; }

    const best = res[0], st = DW.status(best), cs = DW.cleanScore(best);
    const what = [];
    if (kind) what.push(`are in a ${DW.KINDS[kind].label.toLowerCase()}`);
    filters.forEach(f => what.push(DW.FILTER[f].phrase));
    const noun = res.length === 1 ? 'toilet' : 'toilets';
    let html = '';
    if (dropped.length) html += `Nothing nearby ticks every box, so I left out <b>${DW.esc(joinAnd(dropped))}</b>. `;
    html += `I found <b>${res.length} ${noun}</b>${what.length ? ` that ${what.length === 1 ? what[0] : joinAnd(what)}` : ' around you'}${maxDist ? ` within ${DW.fmtDist(maxDist)}` : ''}. `;
    const lead = p.sort === 'cheapest' ? 'Cheapest' : p.sort === 'rating' ? 'Best rated' : p.nearest || p.urgent ? 'Nearest' : 'Best match';
    html += `${lead}: <b>${DW.esc(best.name)}</b> — ${DW.fmtWalk(best.d)} walk (${DW.fmtDist(best.d)}), ${st.label.toLowerCase()}, ${DW.priceLabel(best).toLowerCase()}`;
    html += cs.score != null ? `, AI cleanliness ${cs.score}/100.` : '.';
    out.html = html;
    return out;
  };
})();
