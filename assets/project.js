/* Project page v2: "all photos" opens the gallery lightbox, unit-type switch for the return estimate, active section in the nav. */
(function () {
  'use strict';
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
})();
