/* PromptEstates Pro — investor dashboard on Dubai Land Department open data.
   Static SPA: hash routes, data from ./data (built by tools/pro_data.py). */
(function () {
  'use strict';
  var PASS_HASH = 'a8fd3e8aa693b3325bfaea2787459e0abe86f7fd54c2ab062be65e522def6a27';
  var SQFT = 10.7639;
  var store = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };

  // ------------------------------------------------------------------ i18n
  var T = {
    ru: {
      gateText: 'Аналитика рынка недвижимости Дубая на данных DLD. Введите пароль доступа.', gateBtn: 'Войти', gateErr: 'Неверный пароль',
      navMarket: 'Рынок', navAreas: 'Районы', navProjects: 'Проекты', navTx: 'Сделки', navDevs: 'Застройщики',
      marketH: 'Рынок недвижимости Дубая', marketSub: 'Зарегистрированные сделки продажи и договоры аренды DLD',
      sales12: 'Сделок за 12 мес.', value12: 'Объём за 12 мес.', ppm: 'Медиана за', yoy: 'к прошлому году', off12: 'Доля off-plan',
      rent: 'Медиана аренды, год', yield: 'Доходность', grossYield: 'Валовая доходность', bn: 'млрд AED', m: 'млн AED',
      volH: 'Объём продаж и цена', volHint: 'Количество сделок по месяцам и медианная цена', offH: 'Off-plan и вторичный рынок', offHint: 'Медианная цена: строящиеся и готовые объекты',
      rentH: 'Аренда', rentHint: 'Медианная годовая аренда по новым и продлённым договорам Ejari', topAreas: 'Районы', all: 'Все',
      area: 'Район', sales: 'Сделок', value: 'Объём', price: 'Цена', aptPpm: 'Квартиры', vilPpm: 'Виллы', offplan: 'Off-plan', ready: 'Готовое',
      activeProj: 'Проектов в стройке', yld1: 'Доходн. 1BR', areasH: 'Районы Дубая', areasSub: 'Сравнение районов: цены, объёмы, аренда, доходность',
      search: 'Поиск…', projectsH: 'Проекты', projectsSub: 'Реестр проектов DLD с ценами по сделкам', developer: 'Застройщик', status: 'Статус',
      pct: 'Готовность', handover: 'Сдача', units: 'Юнитов', last: 'Последняя сделка', anyStatus: 'Любой статус', st_offplan: 'Строится', st_ns: 'Не начат',
      st_fin: 'Сдан', anyArea: 'Все районы', anyYear: 'Любой год сдачи', overdueOnly: 'Только просроченные', late: 'Просрочен', rooms: 'Комнаты',
      size: 'Площадь', priceTotal: 'Цена сделки', type: 'Тип', date: 'Дата', project: 'Проект', txH: 'Сделки', txSub: 'Все зарегистрированные продажи за 24 месяца по району',
      pickArea: 'Выберите район', anyRooms: 'Любые', anyType: 'Любой тип', priceFrom: 'Цена от', priceTo: 'Цена до', from: 'С', to: 'По',
      found: 'Найдено', median: 'медиана', export: 'Скачать CSV', devsH: 'Застройщики', devsSub: 'Надёжность и объёмы по реестру DLD',
      projects: 'Проектов', finished: 'Сдано', active: 'В работе', overdue: 'Просрочено', avgPct: 'Средняя готовность', escrow: 'Эскроу-банк',
      start: 'Старт', registry: 'Реестр DLD', priceHist: 'История цен', byRooms: 'По типам квартир', recent: 'Последние сделки', inArea: 'Проекты района',
      seeTx: 'Все сделки района', prev: 'Назад', next: 'Дальше', page: 'стр.', of: 'из', none: 'Ничего не найдено', loading: 'Загрузка…',
      source: 'Источник: Dubai Land Department (data.dubai) — сделки на {tx}, аренда на {rent} ({rs}), реестр проектов на {reg}. Медианы, не оценка конкретного объекта.',
      studio: 'Студия', br: 'сп.', villa: 'Вилла', ph: 'Пентхаус', apt: 'Кв.', land: 'Земля', bld: 'Здание', ppmShort: 'за', perYear: '/год',
      devProjects: 'Проекты застройщика', expectedYield: '* В доме ещё нет договоров аренды: аренда и доходность — по медиане района за 12 месяцев.', master: 'Мастер-проект', medianPrice: 'Медиана цены', medianSize: 'Медиана площади', medianRent: 'Аренда/год'
    },
    en: {
      gateText: 'Dubai real estate intelligence on Dubai Land Department data. Enter your access password.', gateBtn: 'Sign in', gateErr: 'Wrong password',
      navMarket: 'Market', navAreas: 'Areas', navProjects: 'Projects', navTx: 'Transactions', navDevs: 'Developers',
      marketH: 'Dubai property market', marketSub: 'Registered DLD sales transactions and Ejari rent contracts',
      sales12: 'Sales, 12 months', value12: 'Value, 12 months', ppm: 'Median per', yoy: 'YoY', off12: 'Off-plan share',
      rent: 'Median rent, annual', yield: 'Yield', grossYield: 'Gross yield', bn: 'bn AED', m: 'm AED',
      volH: 'Sales volume and price', volHint: 'Monthly transactions and median price', offH: 'Off-plan vs ready', offHint: 'Median price: under construction vs completed',
      rentH: 'Rents', rentHint: 'Median annual rent, new and renewed Ejari contracts', topAreas: 'Areas', all: 'All',
      area: 'Area', sales: 'Sales', value: 'Value', price: 'Price', aptPpm: 'Apartments', vilPpm: 'Villas', offplan: 'Off-plan', ready: 'Ready',
      activeProj: 'Projects under construction', yld1: '1BR yield', areasH: 'Dubai areas', areasSub: 'Compare areas: prices, volumes, rents, yields',
      search: 'Search…', projectsH: 'Projects', projectsSub: 'DLD project registry with transaction prices', developer: 'Developer', status: 'Status',
      pct: 'Completion', handover: 'Handover', units: 'Units', last: 'Last sale', anyStatus: 'Any status', st_offplan: 'Under construction', st_ns: 'Not started',
      st_fin: 'Completed', anyArea: 'All areas', anyYear: 'Any handover year', overdueOnly: 'Overdue only', late: 'Overdue', rooms: 'Beds',
      size: 'Size', priceTotal: 'Price', type: 'Type', date: 'Date', project: 'Project', txH: 'Transactions', txSub: 'Every registered sale in the last 24 months, by area',
      pickArea: 'Choose an area', anyRooms: 'Any', anyType: 'Any type', priceFrom: 'Price from', priceTo: 'Price to', from: 'From', to: 'To',
      found: 'Found', median: 'median', export: 'Download CSV', devsH: 'Developers', devsSub: 'Track record and volumes from the DLD registry',
      projects: 'Projects', finished: 'Completed', active: 'Active', overdue: 'Overdue', avgPct: 'Avg completion', escrow: 'Escrow bank',
      start: 'Start', registry: 'DLD registry', priceHist: 'Price history', byRooms: 'By unit type', recent: 'Recent transactions', inArea: 'Projects in the area',
      seeTx: 'All transactions in the area', prev: 'Prev', next: 'Next', page: 'page', of: 'of', none: 'Nothing found', loading: 'Loading…',
      source: 'Source: Dubai Land Department (data.dubai) — transactions as of {tx}, rents as of {rent} ({rs}), project registry as of {reg}. Medians, not a valuation of any unit.',
      studio: 'Studio', br: 'BR', villa: 'Villa', ph: 'Penthouse', apt: 'Apt', land: 'Land', bld: 'Building', ppmShort: 'per', perYear: '/yr',
      devProjects: 'Developer projects', expectedYield: '* No rent contracts in this building yet: rent and yield use the area median over 12 months.', master: 'Master project', medianPrice: 'Median price', medianSize: 'Median size', medianRent: 'Rent/yr'
    }
  };
  var lang = store('pro_lang') || ((navigator.language || 'en').toLowerCase().indexOf('ru') === 0 ? 'ru' : 'en');
  var unit = store('pro_unit') || (lang === 'ru' ? 'm2' : 'sqft');
  var t = function (k) { return (T[lang] && T[lang][k]) || T.en[k] || k; };

  // ------------------------------------------------------------------ helpers
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fmt = function (n, d) { if (n == null || isNaN(n)) return '—'; return Number(n).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); };
  var area = function (v) { return unit === 'm2' ? v : v * SQFT; };
  var ppmv = function (v) { return v == null ? null : (unit === 'm2' ? v : v / SQFT); };
  var uLabel = function () { return unit === 'm2' ? 'м²'.replace('м', lang === 'ru' ? 'м' : 'm') : 'sq ft'; };
  var aed = function (v) { if (v == null) return '—'; if (v >= 1e9) return fmt(v / 1e9, 2) + ' ' + t('bn'); if (v >= 1e6) return fmt(v / 1e6, 2) + ' ' + t('m'); return fmt(v); };
  var pctTag = function (v) { if (v == null) return ''; return '<i class="' + (v >= 0 ? 'up' : 'down') + '">' + (v >= 0 ? '+' : '') + fmt(v, 1) + '%</i>'; };
  var roomsLabel = function (r) { return r === 'S' ? t('studio') : r === 'PH' ? t('ph') : r === 'V' ? t('villa') : r ? r + ' ' + t('br') : '—'; };
  var cache = {};
  var get = function (path) {
    if (!cache[path]) cache[path] = fetch('data/' + path).then(function (r) { if (!r.ok) throw new Error(path); return r.json(); });
    return cache[path];
  };
  var median = function (xs) { if (!xs.length) return null; var s = xs.slice().sort(function (a, b) { return a - b; }), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  var charts = [];
  var css = function (v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); };
  function chart(el, cfg) {
    Chart.defaults.locale = lang === 'ru' ? 'ru-RU' : 'en-US';
    var c = new Chart(el, cfg);
    charts.push(c);
    return c;
  }
  function baseOpts(extra) {
    var grid = css('--line'), tick = css('--muted');
    var o = { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { color: tick, boxWidth: 12 } } },
      scales: { x: { grid: { color: grid }, ticks: { color: tick, maxRotation: 0, autoSkipPadding: 12 } },
                y: { grid: { color: grid }, ticks: { color: tick } } } };
    return Object.assign(o, extra || {});
  }

  // sortable table with pagination
  function table(host, cols, rows, opts) {
    opts = opts || {};
    var state = { key: opts.sort || null, asc: false, page: 0 };
    var per = opts.per || 50;
    function render() {
      var data = rows.slice();
      if (state.key) {
        var col = cols.filter(function (c) { return c.k === state.key; })[0];
        var val = col.v || function (r) { return r[col.k]; };
        data.sort(function (a, b) { var x = val(a), y = val(b); if (x == null) return 1; if (y == null) return -1; return (x > y ? 1 : x < y ? -1 : 0) * (state.asc ? 1 : -1); });
      }
      var pages = Math.max(1, Math.ceil(data.length / per));
      state.page = Math.min(state.page, pages - 1);
      var slice = data.slice(state.page * per, state.page * per + per);
      var h = '<div class="tw"><table><thead><tr>' + cols.map(function (c) {
        return '<th data-k="' + c.k + '" class="' + (c.num ? 'num ' : '') + (state.key === c.k ? 'sorted' + (state.asc ? ' asc' : '') : '') + '">' + esc(c.h) + '</th>';
      }).join('') + '</tr></thead><tbody>' + (slice.length ? slice.map(function (r) {
        return '<tr>' + cols.map(function (c) { return '<td class="' + (c.num ? 'num' : '') + (c.wrap ? ' wrap' : '') + '">' + (c.f ? c.f(r) : esc(r[c.k])) + '</td>'; }).join('') + '</tr>';
      }).join('') : '<tr><td colspan="' + cols.length + '" class="empty">' + t('none') + '</td></tr>') + '</tbody></table></div>';
      if (pages > 1) h += '<div class="pager"><button data-p="-1"' + (state.page ? '' : ' disabled') + '>' + t('prev') + '</button>' + t('page') + ' ' + (state.page + 1) + ' ' + t('of') + ' ' + pages +
        '<button data-p="1"' + (state.page < pages - 1 ? '' : ' disabled') + '>' + t('next') + '</button></div>';
      host.innerHTML = h;
      host.querySelectorAll('th').forEach(function (th) {
        th.onclick = function () { var k = th.dataset.k; if (state.key === k) state.asc = !state.asc; else { state.key = k; state.asc = false; } render(); };
      });
      host.querySelectorAll('.pager button').forEach(function (b) { b.onclick = function () { state.page += +b.dataset.p; render(); host.scrollIntoView({ block: 'nearest' }); }; });
    }
    render();
    return { set: function (r) { rows = r; state.page = 0; render(); } };
  }

  // ------------------------------------------------------------------ views
  var view = $('#view');
  function page(html) { charts.forEach(function (c) { c.destroy(); }); charts = []; view.innerHTML = html; window.scrollTo(0, 0); }
  function kpi(label, value, extra) { return '<div class="kpi"><span>' + esc(label) + '</span><b>' + value + '</b>' + (extra || '') + '</div>'; }
  function lastN(series, n) { return series.slice(-n); }
  function sum(series, i) { return series.reduce(function (s, r) { return s + (r[i] || 0); }, 0); }

  function marketCharts(series, hostVol, hostOff, hostRent) {
    var s = series.slice(-36);
    var labels = s.map(function (r) { return r[0]; });
    chart(hostVol, { data: { labels: labels, datasets: [
      { type: 'bar', label: t('sales'), data: s.map(function (r) { return r[1]; }), backgroundColor: css('--accent') + '66', yAxisID: 'y' },
      { type: 'line', label: t('price') + ', AED/' + uLabel(), data: s.map(function (r) { return ppmv(r[3]); }), borderColor: css('--accent'), backgroundColor: css('--accent'), tension: .3, pointRadius: 0, yAxisID: 'y1' }
    ] }, options: baseOpts({ scales: { x: { grid: { color: css('--line') }, ticks: { color: css('--muted'), maxRotation: 0, autoSkipPadding: 14 } },
      y: { position: 'left', grid: { color: css('--line') }, ticks: { color: css('--muted') } }, y1: { position: 'right', grid: { display: false }, ticks: { color: css('--muted') } } } }) });
    if (hostOff) chart(hostOff, { type: 'line', data: { labels: labels, datasets: [
      { label: t('offplan'), data: s.map(function (r) { return ppmv(r[7]); }), borderColor: css('--accent'), tension: .3, pointRadius: 0 },
      { label: t('ready'), data: s.map(function (r) { return ppmv(r[8]); }), borderColor: css('--warn'), tension: .3, pointRadius: 0 }
    ] }, options: baseOpts() });
    if (hostRent) chart(hostRent, { type: 'line', data: { labels: labels, datasets: [
      { label: t('rent') + ', AED', data: s.map(function (r) { return r[9]; }), borderColor: css('--good'), tension: .3, pointRadius: 0, spanGaps: true }
    ] }, options: baseOpts() });
  }

  function areaCols(meta) {
    return [
      { k: 'name', h: t('area'), wrap: 1, v: function (a) { return a.community || a.name; }, f: function (a) { return '<a href="#/area/' + a.id + '">' + esc(a.community || a.name) + '</a>' + (a.community ? '<br><small class="muted">' + esc(a.name) + '</small>' : ''); } },
      { k: 'n12', h: t('sales'), num: 1, f: function (a) { return fmt(a.n12); } },
      { k: 'v12', h: t('value') + ', ' + t('m'), num: 1, f: function (a) { return fmt(a.v12); } },
      { k: 'ppm12', h: 'AED/' + uLabel(), num: 1, f: function (a) { return fmt(ppmv(a.ppm12)); } },
      { k: 'yoy', h: t('yoy'), num: 1, f: function (a) { return pctTag(a.yoy); } },
      { k: 'off12', h: t('offplan'), num: 1, f: function (a) { return a.off12 == null ? '—' : a.off12 + '%'; } },
      { k: 'r1', h: t('rent') + ' 1BR', num: 1, v: function (a) { return a.rent['1']; }, f: function (a) { return fmt(a.rent['1']); } },
      { k: 'y1', h: t('yld1'), num: 1, v: function (a) { return a.yld['1']; }, f: function (a) { return a.yld['1'] ? fmt(a.yld['1'], 1) + '%' : '—'; } },
      { k: 'projects', h: t('activeProj'), num: 1 }
    ];
  }

  function vMarket() {
    page('<div class="loading">' + t('loading') + '</div>');
    Promise.all([get('market.json'), get('areas.json')]).then(function (d) {
      var m = d[0], areas = d[1], s = m.all, l12 = lastN(s, 12), p12 = s.slice(-24, -12);
      var ppm12 = median(l12.map(function (r) { return r[3]; }).filter(Boolean)), ppmP = median(p12.map(function (r) { return r[3]; }).filter(Boolean));
      var n12 = sum(l12, 1), off = sum(l12, 6), v12 = sum(l12, 2) * 1e6, rent12 = median(l12.map(function (r) { return r[9]; }).filter(Boolean));
      var ylds = areas.map(function (a) { return a.yld['1']; }).filter(Boolean);
      page('<h1 class="page">' + t('marketH') + '</h1><p class="sub">' + t('marketSub') + '</p><div class="kpis">' +
        kpi(t('sales12'), fmt(n12)) + kpi(t('value12'), aed(v12)) +
        kpi(t('ppm') + ' ' + uLabel(), 'AED ' + fmt(ppmv(ppm12)), pctTag(ppmP ? 100 * (ppm12 / ppmP - 1) : null) + ' <i>' + t('yoy') + '</i>') +
        kpi(t('off12'), fmt(100 * off / n12) + '%') + kpi(t('rent'), 'AED ' + fmt(rent12)) +
        kpi(t('grossYield') + ' 1BR', fmt(median(ylds), 1) + '%') + '</div>' +
        '<div class="panel"><h2>' + t('volH') + '</h2><p class="hint">' + t('volHint') + '</p><div class="chart"><canvas id="c1"></canvas></div></div>' +
        '<div class="grid2"><div class="panel"><h2>' + t('offH') + '</h2><p class="hint">' + t('offHint') + ', AED/' + uLabel() + '</p><div class="chart"><canvas id="c2"></canvas></div></div>' +
        '<div class="panel"><h2>' + t('rentH') + '</h2><p class="hint">' + t('rentHint') + '</p><div class="chart"><canvas id="c3"></canvas></div></div></div>' +
        '<h2>' + t('topAreas') + '</h2><div id="tbl"></div>');
      marketCharts(s, $('#c1'), $('#c2'), $('#c3'));
      table($('#tbl'), areaCols(), areas.slice(0, 25), { sort: 'n12', per: 25 });
    });
  }

  function vAreas() {
    get('areas.json').then(function (areas) {
      page('<h1 class="page">' + t('areasH') + '</h1><p class="sub">' + t('areasSub') + '</p><div class="filters"><input type="search" id="q" placeholder="' + t('search') + '"></div><div id="tbl"></div>');
      var tb = table($('#tbl'), areaCols(), areas, { sort: 'n12', per: 50 });
      $('#q').oninput = function () { var q = this.value.toLowerCase(); tb.set(areas.filter(function (a) { return (a.name + ' ' + (a.community || '')).toLowerCase().indexOf(q) >= 0; })); };
    });
  }

  function roomsTable(host, rooms, rents, yld) {
    var order = ['S', '1', '2', '3', '4', '5+', 'PH'];
    var rows = order.filter(function (k) { return rooms[k] || (rents && rents[k]); }).map(function (k) {
      var r = rooms[k] || {};
      return { k: k, n: r.n, price: r.price, size: r.size, rent: rents && rents[k], y: yld && yld[k] };
    });
    table(host, [
      { k: 'k', h: t('rooms'), f: function (r) { return roomsLabel(r.k); } },
      { k: 'n', h: t('sales'), num: 1, f: function (r) { return fmt(r.n); } },
      { k: 'price', h: t('medianPrice'), num: 1, f: function (r) { return fmt(r.price); } },
      { k: 'size', h: t('medianSize') + ', ' + uLabel(), num: 1, f: function (r) { return r.size ? fmt(area(r.size)) : '—'; } },
      { k: 'rent', h: t('medianRent'), num: 1, f: function (r) { return fmt(r.rent); } },
      { k: 'y', h: t('grossYield'), num: 1, f: function (r) { return r.y ? fmt(r.y, 1) + '%' : '—'; } }
    ], rows, { per: 20 });
  }

  function vArea(id) {
    Promise.all([get('market.json'), get('areas.json'), get('projects.json')]).then(function (d) {
      var a = d[1].filter(function (x) { return x.id === id; })[0], s = d[0].areas[id] || [];
      if (!a) { page('<div class="empty">' + t('none') + '</div>'); return; }
      var projs = d[2].filter(function (p) { return p.area === id; });
      var l12 = lastN(s, 12);
      var aptRooms = {}; ['S', '1', '2', '3', '4'].forEach(function (k) { if (a.rent[k] || a.yld[k]) aptRooms[k] = {}; });
      page('<div class="crumbs"><a href="#/areas">' + t('navAreas') + '</a> /</div><h1 class="page">' + esc(a.community || a.name) + '</h1><p class="sub">' + (a.community ? esc(a.name) + ' · ' : '') + t('marketSub') + '</p><div class="kpis">' +
        kpi(t('sales12'), fmt(a.n12)) + kpi(t('value12'), aed(a.v12 * 1e6)) + kpi(t('ppm') + ' ' + uLabel(), 'AED ' + fmt(ppmv(a.ppm12)), pctTag(a.yoy) + ' <i>' + t('yoy') + '</i>') +
        kpi(t('off12'), a.off12 == null ? '—' : a.off12 + '%') + kpi(t('rent') + ' 1BR', 'AED ' + fmt(a.rent['1'])) + kpi(t('grossYield') + ' 1BR', a.yld['1'] ? fmt(a.yld['1'], 1) + '%' : '—') + '</div>' +
        '<div class="panel"><h2>' + t('volH') + '</h2><div class="chart"><canvas id="c1"></canvas></div></div>' +
        '<div class="grid2"><div class="panel"><h2>' + t('offH') + '</h2><p class="hint">AED/' + uLabel() + '</p><div class="chart"><canvas id="c2"></canvas></div></div>' +
        '<div class="panel"><h2>' + t('rentH') + '</h2><p class="hint">' + t('rentHint') + '</p><div class="chart"><canvas id="c3"></canvas></div></div></div>' +
        '<div class="panel"><h2>' + t('byRooms') + '</h2><div id="rooms"></div></div>' +
        '<h2>' + t('inArea') + ' <a class="chip" href="#/tx/' + id + '" style="display:inline-flex;align-items:center;margin-inline-start:8px">' + t('seeTx') + ' →</a></h2><div id="tbl"></div>');
      marketCharts(s, $('#c1'), $('#c2'), $('#c3'));
      roomsTable($('#rooms'), {}, a.rent, a.yld);
      table($('#tbl'), projCols(), projs, { sort: 'n12', per: 30 });
    });
  }

  function statusTag(p) {
    if (p.overdue) return '<span class="tag late">' + t('late') + '</span>';
    if (p.status === 'FINISHED') return '<span class="tag done">' + t('st_fin') + '</span>';
    if (p.status === 'ACTIVE') return '<span class="tag off">' + t('st_offplan') + '</span>';
    return '<span class="tag">' + t('st_ns') + '</span>';
  }
  function projCols(areaNames) {
    var cols = [
      { k: 'name', h: t('project'), wrap: 1, f: function (p) { return '<a href="#/project/' + p.id + '">' + esc(p.name) + '</a>'; } },
      { k: 'dev', h: t('developer'), wrap: 1, f: function (p) { return p.devId ? '<a href="#/developer/' + p.devId + '">' + esc(p.dev) + '</a>' : '—'; } },
      { k: 'status', h: t('status'), f: statusTag },
      { k: 'pct', h: t('pct'), num: 1, f: function (p) { return p.pct == null ? '—' : '<span class="bar"><i style="width:' + p.pct + '%"></i></span>' + fmt(p.pct) + '%'; } },
      { k: 'end', h: t('handover'), f: function (p) { return esc((p.end || p.done || '').slice(0, 7)) || '—'; } },
      { k: 'units', h: t('units'), num: 1, f: function (p) { return fmt(p.units || p.villas); } },
      { k: 'n12', h: t('sales12'), num: 1, f: function (p) { return fmt(p.n12); } },
      { k: 'ppm12', h: 'AED/' + uLabel(), num: 1, f: function (p) { return fmt(ppmv(p.ppm12)); } },
      { k: 'y1', h: t('yld1'), num: 1, v: function (p) { return p.yld && p.yld['1']; }, f: function (p) { return p.yld && p.yld['1'] ? fmt(p.yld['1'], 1) + '%' : '—'; } }
    ];
    if (areaNames) cols.splice(1, 0, { k: 'area', h: t('area'), v: function (p) { return areaNames[p.area] || ''; }, f: function (p) { return p.area ? '<a href="#/area/' + p.area + '">' + esc(areaNames[p.area] || p.area) + '</a>' : '—'; } });
    return cols;
  }

  function vProjects() {
    Promise.all([get('projects.json'), get('meta.json')]).then(function (d) {
      var all = d[0], names = d[1].areas;
      var years = {}; all.forEach(function (p) { if (p.end) years[p.end.slice(0, 4)] = 1; });
      var devs = {}; all.forEach(function (p) { if (p.devId) devs[p.devId] = p.dev; });
      page('<h1 class="page">' + t('projectsH') + '</h1><p class="sub">' + t('projectsSub') + '</p><div class="filters">' +
        '<input type="search" id="q" placeholder="' + t('search') + '">' +
        '<select id="fa"><option value="">' + t('anyArea') + '</option>' + Object.keys(names).sort(function (a, b) { return names[a] > names[b] ? 1 : -1; }).map(function (k) { return '<option value="' + k + '">' + esc(names[k]) + '</option>'; }).join('') + '</select>' +
        '<select id="fs"><option value="">' + t('anyStatus') + '</option><option value="ACTIVE">' + t('st_offplan') + '</option><option value="NS">' + t('st_ns') + '</option><option value="FINISHED">' + t('st_fin') + '</option></select>' +
        '<select id="fy"><option value="">' + t('anyYear') + '</option>' + Object.keys(years).sort().map(function (y) { return '<option>' + y + '</option>'; }).join('') + '</select>' +
        '<label><input type="checkbox" id="fo"> ' + t('overdueOnly') + '</label></div><div id="tbl"></div>');
      var tb = table($('#tbl'), projCols(names), all, { sort: 'n12', per: 50 });
      function apply() {
        var q = $('#q').value.toLowerCase(), fa = $('#fa').value, fs = $('#fs').value, fy = $('#fy').value, fo = $('#fo').checked;
        tb.set(all.filter(function (p) {
          if (q && (p.name + ' ' + p.dev + ' ' + p.master).toLowerCase().indexOf(q) < 0) return false;
          if (fa && p.area !== fa) return false;
          if (fs === 'NS' ? ['NOT_STARTED', 'PENDING', 'CONDITIONAL_ACTIVATING'].indexOf(p.status) < 0 : fs && p.status !== fs) return false;
          if (fy && (p.end || '').slice(0, 4) !== fy) return false;
          if (fo && !p.overdue) return false;
          return true;
        }));
      }
      ['q', 'fa', 'fs', 'fy', 'fo'].forEach(function (id) { $('#' + id).addEventListener(id === 'q' ? 'input' : 'change', apply); });
    });
  }

  function txCols(projNames, withProject) {
    var cols = [
      { k: 0, h: t('date'), f: function (r) { return esc(r[0]); } },
      { k: 2, h: t('rooms'), f: function (r) { return roomsLabel(r[2]); } },
      { k: 3, h: t('size') + ', ' + uLabel(), num: 1, v: function (r) { return r[3]; }, f: function (r) { return fmt(area(r[3])); } },
      { k: 4, h: t('priceTotal') + ', AED', num: 1, v: function (r) { return r[4]; }, f: function (r) { return fmt(r[4]); } },
      { k: 5, h: 'AED/' + uLabel(), num: 1, v: function (r) { return r[5]; }, f: function (r) { return fmt(ppmv(r[5])); } },
      { k: 6, h: t('type'), v: function (r) { return r[6]; }, f: function (r) { return r[6] ? '<span class="tag off">' + t('offplan') + '</span>' : '<span class="tag">' + t('ready') + '</span>'; } }
    ];
    if (withProject) cols.splice(1, 0, { k: 1, h: t('project'), wrap: 1, v: function (r) { return projNames[r[1]] || ''; }, f: function (r) { return r[1] ? '<a href="#/project/' + r[1] + '">' + esc(projNames[r[1]] || r[1]) + '</a>' : '—'; } });
    return cols;
  }

  function vTx(id) {
    Promise.all([get('meta.json'), get('projects.json')]).then(function (d) {
      var names = d[0].areas, pnames = {}; d[1].forEach(function (p) { pnames[p.id] = p.name; });
      id = id || store('pro_tx_area') || '';
      page('<h1 class="page">' + t('txH') + '</h1><p class="sub">' + t('txSub') + '</p><div class="filters">' +
        '<select id="fa"><option value="">' + t('pickArea') + '</option>' + Object.keys(names).sort(function (a, b) { return names[a] > names[b] ? 1 : -1; }).map(function (k) { return '<option value="' + k + '"' + (k === id ? ' selected' : '') + '>' + esc(names[k]) + '</option>'; }).join('') + '</select>' +
        '<input type="search" id="q" placeholder="' + t('project') + '…">' +
        '<select id="fr"><option value="">' + t('rooms') + ': ' + t('anyRooms') + '</option>' + ['S', '1', '2', '3', '4', '5+', 'PH'].map(function (k) { return '<option value="' + k + '">' + roomsLabel(k) + '</option>'; }).join('') + '</select>' +
        '<select id="ft"><option value="">' + t('anyType') + '</option><option value="1">' + t('offplan') + '</option><option value="0">' + t('ready') + '</option></select>' +
        '<input type="number" id="p1" placeholder="' + t('priceFrom') + '" style="width:130px"><input type="number" id="p2" placeholder="' + t('priceTo') + '" style="width:130px">' +
        '<input type="month" id="d1" title="' + t('from') + '"><input type="month" id="d2" title="' + t('to') + '">' +
        '<button class="chip" id="csv" type="button">' + t('export') + '</button></div><div class="kpis" id="sum"></div><div id="tbl"></div>');
      var rows = [], filtered = [], tb = null;
      function load() {
        var a = $('#fa').value;
        if (!a) { $('#tbl').innerHTML = '<div class="empty">' + t('pickArea') + '</div>'; $('#sum').innerHTML = ''; return; }
        store('pro_tx_area', a);
        $('#tbl').innerHTML = '<div class="loading">' + t('loading') + '</div>';
        get('t/' + a + '.json').then(function (r) { rows = r; apply(); }).catch(function () { rows = []; apply(); });
      }
      function apply() {
        var q = $('#q').value.toLowerCase(), fr = $('#fr').value, ft = $('#ft').value, p1 = +$('#p1').value || 0, p2 = +$('#p2').value || Infinity, d1 = $('#d1').value, d2 = $('#d2').value;
        filtered = rows.filter(function (r) {
          if (fr && r[2] !== fr) return false;
          if (ft !== '' && String(r[6]) !== ft) return false;
          if (r[4] < p1 || r[4] > p2) return false;
          if (d1 && r[0].slice(0, 7) < d1) return false;
          if (d2 && r[0].slice(0, 7) > d2) return false;
          if (q && (pnames[r[1]] || '').toLowerCase().indexOf(q) < 0) return false;
          return true;
        });
        $('#sum').innerHTML = kpi(t('found'), fmt(filtered.length)) + kpi(t('median') + ' AED', fmt(median(filtered.map(function (r) { return r[4]; })))) +
          kpi(t('median') + ' AED/' + uLabel(), fmt(ppmv(median(filtered.map(function (r) { return r[5]; }))))) +
          kpi(t('offplan'), filtered.length ? fmt(100 * filtered.filter(function (r) { return r[6]; }).length / filtered.length) + '%' : '—');
        if (tb) tb.set(filtered); else tb = table($('#tbl'), txCols(pnames, true), filtered, { per: 50 });
      }
      $('#fa').onchange = function () { tb = null; load(); };
      ['q', 'fr', 'ft', 'p1', 'p2', 'd1', 'd2'].forEach(function (k) { $('#' + k).addEventListener(k === 'q' || k[0] === 'p' ? 'input' : 'change', apply); });
      $('#csv').onclick = function () {
        var lines = ['date,project,beds,size_' + (unit === 'm2' ? 'm2' : 'sqft') + ',price_aed,aed_per_' + (unit === 'm2' ? 'm2' : 'sqft') + ',offplan'];
        filtered.forEach(function (r) { lines.push([r[0], '"' + (pnames[r[1]] || r[1] || '').replace(/"/g, '""') + '"', r[2], Math.round(area(r[3])), r[4], Math.round(ppmv(r[5])), r[6]].join(',')); });
        var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
        a.download = 'dld-transactions-' + ($('#fa').value) + '.csv'; a.click();
      };
      load();
    });
  }

  function vProject(id) {
    page('<div class="loading">' + t('loading') + '</div>');
    Promise.all([get('p/' + id + '.json').catch(function () { return null; }), get('projects.json'), get('meta.json'), get('areas.json')]).then(function (d) {
      var p = d[0] || d[1].filter(function (x) { return x.id === id; })[0], names = d[2].areas;
      if (!p) { page('<div class="empty">' + t('none') + '</div>'); return; }
      // no rent contracts in the building yet (typical for off-plan): expected yield from the area's median rents
      var expected = false;
      if (p.rooms && (!p.rent || !Object.keys(p.rent).length)) {
        var ar = d[3].filter(function (a) { return a.id === p.area; })[0];
        if (ar && Object.keys(ar.rent).length) {
          expected = true; p.rent = ar.rent; p.yld = {};
          Object.keys(p.rooms).forEach(function (k) { if (ar.rent[k] && p.rooms[k].price) p.yld[k] = Math.round(1000 * ar.rent[k] / p.rooms[k].price) / 10; });
        }
      }
      var meta = [[t('area'), p.area ? '<a href="#/area/' + p.area + '">' + esc(names[p.area] || p.area) + '</a>' : '—'], [t('master'), esc(p.master || '—')],
        [t('developer'), p.devId ? '<a href="#/developer/' + p.devId + '">' + esc(p.dev) + '</a>' : '—'], [t('status'), statusTag(p)],
        [t('start'), esc(p.start || '—')], [t('handover'), esc(p.end || p.done || '—')], [t('units'), fmt(p.units || p.villas)], [t('escrow'), esc(p.escrow || '—')]];
      page('<div class="crumbs"><a href="#/projects">' + t('navProjects') + '</a> /</div><h1 class="page">' + esc(p.name) + '</h1>' +
        (p.ar ? '<p class="sub" dir="rtl" style="text-align:start">' + esc(p.ar) + '</p>' : '<p class="sub"></p>') +
        '<div class="kpis">' + kpi(t('sales12'), fmt(p.n12)) + kpi(t('ppm') + ' ' + uLabel(), p.ppm12 ? 'AED ' + fmt(ppmv(p.ppm12)) : '—') +
        kpi(t('off12'), p.off12 == null ? '—' : p.off12 + '%') + kpi(t('pct'), p.pct == null ? '—' : fmt(p.pct) + '%') +
        kpi(t('grossYield') + ' 1BR' + (expected ? '*' : ''), p.yld && p.yld['1'] ? fmt(p.yld['1'], 1) + '%' : '—') + kpi(t('last'), esc(p.last || '—')) + '</div>' +
        '<div class="panel"><h2>' + t('registry') + '</h2>' + (p.pct != null ? '<div class="progress"><i style="width:' + p.pct + '%"></i></div>' : '') +
        '<dl class="meta-list">' + meta.map(function (m) { return '<div><dt>' + esc(m[0]) + '</dt><dd>' + m[1] + '</dd></div>'; }).join('') + '</dl></div>' +
        (p.series ? '<div class="panel"><h2>' + t('priceHist') + '</h2><p class="hint">AED/' + uLabel() + '</p><div class="chart"><canvas id="c1"></canvas></div></div>' : '') +
        (p.rooms ? '<div class="panel"><h2>' + t('byRooms') + '</h2>' + (expected ? '<p class="hint">' + t('expectedYield') + '</p>' : '') + '<div id="rooms"></div></div>' : '') +
        (p.recent ? '<h2>' + t('recent') + '</h2><div id="tbl"></div>' : ''));
      if (p.series) {
        chart($('#c1'), { data: { labels: p.series.map(function (r) { return r[0]; }), datasets: [
          { type: 'line', label: t('price'), data: p.series.map(function (r) { return ppmv(r[2]); }), borderColor: css('--accent'), tension: .3, pointRadius: 2, yAxisID: 'y1' },
          { type: 'bar', label: t('sales'), data: p.series.map(function (r) { return r[1]; }), backgroundColor: css('--accent') + '44', yAxisID: 'y' }
        ] }, options: baseOpts({ scales: { x: { ticks: { color: css('--muted') }, grid: { color: css('--line') } }, y: { position: 'right', grid: { display: false }, ticks: { color: css('--muted') } }, y1: { position: 'left', grid: { color: css('--line') }, ticks: { color: css('--muted') } } } }) });
      }
      if (p.rooms) roomsTable($('#rooms'), p.rooms, p.rent, p.yld);
      if (p.recent) table($('#tbl'), [
        { k: 0, h: t('date'), f: function (r) { return esc(r[0]); } }, { k: 1, h: t('rooms'), f: function (r) { return roomsLabel(r[1]); } },
        { k: 2, h: t('size') + ', ' + uLabel(), num: 1, v: function (r) { return r[2]; }, f: function (r) { return fmt(area(r[2])); } },
        { k: 3, h: t('priceTotal') + ', AED', num: 1, v: function (r) { return r[3]; }, f: function (r) { return fmt(r[3]); } },
        { k: 4, h: 'AED/' + uLabel(), num: 1, v: function (r) { return r[4]; }, f: function (r) { return fmt(ppmv(r[4])); } },
        { k: 5, h: t('type'), v: function (r) { return r[5]; }, f: function (r) { return r[5] ? '<span class="tag off">' + t('offplan') + '</span>' : '<span class="tag">' + t('ready') + '</span>'; } }
      ], p.recent, { per: 25 });
    });
  }

  function devCols() {
    return [
      { k: 'name', h: t('developer'), wrap: 1, f: function (d) { return '<a href="#/developer/' + d.id + '">' + esc(d.name) + '</a>'; } },
      { k: 'projects', h: t('projects'), num: 1 }, { k: 'finished', h: t('finished'), num: 1 }, { k: 'active', h: t('active'), num: 1 },
      { k: 'overdue', h: t('overdue'), num: 1, f: function (d) { return d.overdue ? '<span class="down">' + d.overdue + '</span> <small>(' + Math.round(100 * d.overdue / Math.max(d.active, 1)) + '%)</small>' : '0'; } },
      { k: 'pct', h: t('avgPct'), num: 1, f: function (d) { return d.pct == null ? '—' : fmt(d.pct) + '%'; } },
      { k: 'units', h: t('units'), num: 1, f: function (d) { return fmt(d.units); } },
      { k: 'n12', h: t('sales12'), num: 1, f: function (d) { return fmt(d.n12); } },
      { k: 'ppm12', h: 'AED/' + uLabel(), num: 1, f: function (d) { return fmt(ppmv(d.ppm12)); } }
    ];
  }

  function vDevelopers() {
    get('developers.json').then(function (devs) {
      page('<h1 class="page">' + t('devsH') + '</h1><p class="sub">' + t('devsSub') + '</p><div class="filters"><input type="search" id="q" placeholder="' + t('search') + '"></div><div id="tbl"></div>');
      var tb = table($('#tbl'), devCols(), devs, { sort: 'n12', per: 50 });
      $('#q').oninput = function () { var q = this.value.toLowerCase(); tb.set(devs.filter(function (d) { return (d.name || '').toLowerCase().indexOf(q) >= 0; })); };
    });
  }

  function vDeveloper(id) {
    Promise.all([get('developers.json'), get('projects.json'), get('meta.json')]).then(function (d) {
      var dev = d[0].filter(function (x) { return x.id === id; })[0];
      if (!dev) { page('<div class="empty">' + t('none') + '</div>'); return; }
      var projs = d[1].filter(function (p) { return p.devId === id; });
      page('<div class="crumbs"><a href="#/developers">' + t('navDevs') + '</a> /</div><h1 class="page">' + esc(dev.name) + '</h1><p class="sub">' + t('devsSub') + '</p><div class="kpis">' +
        kpi(t('projects'), fmt(dev.projects)) + kpi(t('finished'), fmt(dev.finished)) + kpi(t('active'), fmt(dev.active)) +
        kpi(t('overdue'), fmt(dev.overdue), dev.active ? ' <i class="' + (dev.overdue ? 'down' : 'up') + '">' + Math.round(100 * dev.overdue / dev.active) + '%</i>' : '') +
        kpi(t('avgPct'), dev.pct == null ? '—' : fmt(dev.pct) + '%') + kpi(t('sales12'), fmt(dev.n12)) + '</div><h2>' + t('devProjects') + '</h2><div id="tbl"></div>');
      table($('#tbl'), projCols(d[2].areas), projs, { sort: 'n12', per: 50 });
    });
  }

  // ------------------------------------------------------------------ router & chrome
  function route() {
    var h = location.hash.replace(/^#\/?/, '').split('/');
    var r = h[0] || 'market';
    document.querySelectorAll('#tabs a').forEach(function (a) {
      var map = { area: 'areas', project: 'projects', developer: 'developers' };
      a.classList.toggle('on', a.dataset.route === (map[r] || r));
    });
    ({ market: vMarket, areas: vAreas, area: function () { vArea(h[1]); }, projects: vProjects, project: function () { vProject(h[1]); },
       tx: function () { vTx(h[1]); }, developers: vDevelopers, developer: function () { vDeveloper(h[1]); } }[r] || vMarket)();
  }
  function chrome() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = t(el.dataset.t); });
    $('#lang-btn').textContent = lang === 'ru' ? 'EN' : 'RU';
    $('#unit-btn').textContent = unit === 'm2' ? (lang === 'ru' ? 'м² → sq ft' : 'm² → sq ft') : (lang === 'ru' ? 'sq ft → м²' : 'sq ft → m²');
    get('meta.json').then(function (m) {
      $('#foot').textContent = t('source').replace('{tx}', m.tx_date).replace('{rent}', m.rent_date).replace('{rs}', m.rent_sample).replace('{reg}', m.registry_date);
    });
  }
  function start() {
    $('#gate').hidden = true; $('#app').hidden = false;
    chrome(); route();
    window.addEventListener('hashchange', route);
    $('#lang-btn').onclick = function () { lang = lang === 'ru' ? 'en' : 'ru'; store('pro_lang', lang); chrome(); route(); };
    $('#unit-btn').onclick = function () { unit = unit === 'm2' ? 'sqft' : 'm2'; store('pro_unit', unit); chrome(); route(); };
    $('#theme-btn').onclick = function () {
      var th = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', th); store('pe_theme', th); route();
    };
  }
  function sha256(s) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  }
  // gate (prototype access control; real auth moves to app.promptestates.com with subscriptions)
  if (store('pro_ok') === PASS_HASH) { start(); return; }
  $('#gate').hidden = false;
  document.querySelectorAll('#gate [data-t]').forEach(function (el) { el.textContent = t(el.dataset.t); });
  $('#gate-form').onsubmit = function (e) {
    e.preventDefault();
    sha256($('#gate-pass').value.trim()).then(function (h) {
      if (h === PASS_HASH) { store('pro_ok', h); start(); } else { $('#gate-err').hidden = false; }
    });
  };
})();
