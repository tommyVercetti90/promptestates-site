/* Project catalogue: filters + AI search (the model turns the visitor's words into these filters; cards are filtered here).
   Cards carry data-area/dev/devslug/city/price/year/beds("n:price,...")/q. Works without the API: a local parser covers
   numbers, bedrooms, years, area and developer names. URL keeps the state: ?area=&dev=&developer=<slug>&max=&year=&beds=&sort=&q= */
(function () {
  var C = window.PE_CAT, grid = document.getElementById('pgrid');
  if (!C || !grid) return;
  var cards = [].slice.call(grid.querySelectorAll('.pcard'));
  var $ = function (id) { return document.getElementById(id); };
  var form = $('cat-ai'), q = $('cat-q'), say = $('cat-say'), count = $('cat-count'), more = $('cat-more'), empty = $('cat-empty'), reset = $('cat-reset');
  var sel = {}; [].forEach.call(document.querySelectorAll('#cat-filters select'), function (s) { sel[s.dataset.f] = s; });
  var bedBtns = [].slice.call(document.querySelectorAll('.cat-bed'));
  var S = { areas: [], dev: '', max: 0, min: 0, year: 0, beds: [], sort: '', kw: '', city: '' }, shown = C.page;
  var info = cards.map(function (c, i) {
    var d = c.dataset, beds = {};
    (d.beds || '').split(',').forEach(function (x) { if (x) { var p = x.split(':'); beds[+p[0]] = +p[1]; } });
    return { el: c, i: i, area: d.area, dev: d.dev, slug: d.devslug, city: d.city, price: +d.price, year: +d.year, beds: beds, q: d.q || '' };
  });
  var areaNames = opts(sel.area), devNames = opts(sel.dev);
  function opts(s) { return [].slice.call(s.options).map(function (o) { return o.value; }).filter(Boolean); }

  function bedPrice(p) {  // lowest known price among the wanted bedroom counts (0 = unknown)
    var best = 0;
    S.beds.forEach(function (b) { for (var k in p.beds) if ((b === 4 ? +k >= 4 : +k === b) && p.beds[k] && (!best || p.beds[k] < best)) best = p.beds[k]; });
    return best;
  }
  function hasBeds(p) {
    if (!S.beds.length) return true;
    return S.beds.some(function (b) { for (var k in p.beds) if (b === 4 ? +k >= 4 : +k === b) return true; return false; });
  }
  function kwHit(p) {
    if (!S.kw) return true;
    return S.kw.toLowerCase().split(/[\s,]+/).filter(function (w) { return w.length > 2; })
      .every(function (w) { return p.q.indexOf(w.slice(0, Math.max(4, w.length - 2))) > -1; });
  }
  function match(p, useKw) {
    if (S.areas.length && S.areas.indexOf(p.area) < 0) return false;
    if (S.dev && p.dev !== S.dev) return false;
    if (S.city && p.city !== S.city) return false;
    if (!hasBeds(p)) return false;
    var price = (S.beds.length && bedPrice(p)) || p.price;
    if (S.max && (!price || price > S.max)) return false;
    if (S.min && price && price < S.min) return false;
    if (S.year && (!p.year || p.year > S.year)) return false;
    return !useKw || kwHit(p);
  }
  function apply(keepPage) {
    if (!keepPage) shown = C.page;
    var hit = info.filter(function (p) { return match(p, true); });
    if (!hit.length && S.kw) hit = info.filter(function (p) { return match(p, false); });  // words not found: keep the filters only
    var price = function (p) { return (S.beds.length && bedPrice(p)) || p.price || 9e12; };
    if (S.sort === 'price_desc') hit.sort(function (a, b) { return (b.price || 0) - (a.price || 0); });
    else if (S.sort === 'handover') hit.sort(function (a, b) { return (a.year || 9999) - (b.year || 9999) || price(a) - price(b); });
    else if (filtered()) hit.sort(function (a, b) { return price(a) - price(b); });
    else hit.sort(function (a, b) { return a.i - b.i; });
    var on = new Set(hit.slice(0, shown).map(function (p) { return p.el; }));
    info.forEach(function (p) { p.el.hidden = !on.has(p.el); });
    hit.forEach(function (p) { grid.appendChild(p.el); });
    count.textContent = C.found.replace('{n}', hit.length);
    empty.hidden = hit.length > 0;
    more.hidden = hit.length <= shown;
    reset.hidden = !filtered();
    sync();
  }
  function filtered() { return S.areas.length || S.dev || S.max || S.min || S.year || S.beds.length || S.kw || S.city; }
  function toUI() {
    sel.area.value = S.areas.length === 1 ? S.areas[0] : '';
    sel.dev.value = S.dev; sel.year.value = S.year || ''; sel.sort.value = S.sort;
    var m = S.max ? [].slice.call(sel.max.options).map(function (o) { return +o.value; }).filter(function (v) { return v >= S.max; })[0] : '';
    sel.max.value = m || '';
    bedBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(S.beds.indexOf(+b.dataset.beds) > -1)); });
  }
  function sync() {
    var u = new URLSearchParams();
    if (S.areas.length) u.set('area', S.areas.join('|'));
    if (S.dev) u.set('dev', S.dev);
    if (S.max) u.set('max', S.max);
    if (S.year) u.set('year', S.year);
    if (S.beds.length) u.set('beds', S.beds.join(','));
    if (S.sort) u.set('sort', S.sort);
    if (S.kw) u.set('kw', S.kw);
    if (q.value.trim()) u.set('q', q.value.trim());
    var s = u.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash);
  }

  // filters by hand
  sel.area.onchange = function () { S.areas = sel.area.value ? [sel.area.value] : []; apply(); };
  sel.dev.onchange = function () { S.dev = sel.dev.value; apply(); };
  sel.max.onchange = function () { S.max = +sel.max.value || 0; S.min = 0; apply(); };
  sel.year.onchange = function () { S.year = +sel.year.value || 0; apply(); };
  sel.sort.onchange = function () { S.sort = sel.sort.value; apply(); };
  bedBtns.forEach(function (b) {
    b.onclick = function () {
      var v = +b.dataset.beds, i = S.beds.indexOf(v);
      if (i > -1) S.beds.splice(i, 1); else S.beds.push(v);
      toUI(); apply();
    };
  });
  more.onclick = function () { shown += C.page; apply(true); };
  reset.onclick = function () { S = { areas: [], dev: '', max: 0, min: 0, year: 0, beds: [], sort: '', kw: '', city: '' }; q.value = ''; say.textContent = ''; toUI(); apply(); };

  // local reading of the request: used when the AI service is unavailable, and to fill gaps
  function local(text) {
    var t = ' ' + text.toLowerCase().replace(/\s+/g, ' ') + ' ', f = { areas: [], developers: [] }, m;
    [[/даунта?ун\w*/g, 'downtown'], [/марин\w*/g, 'marina'], [/айленд\w*/g, 'islands'], [/бизнес[ -]?бэ\w*/g, 'business bay'], [/палм\w*/g, 'palm'],
     [/джумейр\w*|джумер\w*/g, 'jumeirah'], [/хиллс\w*/g, 'hills'], [/крик\w*/g, 'creek'], [/аль фурджан\w*|фурджан\w*/g, 'al furjan']]
      .forEach(function (r) { t = t.replace(r[0], r[1]); });
    areaNames.forEach(function (a) {
      var ab = /^(\w+) \(/.exec(a), words = a.toLowerCase().replace(/[()]/g, ' ').split(/\s+/).filter(function (w) { return w && w !== 'dubai'; });
      var full = a.toLowerCase().replace(/\s*\(.*\)/, '');
      if ((ab && t.indexOf(' ' + ab[1].toLowerCase() + ' ') > -1) || t.indexOf(full) > -1 ||
          (!ab && words.length && words.every(function (w) { return t.indexOf(w) > -1; }))) f.areas.push(a);
    });
    devNames.forEach(function (d) { var k = d.toLowerCase().split(' ')[0]; if (k.length > 3 && t.indexOf(k) > -1) f.developers.push(d); });
    var rate = /\$|usd|долл|dollar/.test(t) ? 3.67 : /€|eur|евро/.test(t) ? 4 : 1;
    if ((m = /(\d+(?:[.,]\d+)?)\s*(млн|mln|million|m\b|м\b|миллион)/.exec(t))) f.max_price = Math.round(parseFloat(m[1].replace(',', '.')) * 1e6 * rate);
    else if ((m = /(\d+(?:[.,]\d+)?)\s*(k\b|к\b|тыс|thousand)/.exec(t))) f.max_price = Math.round(parseFloat(m[1].replace(',', '.')) * 1e3 * rate);
    else if ((m = /(\d[\d\s]{5,})/.exec(t))) f.max_price = Math.round(parseInt(m[1].replace(/\s/g, ''), 10) * rate);
    if (/(от|from|over|больше)\s*\d/.test(t) && f.max_price && !/(до|under|below|up to|max|меньше|дешевле)/.test(t)) { f.min_price = f.max_price; delete f.max_price; }
    if (/студи|studio/.test(t)) f.beds = 0;
    else if ((m = /(\d)\s*-?\s*(спал|bed|br\b|bhk|комн|к\b)/.exec(t))) f.beds = +m[1];
    else if (/однуш|однокомн/.test(t)) f.beds = 0; else if (/двуш|двухкомн/.test(t)) f.beds = 1; else if (/трёш|треш|трехкомн|трёхкомн/.test(t)) f.beds = 2;
    if ((m = /(20[23]\d)/.exec(t))) f.handover_by = +m[1];
    if (/мор|пляж|beach|sea\b|waterfront|набережн/.test(t)) f.keywords = 'beach';
    if (/брендов|branded/.test(t)) f.keywords = ((f.keywords || '') + ' branded').trim();
    if (/дешев|cheap|lowest/.test(t)) f.sort = 'price_asc';
    if (/скорее|быстр|soonest|earliest|ready soon/.test(t)) f.sort = 'handover';
    return f;
  }
  function fromFilters(f) {
    S = { areas: f.areas || [], dev: (f.developers || [])[0] || '', max: f.max_price || 0, min: f.min_price || 0,
          year: f.handover_by || 0, beds: f.beds === undefined || f.beds === null ? [] : [Math.min(4, +f.beds)], sort: f.sort || '',
          kw: f.keywords || '', city: f.city && f.city !== 'Dubai' ? f.city : '' };
    toUI(); apply();
  }
  function search(text) {
    text = (text || '').trim();
    if (!text) return;
    var lf = local(text);
    fromFilters(lf);                       // instant result from the local reading
    say.textContent = C.thinking; say.classList.add('busy');
    if (window.gtag) gtag('event', 'catalog_search', { lang: C.lang, chars: text.length });
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 12000);
    fetch(C.api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl && ctl.signal,
                   body: JSON.stringify({ q: text, lang: C.lang, areas: areaNames, developers: devNames }) })
      .then(function (r) { if (!r.ok) throw r.status; return r.json(); })
      .then(function (f) {
        if (q.value.trim() !== text) return;    // a newer request replaced this one
        if (!f.areas.length && lf.areas.length) f.areas = lf.areas;
        fromFilters(f);
        say.textContent = f.reply || '';
      })
      .catch(function () { say.textContent = ''; })
      .then(function () { clearTimeout(timer); say.classList.remove('busy'); });
  }
  form.onsubmit = function (ev) { ev.preventDefault(); search(q.value); };
  [].forEach.call(document.querySelectorAll('.cat-ex'), function (b) { b.onclick = function () { q.value = b.textContent; search(b.textContent); }; });

  // state from the URL (developer pages link here with ?developer=<slug>)
  var u = new URLSearchParams(location.search);
  if (u.get('developer')) { var hit = info.filter(function (p) { return p.slug === u.get('developer') || p.slug.indexOf(u.get('developer') + '-') === 0; })[0]; if (hit) S.dev = hit.dev; }
  if (u.get('dev')) S.dev = u.get('dev');
  if (u.get('area')) S.areas = u.get('area').split('|').filter(function (a) { return areaNames.indexOf(a) > -1; });
  S.max = +u.get('max') || 0; S.year = +u.get('year') || 0; S.sort = u.get('sort') || ''; S.kw = u.get('kw') || '';
  if (u.get('beds')) S.beds = u.get('beds').split(',').map(Number);
  if (u.get('q')) q.value = u.get('q');
  toUI(); apply();
})();
