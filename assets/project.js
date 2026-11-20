/* Project page v2: "all photos" opens the gallery lightbox, unit-type switch for the return estimate, active section in the nav. */
(function () {
  'use strict';
  /* the section nav sticks right under the pinned breadcrumbs row, whatever height that row has on this screen */
  var crow = document.querySelector('.crumbs-row');
  if (crow) {
    var setH = function () { document.documentElement.style.setProperty('--crh', crow.offsetHeight + 'px'); };
    setH(); addEventListener('resize', setH);
  }
  var m = document.querySelector('.pj-mosaic');
  if (m) {
    var all = m.querySelector('.pm-all');
    if (all) all.addEventListener('click', function () {
      var imgs = m.querySelectorAll('img'), i = Math.min(+all.dataset.n || 0, imgs.length - 1);
      if (imgs[i]) imgs[i].click();
    });
  }

  var ret = document.querySelector('.pj-ret'), types = document.querySelector('.pj-types');
  if (ret && types) {
    var data = {};
    try { data = JSON.parse(ret.getAttribute('data-types') || '{}'); } catch (e) { data = {}; }
    var cum = document.querySelector('.pj-cum');
    types.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-t]');
      if (!b || !data[b.dataset.t]) return;
      var d = data[b.dataset.t];
      types.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      ['yld', 'rent', 'inc'].forEach(function (k) { var el = ret.querySelector('[data-k="' + k + '"]'); if (el) el.textContent = d[k]; });
      if (cum) cum.querySelectorAll('.rb').forEach(function (row, i) {
        var bar = row.querySelector('i'), val = row.querySelector('b');
        if (bar) bar.style.width = d.w[i] + '%';
        if (val) val.textContent = d.bars[i];
      });
    });
  }

  // photos by category (all images stay in one gallery for the lightbox)
  var cats = document.querySelector('.pj-cats'), pg = document.querySelector('.pj-pgrid');
  if (cats && pg) cats.addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-cat]');
    if (!b) return;
    cats.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    pg.querySelectorAll('img').forEach(function (im) { im.classList.toggle('off', im.dataset.cat !== b.dataset.cat); });
  });
  if (pg) pg.querySelectorAll('img').forEach(function (im) { im.classList.toggle('off', im.dataset.cat !== 'Project'); });

  // payment schedule for the chosen unit type
  var sw = document.querySelector('.pj-paysw .pj-types');
  if (sw) {
    var pay = {};
    try { pay = JSON.parse(sw.getAttribute('data-pay') || '{}'); } catch (e) { pay = {}; }
    var sec = document.getElementById('pj-plan');
    sw.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-t]');
      if (!b || !pay[b.dataset.t]) return;
      var d = pay[b.dataset.t];
      sw.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      d.rows.forEach(function (v, i) { var el = sec.querySelector('[data-k="r' + i + '"]'); if (el) el.textContent = v; });
      ['price', 'dld', 'total'].forEach(function (k) { var el = sec.querySelector('[data-k="' + k + '"]'); if (el) el.textContent = d[k]; });
    });
  }

  var nav = document.querySelector('.pj-nav');
  if (nav && 'IntersectionObserver' in window) {
    var links = {}, secs = [];
    nav.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var s = document.getElementById(a.getAttribute('href').slice(1));
      if (s) { links[s.id] = a; secs.push(s); }
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        Object.keys(links).forEach(function (k) { links[k].classList.toggle('on', k === en.target.id); });
        var a = links[en.target.id];
        if (a && a.scrollIntoView && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: a.offsetLeft - 20, behavior: 'smooth' });
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    secs.forEach(function (s) { io.observe(s); });
  }
  /* Project map: MapLibre + OpenFreeMap, loaded when the map scrolls near; place names in the page language
     (OpenMapTiles name:xx), falling back to English / Latin, so Emirates maps are not Arabic-only. */
  var pm = document.querySelector('.pj-map[data-ll]');
  if (pm && 'IntersectionObserver' in window) {
    var STY = { light: 'https://tiles.openfreemap.org/styles/positron', dark: 'https://tiles.openfreemap.org/styles/dark' };
    var theme = function () { return document.documentElement.getAttribute('data-theme') === 'light' ? STY.light : STY.dark; };
    var lang = (pm.getAttribute('data-lang') || 'en').slice(0, 2);
    var label = lang === 'ar' ? ['coalesce', ['get', 'name:ar'], ['get', 'name']]
      : ['coalesce', ['get', 'name:' + lang], ['get', 'name_en'], ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']];
    // the "use Ctrl + scroll" hint in the page language
    var HINT = {
      en: ['Use Ctrl + scroll to zoom the map', 'Use ⌘ + scroll to zoom the map', 'Use two fingers to move the map'],
      ru: ['Чтобы изменить масштаб, прокручивайте с Ctrl', 'Чтобы изменить масштаб, прокручивайте с ⌘', 'Двигайте карту двумя пальцами'],
      ar: ['استخدم Ctrl مع التمرير لتكبير الخريطة', 'استخدم ⌘ مع التمرير لتكبير الخريطة', 'استخدم إصبعين لتحريك الخريطة'],
      de: ['Strg + Scrollen zum Zoomen der Karte', '⌘ + Scrollen zum Zoomen der Karte', 'Karte mit zwei Fingern bewegen'],
      fr: ['Ctrl + molette pour zoomer sur la carte', '⌘ + molette pour zoomer sur la carte', 'Utilisez deux doigts pour déplacer la carte'],
      it: ['Usa Ctrl + scorrimento per ingrandire la mappa', 'Usa ⌘ + scorrimento per ingrandire la mappa', 'Usa due dita per spostare la mappa'],
      tr: ['Haritayı yakınlaştırmak için Ctrl + kaydırma kullanın', 'Haritayı yakınlaştırmak için ⌘ + kaydırma kullanın', 'Haritayı iki parmakla kaydırın'],
      hi: ['मैप ज़ूम करने के लिए Ctrl दबाकर स्क्रॉल करें', 'मैप ज़ूम करने के लिए ⌘ दबाकर स्क्रॉल करें', 'मैप को दो उंगलियों से खिसकाएँ'],
      ur: ['نقشہ زوم کرنے کے لیے Ctrl کے ساتھ اسکرول کریں', 'نقشہ زوم کرنے کے لیے ⌘ کے ساتھ اسکرول کریں', 'نقشہ دو انگلیوں سے ہلائیں'],
      fa: ['برای بزرگ‌نمایی نقشه، Ctrl را نگه دارید و اسکرول کنید', 'برای بزرگ‌نمایی نقشه، ⌘ را نگه دارید و اسکرول کنید', 'نقشه را با دو انگشت جابه‌جا کنید'],
      zh: ['按住 Ctrl 并滚动以缩放地图', '按住 ⌘ 并滚动以缩放地图', '用两根手指移动地图']
    };
    var start = function () {
      var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/assets/vendor/maplibre-gl.css'; document.head.appendChild(css);
      var sc = document.createElement('script'); sc.src = '/assets/vendor/maplibre-gl.js';
      sc.onload = function () {
        if (!window.maplibregl) return;
        var ll = pm.getAttribute('data-ll').split(',').map(Number), map;
        try {
          var H = HINT[lang] || HINT.en;
          map = new maplibregl.Map({ container: pm, style: theme(), center: ll, zoom: pm.hasAttribute('data-area') ? 12.5 : 13.5, attributionControl: { compact: true }, cooperativeGestures: true,
            locale: { 'CooperativeGesturesHandler.WindowsHelpText': H[0], 'CooperativeGesturesHandler.MacHelpText': H[1], 'CooperativeGesturesHandler.MobileHelpText': H[2] } });
        } catch (e) { return; }
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
        var pin = document.createElement('div'); pin.className = 'pj-pin';
        if (!pm.hasAttribute('data-area')) new maplibregl.Marker({ element: pin, anchor: 'bottom' }).setLngLat(ll).addTo(map);
        map.on('style.load', function () {
          (map.getStyle().layers || []).forEach(function (l) {
            if (l.type === 'symbol' && l.layout && l.layout['text-field']) { try { map.setLayoutProperty(l.id, 'text-field', label); } catch (e) {} }
          });
          pm.classList.add('is-live');
        });
        document.querySelectorAll('.theme-toggle').forEach(function (tg) { tg.addEventListener('click', function () { setTimeout(function () { map.setStyle(theme()); }, 50); }); });
      };
      document.head.appendChild(sc);
    };
    var mo = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { mo.disconnect(); start(); } }, { rootMargin: '300px' });
    mo.observe(pm);
  }
})();
