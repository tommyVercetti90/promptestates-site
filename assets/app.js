(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cfg = window.PE_CONFIG || {};

  /* Remember a manual language choice (auto-detect runs only on the first visit) */
  document.querySelectorAll('.lang-menu a[data-lang]').forEach(function (a) {
    a.addEventListener('click', function () {
      try { localStorage.setItem('pe_lang', a.getAttribute('data-lang')); } catch (_) {}
    });
  });
  /* language menu: close on outside click or Escape */
  document.addEventListener('click', function (ev) {
    document.querySelectorAll('.lang-dd[open]').forEach(function (d) { if (!d.contains(ev.target)) d.open = false; });
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') document.querySelectorAll('.lang-dd[open]').forEach(function (d) { d.open = false; });
  });

  /* Theme toggle (initial theme is set inline in <head> to avoid a flash) */
  document.querySelectorAll('.theme-toggle').forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.classList.add('theming');
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('pe_theme', next); } catch (_) {}
      setTimeout(function () { root.classList.remove('theming'); }, 400);
    });
  });

  /* "Back" on guide pages: return to wherever the visitor came from on this site (keeps their scroll position),
     otherwise follow the link to the parent page */
  document.querySelectorAll('[data-back]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      var ref = document.referrer;
      if (ref && ref.indexOf(location.origin) === 0 && ref !== location.href && history.length > 1) {
        ev.preventDefault();
        history.back();
      }
    });
  });

  /* header height for the pinned back button; direction of the page transition when going back */
  var hdr = document.querySelector('.header');
  var setHdr = function () { if (hdr) root.style.setProperty('--hdr', hdr.offsetHeight + 'px'); };
  setHdr(); window.addEventListener('resize', setHdr);
  window.addEventListener('pagereveal', function (e) {
    try {
      if (e.viewTransition && window.navigation && navigation.activation && navigation.activation.navigationType === 'traverse') e.viewTransition.types.add('back');
    } catch (_) {}
  });
  window.addEventListener('pageswap', function (e) {
    try {
      if (e.viewTransition && e.activation && e.activation.navigationType === 'traverse') e.viewTransition.types.add('back');
    } catch (_) {}
  });

  /* Mobile menu */
  var burger = document.querySelector('.burger');
  var mnav = document.getElementById('mnav');
  if (burger && mnav) {
    var openLabel = burger.getAttribute('aria-label');
    var setMenu = function (open) {
      mnav.hidden = !open;
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? burger.getAttribute('data-label-close') : openLabel);
      root.classList.toggle('menu-open', open);
    };
    burger.addEventListener('click', function () { setMenu(mnav.hidden); });
    mnav.addEventListener('click', function (ev) { if (ev.target.closest('a, [data-quiz-open]')) setMenu(false); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !mnav.hidden) { setMenu(false); burger.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 1024 && !mnav.hidden) setMenu(false); });
  }

  /* Scroll reveal: .reveal elements fade in; charts inside them draw when revealed */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* Demo: typed AI query, then results */
  var demo = document.querySelector('.demo');
  if (demo) {
    var out = demo.querySelector('.q-text');
    var query = out.textContent;
    if (reduced) {
      demo.setAttribute('data-phase', 'done');
    } else {
      out.textContent = '';
      demo.setAttribute('data-phase', 'typing');
      var i = 0;
      var tick = function () {
        i++;
        out.textContent = query.slice(0, i);
        if (i < query.length) {
          setTimeout(tick, 16 + Math.random() * 20);
        } else {
          demo.setAttribute('data-phase', 'thinking');
          setTimeout(function () { demo.setAttribute('data-phase', 'done'); }, 700);
        }
      };
      setTimeout(tick, 500);
    }
  }


  /* Live map (MapLibre GL): loads only when the map window scrolls into view */
  var mapBox = document.querySelector('.live-map');
  if (mapBox && cfg.map && 'IntersectionObserver' in window) {
    var styleFor = function () { return root.getAttribute('data-theme') === 'light' ? cfg.map.light : cfg.map.dark; };
    var startMap = function () {
      var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/assets/vendor/maplibre-gl.css';
      document.head.appendChild(css);
      var sc = document.createElement('script'); sc.src = '/assets/vendor/maplibre-gl.js';
      sc.onload = function () {
        if (!window.maplibregl) return;
        var pts = JSON.parse(mapBox.getAttribute('data-points') || '[]');
        var more = mapBox.getAttribute('data-more') || '';
        var holder = mapBox.querySelector('.map-canvas');
        var map;
        try {
          map = new maplibregl.Map({ container: holder, style: styleFor(), center: [55.235, 25.135], zoom: 9.6,
            attributionControl: { compact: true }, cooperativeGestures: true });
        } catch (e) { return; }
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
        var bounds = new maplibregl.LngLatBounds();
        pts.forEach(function (p, i) {
          var el = document.createElement('button');
          el.type = 'button'; el.className = 'mk' + (i === 0 ? ' active' : ''); el.textContent = p.n;
          var html = '<b>' + p.n + '</b>' + (p.u ? '<a href="' + p.u + '">' + more + ' →</a>' : '');
          el.addEventListener('click', function () {
            holder.querySelectorAll('.mk').forEach(function (x) { x.classList.toggle('active', x === el); });
          });
          new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(p.c)
            .setPopup(new maplibregl.Popup({ offset: 18, closeButton: false }).setHTML(html)).addTo(map);
          bounds.extend(p.c);
        });
        map.once('load', function () {
          mapBox.classList.add('is-live');
          map.fitBounds(bounds, { padding: { top: 56, bottom: 44, left: 70, right: 130 }, duration: 0 });
          var at = mapBox.querySelector('.maplibregl-ctrl-attrib'); if (at) at.classList.remove('maplibregl-compact-show');
        });
        document.querySelectorAll('.theme-toggle').forEach(function (tg) { tg.addEventListener('click', function () { setTimeout(function () { map.setStyle(styleFor()); }, 50); }); });
      };
      document.head.appendChild(sc);
    };
    var mio = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { mio.disconnect(); startMap(); }
    }, { rootMargin: '400px' });
    mio.observe(mapBox);
  }

  /* Favourite toggles in demo cards */
  document.querySelectorAll('.fav').forEach(function (b) {
    b.addEventListener('click', function () {
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    });
  });

  /* Countdown */
  var cd = document.querySelector('.countdown');
  if (cd) {
    var target = Date.parse(cd.getAttribute('data-launch'));
    var cells = cd.querySelectorAll('b');
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var render = function () {
      var d = isNaN(target) ? 0 : Math.max(0, target - Date.now());
      cells[0].textContent = pad(Math.floor(d / 864e5));
      cells[1].textContent = pad(Math.floor(d / 36e5) % 24);
      cells[2].textContent = pad(Math.floor(d / 6e4) % 60);
      cells[3].textContent = pad(Math.floor(d / 1e3) % 60);
    };
    render();
    setInterval(render, 1000);
  }

  /* ---------- funnel helpers ---------- */
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  window.dataLayer = window.dataLayer || [];
  /* A/B variants come from the inline <head> script (window.PE_EXP), e.g. "hero:a,cta:b,contact:a" */
  var EXP = window.PE_EXP || {};
  var expStr = Object.keys(EXP).map(function (k) { return k + ':' + EXP[k]; }).join(',');
  var track = function (name, params) {
    params = Object.assign({}, params || {});
    if (expStr) params.exp = expStr;
    window.dataLayer.push(Object.assign({ event: name }, params));
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
    if (typeof window.ym === 'function' && cfg.metrika) window.ym(cfg.metrika, 'reachGoal', name, params);
    if (typeof window.clarity === 'function') {
      window.clarity('event', name);
      /* keep the sessions of people who reached the funnel's key steps */
      if (name === 'sign_up' || name === 'quiz_complete' || name === 'plan_reserve') window.clarity('upgrade', name);
      Object.keys(params).forEach(function (k) { if (typeof params[k] === 'string') window.clarity('set', name + '_' + k, params[k]); });
    }
    if (window.posthog && typeof window.posthog.capture === 'function') window.posthog.capture(name, params);
  };
  /* tell every analytics tool which variants this visitor sees, so reports can be split by them */
  if (expStr) {
    var expProps = {};
    Object.keys(EXP).forEach(function (k) { expProps['exp_' + k] = EXP[k]; });
    if (typeof window.gtag === 'function') window.gtag('set', 'user_properties', expProps);
    if (typeof window.clarity === 'function') Object.keys(EXP).forEach(function (k) { window.clarity('set', 'exp_' + k, EXP[k]); });
    if (window.posthog && window.posthog.register) window.posthog.register(expProps);
    track('experiment_view', {});
    /* variant B of the contact test also changes the field's placeholder */
    var qc = document.getElementById('q-contact');
    if (qc && EXP.contact === 'b' && qc.getAttribute('data-ph-b')) qc.placeholder = qc.getAttribute('data-ph-b');
  }

  /* Cookie banner: OK keeps analytics on; Decline switches GA to denied, stops Clarity and PostHog */
  var ck = document.querySelector('[data-ck]');
  var ckChoice = (function () { try { return localStorage.getItem('pe_consent'); } catch (_) { return null; } })();
  if (ck && !ckChoice) { ck.hidden = false; root.classList.add('ck-open'); }
  var ckSet = function (v) {
    try { localStorage.setItem('pe_consent', v); } catch (_) {}
    if (ck) ck.hidden = true;
    root.classList.remove('ck-open');
    if (v === 'denied') {
      if (typeof window.gtag === 'function') window.gtag('consent', 'update', { analytics_storage: 'denied' });
      if (typeof window.clarity === 'function') window.clarity('consent', false);
      if (window.posthog && window.posthog.opt_out_capturing) window.posthog.opt_out_capturing();
    } else if (typeof window.clarity === 'function') {
      window.clarity('consent');
    }
  };
  if (ck) {
    ck.querySelector('[data-ck-ok]').addEventListener('click', function () { ckSet('granted'); });
    ck.querySelector('[data-ck-no]').addEventListener('click', function () { ckSet('denied'); });
  }
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
  };
  /* referral: ?ref=CODE from the URL is remembered; every visitor gets an own code for sharing */
  var refIn = (location.search.match(/[?&]ref=([A-Za-z0-9]{4,12})/) || [])[1];
  if (refIn && !store.get('pe_ref_in')) store.set('pe_ref_in', refIn);
  var myRef = store.get('pe_ref');
  if (!myRef) { myRef = Math.random().toString(36).slice(2, 9); store.set('pe_ref', myRef); }
  var quizEl = document.getElementById('quiz');
  var autoText = quizEl ? quizEl.getAttribute('data-auto') : '';
  var post = function (url, payload) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json().catch(function () { return {}; });
    }).then(function (data) {
      if (data && String(data.success) === 'false') throw new Error(data.message || 'rejected');
    });
  };
  /* FormSubmit e-mails the lead to the inbox; the Brevo worker adds the contact to the list that runs the e-mail sequence.
     The lead counts as sent when at least one of them accepted it. */
  /* FormSubmit e-mails fields as a plain table, so give them readable names and drop the empty ones */
  var LABELS = { contact: 'Контакт', goal: 'Цель', budget: 'Бюджет', area: 'Район', plan: 'Тариф', calc: 'Калькулятор',
                 source: 'Источник', lang: 'Язык', page: 'Страница', ref_code: 'Реф. код', ref_from: 'Пригласил (код)', exp: 'A/B варианты' };
  var SOURCES = { quiz: 'Квиз', form: 'Форма' };
  var PLANS = { search: 'Поиск · 3 мес', investor: 'Инвестор · 12 мес', founder: 'Основатель' };
  var forInbox = function (d) {
    var out = { email: d.email };
    Object.keys(LABELS).forEach(function (k) {
      var v = k === 'source' ? SOURCES[d[k]] || d[k] : k === 'plan' ? PLANS[d[k]] || d[k] : d[k];
      if (v) out[LABELS[k]] = v;
    });
    var tag = d.plan ? 'Тариф ' + (PLANS[d.plan] || d.plan) : SOURCES[d.source] || 'Заявка';
    out._subject = '🔥 Новая заявка — ' + tag + (d.area ? ' · ' + d.area : '') + ' · PromptEstates';
    out._template = 'table';
    out._captcha = 'false';
    if (autoText) out._autoresponse = autoText;
    return out;
  };
  /* With the Brevo worker configured it adds the contact, starts the e-mail sequence and sends a branded
     notification; FormSubmit is then only a fallback if the worker is unreachable. */
  var sendLead = function (fields) {
    var d = Object.assign({ lang: root.lang, page: location.pathname, ref_from: store.get('pe_ref_in') || '', ref_code: myRef, exp: expStr }, fields);
    if (cfg.brevo) {
      return post(cfg.brevo, d).catch(function (err) {
        if (cfg.endpoint) return post(cfg.endpoint, forInbox(d));
        throw err;
      });
    }
    if (cfg.endpoint) return post(cfg.endpoint, forInbox(d));
    console.warn('PE_CONFIG has no endpoints — lead was not sent anywhere.', d);
    return Promise.resolve();
  };
  var markDone = function (email) {
    document.querySelectorAll('.form-wrap').forEach(function (w) {
      w.classList.add('is-done');
      var e = w.querySelector('.success-email');
      if (e) e.textContent = email;
    });
    store.set('pe_waitlist', '1');
  };

  /* ---------- plain e-mail forms ---------- */
  document.querySelectorAll('.form-wrap').forEach(function (wrap) {
    var form = wrap.querySelector('form');
    var note = wrap.querySelector('.form-note');
    var input = form.querySelector('input[type="email"]');
    var btn = form.querySelector('button');
    input.addEventListener('input', function () { note.classList.remove('err'); note.textContent = ''; });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var email = input.value.trim();
      if (!emailRe.test(email)) {
        note.classList.add('err'); note.textContent = note.getAttribute('data-err'); input.focus(); return;
      }
      if (form._honey && form._honey.value) return;
      btn.disabled = true;
      sendLead({ email: email, source: 'form' }).then(function () {
        markDone(email); track('sign_up', { method: 'form' });
      }).catch(function () {
        note.classList.add('err'); note.textContent = note.getAttribute('data-fail');
      }).then(function () { btn.disabled = false; });
    });
  });

  /* "or just leave your e-mail" toggle in the hero */
  document.querySelectorAll('[data-toggle-form]').forEach(function (b) {
    b.addEventListener('click', function () {
      var box = b.closest('[data-cta-wrap], .hero-actions').querySelector('.quick-form');
      box.hidden = !box.hidden;
      b.setAttribute('aria-expanded', String(!box.hidden));
      if (!box.hidden) { var i = box.querySelector('input[type="email"]'); if (i) i.focus(); }
    });
  });

  /* ---------- quiz ---------- */
  if (quizEl && typeof quizEl.showModal === 'function') {
    var steps = [].slice.call(quizEl.querySelectorAll('.qstep'));
    var total = steps.length - 1; /* last one is the "done" screen */
    var answers = {};
    var cur = 0;
    var prog = quizEl.querySelector('.qprog i');
    var curLabel = quizEl.querySelector('[data-cur]');
    var backBtn = quizEl.querySelector('[data-back]');
    var show = function (i) {
      cur = i;
      steps.forEach(function (s, k) { s.hidden = k !== i; });
      var isDone = i >= total;
      prog.style.width = (isDone ? 100 : ((i + 1) / total) * 100) + '%';
      curLabel.textContent = Math.min(i + 1, total);
      backBtn.hidden = i === 0 || isDone;
      var f = steps[i].querySelector('.qopt, input');
      if (f) setTimeout(function () { f.focus(); }, 30);
    };
    var planLine = quizEl.querySelector('.qplan');
    var open = function (src, planBtn) {
      if (planBtn) {
        store.set('pe_plan', planBtn.getAttribute('data-plan'));
        planLine.querySelector('[data-plan-out]').textContent = planBtn.getAttribute('data-plan-label');
        planLine.hidden = false;
        track('plan_reserve', { plan: planBtn.getAttribute('data-plan') });
      } else if (planLine) { planLine.hidden = true; }
      if (!quizEl.open) { quizEl.showModal(); }
      if (cur >= total) return;
      show(0);
      track('quiz_start', { from: src || 'button' });
    };
    document.querySelectorAll('[data-quiz-open]').forEach(function (b) {
      b.addEventListener('click', function (ev) {
        ev.preventDefault();
        var src = b.hasAttribute('data-plan') ? 'pricing' : b.closest('.tabbar') ? 'tabbar' : b.closest('.calc') ? 'calc' : b.closest('header') ? 'header' : 'cta';
        open(src, b.hasAttribute('data-plan') ? b : null);
      });
    });
    if (location.hash === '#quiz') open('link');
    quizEl.querySelector('[data-close]').addEventListener('click', function () { quizEl.close(); });
    quizEl.addEventListener('click', function (ev) { if (ev.target === quizEl) quizEl.close(); });
    backBtn.addEventListener('click', function () { if (cur > 0) show(cur - 1); });
    steps.forEach(function (s, i) {
      s.querySelectorAll('.qopt').forEach(function (o) {
        o.addEventListener('click', function () {
          s.querySelectorAll('.qopt').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          o.setAttribute('aria-pressed', 'true');
          answers[s.getAttribute('data-key')] = o.getAttribute('data-val');
          track('quiz_step', { step: i + 1, key: s.getAttribute('data-key') });
          setTimeout(function () { show(i + 1); }, 160);
        });
      });
    });
    var qform = quizEl.querySelector('.qform');
    qform.email.addEventListener('input', function () { var n = qform.querySelector('.form-note'); n.classList.remove('err'); n.textContent = ''; });
    qform.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var note = qform.querySelector('.form-note');
      var email = qform.email.value.trim();
      if (!emailRe.test(email)) { note.classList.add('err'); note.textContent = note.getAttribute('data-err'); qform.email.focus(); return; }
      if (qform._honey && qform._honey.value) return;
      var btn = qform.querySelector('button[type="submit"]');
      btn.disabled = true; note.textContent = '';
      var summary = [answers.goal, answers.budget, answers.area].filter(Boolean).join(' · ');
      sendLead({ email: email, contact: qform.contact.value.trim(), goal: answers.goal || '', budget: answers.budget || '',
                 area: answers.area || '', calc: store.get('pe_calc') || '', plan: store.get('pe_plan') || '', source: 'quiz' })
        .then(function () {
          quizEl.querySelector('.q-email-out').textContent = email;
          quizEl.querySelector('.q-summary-out').textContent = summary;
          var link = location.origin + location.pathname + '?ref=' + myRef;
          quizEl.querySelector('.q-ref-link').value = link;
          var msg = quizEl.getAttribute('data-msg') + ' ' + link;
          quizEl.querySelector('[data-share="tg"]').href = 'https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(quizEl.getAttribute('data-msg'));
          quizEl.querySelector('[data-share="wa"]').href = 'https://wa.me/?text=' + encodeURIComponent(msg);
          markDone(email);
          show(total);
          track('quiz_complete', { goal: answers.goal, budget: answers.budget, area: answers.area });
          track('sign_up', { method: 'quiz' });
        })
        .catch(function () { note.classList.add('err'); note.textContent = note.getAttribute('data-fail'); })
        .then(function () { btn.disabled = false; });
    });
    var copyBtn = quizEl.querySelector('[data-copy]');
    copyBtn.addEventListener('click', function () {
      var inp = quizEl.querySelector('.q-ref-link');
      var ok = function () { copyBtn.textContent = copyBtn.getAttribute('data-done'); track('share', { channel: 'copy' }); };
      if (navigator.clipboard) navigator.clipboard.writeText(inp.value).then(ok, function () { inp.select(); document.execCommand('copy'); ok(); });
      else { inp.select(); document.execCommand('copy'); ok(); }
    });
    quizEl.querySelectorAll('[data-share]').forEach(function (a) {
      a.addEventListener('click', function () { track('share', { channel: a.getAttribute('data-share') }); });
    });
  }

  /* ---------- pricing: plans with a payment link ---------- */
  document.querySelectorAll('a[data-plan]:not([data-quiz-open])').forEach(function (a) {
    try { /* Stripe Payment Links keep the referral code for attribution */
      var u = new URL(a.href);
      if (/stripe\.com$/.test(u.hostname)) { u.searchParams.set('client_reference_id', myRef); a.href = u.toString(); }
    } catch (_) {}
    a.addEventListener('click', function () { track('begin_checkout', { plan: a.getAttribute('data-plan') }); });
  });

  /* ---------- PDF report showcase: cycling 3D deck with cursor tilt ---------- */
  document.querySelectorAll('[data-rx]').forEach(function (rx) {
    var pages = [].slice.call(rx.querySelectorAll('.rx-page'));
    var tabs = [].slice.call(rx.querySelectorAll('.rx-tab'));
    var deck = rx.querySelector('.rx-deck');
    var n = pages.length, cur = 0, timer = null;
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var go = function (i) {
      cur = (i + n) % n;
      pages.forEach(function (p, k) { p.setAttribute('data-pos', String((k - cur + n) % n)); });
      tabs.forEach(function (t, k) {
        t.setAttribute('aria-pressed', String(k === cur));
      });
      /* keep the active tab visible in the swipeable row on phones (scrolls the row only, not the page) */
      var row = tabs[cur] && tabs[cur].parentElement;
      if (row && row.scrollWidth > row.clientWidth) {
        row.scrollTo({ left: tabs[cur].offsetLeft - (row.clientWidth - tabs[cur].offsetWidth) / 2, behavior: 'smooth' });
      }
    };
    var play = function () {
      clearInterval(timer);
      if (!still) timer = setInterval(function () { if (!rx.classList.contains('paused')) go(cur + 1); }, 3600);
    };
    go(0);
    tabs.forEach(function (t, k) { t.addEventListener('click', function () { go(k); play(); track('report_tab', { tab: k }); }); });
    pages.forEach(function (p, k) { p.addEventListener('click', function () { if (k !== cur) { go(k); play(); } }); });
    rx.addEventListener('mouseenter', function () { rx.classList.add('paused'); });
    rx.addEventListener('mouseleave', function () { rx.classList.remove('paused'); deck.style.setProperty('--tx', '0deg'); deck.style.setProperty('--ty', '0deg'); });
    if (!still && window.matchMedia('(hover: hover)').matches) {
      rx.addEventListener('mousemove', function (ev) {
        var b = rx.getBoundingClientRect();
        var x = (ev.clientX - b.left) / b.width - 0.5, y = (ev.clientY - b.top) / b.height - 0.5;
        deck.style.setProperty('--ty', (x * 14).toFixed(2) + 'deg');
        deck.style.setProperty('--tx', (-y * 10).toFixed(2) + 'deg');
      });
    }
    /* start cycling only once the block is on screen */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) play(); else clearInterval(timer); });
      }, { threshold: 0.3 }).observe(rx);
    } else { play(); }
    var dl = rx.querySelector('.rx-dl');
    if (dl) dl.addEventListener('click', function () { track('report_download'); });
  });

  /* ---------- spotlight page: islands tabs, plan hotspots, count-up, section nav ---------- */
  var islTabs = document.querySelectorAll('.isl-tab');
  if (islTabs.length) {
    var setIsland = function (k, scroll) {
      islTabs.forEach(function (t) { t.setAttribute('aria-pressed', String(t.getAttribute('data-island') === k)); });
      document.querySelectorAll('.isl').forEach(function (a) { a.hidden = a.getAttribute('data-island') !== k; });
      document.querySelectorAll('.plan-spot').forEach(function (s) { s.classList.toggle('is-on', s.getAttribute('data-island') === k); });
      if (scroll) document.getElementById('islands').scrollIntoView({ behavior: 'smooth', block: 'start' });
      track('spot_island', { island: k });
    };
    islTabs.forEach(function (t) { t.addEventListener('click', function () { setIsland(t.getAttribute('data-island'), false); }); });
    document.querySelectorAll('.plan-spot').forEach(function (s) {
      s.addEventListener('click', function () { setIsland(s.getAttribute('data-island'), true); });
    });
    var first = document.querySelector('.plan-spot[data-island="A"]');
    if (first) first.classList.add('is-on');
  }
  /* count-up for hero stats */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, to = parseFloat(el.getAttribute('data-count')), t0 = null;
        cio.unobserve(el);
        var step = function (ts) {
          if (!t0) t0 = ts;
          var k = Math.min(1, (ts - t0) / 1200);
          el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(step);
        };
        el.textContent = '0';
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }
  /* highlight the current section in the sticky in-page nav */
  var spotLinks = document.querySelectorAll('.spot-nav a[href^="#"]');
  if (spotLinks.length && 'IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        spotLinks.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spotLinks.forEach(function (a) { var s = document.querySelector(a.getAttribute('href')); if (s) sio.observe(s); });
  }

  /* ---------- guide index: filter articles by topic ---------- */
  var magChips = document.querySelectorAll('.mag-chip');
  magChips.forEach(function (c) {
    c.addEventListener('click', function () {
      var tp = c.getAttribute('data-topic');
      magChips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
      document.querySelectorAll('.mag-card').forEach(function (card) {
        card.hidden = tp === 'all' ? card.classList.contains('mag-only') : card.getAttribute('data-topic') !== tp;
        card.classList.toggle('mag-feat', tp === 'all' && card === card.parentElement.firstElementChild);
      });
      track('guide_topic', { topic: tp });
    });
  });

  /* ---------- FAQ: show all / fewer ---------- */
  document.querySelectorAll('.faq-toggle').forEach(function (b) {
    b.addEventListener('click', function () {
      var box = b.closest('[data-faq]'), open = !box.classList.contains('is-open');
      box.classList.toggle('is-open', open);
      b.textContent = b.getAttribute(open ? 'data-less' : 'data-more');
    });
  });


  /* ---------- bottom tab bar on phones ---------- */
  var tabMenu = document.querySelector('[data-tab-menu]');
  if (tabMenu && burger) tabMenu.addEventListener('click', function () { burger.click(); tabMenu.classList.toggle('is-on', !mnav.hidden); });

  /* ---------- sticky quiz button on phones: after the hero, hidden near the final form ---------- */
  var mcta = document.querySelector('[data-mcta]');
  var heroEl = document.querySelector('.hero'), joinEl = document.getElementById('join');
  if (mcta && heroEl && 'IntersectionObserver' in window) {
    var heroVis = true, joinVis = false;
    var upd = function () { var on = !heroVis && !joinVis; mcta.hidden = false; mcta.classList.toggle('is-on', on); };
    new IntersectionObserver(function (es) { heroVis = es[0].isIntersecting; upd(); }).observe(heroEl);
    if (joinEl) new IntersectionObserver(function (es) { joinVis = es[0].isIntersecting; upd(); }, { threshold: 0.15 }).observe(joinEl);
  }

  /* ---------- full-cost calculator ---------- */
  document.querySelectorAll('.calc').forEach(function (c) {
    var loc = c.getAttribute('data-locale') || 'en';
    var fmt = function (n) { return 'AED ' + Math.round(n).toLocaleString(loc === 'ar' ? 'en' : loc); };
    var inp = function (k) { return c.querySelector('[data-c="' + k + '"]'); };
    var out = function (k, v) { c.querySelector('[data-o="' + k + '"]').textContent = fmt(v); };
    var used = false;
    var calc = function (ev) {
      var price = Math.max(0, parseFloat(inp('price').value) || 0);
      var pre = parseFloat(inp('plan').value) / 100;
      var booking = parseFloat(inp('booking').value) / 100;
      var dld = price * 0.04;
      out('dld', dld); out('total', price + dld); out('upfront', price * booking + dld);
      out('during', Math.max(0, price * (pre - booking))); out('handover', price * (1 - pre));
      store.set('pe_calc', fmt(price) + ', ' + inp('plan').selectedOptions[0].text + ', ' + inp('booking').value + '%');
      if (ev && !used) { used = true; track('calc_used'); }
    };
    ['price', 'plan', 'booking'].forEach(function (k) { inp(k).addEventListener('input', calc); });
    calc();
  });
})();

// The old app on this domain installed a service worker that serves its cached shell; this site has none, so remove any.
(function () {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.getRegistrations().then(function (regs) {
    regs.forEach(function (r) { r.unregister(); });
    if (regs.length && window.caches) caches.keys().then(function (k) { k.forEach(function (n) { caches.delete(n); }); });
  }).catch(function () {});
})();
