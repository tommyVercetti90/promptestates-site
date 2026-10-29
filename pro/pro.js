/* PromptEstates Pro — investor dashboard on Dubai Land Department open data.
   Static SPA: hash routes, data from ./data (built by tools/pro_data.py). */
(function () {
  'use strict';
  var PASS_HASH = 'a8fd3e8aa693b3325bfaea2787459e0abe86f7fd54c2ab062be65e522def6a27';
  var SQFT = 10.7639;
  // Subscriptions: Firebase Auth (same accounts as the PromptEstates app) + Stripe via pro_api.
  // Keep false until pro_api runs with Stripe keys; the prototype password gate stays active meanwhile.
  var BILLING_LIVE = true;
  var AUTH_OWN = true;    // Google accepts https://promptestates.com/__/auth/handler (OAuth client redirect URI)
  var FIREBASE = { apiKey: 'AIzaSyDzuI6QmmsG2UQy3widIUzXDnGlFauZ9Iw', authDomain: AUTH_OWN && /(^|\.)promptestates\.com$/.test(location.hostname) ? 'promptestates.com' : 'promptestates-ai.firebaseapp.com',   // own domain: sign-in survives storage partitioning (in-app browsers, Safari) and Google shows promptestates.com
    projectId: 'promptestates-ai',
                   appId: '1:321328766090:web:40be29995e21224225a173' };
  var FREE_FILES = ['meta.json', 'market.json', 'areas.json', 'geo.json', 'areas_geo.json', 'ad/areas.json', 'ad/market.json', 'shj/market.json'];
  var FREE_ROUTES = ['market', 'map', 'pricing', 'account', 'ask', 'ad'];
  // Inside the PromptEstates app (WebView): the app injects window.PE_APP = {token, lang, platform} with the user's
  // Firebase ID token. Same account and plan, but no sign-in UI and no prices or checkout (purchases are web-only).
  var APP = window.PE_APP || (/[?&]app=1/.test(location.search) ? {} : null);
  var USER = null, ACCOUNT = { plan: BILLING_LIVE ? 'free' : 'pro' };
  var isPro = function () { return ACCOUNT.plan === 'pro'; };
  var store = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };

  // ------------------------------------------------------------------ i18n
  var T = {
    ru: {
      gateText: 'Аналитика рынка недвижимости Дубая на данных DLD. Введите пароль доступа.', gateBtn: 'Войти', gateErr: 'Неверный пароль',
      tabAsk: 'Спросить', navMap: 'Карта', tourL: 'Обучение', navAccount: 'Аккаунт', signIn: 'Войти', haveSub: 'Уже есть подписка?',
      siH: 'Вход в PromptEstates', siSub: 'Тот же аккаунт, что в приложении PromptEstates', siGoogle: 'Продолжить с Google', siApple: 'Продолжить с Apple', siOr: 'или',
      siEmail: 'Email', siPass: 'Пароль (от 6 символов)', siSignIn: 'Войти', siSignUp: 'Создать аккаунт', siToSignUp: 'Нет аккаунта? Создать', siToSignIn: 'Уже есть аккаунт? Войти',
      siReset: 'Забыли пароль?', siResetSent: 'Письмо для сброса пароля отправлено', siErr: 'Не получилось войти. Проверьте email и пароль',
      siErrs: { 'auth/popup-blocked': 'Браузер заблокировал окно входа — открываем вход на этой странице…', 'auth/operation-not-supported-in-this-environment': 'Этот браузер не поддерживает окно входа — открываем вход на этой странице…',
        'auth/unauthorized-domain': 'Вход с этого адреса не разрешён. Откройте promptestates.com/pro', 'auth/operation-not-allowed': 'Этот способ входа пока не включён. Войдите через Google или email',
        'auth/invalid-oauth-client-id': 'Вход через Apple в браузере пока не настроен. Войдите через Google или email', 'auth/account-exists-with-different-credential': 'Этот email уже привязан к другому способу входа — войдите им',
        'auth/network-request-failed': 'Нет связи с сервером входа. Проверьте интернет', 'auth/too-many-requests': 'Слишком много попыток. Подождите минуту',
        'auth/wrong-password': 'Неверный пароль', 'auth/invalid-credential': 'Неверный email или пароль', 'auth/user-not-found': 'Аккаунт не найден — нажмите «Создать»', 'auth/email-already-in-use': 'Этот email уже зарегистрирован — войдите', 'auth/weak-password': 'Пароль должен быть от 6 символов', 'auth/invalid-email': 'Проверьте email' },
      prH: 'PromptEstates Pro', prSub: 'Вся аналитика рынка Дубая по данным DLD — в одном месте', prMonth: 'Месяц', prYear: 'Год', prPerM: '/ мес', prPerY: '/ год', prSave: 'выгода 34%',
      prCta: 'Оформить Pro', prCurrent: 'Ваш тариф', prFree: 'Бесплатно', prFreeL: ['Обзор рынка Дубая', 'Карта районов', 'Данные DLD каждую неделю'],
      prProL: ['Все разделы: районы, проекты, сделки, застройщики', 'Фильтры по типу жилья на карте и в инфографике', 'Инфографика в PNG для постов и презентаций', 'ИИ-аналитик: вопросы обычными словами', 'ИИ-меморандум по любому проекту', 'Калькулятор справедливой цены', 'Выгрузка сделок в CSV'],
      prNote: 'Оплата через Stripe. Отмена в любой момент в личном кабинете', prSoon: 'Оплата скоро откроется',
      lockH: 'Раздел доступен в Pro', lockSub: 'Оформите подписку, чтобы открыть все данные DLD, ИИ-аналитика и инфографику', lockSee: 'Смотреть тарифы', lockApp: 'Подписка оформляется на сайте promptestates.com — после этого Pro откроется и здесь, в том же аккаунте.', lockSeg: 'Фильтры по типу жилья — в Pro',
      acH: 'Аккаунт', acPlan: 'Тариф', acRenew: 'Продлится', acEnds: 'Доступ до', acManage: 'Управлять подпиской', acOut: 'Выйти', acUpgrade: 'Перейти на Pro',
      acStatus: { active: 'активна', trialing: 'пробный период', past_due: 'проблема с оплатой', canceled: 'отменена', incomplete: 'не завершена' },
      okPaid: 'Подписка оформлена — добро пожаловать в Pro!', waitPaid: 'Подтверждаем оплату…', apiDown: 'Сервис временно недоступен, попробуйте позже', navMore: 'Ещё', done: 'Готово', settings: 'Настройки', unitsL: 'Площадь', langL: 'Язык', themeL: 'Тема', loadingA: 'Загружаю данные',
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
      devProjects: 'Проекты застройщика', navAsk: 'Спроси рынок', navInfo: 'Инфографика', askH: 'Спроси рынок', askSub: 'Вопрос обычными словами — ответ по реальным сделкам и аренде DLD',
      adMap: 'Карта районов', adMapHint: 'Размер — число сделок за 12 месяцев, цвет — выбранный показатель', adPpm: 'Цена м², квартиры', adPpmV: 'Цена м², виллы', adPpmNote: 'Цена за м² — средняя по отчёту ADREC за {p}',
      adM: { yoy_value: 'Рост за год', off12: 'Доля off-plan', y1: 'Доходность 1BR', ppm: 'Цена м² квартир' }, adOpen: 'Открыть район',
      citySHJ: 'Шарджа', shjH: 'Рынок Шарджи', shjSub: 'Итоги Регистрационного департамента недвижимости Шарджи (SRERD) по сообщениям прессы', shjVal9: 'Объём сделок, 9 мес. 2026', shjTx9: 'Сделок, 9 мес. 2026', shjSales9: 'Продаж, 9 мес. 2026', shjMortH1: 'Ипотек, I пол. 2026', shjFY: 'Объём за 2025 год', shjDeals: 'сделок', shjMonths: 'Объём по месяцам', shjMonthsHint: 'Месяцы, по которым SRERD публиковал итоги: объём, млрд AED, и число сделок', shjSrc: 'Источники:', shjNoneH: 'Для Шарджи этого раздела нет', shjNoneSub: 'Шарджа не публикует открытые данные по районам, проектам и отдельным сделкам — только общие итоги. Обзор рынка доступен, ИИ-аналитик отвечает и про Шарджу.',
      adLegNo: 'нет данных', adLegSize: 'размер круга — сделки за 12 мес.', adLegDiv: 'синий — рост, красный — падение',
      mort12: 'Ипотек за 12 мес.', mortS: 'Ипотека', mortOf: '{x}% от числа продаж',
      navAD: 'Абу-Даби', cityDxb: 'Дубай', cityL: 'Город', adAll: 'Все районы', adMapH: 'Карта районов Абу-Даби',
      adNoneH: 'Для Абу-Даби этого раздела пока нет', adNoneSub: 'ADREC не публикует открыто данные по отдельным проектам, сделкам и застройщикам. Рынок, карта и районы Абу-Даби уже доступны, а ИИ-аналитик отвечает и про Абу-Даби.',
      adToDxb: 'Смотреть по Дубаю', adToMarket: 'Рынок Абу-Даби', adH: 'Рынок Абу-Даби', adSub: 'Продажи жилья за 12 месяцев по данным Abu Dhabi Real Estate Centre (ADREC)', adAvg: 'Средняя цена сделки', adYoy: 'объём к прошлому году',
      adQ: 'Продажи по кварталам', adQs: 'Объём, млрд AED, и число сделок', adPart: 'неполный', adDist: 'Районы Абу-Даби', adMore: 'Остальные районы ({n}), цены и аренда по типам жилья — в Pro',
      adNote: 'ADREC публикует средние цены за объект и аренду за год, а не цены за м², поэтому с Дубаем сравнивайте активность, рост и доходность.', adPrices: 'Средние цены и аренда', adApt: 'Квартира', adVilla: 'Вилла',
      adPrice: 'Средняя цена, AED', adRent: 'Аренда в год, AED', adSrc: 'Источник: Abu Dhabi Real Estate Centre (ADREC) — продажи за {m}, цены и аренда на {q}.', adCity: 'Город',
      cardShare: 'Поделиться', cardPng: 'PNG', cardBy: 'ИИ-аналитик PromptEstates', cardSrc: 'Источник: {s} · {d}', cardShareText: 'Разбор рынка от PromptEstates',
      chatNew: 'Новый чат', chatHist: 'История', chatPh: 'Напишите, что ищете…', chatHi: 'Спросите рынок Дубая и Абу-Даби', chatBusy: 'Слишком много вопросов подряд — попробуйте через минуту',
      chatNote: 'Ответы — по зарегистрированным сделкам и аренде DLD. Это не инвестиционная рекомендация.', chatGuest: 'Войдите, чтобы история чатов сохранялась — и в приложении тоже', chatEmpty: 'Здесь появятся ваши чаты',
      askPh: 'Например: студии в JVC с доходностью выше 6% и сдачей в 2027 году', askBtn: 'Спросить', askWait: 'Считаю по данным DLD…', askErr: 'ИИ-аналитик временно недоступен — попробуйте через пару минут',
      askEx: ['Где самая высокая доходность 1-спальных?', 'Сравни JVC и Arjan', 'Какие проекты Binghatti просрочены?', 'Сколько реально стоит 1-спальная 67 м² в Azizi Venice 14?'],
      memoBtn: 'ИИ-меморандум', memoH: 'Инвест-меморандум', memoWait: 'Готовлю меморандум по данным DLD… (до 30 сек.)', print: 'Печать / PDF',
      fairH: 'Справедливая цена', fairSub: 'По похожим сделкам за 6 месяцев: те же комнаты, площадь ±20%', asking: 'Цена продавца, AED', calc: 'Рассчитать',
      fairRange: 'Диапазон рынка', fairMid: 'Медиана', comps: 'Сделок-аналогов', vsMarket: 'К медиане рынка', fewComps: 'Мало похожих сделок за 6 месяцев', scopeProj: 'по этому проекту', scopeArea: 'по району', expectedYield: '* В доме ещё нет договоров аренды: аренда и доходность — по медиане района за 12 месяцев.', master: 'Мастер-проект', medianPrice: 'Медиана цены', medianSize: 'Медиана площади', medianRent: 'Аренда/год'
    },
    en: {
      gateText: 'Dubai real estate intelligence on Dubai Land Department data. Enter your access password.', gateBtn: 'Sign in', gateErr: 'Wrong password',
      tabAsk: 'Ask', navMap: 'Map', tourL: 'Tour', navAccount: 'Account', signIn: 'Sign in', haveSub: 'Already subscribed?',
      siH: 'Sign in to PromptEstates', siSub: 'Same account as in the PromptEstates app', siGoogle: 'Continue with Google', siApple: 'Continue with Apple', siOr: 'or',
      siEmail: 'Email', siPass: 'Password (6+ characters)', siSignIn: 'Sign in', siSignUp: 'Create account', siToSignUp: 'No account? Create one', siToSignIn: 'Have an account? Sign in',
      siReset: 'Forgot password?', siResetSent: 'Password reset email sent', siErr: 'Could not sign in. Check your email and password',
      siErrs: { 'auth/popup-blocked': 'The browser blocked the sign-in window — continuing on this page…', 'auth/operation-not-supported-in-this-environment': 'This browser does not support the sign-in window — continuing on this page…',
        'auth/unauthorized-domain': 'Sign-in is not allowed from this address. Open promptestates.com/pro', 'auth/operation-not-allowed': 'This sign-in method is not enabled yet. Use Google or email',
        'auth/invalid-oauth-client-id': 'Sign in with Apple is not set up for the web yet. Use Google or email', 'auth/account-exists-with-different-credential': 'This email is linked to another sign-in method — use that one',
        'auth/network-request-failed': 'No connection to the sign-in service. Check your internet', 'auth/too-many-requests': 'Too many attempts. Wait a minute',
        'auth/wrong-password': 'Wrong password', 'auth/invalid-credential': 'Wrong email or password', 'auth/user-not-found': 'No account found — choose “Create account”', 'auth/email-already-in-use': 'This email is already registered — sign in', 'auth/weak-password': 'Password must be 6+ characters', 'auth/invalid-email': 'Check the email' },
      prH: 'PromptEstates Pro', prSub: 'All Dubai market analytics from DLD data in one place', prMonth: 'Monthly', prYear: 'Yearly', prPerM: '/ mo', prPerY: '/ yr', prSave: 'save 34%',
      prCta: 'Get Pro', prCurrent: 'Your plan', prFree: 'Free', prFreeL: ['Dubai market overview', 'Area map', 'Weekly DLD data'],
      prProL: ['Every section: areas, projects, transactions, developers', 'Property-type filters on the map and infographics', 'Infographics as PNG for posts and decks', 'AI analyst: ask in plain words', 'AI memo for any project', 'Fair price calculator', 'Transactions CSV export'],
      prNote: 'Payments by Stripe. Cancel anytime from your account', prSoon: 'Checkout opens soon',
      lockH: 'This section is part of Pro', lockSub: 'Subscribe to unlock all DLD data, the AI analyst and infographics', lockSee: 'See plans', lockApp: 'Subscribe on the promptestates.com website — Pro then unlocks here too, on the same account.', lockSeg: 'Property-type filters are part of Pro',
      acH: 'Account', acPlan: 'Plan', acRenew: 'Renews', acEnds: 'Access until', acManage: 'Manage subscription', acOut: 'Sign out', acUpgrade: 'Upgrade to Pro',
      acStatus: { active: 'active', trialing: 'trial', past_due: 'payment issue', canceled: 'canceled', incomplete: 'incomplete' },
      okPaid: 'You are on Pro — welcome!', waitPaid: 'Confirming your payment…', apiDown: 'Service is temporarily unavailable, try again later', navMore: 'More', done: 'Done', settings: 'Settings', unitsL: 'Area units', langL: 'Language', themeL: 'Appearance', loadingA: 'Loading data',
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
      devProjects: 'Developer projects', navAsk: 'Ask the market', navInfo: 'Infographics', askH: 'Ask the market', askSub: 'Ask in plain words — answers from actual DLD sales and rents',
      adMap: 'District map', adMapHint: 'Size: sales over 12 months; colour: the selected metric', adPpm: 'Price per m², apartments', adPpmV: 'Price per m², villas', adPpmNote: 'Price per m² is the ADREC report average for {p}',
      adM: { yoy_value: 'YoY growth', off12: 'Off-plan share', y1: '1-bed yield', ppm: 'Apartment price per m²' }, adOpen: 'Open district',
      citySHJ: 'Sharjah', shjH: 'Sharjah market', shjSub: 'Totals reported by the Sharjah Real Estate Registration Department (SRERD), as published in the press', shjVal9: 'Transaction value, 9M 2026', shjTx9: 'Transactions, 9M 2026', shjSales9: 'Sales, 9M 2026', shjMortH1: 'Mortgages, H1 2026', shjFY: 'Value in 2025', shjDeals: 'transactions', shjMonths: 'Value by month', shjMonthsHint: 'Months with a published SRERD report: value, AED bn, and number of transactions', shjSrc: 'Sources:', shjNoneH: 'This section is not available for Sharjah', shjNoneSub: 'Sharjah does not publish open data by area, project or transaction — only overall totals. The market overview is available and the AI analyst answers about Sharjah too.',
      adLegNo: 'no data', adLegSize: 'circle size — sales over 12 months', adLegDiv: 'blue — growth, red — decline',
      mort12: 'Mortgages, 12 months', mortS: 'Mortgages', mortOf: '{x}% of sales count',
      navAD: 'Abu Dhabi', cityDxb: 'Dubai', cityL: 'City', adAll: 'All districts', adMapH: 'Abu Dhabi district map',
      adNoneH: 'This section is not available for Abu Dhabi yet', adNoneSub: 'ADREC does not openly publish data on individual projects, transactions and developers. The Abu Dhabi market, map and districts are available, and the AI analyst answers about Abu Dhabi too.',
      adToDxb: 'View Dubai', adToMarket: 'Abu Dhabi market', adH: 'Abu Dhabi market', adSub: 'Residential sales over 12 months from Abu Dhabi Real Estate Centre (ADREC) data', adAvg: 'Average deal price', adYoy: 'value YoY',
      adQ: 'Sales by quarter', adQs: 'Value, AED bn, and number of sales', adPart: 'partial', adDist: 'Abu Dhabi districts', adMore: 'All other districts ({n}), prices and rents by unit type — in Pro',
      adNote: 'ADREC publishes average prices per unit and annual rents, not prices per m², so compare activity, growth and yields with Dubai.', adPrices: 'Average prices and rents', adApt: 'Apartment', adVilla: 'Villa',
      adPrice: 'Average price, AED', adRent: 'Annual rent, AED', adSrc: 'Source: Abu Dhabi Real Estate Centre (ADREC) — sales for {m}, prices and rents as of {q}.', adCity: 'City',
      cardShare: 'Share', cardPng: 'PNG', cardBy: 'PromptEstates AI analyst', cardSrc: 'Source: {s} · {d}', cardShareText: 'Market insight from PromptEstates',
      chatNew: 'New chat', chatHist: 'History', chatPh: 'Write what you’re looking for…', chatHi: 'Ask about Dubai and Abu Dhabi', chatBusy: 'Too many questions in a row — try again in a minute',
      chatNote: 'Answers use registered DLD sales and rents. Not investment advice.', chatGuest: 'Sign in to keep your chat history — in the app too', chatEmpty: 'Your chats will appear here',
      askPh: 'E.g. studios in JVC with yield above 6% and handover in 2027', askBtn: 'Ask', askWait: 'Crunching DLD data…', askErr: 'The AI analyst is temporarily unavailable — please try again in a few minutes',
      askEx: ['Where are 1-bed yields highest?', 'Compare JVC and Arjan', 'Which Binghatti projects are overdue?', 'What is a fair price for a 67 m² 1-bed in Azizi Venice 14?'],
      memoBtn: 'AI memo', memoH: 'Investment memo', memoWait: 'Writing the memo from DLD data… (up to 30 s)', print: 'Print / PDF',
      fairH: 'Fair price', fairSub: 'From comparable sales in the last 6 months: same beds, size ±20%', asking: 'Asking price, AED', calc: 'Calculate',
      fairRange: 'Market range', fairMid: 'Median', comps: 'Comparable sales', vsMarket: 'Vs market median', fewComps: 'Too few comparable sales in 6 months', scopeProj: 'in this project', scopeArea: 'in the area', expectedYield: '* No rent contracts in this building yet: rent and yield use the area median over 12 months.', master: 'Master project', medianPrice: 'Median price', medianSize: 'Median size', medianRent: 'Rent/yr'
    }
  };
  var I18N = window.PRO_I18N || {}, LANGS = ['ru', 'en'].concat(Object.keys(I18N));
  var LOCALES = { ru: 'ru-RU', en: 'en-US', ar: 'ar-AE', de: 'de-DE', fr: 'fr-FR', it: 'it-IT', tr: 'tr-TR', zh: 'zh-CN', hi: 'hi-IN', ur: 'ur-PK', fa: 'fa-IR' };
  var LNAMES = { ru: 'Русский', en: 'English', ar: 'العربية', de: 'Deutsch', fr: 'Français', it: 'Italiano', tr: 'Türkçe', zh: '中文', hi: 'हिन्दी', ur: 'اردو', fa: 'فارسی' };
  var pickLang = function (c) { c = (c || '').toLowerCase().slice(0, 2); return LANGS.indexOf(c) >= 0 ? c : null; };
  var lang = pickLang(store('pro_lang')) || pickLang(APP && APP.lang) || pickLang(navigator.language) || 'en';
  var loc = function () { return LOCALES[lang] || 'en-US'; };   // numbers stay Latin digits for every language (nu-latn)
  var unit = store('pro_unit') || (lang === 'ru' ? 'm2' : 'sqft');
  var t = function (k) { return (T[lang] && T[lang][k]) || T.en[k] || k; };

  // ------------------------------------------------------------------ helpers
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fmt = function (n, d) { if (n == null || isNaN(n)) return '—'; return Number(n).toLocaleString(loc() + '-u-nu-latn', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); };
  var area = function (v) { return unit === 'm2' ? v : v * SQFT; };
  var ppmv = function (v) { return v == null ? null : (unit === 'm2' ? v : v / SQFT); };
  var uLabel = function () { return unit === 'm2' ? 'м²'.replace('м', lang === 'ru' ? 'м' : 'm') : 'sq ft'; };
  var aed = function (v) { if (v == null) return '—'; if (v >= 1e9) return fmt(v / 1e9, v >= 1e11 ? 0 : 1) + ' ' + t('bn'); if (v >= 1e6) return fmt(v / 1e6, v >= 1e8 ? 0 : 1) + ' ' + t('m'); return fmt(v); };
  var fdate = function (d) { if (!d || !/^\d{4}-\d{2}-\d{2}/.test(d)) return d || '—'; return new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString((lang === 'en' ? 'en-GB' : loc()) + '-u-nu-latn', { day: 'numeric', month: 'short', year: 'numeric' }); };
  var pctTag = function (v) { if (v == null) return ''; return '<i class="' + (v >= 0 ? 'up' : 'down') + '">' + (v >= 0 ? '+' : '') + fmt(v, 1) + '%</i>'; };
  var roomsLabel = function (r) { return r === 'S' ? t('studio') : r === 'PH' ? t('ph') : r === 'V' ? t('villa') : r ? r + ' ' + t('br') : '—'; };
  var cache = {};
  var API = store('pro_api') || 'https://api.promptestates.com';
  function authHeaders() { return USER ? USER.getIdToken().then(function (tk) { return { Authorization: 'Bearer ' + tk }; }) : Promise.resolve({}); }
  var get = function (path) {
    if (!cache[path]) cache[path] = (BILLING_LIVE && FREE_FILES.indexOf(path) < 0
      ? authHeaders().then(function (hd) { return fetch(API + '/api/data/' + path, { headers: hd }); })
      : fetch('data/' + path)).then(function (r) { if (!r.ok) throw new Error(path); return r.json(); });
    return cache[path];
  };
  var median = function (xs) { if (!xs.length) return null; var s = xs.slice().sort(function (a, b) { return a - b; }), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  var charts = [];
  var css = function (v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); };
  function chart(el, cfg) {
    Chart.defaults.locale = loc() + '-u-nu-latn';
    Chart.defaults.font.family = css('--font') || 'system-ui';
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) Chart.defaults.animation = false;
    var c = new Chart(el, cfg);
    charts.push(c);
    return c;
  }
  function xTicks() {
    return { color: css('--muted'), maxRotation: 0, autoSkipPadding: 16,
      callback: function (v) { var l = this.getLabelForValue(v); return /^\d{4}-\d{2}$/.test(l) ? mlabel(l) : l; } };
  }
  function baseOpts(extra) {
    var grid = css('--line'), tick = css('--muted');
    var o = { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { color: tick, boxWidth: 12 } } },
      scales: { x: { grid: { display: false }, ticks: xTicks() },
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
        th.tabIndex = 0;
        th.setAttribute('aria-sort', state.key === th.dataset.k ? (state.asc ? 'ascending' : 'descending') : 'none');
        th.onclick = function () { var k = th.dataset.k; if (state.key === k) state.asc = !state.asc; else { state.key = k; state.asc = false; } render(); };
        th.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); th.onclick(); } };
      });
      host.querySelectorAll('tbody tr').forEach(function (tr) {
        var a = tr.querySelector('a[href^="#/"]');
        if (!a) return;
        tr.classList.add('tap');
        tr.onclick = function (e) { if (!e.target.closest('a')) location.hash = a.getAttribute('href'); };
      });
      host.querySelectorAll('.pager button').forEach(function (b) { b.onclick = function () { state.page += +b.dataset.p; render(); host.scrollIntoView({ block: 'nearest' }); }; });
    }
    render();
    return { set: function (r) { rows = r; state.page = 0; render(); } };
  }

  // ------------------------------------------------------------------ AI layer (pro_api)
  function api(path, body, method) {
    return authHeaders().then(function (hd) {
      hd['Content-Type'] = 'application/json';
      return fetch(API + path, { method: method || 'POST', headers: hd, body: method === 'GET' ? undefined : JSON.stringify(body || {}) });
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.detail || r.status); e.status = r.status; if (r.status === 401) toApp({ type: 'token' }); throw e; } return j; }); });
  }
  function toApp(msg) { if (APP && window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
  function md(src) {
    var lines = esc(src).split('\n'), out = [], i = 0;
    var inline = function (x) {
      return x.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[([^\]]+)\]\((#\/[^)\s]+)\)/g, '<a href="$2">$1</a>').replace(/`([^`]+)`/g, '<code>$1</code>');
    };
    var row = function (x) { return x.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }); };
    while (i < lines.length) {
      var l = lines[i];
      if (/^\s*\|/.test(l) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
        var head = row(l), body = []; i += 2;
        while (i < lines.length && /^\s*\|/.test(lines[i])) { body.push(row(lines[i])); i++; }
        out.push('<div class="tw"><table><thead><tr>' + head.map(function (h) { return '<th>' + inline(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          body.map(function (r) { return '<tr>' + r.map(function (c) { return '<td class="' + (/^[-+]?[\d\s.,%]+$/.test(c) ? 'num' : '') + '">' + inline(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>');
        continue;
      }
      if (/^\s*[-*•]\s/.test(l)) { var ul = []; while (i < lines.length && /^\s*[-*•]\s/.test(lines[i])) { ul.push('<li>' + inline(lines[i].replace(/^\s*[-*•]\s/, '')) + '</li>'); i++; } out.push('<ul>' + ul.join('') + '</ul>'); continue; }
      if (/^\s*\d+[.)]\s/.test(l)) { var ol = []; while (i < lines.length && /^\s*\d+[.)]\s/.test(lines[i])) { ol.push('<li>' + inline(lines[i].replace(/^\s*\d+[.)]\s/, '')) + '</li>'); i++; } out.push('<ol>' + ol.join('') + '</ol>'); continue; }
      if (/^#{1,4}\s/.test(l)) out.push('<h3>' + inline(l.replace(/^#+\s*/, '')) + '</h3>');
      else if (l.trim()) out.push('<p>' + inline(l) + '</p>');
      i++;
    }
    return '<div class="md">' + out.join('') + '</div>';
  }
  // ------------------------------------------------------------------ shareable infographic for AI answers
  // A markdown table in the answer becomes a branded image (bars for the main numeric column) that can be shared to WhatsApp or saved.
  function mdPlain(x) { return String(x || '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*\*|`|__/g, '').trim(); }
  function cellNum(x) {
    var c = mdPlain(x).replace(/[\s  ]/g, '').replace('−', '-').replace(/^[^\d+-]+/, '');
    var m = c.match(/^[+-]?\d+(?:[.,]\d+)?/); if (!m) return null;
    var v = m[0].replace(/,(\d{3})(?!\d)/g, '$1');
    return parseFloat(v.replace(',', '.'));
  }
  function mdTable(text) {
    var lines = String(text || '').split('\n'), i = lines.findIndex(function (l, k) { return /^\s*\|/.test(l) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[k + 1] || ''); });
    if (i < 0) return null;
    var row = function (l) { return l.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }); };
    var head = row(lines[i]), body = [];
    for (var k = i + 2; k < lines.length && /^\s*\|/.test(lines[k]); k++) body.push(row(lines[k]));
    return body.length >= 2 && head.length >= 2 ? { head: head.map(mdPlain), rows: body } : null;
  }
  function answerSvg(id, q, text) {
    var tb = mdTable(text); if (!tb) return '';
    var rows = tb.rows.slice(0, 8), nc = tb.head.length;
    var numCols = []; for (var c = 1; c < nc; c++) if (rows.filter(function (r) { return cellNum(r[c]) != null; }).length >= rows.length * 0.7) numCols.push(c);
    var pct = numCols.filter(function (c) { return /%/.test(tb.head[c]) || rows.some(function (r) { return /%/.test(r[c] || ''); }); });
    var main = pct.length ? pct[0] : numCols[0], second = numCols.filter(function (c) { return c !== main; })[0];
    // a table of metrics by rows (transposed) has text in col 1+: fall back to listing the first two columns
    var W = 560, X0 = 32, lead = mdPlain((text.split('\n').filter(function (l) { return l.trim() && !/^\s*\|/.test(l); })[0] || '')).replace(/^#+\s*/, '');
    var title = wrapText(mdPlain(q), 30).slice(0, 3), leadL = wrapText(lead, 46).slice(0, 4);
    var y = 0, b = '', C = { bg: '#0d2a36', bg2: '#123a4a', text: '#f2f7f9', muted: '#a8c2cc', accent: '#6bbfe0', bar: '#2f8fb5' };
    var T = function (x, yy, str, o) { o = o || {}; return '<text x="' + x + '" y="' + yy + '" font-size="' + (o.size || 14) + '" font-family="Inter, Segoe UI, Roboto, Arial, sans-serif"' + (o.w ? ' font-weight="' + o.w + '"' : '') +
      ' fill="' + (o.fill || C.text) + '"' + (o.anchor ? ' text-anchor="' + o.anchor + '"' : '') + '>' + esc(str) + '</text>'; };
    b += T(X0, 46, 'PromptEstates', { size: 20, w: 800 }) + T(W - X0, 46, t('cardBy'), { size: 13, fill: C.accent, anchor: 'end', w: 600 });
    y = 96; title.forEach(function (l) { b += T(X0, y, l, { size: 28, w: 700 }); y += 35; });
    y += 4; leadL.forEach(function (l) { b += T(X0, y, l, { size: 17, fill: C.muted }); y += 24; });
    y += 18;
    var labelW = 160, barX = X0 + labelW + 10, barMax = W - X0 - barX - (second != null ? 128 : 70);
    b += T(X0, y, trunc(tb.head[0], 18), { size: 13, fill: C.muted, w: 600 }) + (main != null ? T(barX, y, trunc(tb.head[main], 22), { size: 13, fill: C.muted, w: 600 }) : '') +
      (second != null ? T(W - X0, y, trunc(tb.head[second], 14), { size: 13, fill: C.muted, w: 600, anchor: 'end' }) : '');
    y += 14;
    var vals = main != null ? rows.map(function (r) { return cellNum(r[main]); }) : [], mx = Math.max.apply(null, vals.map(function (v) { return Math.abs(v || 0); }).concat([1e-9]));
    rows.forEach(function (r, i) {
      b += '<rect x="' + (X0 - 12) + '" y="' + (y - 2) + '" width="' + (W - 2 * X0 + 24) + '" height="46" rx="12" fill="' + (i % 2 ? 'transparent' : C.bg2) + '"/>';
      b += T(X0, y + 27, trunc(mdPlain(r[0]), 17), { size: 17, w: 600 });
      if (main != null) {
        var v = vals[i], w = v == null ? 0 : Math.max(4, barMax * Math.abs(v) / mx);
        b += '<rect x="' + barX + '" y="' + (y + 11) + '" width="' + w + '" height="22" rx="7" fill="' + (v != null && v < 0 ? '#f07a6a' : i === 0 ? C.accent : C.bar) + '"/>' +
          T(barX + w + 8, y + 28, mdPlain(r[main]), { size: 16, w: 700 });
      } else b += T(barX, y + 27, trunc(mdPlain(r[1]), 30), { size: 16 });
      if (second != null) b += T(W - X0, y + 28, trunc(mdPlain(r[second]), 12), { size: 15, fill: C.muted, anchor: 'end' });
      y += 50;
    });
    var src = /ADREC|Абу-Даби|Abu Dhabi/i.test(text) ? (/DLD|Дуба|Dubai/i.test(text) ? 'DLD, ADREC' : 'ADREC') : 'DLD';
    y += 16;
    b += '<line x1="' + X0 + '" y1="' + y + '" x2="' + (W - X0) + '" y2="' + y + '" stroke="#2b5566"/>';
    y += 26;
    b += T(X0, y, t('cardSrc').replace('{s}', src).replace('{d}', fdate(new Date().toISOString())), { size: 12, fill: C.muted }) + T(W - X0, y, 'promptestates.com/pro', { size: 14, fill: C.accent, w: 700, anchor: 'end' });
    var H = y + 26;
    return '<svg id="' + id + '" class="cm-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(mdPlain(q)) + '">' +
      '<defs><linearGradient id="' + id + '-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#114154"/><stop offset="1" stop-color="' + C.bg + '"/></linearGradient></defs>' +
      '<rect width="' + W + '" height="' + H + '" rx="22" fill="url(#' + id + '-g)"/>' + b + '</svg>';
  }
  function svgBlob(id, cb) {
    var svg = document.getElementById(id), vb = svg.viewBox.baseVal, img = new Image(), k = 2;
    img.onload = function () {
      var c = document.createElement('canvas'); c.width = vb.width * k; c.height = vb.height * k;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(cb, 'image/png');
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
  }
  function cardAction(id, how) {
    svgBlob(id, function (bl) {
      var name = 'promptestates-' + new Date().toISOString().slice(0, 10) + '.png', file = new File([bl], name, { type: 'image/png' });
      var text = t('cardShareText') + ' — https://promptestates.com/pro/';
      if (how === 'share' && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], text: text }).catch(function () {});
        return;
      }
      var a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      if (how === 'share') window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');   // desktop: image saved, WhatsApp opens for the message
    });
  }

  // ------------------------------------------------------------------ Ask tab: the PromptEstates app chat
  // Same AI, limits and chat history as the mobile app (pro_api /api/v1/chat/*): a chat started here continues in the app.
  var CHAT = { id: null, msgs: [], busy: false, welcome: null, pending: null };
  var ICO_SEND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  var ICO_NEW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  function askBox() {   // entry point on the market page: opens the chat with the question
    return '<form class="ask" id="ask-form"><input id="ask-q" autocomplete="off" placeholder="' + esc(t('askPh')) + '"><button class="btn" type="submit">' + t('askBtn') + '</button></form>';
  }
  function wireAsk() {
    var f = $('#ask-form'); if (!f) return;
    f.onsubmit = function (e) { e.preventDefault(); var q = $('#ask-q').value.trim(); if (!q) return; CHAT = { id: null, msgs: [], busy: false, welcome: CHAT.welcome, pending: q }; location.hash = '#/ask'; };
  }
  function chatMsg(m, i) {
    if (m.role === 'user') return '<div class="cm cm-user"><span>' + esc(m.text) + '</span></div>';
    if (m.wait) return '<div class="cm cm-ai cm-wait"><span class="shimmer">' + t('askWait') + '</span></div>';
    var cta = '';
    if (m.limit === 'guest') cta = '<div class="cm-cta"><button type="button" class="btn" data-chat-in>' + t('signIn') + '</button></div>';
    else if (m.limit === 'free' && !APP) cta = '<div class="cm-cta"><a class="btn" href="#/pricing">' + t('lockSee') + '</a></div>';
    var prev = CHAT.msgs[i - 1], svg = !m.error && m.text ? answerSvg('cm-card-' + i, prev && prev.role === 'user' ? prev.text : t('chatHi'), m.text) : '';
    var cardH = svg ? '<figure class="cm-card">' + svg + '<figcaption><button type="button" class="cm-act" data-card="cm-card-' + i + '" data-how="share">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13"/></svg>' + t('cardShare') + '</button>' +
      '<button type="button" class="cm-act" data-card="cm-card-' + i + '" data-how="png"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>' + t('cardPng') + '</button></figcaption></figure>' : '';
    return '<div class="cm cm-ai">' + (m.error ? '<p class="note">' + esc(m.text) + '</p>' : md(m.text || '')) + cardH + cta + '</div>';
  }
  function chatRender() {
    var sc = $('#chat-scroll'); if (!sc) return;
    if (!CHAT.msgs.length) {
      sc.innerHTML = '<div class="chat-hello"><h1>' + t('chatHi') + '</h1><p>' + t('askSub') + '</p></div>';
    } else sc.innerHTML = CHAT.msgs.map(function (m, i) { return chatMsg(m, i); }).join('');
    sc.querySelectorAll('[data-card]').forEach(function (b) { b.onclick = function () { cardAction(b.dataset.card, b.dataset.how); }; });
    var last = CHAT.msgs[CHAT.msgs.length - 1];
    var btns = !CHAT.msgs.length ? (CHAT.welcome || []) : (last && last.role === 'assistant' && !CHAT.busy ? last.btns || [] : []);
    $('#chat-chips').innerHTML = btns.map(function (b) { return '<button type="button" class="chat-chip" data-q="' + esc(b.text) + '">' + esc(b.title) + '</button>'; }).join('');
    sc.querySelectorAll('[data-chat-in]').forEach(function (b) { b.onclick = function () { openSignIn(); }; });
    sc.scrollTop = sc.scrollHeight;
    var main = $('.chat-main'); if (main && CHAT.msgs.length) main.scrollIntoView({ block: 'end' });
  }
  function chatSend(q) {
    q = (q || '').trim(); if (!q || CHAT.busy) return;
    track('ask_question', { city: CITY });
    CHAT.busy = true; CHAT.msgs.push({ role: 'user', text: q }, { role: 'assistant', wait: true }); chatRender();
    api('/api/v1/chat/message', { message: q, chatId: CHAT.id, client: 'web', city: CITY, lang: lang }).then(function (r) {
      CHAT.id = r.chatId; CHAT.msgs[CHAT.msgs.length - 1] = { role: 'assistant', text: r.message, btns: r.actionButtons, limit: r.limit };
      if (location.hash.indexOf(CHAT.id) < 0) history.replaceState(null, '', '#/ask/' + CHAT.id);
      if (USER) chatList();
    }).catch(function (e) {
      CHAT.msgs[CHAT.msgs.length - 1] = { role: 'assistant', error: true, text: e.status === 429 ? t('chatBusy') : t('askErr') };
    }).then(function () { CHAT.busy = false; chatRender(); var i = $('#chat-q'); if (i && matchMedia('(hover:hover)').matches) i.focus(); });
  }
  function chatList() {
    var box = $('#chat-list'); if (!box) return;
    if (!USER) { box.innerHTML = '<p class="chat-empty">' + t('chatGuest') + '</p>'; return; }
    api('/api/v1/personal/chats/', null, 'GET').then(function (r) {
      var rows = (r.data || []).slice(0, 40);
      box.innerHTML = rows.length ? rows.map(function (c) {
        return '<button type="button" class="chat-item' + (c.chat_id === CHAT.id ? ' on' : '') + '" data-chat="' + esc(c.chat_id) + '"><b>' + esc(c.title) + '</b><span>' + fdate(c.last_message_at) + '</span></button>';
      }).join('') : '<p class="chat-empty">' + t('chatEmpty') + '</p>';
      box.querySelectorAll('[data-chat]').forEach(function (b) { b.onclick = function () { location.hash = '#/ask/' + b.dataset.chat; }; });
    }).catch(function () { box.innerHTML = ''; });
  }
  function chatOpen(id) {
    if (!USER || id === CHAT.id && CHAT.msgs.length) { chatRender(); return; }
    CHAT = { id: id, msgs: [{ role: 'assistant', wait: true }], busy: true, welcome: CHAT.welcome }; chatRender();
    api('/api/v1/personal/chats/' + encodeURIComponent(id), null, 'GET').then(function (r) {
      CHAT.msgs = (r.data || []).map(function (m) {
        return m.role === 'user' ? { role: 'user', text: m.message } : { role: 'assistant', text: m.message, btns: m.chat_response && m.chat_response.actionButtons };
      });
    }).catch(function () { CHAT.id = null; CHAT.msgs = []; history.replaceState(null, '', '#/ask'); }).then(function () { CHAT.busy = false; chatRender(); });
  }
  function vAsk(id) {
    page('<div class="chat-app">' +
      '<aside class="chat-rail"><button type="button" class="chat-new" data-chat-new>' + ICO_NEW + '<span>' + t('chatNew') + '</span></button>' +
      '<p class="chat-rail-h">' + t('chatHist') + '</p><div class="chat-list" id="chat-list"></div></aside>' +
      '<section class="chat-main"><div class="chat-top"><button type="button" class="chip" data-chat-new>' + ICO_NEW + ' ' + t('chatNew') + '</button></div>' +
      '<div class="chat-scroll" id="chat-scroll" aria-live="polite"></div>' +
      '<div class="chat-chips" id="chat-chips"></div>' +
      '<form class="chat-input" id="chat-form"><input id="chat-q" autocomplete="off" enterkeyhint="send" placeholder="' + esc(t('chatPh')) + '" aria-label="' + esc(t('chatPh')) + '">' +
      '<button type="submit" class="chat-send" aria-label="' + t('askBtn') + '">' + ICO_SEND + '</button></form>' +
      '<p class="chat-note">' + t('chatNote') + '</p></section></div>');
    // full-screen chat under the header, like the app
    var fit = function () { var tp = $('.top'), tb = $('#tabbar'); document.documentElement.style.setProperty('--top-h', (tp ? tp.offsetHeight : 64) + 'px');
      document.documentElement.style.setProperty('--bar-h', (tb && getComputedStyle(tb).display !== 'none' ? tb.offsetHeight : 0) + 'px'); };
    document.documentElement.classList.add('ask-full'); fit();
    if (!window._askFit) { window._askFit = true; window.addEventListener('resize', function () { if (document.documentElement.classList.contains('ask-full')) fit(); }); }
    $('#chat-form').onsubmit = function (e) { e.preventDefault(); var i = $('#chat-q'); chatSend(i.value); i.value = ''; };
    $('#chat-chips').onclick = function (e) { var b = e.target.closest('[data-q]'); if (b) chatSend(b.dataset.q); };
    view.querySelectorAll('[data-chat-new]').forEach(function (b) { b.onclick = function () { CHAT = { id: null, msgs: [], busy: false, welcome: CHAT.welcome }; history.replaceState(null, '', '#/ask'); chatRender(); chatList(); $('#chat-q').focus(); }; });
    if (!CHAT.welcome || CHAT.welcomeFor !== lang + CITY) { var wf = lang + CITY; api('/api/v1/variables/supported_btns?lang=' + lang + '&city=' + CITY, null, 'GET').then(function (r) { CHAT.welcome = r.supported_btns; CHAT.welcomeFor = wf; if (!CHAT.msgs.length) chatRender(); }).catch(function () {}); }
    if (id && id !== CHAT.id) chatOpen(id); else chatRender();
    chatList();
    if (CHAT.pending) { var q = CHAT.pending; CHAT.pending = null; chatSend(q); }
  }

  // fair price from comparable sales (client-side, no AI)
  function fairPrice(p, beds, size, asking) {
    var since = new Date(Date.now() - 183 * 864e5).toISOString().slice(0, 10);
    var ok = function (b, s, d) { return b === beds && d >= since && (!size || Math.abs(s - size) <= 0.2 * size); };
    var done = function (list, scope) {
      if (list.length < 5) return { error: t('fewComps') };
      var ppm = list.map(function (c) { return c.ppm; }).sort(function (a, b) { return a - b; });
      var q = function (f) { var i = (ppm.length - 1) * f, lo = Math.floor(i); return ppm[lo] + (ppm[Math.min(lo + 1, ppm.length - 1)] - ppm[lo]) * (i - lo); };
      var sz = size || median(list.map(function (c) { return c.size; }));
      var r = { n: list.length, scope: scope, low: q(.25) * sz, mid: q(.5) * sz, high: q(.75) * sz, ppm: q(.5) };
      if (asking) r.vs = 100 * (asking / r.mid - 1);
      return r;
    };
    var comps = (p.recent || []).filter(function (r) { return ok(r[1], r[2], r[0]); }).map(function (r) { return { size: r[2], ppm: r[4] }; });
    if (comps.length >= 5 || !p.area) return Promise.resolve(done(comps, t('scopeProj')));
    return get('t/' + p.area + '.json').then(function (rows) {
      return done(rows.filter(function (r) { return ok(r[2], r[3], r[0]); }).map(function (r) { return { size: r[3], ppm: r[5] }; }), t('scopeArea'));
    });
  }

  // ------------------------------------------------------------------ views
  var view = $('#view');
  var lmap = null;
  function page(html) { document.documentElement.classList.remove('ask-full'); charts.forEach(function (c) { c.destroy(); }); charts = []; if (lmap) { lmap.remove(); lmap = null; } view.innerHTML = html; view.classList.remove('v-in'); void view.offsetWidth; view.classList.add('v-in'); window.scrollTo(0, 0); }
  function kpi(label, value, extra) {
    value = String(value).replace(/^AED /, '<small class="u-pre">AED</small>').replace(/ ((?:млрд|млн|bn|m)(?: AED)?)$/, '<small class="u-suf">$1</small>');
    return '<div class="kpi"><span>' + esc(label) + '</span><b>' + value + '</b>' + (extra || '') + '</div>';
  }
  function skeleton() {
    return '<div class="skel" aria-busy="true"><span class="sr">' + t('loadingA') + '</span><div class="sk sk-h"></div><div class="sk sk-s"></div><div class="kpis">' +
      '<div class="sk sk-k"></div>'.repeat(6) + '</div><div class="sk sk-c"></div></div>';
  }
  function lastN(series, n) { return series.slice(-n); }
  function sum(series, i) { return series.reduce(function (s, r) { return s + (r[i] || 0); }, 0); }

  function marketCharts(series, hostVol, hostOff, hostRent) {
    var s = series.slice(-36);
    var labels = s.map(function (r) { return r[0]; });
    chart(hostVol, { data: { labels: labels, datasets: [
      { type: 'bar', label: t('sales'), data: s.map(function (r) { return r[1]; }), backgroundColor: css('--accent') + '66', yAxisID: 'y' },
      { type: 'line', label: t('price') + ', AED/' + uLabel(), data: s.map(function (r) { return ppmv(r[3]); }), borderColor: css('--accent'), backgroundColor: css('--accent'), tension: .3, pointRadius: 0, yAxisID: 'y1' }
    ] }, options: baseOpts({ scales: { x: { grid: { display: false }, ticks: xTicks() },
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
      { k: 'mort_share', h: t('mortS'), num: 1, f: function (a) { return a.mort_share == null ? '—' : a.mort_share + '%'; } },
      { k: 'r1', h: t('rent') + ' 1BR', num: 1, v: function (a) { return a.rent['1']; }, f: function (a) { return fmt(a.rent['1']); } },
      { k: 'y1', h: t('yld1'), num: 1, v: function (a) { return a.yld['1']; }, f: function (a) { return a.yld['1'] ? fmt(a.yld['1'], 1) + '%' : '—'; } },
      { k: 'projects', h: t('activeProj'), num: 1 }
    ];
  }

  function vMarket() {
    page(skeleton());
    Promise.all([get('market.json'), get('areas.json')]).then(function (d) {
      var m = d[0], areas = d[1], s = m.all, l12 = lastN(s, 12), p12 = s.slice(-24, -12);
      var ppm12 = median(l12.map(function (r) { return r[3]; }).filter(Boolean)), ppmP = median(p12.map(function (r) { return r[3]; }).filter(Boolean));
      var n12 = sum(l12, 1), off = sum(l12, 6), v12 = sum(l12, 2) * 1e6, rent12 = median(l12.map(function (r) { return r[9]; }).filter(Boolean));
      var ylds = areas.map(function (a) { return a.yld['1']; }).filter(Boolean);
      page('<h1 class="page">' + t('marketH') + '</h1><p class="sub">' + t('marketSub') + '</p>' + askBox() + '<div class="kpis">' +
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
      wireAsk();
    });
  }

  function vAreas() {
    get('areas.json').then(function (areas) {
      page('<h1 class="page">' + t('areasH') + '</h1><p class="sub">' + t('areasSub') + '</p><div class="filters"><input type="search" id="q" placeholder="' + t('search') + '"></div><div id="tbl"></div>');
      var tb = table($('#tbl'), areaCols(), areas, { sort: 'n12', per: 50 });
      $('#q').oninput = function () { var q = this.value.toLowerCase(); tb.set(areas.filter(function (a) { return (a.name + ' ' + (a.community || '')).toLowerCase().indexOf(q) >= 0; })); };
    });
  }

  // ------------------------------------------------------------------ Abu Dhabi (ADREC)
  var AD_NAMES = { 'Al Hidayriyyat': 'Hudayriyat Island', 'Al Rahah': 'Al Raha', 'Mohamed Bin Zayed City': 'MBZ City', 'Al Saadiyat Island': 'Saadiyat Island', 'Al Maryah Island': 'Al Maryah Island (ADGM)' };
  var adName = function (n) { return AD_NAMES[n] || n; };
  var adSlug = function (n) { return n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };
  function adSource(meta) { return t('adSrc').replace('{m}', meta.sales_months.replace(/ - /g, '-')).replace('{q}', fdate(meta.prices_quarter_end)); }
  function adCols() {
    return [
      { k: 'name', h: t('navAreas'), v: function (a) { return adName(a.name); }, f: function (a) { return '<a href="#/adarea/' + adSlug(a.name) + '">' + esc(adName(a.name)) + '</a><small class="muted"> ' + esc(a.municipality || '') + '</small>'; } },
      { k: 'n12', h: t('sales12'), num: 1, f: function (a) { return fmt(a.n12); } },
      { k: 'v12', h: t('value12'), num: 1, f: function (a) { return aed(a.v12 * 1e6); } },
      { k: 'avg_aed', h: t('adAvg'), num: 1, f: function (a) { return a.avg_aed ? aed(a.avg_aed) : '—'; } },
      { k: 'ppm_a', h: t('adPpm').replace('м²', uLabel()).replace('m²', uLabel()), num: 1, v: function (a) { return a.ppm && a.ppm.apt ? a.ppm.apt[0] : null; }, f: function (a) { return a.ppm && a.ppm.apt ? fmt(ppmv(a.ppm.apt[0])) : '—'; } },
      { k: 'off12', h: t('off12'), num: 1, f: function (a) { return a.off12 == null ? '—' : a.off12 + '%'; } },
      { k: 'yoy_value', h: t('yoy'), num: 1, f: function (a) { return a.yoy_value == null ? '—' : pctTag(a.yoy_value); } },
      { k: 'y1', h: t('grossYield') + ' 1BR', num: 1, v: function (a) { return a.yld.A1; }, f: function (a) { return a.yld.A1 ? fmt(a.yld.A1, 1) + '%' : '—'; } }
    ];
  }
  var ADM = store('pro_adm') || 'yoy_value';
  var CITY = ['ad', 'shj'].indexOf(store('pro_city')) >= 0 ? store('pro_city') : 'dxb';
  function setCity(c) { if (c === CITY) return; CITY = c; store('pro_city', c); chrome(); route(); }
  function adVal(a, m) { return m === 'y1' ? a.yld.A1 : m === 'ppm' ? (a.ppm && a.ppm.apt ? a.ppm.apt[0] : null) : a[m]; }
  function adFmt(v, m) { return v == null ? '—' : m === 'ppm' ? 'AED ' + fmt(ppmv(v)) + '/' + uLabel() : m === 'yoy_value' ? (v >= 0 ? '+' : '') + fmt(v, 1) + '%' : fmt(v, m === 'y1' ? 1 : 0) + '%'; }
  function adMapInit(areas) {
    var host = $('#admap'); if (!host) return;
    if (lmap) { lmap.remove(); lmap = null; }
    var cv = document.createElement('canvas');
    if (!window.maplibregl || !(cv.getContext('webgl2') || cv.getContext('webgl'))) { host.outerHTML = '<div class="empty">' + mt('noGl') + '</div>'; return; }
    var pts = areas.filter(function (a) { return a.ll && a.n12 > 0; });
    var vals = pts.map(function (a) { return adVal(a, ADM); }).filter(function (v) { return v != null; }).sort(function (a, b) { return a - b; });
    var q = function (f) { return vals.length ? vals[Math.floor((vals.length - 1) * f)] : 0; };
    var lo = q(.05), hi = q(.95), div = ADM === 'yoy_value';
    if (div) { var mx = Math.min(150, Math.max(Math.abs(lo), Math.abs(hi))) || 1; lo = -mx; hi = mx; }
    var nMax = Math.max.apply(null, pts.map(function (a) { return a.n12; }));
    var fc = { type: 'FeatureCollection', features: pts.map(function (a) {
      var v = adVal(a, ADM);
      return { type: 'Feature', geometry: { type: 'Point', coordinates: [a.ll[1], a.ll[0]] },
        properties: { name: adName(a.name), slug: adSlug(a.name), n: a.n12, r: 5 + 30 * Math.sqrt(a.n12 / nMax), c: v == null ? '#7a858c' : rampColor(Math.max(0, Math.min(1, (v - lo) / ((hi - lo) || 1))), div),
          v: adFmt(v, ADM), val: aed(a.v12 * 1e6), avg: a.avg_aed ? aed(a.avg_aed) : '—', off: a.off12 == null ? '—' : a.off12 + '%' } };
    }) };
    var dark = document.documentElement.getAttribute('data-theme') !== 'light';
    var map = lmap = new maplibregl.Map({ container: 'admap', style: 'https://tiles.openfreemap.org/styles/' + (dark ? 'dark' : 'positron'),
      center: [54.5, 24.45], zoom: 9.3, attributionControl: false, preserveDrawingBuffer: true, cooperativeGestures: matchMedia('(pointer: coarse)').matches });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: 'ADREC · <a href="https://openfreemap.org">OpenFreeMap</a> · © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }), 'bottom-right');
    map.on('load', function () {
      map.addSource('ad', { type: 'geojson', data: fc });
      map.addLayer({ id: 'ad-c', type: 'circle', source: 'ad', paint: { 'circle-radius': ['get', 'r'], 'circle-color': ['get', 'c'], 'circle-opacity': .78,
        'circle-stroke-width': 1.2, 'circle-stroke-color': dark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.35)' } });
      map.addLayer({ id: 'ad-l', type: 'symbol', source: 'ad', filter: ['>=', ['get', 'n'], 300], layout: { 'text-field': ['get', 'name'], 'text-size': 11, 'text-offset': [0, 1.6], 'text-font': ['Noto Sans Regular'] },
        paint: { 'text-color': dark ? '#e8f1f5' : '#14313c', 'text-halo-color': dark ? 'rgba(0,0,0,.7)' : 'rgba(255,255,255,.85)', 'text-halo-width': 1.2 } });
      map.on('mouseenter', 'ad-c', function () { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'ad-c', function () { map.getCanvas().style.cursor = ''; });
      map.on('click', 'ad-c', function (e) {
        var p = e.features[0].properties;
        new maplibregl.Popup({ closeButton: true, maxWidth: '260px' }).setLngLat(e.lngLat).setHTML('<div class="ad-pop"><b>' + esc(p.name) + '</b><span>' + t('sales12') + ': ' + fmt(p.n) + '</span><span>' + t('value12') + ': ' + esc(p.val) + '</span>' +
          '<span>' + t('adAvg') + ': ' + esc(p.avg) + '</span><span>' + t('off12') + ': ' + esc(p.off) + '</span><span>' + esc(t('adM')[ADM]) + ': <b>' + esc(p.v) + '</b></span><a href="#/adarea/' + p.slug + '">' + t('adOpen') + ' →</a></div>').addTo(map);
      });
    });
    var leg = $('#adleg');
    if (leg) {
      var stops = [0, .25, .5, .75, 1].map(function (k) { return rampColor(k, div); }).join(',');
      leg.innerHTML = '<div class="adl-row"><b>' + esc(t('adM')[ADM]) + '</b><span class="adl-v">' + esc(adFmt(lo, ADM)) + '</span><i class="adl-grad" style="background:linear-gradient(90deg,' + stops + ')"></i><span class="adl-v">' + esc(adFmt(hi, ADM)) + '</span></div>' +
        '<div class="adl-row adl-sub"><span><i class="adl-dot"></i>' + esc(t('adLegNo')) + '</span><span><i class="adl-size"></i>' + esc(t('adLegSize')) + '</span>' +
        (ADM === 'ppm' ? '<span>' + esc(t('adPpmNote').replace('{p}', 'H1 2026')) + '</span>' : div ? '<span>' + esc(t('adLegDiv')) + '</span>' : '') + '</div>';
    }
  }
  // Abu Dhabi versions of the Market, Map and Areas tabs (city switch in the header)
  function vAD(part) {
    page(skeleton());
    Promise.all([get('ad/areas.json'), get('ad/market.json')]).then(function (d) {
      var meta = d[0].meta, areas = d[0].areas, mk = d[1], qs = Object.keys(mk).sort().slice(-12);
      var off = areas.reduce(function (s, a) { return s + (a.off12 || 0) * a.n12; }, 0) / Math.max(1, meta.sales_12m);
      var last4 = meta.yoy_quarters[0], prev4 = meta.yoy_quarters[1], sq = function (l) { return l.reduce(function (s, q) { return s + ((mk[q] || {}).value || 0); }, 0); };
      var yoy = sq(prev4) ? 100 * (sq(last4) / sq(prev4) - 1) : null;
      var pro = isPro(), shown = part === 'areas' && pro ? areas : areas.slice(0, 10);
      var kpis = '<div class="kpis">' + kpi(t('sales12'), fmt(meta.sales_12m)) + kpi(t('value12'), aed(meta.value_12m_aed_m * 1e6), pctTag(yoy) + ' <i>' + t('adYoy') + '</i>') +
        kpi(t('adAvg'), aed(meta.value_12m_aed_m * 1e6 / meta.sales_12m)) + kpi(t('off12'), fmt(off) + '%') + kpi(t('navAreas'), fmt(meta.districts)) + '</div>';
      var chartP = '<div class="panel"><h2>' + t('adQ') + '</h2><p class="hint">' + t('adQs') + '</p><div class="chart"><canvas id="c1"></canvas></div></div>';
      var mapP = '<div class="panel">' + (part === 'map' ? '' : '<p class="hint">' + t('adMapHint') + '</p>') + '<div class="ad-chips" id="adm">' +
        Object.keys(t('adM')).map(function (k) { return '<button type="button" class="chip" data-adm="' + k + '" aria-pressed="' + (k === ADM) + '">' + t('adM')[k] + '</button>'; }).join('') +
        '</div><div class="ad-map' + (part === 'map' ? ' ad-map-big' : '') + '" id="admap"></div><div class="ad-legend" id="adleg"></div></div>';
      var tblP = '<div class="panel"><h2>' + t('adDist') + '</h2><p class="hint">' + t('adNote') + ' ' + esc(t('adPpmNote').replace('{p}', meta.ppm_period || 'H1 2026')) + '</p>' +
        '<div class="filters"><input type="search" id="q" placeholder="' + t('search') + '"></div><div id="tbl"></div>' +
        (part === 'market' ? '<div class="actions center"><a class="btn btn-ghost" href="#/areas">' + t('adAll') + ' →</a></div>' :
          pro ? '' : '<div class="actions center"><a class="btn" href="#/pricing">' + esc(t('adMore').replace('{n}', areas.length - shown.length)) + '</a></div>') + '</div>';
      var head = { market: [t('adH'), t('adSub')], map: [t('adMapH'), t('adMapHint')], areas: [t('adDist'), t('adSub')] }[part];
      page('<h1 class="page">' + head[0] + '</h1><p class="sub">' + head[1] + '</p>' +
        (part === 'market' ? kpis + chartP + tblP : part === 'map' ? mapP : tblP) + '<p class="note">' + esc(adSource(meta)) + '</p>');
      if ($('#tbl')) {
        var tb = table($('#tbl'), adCols(), shown, { sort: 'v12', per: 50 });
        $('#q').oninput = function () { var q = this.value.toLowerCase(); tb.set(shown.filter(function (a) { return (a.name + ' ' + adName(a.name)).toLowerCase().indexOf(q) >= 0; })); };
      }
      if ($('#admap')) {
        adMapInit(areas);
        view.querySelectorAll('[data-adm]').forEach(function (b) { b.onclick = function () { ADM = b.dataset.adm; store('pro_adm', ADM); view.querySelectorAll('[data-adm]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); adMapInit(areas); }; });
      }
      if ($('#c1')) {
        var labels = qs.map(function (q, i) { return q + (i === qs.length - 1 ? ' (' + t('adPart') + ')' : ''); });
        chart($('#c1'), { data: { labels: labels, datasets: [
          { type: 'bar', label: t('value12').replace(/,.*$/, '') + ', AED bn', data: qs.map(function (q) { return +(mk[q].value / 1e9).toFixed(2); }), backgroundColor: css('--accent') + '88', yAxisID: 'y' },
          { type: 'line', label: t('sales'), data: qs.map(function (q) { return mk[q].count; }), borderColor: css('--warn'), backgroundColor: css('--warn'), tension: .3, pointRadius: 2, yAxisID: 'y1' }
        ] }, options: baseOpts({ scales: { x: { grid: { display: false }, ticks: { color: css('--muted') } }, y: { position: 'left', grid: { color: css('--line') }, ticks: { color: css('--muted') } },
          y1: { position: 'right', grid: { display: false }, ticks: { color: css('--muted') } } } }) });
      }
    }).catch(function () { page('<div class="empty">' + t('apiDown') + '</div>'); });
  }
  // Sharjah: SRERD reported totals (no open transaction data)
  function vSHJ() {
    page(skeleton());
    get('shj/market.json').then(function (d) {
      var P = {}; d.periods.forEach(function (p) { P[p.period] = p; });
      var cur = P['2026-9M'] || {}, fy = P['2025'] || {}, h1 = P['2026-H1'] || {};
      page('<h1 class="page">' + t('shjH') + '</h1><p class="sub">' + t('shjSub') + '</p><div class="kpis">' +
        kpi(t('shjVal9'), aed(cur.value_bn * 1e9), cur.yoy_value_pct != null ? pctTag(cur.yoy_value_pct) + ' <i>' + t('yoy') + '</i>' : '') +
        kpi(t('shjTx9'), fmt(cur.transactions), cur.yoy_transactions_pct != null ? pctTag(cur.yoy_transactions_pct) + ' <i>' + t('yoy') + '</i>' : '') +
        kpi(t('shjSales9'), fmt(cur.sales), cur.sales_value_bn ? '<i>' + aed(cur.sales_value_bn * 1e9) + '</i>' : '') +
        kpi(t('shjMortH1'), fmt(h1.mortgages), h1.mortgage_value_bn ? '<i>' + aed(h1.mortgage_value_bn * 1e9) + '</i>' : '') +
        kpi(t('shjFY'), aed(fy.value_bn * 1e9), '<i>' + fmt(fy.transactions) + ' ' + t('shjDeals') + '</i>') + '</div>' +
        '<div class="panel"><h2>' + t('shjMonths') + '</h2><p class="hint">' + t('shjMonthsHint') + '</p><div class="chart"><canvas id="c1"></canvas></div></div>' +
        '<div class="panel"><p class="hint">' + esc(d.meta.note) + '</p><p class="note">' + t('shjSrc') + ' ' +
        d.sources.slice(0, 4).map(function (u, i) { return '<a href="' + esc(u) + '" target="_blank" rel="noopener">[' + (i + 1) + ']</a>'; }).join(' ') + '</p></div>');
      var ms = d.months;
      chart($('#c1'), { data: { labels: ms.map(function (m) { return mlabel(m.month); }), datasets: [
        { type: 'bar', label: t('value12').replace(/,.*$/, '') + ', AED bn', data: ms.map(function (m) { return m.value_bn; }), backgroundColor: css('--accent') + '88', yAxisID: 'y' },
        { type: 'line', label: t('sales'), data: ms.map(function (m) { return m.transactions || null; }), borderColor: css('--warn'), backgroundColor: css('--warn'), spanGaps: true, tension: .3, pointRadius: 3, yAxisID: 'y1' }
      ] }, options: baseOpts({ scales: { x: { grid: { display: false }, ticks: { color: css('--muted') } }, y: { position: 'left', grid: { color: css('--line') }, ticks: { color: css('--muted') } },
        y1: { position: 'right', grid: { display: false }, ticks: { color: css('--muted') } } } }) });
    }).catch(function () { page('<div class="empty">' + t('apiDown') + '</div>'); });
  }
  function vSHJNone() {
    page('<div class="lock"><h1 class="page">' + t('shjNoneH') + '</h1><p class="sub">' + t('shjNoneSub') + '</p><div class="actions center">' +
      '<button type="button" class="btn" data-city-go="dxb">' + t('adToDxb') + '</button><a class="chip" href="#/">' + t('shjH') + '</a></div></div>');
  }

  function vADNone() {
    page('<div class="lock"><h1 class="page">' + t('adNoneH') + '</h1><p class="sub">' + t('adNoneSub') + '</p><div class="actions center">' +
      '<button type="button" class="btn" data-city-go="dxb">' + t('adToDxb') + '</button><a class="chip" href="#/">' + t('adToMarket') + '</a></div></div>');
  }
  function vADArea(slug) {
    get('ad/areas.json').then(function (d) {
      var a = d.areas.filter(function (x) { return adSlug(x.name) === slug; })[0];
      if (!a) { page('<div class="empty">' + t('none') + '</div>'); return; }
      var order = ['S', '1', '2', '3', '4', '5+'], rows = [];
      [['A', t('adApt')], ['V', t('adVilla')]].forEach(function (tp) {
        order.forEach(function (k) { var v = a.prices[tp[0] + k]; if (v && (v.price || v.rent)) rows.push({ k: tp[1] + ' · ' + roomsLabel(k === '5+' ? '5+' : k), price: v.price, rent: v.rent, y: a.yld[tp[0] + k] }); });
      });
      page('<div class="crumbs"><a href="#/ad">' + t('navAD') + '</a> /</div><h1 class="page">' + esc(adName(a.name)) + '</h1><p class="sub">' + esc(a.municipality || '') + ' · ADREC</p><div class="kpis">' +
        kpi(t('sales12'), fmt(a.n12)) + kpi(t('value12'), aed(a.v12 * 1e6), a.yoy_value == null ? '' : pctTag(a.yoy_value) + ' <i>' + t('adYoy') + '</i>') +
        kpi(t('adAvg'), a.avg_aed ? aed(a.avg_aed) : '—') + kpi(t('off12'), a.off12 == null ? '—' : a.off12 + '%') +
        kpi(t('grossYield') + ' 1BR', a.yld.A1 ? fmt(a.yld.A1, 1) + '%' : '—') +
        (a.ppm && a.ppm.apt ? kpi(t('adPpm').replace('м²', uLabel()).replace('m²', uLabel()), 'AED ' + fmt(ppmv(a.ppm.apt[0])), '<i>max ' + fmt(ppmv(a.ppm.apt[1])) + '</i>') : '') +
        (a.ppm && a.ppm.villa ? kpi(t('adPpmV').replace('м²', uLabel()).replace('m²', uLabel()), 'AED ' + fmt(ppmv(a.ppm.villa[0])), '<i>max ' + fmt(ppmv(a.ppm.villa[1])) + '</i>') : '') + '</div>' +
        '<div class="panel"><h2>' + t('adPrices') + '</h2><p class="hint">' + t('adNote') + '</p><div id="tbl"></div></div><p class="note">' + esc(adSource(d.meta)) + '</p>');
      table($('#tbl'), [
        { k: 'k', h: t('rooms') },
        { k: 'price', h: t('adPrice'), num: 1, f: function (r) { return r.price ? fmt(r.price) : '—'; } },
        { k: 'rent', h: t('adRent'), num: 1, f: function (r) { return r.rent ? fmt(r.rent) : '—'; } },
        { k: 'y', h: t('grossYield'), num: 1, f: function (r) { return r.y ? fmt(r.y, 1) + '%' : '—'; } }
      ], rows, { per: 20 });
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
        kpi(t('off12'), a.off12 == null ? '—' : a.off12 + '%') + (a.mort12 ? kpi(t('mort12'), fmt(a.mort12), '<i>' + esc(t('mortOf').replace('{x}', a.mort_share)) + '</i>') : '') + kpi(t('rent') + ' 1BR', 'AED ' + fmt(a.rent['1'])) + kpi(t('grossYield') + ' 1BR', a.yld['1'] ? fmt(a.yld['1'], 1) + '%' : '—') + '</div>' +
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
      { k: 'end', h: t('handover'), f: function (p) { var d = (p.end || p.done || '').slice(0, 7); return d ? esc(mlabel(d)) : '—'; } },
      { k: 'units', h: t('units'), num: 1, f: function (p) { return fmt(p.units || p.villas); } },
      { k: 'n12', h: t('sales12'), num: 1, f: function (p) { return fmt(p.n12); } },
      { k: 'ppm12', h: 'AED/' + uLabel(), num: 1, f: function (p) { return fmt(ppmv(p.ppm12)); } },
      { k: 'y1', h: t('yld1'), num: 1, v: function (p) { return p.yld && p.yld['1']; }, f: function (p) { return p.yld && p.yld['1'] ? fmt(p.yld['1'], 1) + '%' : '—'; } }
    ];
    if (areaNames) cols.splice(1, 0, { k: 'area', h: t('area'), v: function (p) { return areaNames[p.area] || ''; }, f: function (p) { var full = areaNames[p.area] || p.area || ''; return p.area ? '<a href="#/area/' + p.area + '" title="' + esc(full) + '">' + esc(full.replace(/ \(.*\)$/, '')) + '</a>' : '—'; } });
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
    page(skeleton());
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
        [t('start'), esc(fdate(p.start))], [t('handover'), esc(fdate(p.end || p.done))], [t('units'), fmt(p.units || p.villas)], [t('escrow'), esc(p.escrow || '—')]];
      page('<div class="crumbs"><a href="#/projects">' + t('navProjects') + '</a> /</div><h1 class="page">' + esc(p.name) + '</h1>' +
        (p.ar ? '<p class="sub" dir="rtl" style="text-align:start">' + esc(p.ar) + '</p>' : '<p class="sub"></p>') +
        '<div class="kpis">' + kpi(t('sales12'), fmt(p.n12)) + kpi(t('ppm') + ' ' + uLabel(), p.ppm12 ? 'AED ' + fmt(ppmv(p.ppm12)) : '—') +
        kpi(t('off12'), p.off12 == null ? '—' : p.off12 + '%') + kpi(t('pct'), p.pct == null ? '—' : fmt(p.pct) + '%') +
        kpi(t('grossYield') + ' 1BR' + (expected ? '*' : ''), p.yld && p.yld['1'] ? fmt(p.yld['1'], 1) + '%' : '—') + kpi(t('last'), esc(fdate(p.last))) + '</div>' +
        '<div class="actions"><button class="btn" id="memo-btn" type="button">✦ ' + t('memoBtn') + '</button></div><div id="memo"></div>' +
        '<div class="panel"><h2>' + t('registry') + '</h2>' + (p.pct != null ? '<div class="progress"><i style="width:' + p.pct + '%"></i></div>' : '') +
        '<dl class="meta-list">' + meta.map(function (m) { return '<div><dt>' + esc(m[0]) + '</dt><dd>' + m[1] + '</dd></div>'; }).join('') + '</dl></div>' +
        (p.series ? '<div class="panel"><h2>' + t('priceHist') + '</h2><p class="hint">AED/' + uLabel() + '</p><div class="chart"><canvas id="c1"></canvas></div></div>' : '') +
        (p.rooms ? '<div class="panel"><h2>' + t('byRooms') + '</h2>' + (expected ? '<p class="hint">' + t('expectedYield') + '</p>' : '') + '<div id="rooms"></div></div>' : '') +
        (p.recent ? '<div class="panel"><h2>' + t('fairH') + '</h2><p class="hint">' + t('fairSub') + '</p><form class="filters" id="fair-form">' +
          '<select id="fb">' + ['S', '1', '2', '3', '4', '5+'].map(function (k) { return '<option value="' + k + '"' + (k === '1' ? ' selected' : '') + '>' + roomsLabel(k) + '</option>'; }).join('') + '</select>' +
          '<input type="number" id="fs" placeholder="' + t('size') + ', ' + uLabel() + '"><input type="number" id="fa" placeholder="' + t('asking') + '">' +
          '<button class="btn" type="submit">' + t('calc') + '</button></form><div id="fair-out"></div></div>' +
          '<h2>' + t('recent') + '</h2><div id="tbl"></div>' : ''));
      if ($('#fair-form')) $('#fair-form').onsubmit = function (e) {
        e.preventDefault();
        var size = +$('#fs').value || null; if (size && unit !== 'm2') size = size / SQFT;
        fairPrice(p, $('#fb').value, size, +$('#fa').value || null).then(function (r) {
          var k = function (v) { return fmt(Math.round(v / 1e3) * 1e3); };
          $('#fair-out').innerHTML = r.error ? '<p class="note">' + r.error + '</p>' : '<div class="kpis">' +
            kpi(t('fairRange') + ', AED', k(r.low) + ' – ' + k(r.high)) +
            kpi(t('fairMid') + ', AED', k(r.mid), '<i>' + fmt(ppmv(r.ppm)) + ' AED/' + uLabel() + '</i>') +
            kpi(t('comps'), fmt(r.n), '<i>' + esc(r.scope) + '</i>') +
            (r.vs != null ? kpi(t('vsMarket'), '<span class="' + (r.vs > 5 ? 'down' : r.vs < -5 ? 'up' : '') + '">' + (r.vs >= 0 ? '+' : '') + fmt(r.vs, 1) + '%</span>') : '') + '</div>';
        });
      };
      $('#memo-btn').onclick = function () {
        var box = $('#memo'), btn = this; btn.disabled = true;
        box.innerHTML = '<div class="panel"><div class="loading">' + t('memoWait') + '</div></div>';
        api('/api/memo', { project: p.id, lang: lang }).then(function (r) {
          box.innerHTML = '<div class="panel memo"><div class="memo-head"><h2>' + t('memoH') + ': ' + esc(p.name) + '</h2><button class="chip" id="memo-print" type="button">' + t('print') + '</button></div>' + md(r.memo) + '</div>';
          $('#memo-print').onclick = function () { document.body.classList.add('printing-memo'); window.print(); document.body.classList.remove('printing-memo'); };
        }).catch(function () { box.innerHTML = '<div class="panel"><p class="note">' + t('askErr') + '</p></div>'; btn.disabled = false; });
      };
      if (p.series) {
        chart($('#c1'), { data: { labels: p.series.map(function (r) { return r[0]; }), datasets: [
          { type: 'line', label: t('price'), data: p.series.map(function (r) { return ppmv(r[2]); }), borderColor: css('--accent'), tension: .3, pointRadius: 2, yAxisID: 'y1' },
          { type: 'bar', label: t('sales'), data: p.series.map(function (r) { return r[1]; }), backgroundColor: css('--accent') + '44', yAxisID: 'y' }
        ] }, options: baseOpts({ scales: { x: { ticks: xTicks(), grid: { display: false } }, y: { position: 'right', grid: { display: false }, ticks: { color: css('--muted') } }, y1: { position: 'left', grid: { color: css('--line') }, ticks: { color: css('--muted') } } } }) });
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

  // ------------------------------------------------------------------ infographics (SVG cards, exportable as PNG)
  var IT = {
    ru: { h: 'Инфографика', sub: 'Рынок Дубая в картинках по данным DLD. Каждую карточку можно скачать в PNG для поста или презентации', png: 'PNG',
      k1: 'Рынок Дубая за 12 месяцев', k1s: 'Все зарегистрированные продажи DLD', sales: 'Сделок', value: 'Объём, AED', price: 'Медиана цены', yoy: 'за год', off: 'Доля off-plan',
      rent: 'Аренда {s}, AED/год', yld: 'Доходность {s}', spark: 'Сделки по месяцам, 24 мес.', bn: 'млрд',
      k2: 'Куда идут деньги', k2s: 'Топ-24 района по объёму продаж за 12 мес. Цвет — изменение цены за год',
      k3: 'Цена против доходности', k3s: 'Районы с наибольшим числом сделок за 12 мес. Размер — число сделок, цвет — доля off-plan', q1: 'Дешевле и доходнее', q2: 'Дороже, доходность ниже',
      offc: 'off-plan', ready: 'вторичка', axes: '↑ доходность {s} · → цена', segs: { all: 'Все', apt: 'Квартиры', S: 'Студии', '1': '1-спальные', '2': '2-спальные', '3': '3-спальные', '4+': '4+ спальни', villa: 'Виллы и таунхаусы' },
      segS: { all: '1BR', apt: '1BR', S: 'студий', '1': '1BR', '2': '2BR', '3': '3BR', '4+': '4BR+', villa: 'вилл' }, onlyU: ' — только квартиры', noData: 'Мало договоров аренды для этого типа', onlyV: ' — только виллы', noSeg: 'Фильтр не влияет на эту карточку',
      k4: 'Тепловая карта цен', k4s: 'Отклонение медианной цены месяца от медианы района за 12 мес., %. Последний столбец — за год',
      k5: 'Волна сдачи', k5s: 'Квартир и вилл в строящихся проектах по плановому году сдачи, реестр DLD', overdue: 'просрочено', later: 'позже', active: 'строится', notst: 'не начато', topH: 'Больше всего сдач',
      k6: 'Надёжность застройщиков', k6s: 'Топ-14 по продажам за 12 мес.: проекты сданные / строящиеся в срок / просроченные', fin: 'сдано', ontime: 'в срок', late: 'просрочено', lateP: '% просрочки',
      k7: 'Off-plan против вторички', k7s: 'Сделки по месяцам и наценка off-plan к готовому жилью (медиана цены за м²)', prem: 'наценка off-plan', share: 'доля off-plan за 12 мес.',
      src: 'PromptEstates Pro · данные DLD до ', k: ' тыс' },
    en: { h: 'Infographics', sub: 'The Dubai market at a glance, from DLD data. Download any card as PNG for a post or a deck', png: 'PNG',
      k1: 'Dubai market, last 12 months', k1s: 'All sales registered with DLD', sales: 'Sales', value: 'Value, AED', price: 'Median price', yoy: 'YoY', off: 'Off-plan share',
      rent: '{s} rent, AED/yr', yld: '{s} gross yield', spark: 'Monthly sales, 24 months', bn: 'bn',
      k2: 'Where the money goes', k2s: 'Top 24 areas by 12-month sales value. Colour: price change YoY',
      k3: 'Price vs yield', k3s: 'Most traded areas in 12 months. Size: number of sales, colour: off-plan share', q1: 'Cheaper, higher yield', q2: 'Pricier, lower yield',
      offc: 'off-plan', ready: 'ready', axes: '↑ {s} yield · → price', segs: { all: 'All', apt: 'Apartments', S: 'Studios', '1': '1-bed', '2': '2-bed', '3': '3-bed', '4+': '4+ bed', villa: 'Villas & townhouses' },
      segS: { all: '1BR', apt: '1BR', S: 'studio', '1': '1BR', '2': '2BR', '3': '3BR', '4+': '4BR+', villa: 'villa' }, onlyU: ' — apartments only', noData: 'Not enough rent contracts for this type', onlyV: ' — villas only', noSeg: 'The filter does not apply to this card',
      k4: 'Price heatmap', k4s: 'Monthly median price vs the area 12-month median, %. Last column: YoY',
      k5: 'Handover wave', k5s: 'Units in active projects by planned handover year, DLD registry', overdue: 'overdue', later: 'later', active: 'under construction', notst: 'not started', topH: 'Most handovers',
      k6: 'Developer reliability', k6s: 'Top 14 by 12-month sales: projects completed / on schedule / overdue', fin: 'completed', ontime: 'on schedule', late: 'overdue', lateP: '% overdue',
      k7: 'Off-plan vs ready', k7s: 'Monthly sales and the off-plan premium over ready homes (median price per m²)', prem: 'off-plan premium', share: 'off-plan share, 12 months',
      src: 'PromptEstates Pro · DLD data to ', k: 'k' }
  };
  var it = function (k) { return (IT[lang] || IT.en)[k]; };
  var P, META, W = 720, SEG = store('pro_seg') || 'all';
  var segT = function (k) { return it(k).replace('{s}', it('segS')[SEG]); };
  function pal() {
    var g = function (v, d) { var c = css(v); return /^#[0-9a-f]{3,6}$/i.test(c) ? c : d; };
    return { bg: g('--surface', '#11161a'), bg2: g('--surface-2', '#161c21'), text: g('--text', '#f2f5f7'), muted: g('--muted', '#8b979f'), line: css('--line-2') || '#333',
      accent: g('--accent', '#6bbfe0'), brand: g('--brand', '#114154'), good: g('--good', '#5fd49a'), bad: g('--bad', '#f07a6a'), warn: g('--warn', '#f0b35a') };
  }
  function hex(c) { c = c.replace('#', ''); if (c.length === 3) c = c.replace(/./g, '$&$&'); return [0, 2, 4].map(function (i) { return parseInt(c.substr(i, 2), 16); }); }
  function mix(a, b, k) { var x = hex(a), y = hex(b); k = Math.max(0, Math.min(1, k || 0)); return '#' + x.map(function (v, i) { return ('0' + Math.round(v + (y[i] - v) * k).toString(16)).slice(-2); }).join(''); }
  function trunc(x, n) { x = String(x || ''); return x.length > n ? x.slice(0, n - 1) + '…' : x; }
  function kfmt(v) { return v >= 1000 ? fmt(v / 1000, v >= 1e4 ? 0 : 1) + it('k') : fmt(v); }
  function mlabel(mo, short) { var d = new Date(mo + '-01T00:00:00'); return d.toLocaleString(loc() + '-u-nu-latn', short ? { month: 'short' } : { month: 'short', year: '2-digit' }); }
  function tx(x, y, str, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 14) + '"' + (o.w ? ' font-weight="' + o.w + '"' : '') + ' fill="' + (o.fill || P.text) + '"' +
      (o.anchor ? ' text-anchor="' + o.anchor + '"' : '') + (o.extra || '') + '>' + esc(str) + '</text>';
  }
  function box(x, y, w, h, fill, rx) { return '<rect x="' + x + '" y="' + y + '" width="' + Math.max(0, w) + '" height="' + Math.max(0, h) + '"' + (rx ? ' rx="' + rx + '"' : '') + ' fill="' + fill + '"/>'; }
  function legend(x, y, items) {
    return items.map(function (i) { var o = box(x, y - 10, 12, 12, i[0], 3) + tx(x + 18, y, i[1], { size: 12, fill: P.muted }); x += 34 + i[1].length * 7; return o; }).join('');
  }
  function wrapText(str, n) {
    var out = [''];
    str.split(' ').forEach(function (w) { var l = (out[out.length - 1] + ' ' + w).trim(); if (l.length > n && out[out.length - 1]) out.push(w); else out[out.length - 1] = l; });
    return out;
  }
  function card(id, h, title, sub, body, noSeg) {
    if (SEG !== 'all' && !noSeg) title += ' · ' + it('segs')[SEG];
    return '<div class="ig"><button class="chip ig-png" type="button" data-png="' + id + '">↓ ' + it('png') + '</button>' +
      '<svg id="' + id + '" viewBox="0 0 ' + W + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" font-family="Onest, -apple-system, Segoe UI, Roboto, sans-serif">' +
      box(0, 0, W, h, P.bg, 18) + tx(32, 50, title, { size: title.length > 40 ? 21 : title.length > 32 ? 24 : 28, w: 700 }) +
      wrapText(sub, 86).slice(0, 2).map(function (l, i) { return tx(32, 78 + i * 19, l, { size: 14, fill: P.muted }); }).join('') + body +
      tx(32, h - 22, it('src') + META.tx_date, { size: 12, fill: P.muted }) + tx(W - 32, h - 22, 'promptestates.com', { size: 13, w: 700, fill: P.accent, anchor: 'end' }) + '</svg></div>';
  }
  function niceTicks(mn, mx, n) {
    var step = Math.pow(10, Math.floor(Math.log10((mx - mn) / n))), e = (mx - mn) / n / step, out = [];
    step *= e >= 7.5 ? 10 : e >= 3.5 ? 5 : e >= 1.5 ? 2 : 1;
    for (var v = Math.ceil(mn / step) * step; v <= mx + 1e-9; v += step) out.push(v);
    return out;
  }
  function squarify(items, x, y, w, h) {
    var total = items.reduce(function (s, i) { return s + i.v; }, 0), k = w * h / total, out = [];
    var rest = items.map(function (i) { return { it: i, a: i.v * k }; });
    while (rest.length) {
      var side = Math.min(w, h), row = [], best = Infinity;
      while (rest.length) {
        var cand = row.concat([rest[0]]), sm = 0, mx = 0, mn = Infinity;
        cand.forEach(function (r) { sm += r.a; mx = Math.max(mx, r.a); mn = Math.min(mn, r.a); });
        var worst = Math.max(side * side * mx / (sm * sm), sm * sm / (side * side * mn));
        if (worst > best) break;
        best = worst; row = cand; rest.shift();
      }
      var rs = row.reduce(function (s, r) { return s + r.a; }, 0), th = rs / side, off = 0;
      row.forEach(function (r) {
        var len = r.a / th;
        out.push(w >= h ? { it: r.it, x: x, y: y + off, w: th, h: len } : { it: r.it, x: x + off, y: y, w: len, h: th });
        off += len;
      });
      if (w >= h) { x += th; w -= th; } else { y += th; h -= th; }
    }
    return out;
  }
  var aname = function (a) { return a.community || a.name; };

  function igPoster(m, areas) {
    var s = m.all, l12 = s.slice(-12), p12 = s.slice(-24, -12), med = function (rows, i) { return median(rows.map(function (r) { return r[i]; }).filter(Boolean)); };
    var ppm = med(l12, 3), ppmP = med(p12, 3), n12 = sum(l12, 1), nP = sum(p12, 1);
    var rent1 = median(areas.filter(function (a) { return a.n12 >= (SEG === 'all' ? 300 : 40); }).map(function (a) { return a.rent['1']; }).filter(Boolean));
    var tiles = [[it('sales'), fmt(n12), nP ? 100 * (n12 / nP - 1) : null], [it('value'), fmt(sum(l12, 2) / 1e3) + ' ' + it('bn'), null],
      [it('price') + ', AED/' + uLabel(), fmt(ppmv(ppm)), ppmP ? 100 * (ppm / ppmP - 1) : null], [it('off'), fmt(100 * sum(l12, 6) / n12) + '%', null],
      [segT('rent'), fmt(rent1), null], [segT('yld'), fmt(median(areas.map(function (a) { return a.yld['1']; }).filter(Boolean)), 1) + '%', null]];
    var tw = (W - 64 - 32) / 3, b = '';
    tiles.forEach(function (x, i) {
      var x0 = 32 + (i % 3) * (tw + 16), y0 = 116 + Math.floor(i / 3) * 132;
      b += box(x0, y0, tw, 118, P.bg2, 12) + tx(x0 + 16, y0 + 28, x[0], { size: 13, fill: P.muted }) + tx(x0 + 16, y0 + 72, x[1], { size: 30, w: 700 }) +
        (x[2] != null ? tx(x0 + 16, y0 + 100, (x[2] >= 0 ? '▲ +' : '▼ ') + fmt(x[2], 1) + '% ' + it('yoy'), { size: 13, w: 600, fill: x[2] >= 0 ? P.good : P.bad }) : '');
    });
    var s24 = s.slice(-24), mx = Math.max.apply(null, s24.map(function (r) { return r[1]; })), bw = (W - 64) / s24.length;
    b += tx(32, 404, it('spark'), { size: 13, w: 600, fill: P.muted });
    s24.forEach(function (r, i) { var hh = 66 * r[1] / mx; b += box(32 + i * bw + 2, 480 - hh, bw - 4, hh, i >= s24.length - 12 ? P.accent : mix(P.bg2, P.accent, .4), 3); });
    b += tx(32, 498, mlabel(s24[0][0]), { size: 11, fill: P.muted }) + tx(W - 32, 498, mlabel(s24[s24.length - 1][0]), { size: 11, fill: P.muted, anchor: 'end' });
    return card('ig-market', 550, it('k1'), it('k1s'), b);
  }

  function igTreemap(areas) {
    var col = function (y) { return y == null ? P.brand : y >= 0 ? mix(P.brand, P.good, y / 20) : mix(P.brand, P.bad, -y / 12); };
    var top = areas.filter(function (a) { return a.v12 > 0; }).sort(function (a, b) { return b.v12 - a.v12; }).slice(0, 24), b = '';
    squarify(top.map(function (a) { return { a: a, v: a.v12 }; }), 32, 116, W - 64, 376).forEach(function (r) {
      var a = r.it.a;
      b += box(r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3, col(a.yoy), 6);
      if (r.w > 60 && r.h > 32) {
        b += tx(r.x + 9, r.y + 21, trunc(aname(a), Math.floor((r.w - 14) / 7.6)), { size: 13, w: 700, fill: '#fff' });
        if (r.h > 52) b += tx(r.x + 9, r.y + 40, fmt(a.v12 / 1e3, 1) + ' ' + it('bn'), { size: 12, fill: '#fff', extra: ' fill-opacity=".85"' });
        if (r.h > 72 && a.yoy != null) b += tx(r.x + 9, r.y + 58, (a.yoy >= 0 ? '+' : '') + fmt(a.yoy, 1) + '%', { size: 12, w: 700, fill: '#fff' });
      }
    });
    b += tx(32, 522, it('yoy') + ', AED/' + uLabel() + ':', { size: 12, fill: P.muted });
    [-12, -6, 0, 10, 20].forEach(function (v, i) { var x = 160 + i * 64; b += box(x, 509, 58, 18, col(v), 4) + tx(x + 29, 522, (v > 0 ? '+' : '') + v + '%', { size: 11, fill: '#fff', anchor: 'middle' }); });
    return card('ig-money', 580, it('k2'), it('k2s'), b);
  }

  function igScatter(areas) {
    var pts = areas.filter(function (a) { return a.yld['1'] && a.ppm12 && a.n12 >= (SEG === 'all' ? 300 : 40); }).sort(function (a, b) { return b.n12 - a.n12; }).slice(0, 45);
    if (pts.length < 4) return card('ig-yield', 300, it('k3'), it('k3s'), tx(W / 2, 170, it('noData'), { size: 16, fill: P.muted, anchor: 'middle' }));
    var X0 = 84, X1 = W - 32, Y0 = 122, Y1 = 500, b = '';
    var xs = pts.map(function (a) { return ppmv(a.ppm12); }), ys = pts.map(function (a) { return a.yld['1']; });
    var xmn = Math.min.apply(null, xs), xmx = Math.max.apply(null, xs), ymn = Math.min.apply(null, ys), ymx = Math.max.apply(null, ys);
    var px = (xmx - xmn) * .06, py = (ymx - ymn) * .1; xmn -= px; xmx += px; ymn -= py; ymx += py;
    var sx = function (v) { return X0 + (v - xmn) / (xmx - xmn) * (X1 - X0); }, sy = function (v) { return Y1 - (v - ymn) / (ymx - ymn) * (Y1 - Y0); };
    var nMax = Math.max.apply(null, pts.map(function (a) { return a.n12; })), rad = function (a) { return 4 + 20 * Math.sqrt(a.n12 / nMax); };
    var mxv = median(xs), myv = median(ys);
    b += box(X0, Y0, sx(mxv) - X0, sy(myv) - Y0, mix(P.bg, P.good, .1));
    niceTicks(xmn, xmx, 5).forEach(function (v) { b += '<line x1="' + sx(v) + '" x2="' + sx(v) + '" y1="' + Y0 + '" y2="' + Y1 + '" stroke="' + P.line + '"/>' + tx(sx(v), Y1 + 20, fmt(v), { size: 11, fill: P.muted, anchor: 'middle' }); });
    niceTicks(ymn, ymx, 5).forEach(function (v) { b += '<line x1="' + X0 + '" x2="' + X1 + '" y1="' + sy(v) + '" y2="' + sy(v) + '" stroke="' + P.line + '"/>' + tx(X0 - 8, sy(v) + 4, fmt(v, 1) + '%', { size: 11, fill: P.muted, anchor: 'end' }); });
    b += tx(X0 + 10, Y0 + 20, it('q1'), { size: 13, w: 700, fill: P.good }) + tx(X1 - 10, Y1 - 10, it('q2'), { size: 13, w: 700, fill: P.muted, anchor: 'end' });
    pts.slice().sort(function (a, b) { return b.n12 - a.n12; }).forEach(function (a) {
      b += '<circle cx="' + sx(ppmv(a.ppm12)) + '" cy="' + sy(a.yld['1']) + '" r="' + rad(a) + '" fill="' + mix(P.warn, P.accent, (a.off12 || 0) / 100) + '" fill-opacity=".8" stroke="' + P.bg + '"/>';
    });
    var lab = pts.slice().sort(function (a, b) { return b.n12 - a.n12; }).slice(0, 12).concat(pts.slice().sort(function (a, b) { return b.yld['1'] - a.yld['1']; }).slice(0, 3));
    var placed = [];
    lab.filter(function (a, i) { return lab.indexOf(a) === i; }).forEach(function (a) {
      var x = sx(ppmv(a.ppm12)), r = rad(a), right = x < X1 - 140, ly = sy(a.yld['1']) + 4, lx = right ? x + r + 3 : x - r - 3 - 130;
      if (placed.some(function (q) { return Math.abs(q[1] - ly) < 14 && Math.abs(q[0] - lx) < 135; })) return;
      placed.push([lx, ly]);
      b += tx(right ? x + r + 3 : x - r - 3, sy(a.yld['1']) + 4, trunc(aname(a), 22), { size: 11, w: 600, anchor: right ? 'start' : 'end' });
    });
    b += legend(32, 552, [[P.accent, it('offc')], [P.warn, it('ready')]]) + tx(W - 32, 552, segT('axes') + ', AED/' + uLabel(), { size: 12, fill: P.muted, anchor: 'end' });
    return card('ig-yield', 600, it('k3'), it('k3s'), b);
  }

  function igHeat(m, areas) {
    var months = m.all.slice(-12).map(function (r) { return r[0]; }), top = areas.slice().sort(function (a, b) { return b.n12 - a.n12; }).slice(0, 14);
    var LX = 202, cw = (W - 32 - LX - 8) / 13, ch = 28, Y = 140, b = '';
    var cx = function (j) { return LX + j * cw + (j === 12 ? 8 : 0); };
    months.forEach(function (mo, j) { b += tx(cx(j) + cw / 2, Y - 10, mlabel(mo, true).replace('.', ''), { size: 11, fill: P.muted, anchor: 'middle' }); });
    b += tx(cx(12) + cw / 2, Y - 10, it('yoy'), { size: 11, w: 700, fill: P.muted, anchor: 'middle' });
    top.forEach(function (a, i) {
      var rows = {}; (m.areas[a.id] || []).forEach(function (r) { rows[r[0]] = r[3]; });
      var vals = months.map(function (mo) { return rows[mo] || null; }), med = median(vals.filter(Boolean)), y = Y + i * ch;
      b += tx(32, y + 18, trunc(aname(a), 24), { size: 12, w: 600 });
      vals.concat([a.yoy]).forEach(function (v, j) {
        var d = j === 12 ? v : v && med ? 100 * (v / med - 1) : null, k = j === 12 ? 25 : 14, rd = d == null ? null : Math.round(d);
        var c = d == null ? P.bg2 : d >= 0 ? mix(P.bg2, P.good, .8 * d / k) : mix(P.bg2, P.bad, -.8 * d / k);
        b += box(cx(j) + 1, y + 1, cw - 2, ch - 2, c, 4) + tx(cx(j) + cw / 2, y + 18, rd == null ? '—' : rd > 0 ? '+' + rd : String(rd), { size: 11, anchor: 'middle', w: j === 12 ? 700 : 400 });
      });
    });
    return card('ig-heat', Y + top.length * ch + 52, it('k4'), it('k4s'), b);
  }

  function igPipeline(projects, areas) {
    var Y = +META.tx_date.slice(0, 4), keys = ['late', Y, Y + 1, Y + 2, Y + 3, Y + 4, 'later'], agg = {}, byArea = {}, names = {}, b = '';
    areas.forEach(function (a) { names[a.id] = aname(a); });
    keys.forEach(function (k) { agg[k] = { a: 0, n: 0 }; });
    projects.forEach(function (p) {
      var act = p.status === 'ACTIVE', ns = ['NOT_STARTED', 'PENDING', 'CONDITIONAL_ACTIVATING'].indexOf(p.status) >= 0;
      var u = SEG === 'all' ? (p.units || p.villas || 0) : SEG === 'villa' ? (p.villas || 0) : (p.units || 0), y = +(p.end || '').slice(0, 4);
      if ((!act && !ns) || !u || !y) return;
      var k = p.overdue || y < Y ? 'late' : y > Y + 4 ? 'later' : y;
      agg[k][act ? 'a' : 'n'] += u;
      if (k !== 'late' && y <= Y + 2 && names[p.area]) byArea[p.area] = (byArea[p.area] || 0) + u;
    });
    var mx = Math.max.apply(null, keys.map(function (k) { return agg[k].a + agg[k].n; })), X0 = 32, Y0 = 140, Y1 = 470, bw = 410 / keys.length;
    keys.forEach(function (k, i) {
      var g = agg[k], ha = (Y1 - Y0) * g.a / mx, hn = (Y1 - Y0) * g.n / mx, x = X0 + i * bw + 5, w = bw - 10, late = k === 'late';
      b += box(x, Y1 - ha, w, ha, late ? P.bad : P.accent, 3) + box(x, Y1 - ha - hn, w, hn, mix(P.bg2, late ? P.bad : P.accent, .4), 3) +
        tx(x + w / 2, Y1 - ha - hn - 8, kfmt(g.a + g.n), { size: 12, w: 700, anchor: 'middle' }) +
        tx(x + w / 2, Y1 + 18, late ? it('overdue') : k === 'later' ? it('later') : String(k), { size: 11, w: 600, anchor: 'middle', fill: late ? P.bad : P.muted });
    });
    var RX = 476, top = Object.keys(byArea).map(function (id) { return [id, byArea[id]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 8), amx = top.length ? top[0][1] : 1;
    b += tx(RX, Y0 - 4, it('topH') + ' ' + Y + '–' + (Y + 2), { size: 13, w: 700 });
    top.forEach(function (r, i) {
      var y = Y0 + 14 + i * 40;
      b += tx(RX, y + 12, trunc(names[r[0]], 26), { size: 12, w: 600 }) + box(RX, y + 19, 150 * r[1] / amx, 8, P.accent, 4) + tx(RX + 158, y + 28, kfmt(r[1]), { size: 11, fill: P.muted });
    });
    b += legend(32, 516, [[P.accent, it('active')], [mix(P.bg2, P.accent, .4), it('notst')], [P.bad, it('overdue')]]);
    return card('ig-pipeline', 562, it('k5'), it('k5s') + (SEG === 'all' ? '' : SEG === 'villa' ? it('onlyV') : it('onlyU')), b, SEG !== 'all' && SEG !== 'villa' && SEG !== 'apt');
  }

  function igDevs(devs) {
    var top = devs.filter(function (d) { return d.active >= 3; }).sort(function (a, b) { return b.n12 - a.n12; }).slice(0, 14), BX = 246, BW = 300, b = '';
    b += legend(32, 128, [[P.good, it('fin')], [P.accent, it('ontime')], [P.bad, it('late')]]) + tx(W - 32, 128, it('lateP'), { size: 12, fill: P.muted, anchor: 'end' });
    top.forEach(function (d, i) {
      var y = 144 + i * 34, tot = d.finished + d.active || 1, x = BX, lp = d.active ? Math.round(100 * d.overdue / d.active) : 0;
      b += tx(32, y + 18, trunc(d.name, 28), { size: 12, w: 600 });
      [[d.finished, P.good], [d.active - d.overdue, P.accent], [d.overdue, P.bad]].forEach(function (sg) { var w = BW * sg[0] / tot; b += box(x, y + 5, w, 18, sg[1]); x += w; });
      b += tx(BX + BW + 12, y + 19, d.finished + ' / ' + (d.active - d.overdue) + ' / ' + d.overdue, { size: 12, fill: P.muted }) +
        tx(W - 32, y + 19, lp + '%', { size: 14, w: 700, anchor: 'end', fill: lp >= 25 ? P.bad : lp >= 10 ? P.warn : P.good });
    });
    return card('ig-devs', 144 + top.length * 34 + 52, it('k6'), it('k6s'), b, true);
  }

  function igOffplan(m) {
    var s = m.all, l12 = s.slice(-12), s24 = s.slice(-24), share = sum(l12, 6) / sum(l12, 1), b = '';
    var prem = median(l12.filter(function (r) { return r[7] && r[8]; }).map(function (r) { return 100 * (r[7] / r[8] - 1); }));
    var cx = 130, cy = 236, R = 80, C = 2 * Math.PI * R;
    b += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="' + P.warn + '" stroke-width="24"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="' + P.accent + '" stroke-width="24" stroke-dasharray="' + (C * share) + ' ' + C + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"/>' +
      tx(cx, cy + 12, fmt(100 * share) + '%', { size: 36, w: 800, anchor: 'middle' }) + tx(cx, cy + R + 36, it('share'), { size: 12, fill: P.muted, anchor: 'middle' }) +
      (prem != null ? tx(cx, cy + R + 76, (prem >= 0 ? '+' : '') + fmt(prem, 1) + '%', { size: 26, w: 700, anchor: 'middle', fill: P.accent }) + tx(cx, cy + R + 96, it('prem'), { size: 12, fill: P.muted, anchor: 'middle' }) : '');
    var X0 = 276, X1 = W - 32, Y0 = 130, Y1 = 400, bw = (X1 - X0) / s24.length, mx = Math.max.apply(null, s24.map(function (r) { return r[1]; }));
    s24.forEach(function (r, i) {
      var ho = (Y1 - Y0) * r[6] / mx, hr = (Y1 - Y0) * (r[1] - r[6]) / mx, x = X0 + i * bw + 1.5;
      b += box(x, Y1 - ho, bw - 3, ho, P.accent, 2) + box(x, Y1 - ho - hr, bw - 3, hr, P.warn, 2);
    });
    b += tx(X0, Y1 + 18, mlabel(s24[0][0]), { size: 11, fill: P.muted }) + tx(X1, Y1 + 18, mlabel(s24[s24.length - 1][0]), { size: 11, fill: P.muted, anchor: 'end' }) +
      legend(X0, 446, [[P.accent, it('offc')], [P.warn, it('ready')]]);
    return card('ig-offplan', 500, it('k7'), it('k7s'), b);
  }

  function savePng(id) {
    var svg = document.getElementById(id), vb = svg.viewBox.baseVal, img = new Image(), k = 2;
    img.onload = function () {
      var c = document.createElement('canvas'); c.width = vb.width * k; c.height = vb.height * k;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(function (bl) {
        var a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = 'promptestates-' + id.replace('ig-', '') + (SEG === 'all' ? '' : '-' + SEG.replace('+', 'plus')) + '-' + META.tx_date + '.png';
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      });
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
  }

  function vInfo() {
    page(skeleton());
    Promise.all([get('market.json'), get('areas.json'), get('projects.json'), get('developers.json'), get('meta.json'), get('segments.json')]).then(function (d) {
      P = pal(); META = d[4];
      var sg = d[5][SEG] || d[5].all, base = {}, mk = { all: sg.series, areas: {} };
      d[1].forEach(function (a) { base[a.id] = a; });
      var ar = sg.areas.filter(function (r) { return base[r.id]; }).map(function (r) {
        mk.areas[r.id] = d[5].months.map(function (mo, i) { return [mo, null, null, r.m[i]]; });
        return { id: r.id, name: base[r.id].name, community: base[r.id].community, n12: r.n12, v12: r.v12, ppm12: r.ppm12, yoy: r.yoy, off12: r.off12,
                 rent: { '1': r.rent }, yld: { '1': r.yld && r.yld <= 12 ? r.yld : null } };  // >12% gross = sale/rent mix mismatch, not a real yield
      });
      d[0] = mk; d[1] = ar;
      page('<h1 class="page">' + it('h') + '</h1><p class="sub">' + it('sub') + '</p><div class="filters ig-seg">' +
        ['all', 'apt', 'S', '1', '2', '3', '4+', 'villa'].map(function (k) { return '<button type="button" class="chip' + (k === SEG ? ' on' : '') + '" data-seg="' + k + '">' + it('segs')[k] + '</button>'; }).join('') +
        '</div><div class="ig-grid">' +
        [igPoster(d[0], d[1]), igTreemap(d[1]), igScatter(d[1]), igHeat(d[0], d[1]), igPipeline(d[2], d[1]), igOffplan(d[0]), igDevs(d[3])].join('') + '</div>');
      view.querySelectorAll('[data-png]').forEach(function (bt) { bt.onclick = function () { savePng(bt.dataset.png); }; });
      view.querySelectorAll('[data-seg]').forEach(function (bt) { bt.onclick = function () { SEG = bt.dataset.seg; store('pro_seg', SEG); vInfo(); }; });
    });
  }

  // ------------------------------------------------------------------ map: MapLibre GL, OpenFreeMap vector tiles, 3D layers + timelapse
  var MT = {
    ru: { h: 'Карта рынка', sub: 'Районы Дубая по данным DLD. Высота столбца — число сделок, цвет — выбранный показатель. Наклоните карту правой кнопкой мыши или двумя пальцами',
      metrics: { ppm: 'Цена за м²', yoy: 'Рост за год', yld: 'Доходность', n12: 'Сделки', off: 'Доля off-plan' },
      layers: 'Слои', lCols: '3D-столбцы рынка', lHeat: 'Тепловая карта сделок', lPipe: 'Волна сдачи 2026–2028', lMetro: 'Метро и трамвай', lLabels: 'Названия районов',
      top: 'Топ-10', open: 'Открыть район', sales: 'сделок', yoy: 'за год', units: 'юнитов к сдаче', overdue: 'просрочено', none: 'Нет данных для этого типа жилья',
      play: 'Воспроизвести', pause: 'Пауза', viewH: 'Вид карты', styleH: 'Стиль', modeH: 'Отображение', lBld: '3D-здания',
      styles: { dark: 'Тёмная', light: 'Светлая', streets: 'Улицы', night: 'Ночь' }, modes: { cols: 'Столбцы', bubbles: 'Районы', flat: '2D' }, lMarket: 'Рынок районов', y12: '12 мес.', tl: 'Таймлапс сделок', reset: 'Сбросить вид', d3: '3D', d2: '2D', noGl: 'Браузер не поддерживает WebGL — карта недоступна' },
    en: { h: 'Market map', sub: 'Dubai areas from DLD data. Column height: number of sales, colour: selected metric. Tilt with right-click drag or two fingers',
      metrics: { ppm: 'Price per m²', yoy: 'YoY change', yld: 'Gross yield', n12: 'Sales', off: 'Off-plan share' },
      layers: 'Layers', lCols: '3D market columns', lHeat: 'Sales heatmap', lPipe: 'Handover wave 2026–2028', lMetro: 'Metro & tram', lLabels: 'Area names',
      top: 'Top 10', open: 'Open area', sales: 'sales', yoy: 'YoY', units: 'units due', overdue: 'overdue', none: 'No data for this property type',
      play: 'Play', pause: 'Pause', viewH: 'Map view', styleH: 'Style', modeH: 'Display', lBld: '3D buildings',
      styles: { dark: 'Dark', light: 'Light', streets: 'Streets', night: 'Night' }, modes: { cols: 'Columns', bubbles: 'Districts', flat: '2D' }, lMarket: 'Area market', y12: '12 mo', tl: 'Sales timelapse', reset: 'Reset view', d3: '3D', d2: '2D', noGl: 'This browser has no WebGL, the map is unavailable' }
  };
  var mt = function (k) { return (MT[lang] || MT.en)[k]; };
  var MAPM = store('pro_mapm') || 'ppm';
  var LAYERS = (function () { try { return JSON.parse(store('pro_layers')) || null; } catch (e) { return null; } })() || { cols: true, heat: true, pipe: false, metro: true, labels: true };
  if (LAYERS.bld == null) LAYERS.bld = true;
  var MAPSTYLE = store('pro_mapstyle') || 'auto', MAPVIEW = store('pro_mapview') === 'cols' ? 'cols' : 'bubbles', MAPCAM = null;
  var STYLE_URL = { dark: 'dark', night: 'dark', light: 'positron', streets: 'liberty' };
  function mapVal(a, m) { return m === 'ppm' ? ppmv(a.ppm12) : m === 'yoy' ? a.yoy : m === 'yld' ? a.yld : m === 'n12' ? a.n12 : a.off12; }
  function mapFmt(v, m) { return v == null ? '—' : m === 'ppm' ? 'AED ' + fmt(v) : m === 'yoy' ? (v >= 0 ? '+' : '') + fmt(v, 1) + '%' : m === 'yld' ? fmt(v, 1) + '%' : m === 'off' ? fmt(v) + '%' : fmt(v); }
  function rampColor(k, diverging) {
    var stops = diverging ? ['#e5534b', '#d98f5c', '#8a949c', '#62b88a', '#2fbf71'] : ['#3a56d4', '#22a7d6', '#2fbf8f', '#c9d94a', '#f5a623', '#ef4b4b'];
    k = Math.max(0, Math.min(1, k)) * (stops.length - 1);
    var i = Math.min(Math.floor(k), stops.length - 2);
    return mix(stops[i], stops[i + 1], k - i);
  }
  function ring(ll, rMeters, n) {
    var lat = ll[0], lon = ll[1], pts = [], dLat = rMeters / 111320, dLon = rMeters / (111320 * Math.cos(lat * Math.PI / 180));
    for (var i = 0; i <= n; i++) { var a = 2 * Math.PI * i / n; pts.push([lon + dLon * Math.cos(a), lat + dLat * Math.sin(a)]); }
    return [pts];
  }
  var mapTimer = null;
  function vMap() {
    if (mapTimer) { clearInterval(mapTimer); mapTimer = null; }
    page(skeleton());
    if (!isPro()) SEG = 'all';
    var cv = document.createElement('canvas');
    if (!window.maplibregl || !(cv.getContext('webgl2') || cv.getContext('webgl'))) { page('<div class="empty">' + mt('noGl') + '</div>'); return; }
    Promise.all([get('areas.json'), SEG === 'all' ? Promise.resolve(null) : get('segments.json'), get('geo.json'), get('market.json'), fetch('data/metro.geojson').then(function (r) { return r.json(); }).catch(function () { return null; }),
                 isPro() ? get('projects.json').catch(function () { return []; }) : Promise.resolve([]),
                 get('areas_geo.json').catch(function () { return { features: [] }; })]).then(function (d) {
      var base = {}, geo = d[2], market = d[3], metro = d[4], projects = d[5], shapes = {};
      d[6].features.forEach(function (f) { shapes[f.properties.id] = f.geometry; });
      d[0].forEach(function (a) { base[a.id] = a; });
      var sg = d[1] ? (d[1][SEG] || d[1].all) : { areas: d[0].map(function (a) { return { id: a.id, n12: a.n12, ppm12: a.ppm12, yoy: a.yoy, off12: a.off12, yld: a.yld['1'] }; }) };
      var rows = sg.areas.filter(function (r) { return geo[r.id] && base[r.id]; }).map(function (r) {
        return { id: r.id, name: aname(base[r.id]), dld: base[r.id].name, ll: geo[r.id], n12: r.n12, ppm12: r.ppm12, yoy: r.yoy, off12: r.off12, yld: r.yld && r.yld <= 12 ? r.yld : null };
      }).sort(function (a, b) { return b.n12 - a.n12; });
      var months = market.all.map(function (r) { return r[0]; });
      var segBtns = ['all', 'apt', 'S', '1', '2', '3', '4+', 'villa'].map(function (k) {
        var locked = !isPro() && k !== 'all';
        return '<button type="button" class="chip' + (k === SEG ? ' on' : '') + (locked ? ' locked' : '') + '" data-mseg="' + k + '">' + it('segs')[k] + '</button>';
      }).join('');
      var mBtns = Object.keys(mt('metrics')).map(function (k) { return '<button type="button" data-metric="' + k + '" aria-pressed="' + (k === MAPM) + '">' + mt('metrics')[k] + '</button>'; }).join('');
      var styleKey = MAPSTYLE === 'auto' ? (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark') : MAPSTYLE;
      var stylesHtml = ['dark', 'light', 'streets', 'night'].map(function (k) {
        return '<button type="button" class="sw sw-' + k + '" data-mstyle="' + k + '" aria-pressed="' + (k === styleKey) + '"><i></i><span>' + mt('styles')[k] + '</span></button>';
      }).join('');
      var modesHtml = ['bubbles', 'cols'].map(function (k) { return '<button type="button" data-mview="' + k + '" aria-pressed="' + (k === MAPVIEW) + '">' + mt('modes')[k] + '</button>'; }).join('');
      var lay = [['cols', 'lMarket'], ['heat', 'lHeat'], ['pipe', 'lPipe'], ['metro', 'lMetro'], ['bld', 'lBld'], ['labels', 'lLabels']].map(function (x) {
        var locked = x[0] === 'pipe' && !isPro();
        return '<label class="lay' + (locked ? ' locked' : '') + '"><input type="checkbox" data-layer="' + x[0] + '"' + (LAYERS[x[0]] && !locked ? ' checked' : '') + (locked ? ' disabled' : '') + '><i class="li-' + x[0] + '"></i><span>' + mt(x[1]) + '</span></label>';
      }).join('');
      page('<h1 class="page">' + mt('h') + '</h1><p class="sub">' + mt('sub') + '</p>' +
        '<div class="map-bar"><div class="seg seg-wide" role="group">' + mBtns + '</div><div class="pills" role="group">' + segBtns + '</div></div>' +
        '<div class="map-wrap map3"><div id="map" class="map" role="application" aria-label="' + esc(mt('h')) + '"></div>' +
        '<div class="glass map-layers collapsed" id="mpanel"><button type="button" class="mp-head" id="mp-toggle" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="m2 13 10 5 10-5"/></svg><span>' + mt('viewH') + '</span><i></i></button>' +
        '<div class="mp-body"><b>' + mt('styleH') + '</b><div class="sws">' + stylesHtml + '</div><b>' + mt('modeH') + '</b><div class="seg mp-modes">' + modesHtml + '</div>' +
        '<b>' + mt('layers') + '</b>' + lay + '</div></div>' +
        '<div class="glass map-tools"><button type="button" id="m-dim" aria-pressed="true">' + mt('d3') + '</button><button type="button" id="m-reset" aria-label="' + mt('reset') + '">⟲</button></div>' +
        '<div class="glass map-legend" id="legend"></div>' +
        '<div class="glass map-card" id="mcard" hidden></div></div>' +
        '<div class="panel"><h2>' + mt('top') + ' · ' + mt('metrics')[MAPM] + '</h2><div id="mtop" class="mtop"></div></div>');
      view.querySelectorAll('[data-mseg]').forEach(function (b) { b.onclick = function () { if (b.classList.contains('locked')) { if (APP) toast(t('lockSeg')); else location.hash = '#/pricing'; return; } SEG = b.dataset.mseg; store('pro_seg', SEG); vMap(); }; });
      view.querySelectorAll('[data-metric]').forEach(function (b) { b.onclick = function () { MAPM = b.dataset.metric; store('pro_mapm', MAPM); vMap(); }; });
      if (!rows.length) { $('#map').outerHTML = '<div class="empty">' + mt('none') + '</div>'; return; }

      // colour scale (5–95th percentile, symmetric for YoY)
      var vals = rows.map(function (r) { return mapVal(r, MAPM); }).filter(function (v) { return v != null; }).sort(function (a, b) { return a - b; });
      var q = function (f) { return vals.length ? vals[Math.floor((vals.length - 1) * f)] : 0; };
      var lo = q(.05), hi = q(.95), div = MAPM === 'yoy';
      if (div) { var mxa = Math.max(Math.abs(lo), Math.abs(hi)) || 1; lo = -mxa; hi = mxa; }
      var rankK = function (v) { var a = 0, b = vals.length - 1; while (a < b) { var m = (a + b) >> 1; if (vals[m] < v) a = m + 1; else b = m; } return vals.length > 1 ? a / (vals.length - 1) : .5; };
      var colorOf = function (v) { return v == null ? '#7a858c' : div ? rampColor((v - lo) / ((hi - lo) || 1), true) : rampColor(rankK(v), false); };
      var shortVal = function (v) {
        if (v == null) return '';
        if (MAPM === 'ppm' || MAPM === 'n12') return v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k' : fmt(v);
        return mapFmt(v, MAPM);
      };
      var nMax = rows[0].n12;
      // monthly sales per area for the timelapse (all property types)
      var monthly = {};
      rows.forEach(function (r) { var m = {}; (market.areas[r.id] || []).forEach(function (x) { m[x[0]] = x[1]; }); monthly[r.id] = m; });
      var mMax = 1;
      rows.forEach(function (r) { months.forEach(function (mo) { mMax = Math.max(mMax, monthly[r.id][mo] || 0); }); });

      var dark = styleKey === 'dark' || styleKey === 'night', night = styleKey === 'night';
      var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, cam = MAPCAM; MAPCAM = null;
      var flatPitch = MAPVIEW === 'flat' ? 0 : null;
      var map = lmap = new maplibregl.Map({ container: 'map', style: 'https://tiles.openfreemap.org/styles/' + STYLE_URL[styleKey],
        center: cam ? cam.center : [55.24, 25.13], zoom: cam ? cam.zoom : reduce ? 10.6 : 9.2, pitch: cam ? (flatPitch != null ? 0 : cam.pitch) : reduce ? (flatPitch != null ? 0 : 50) : 0,
        bearing: cam ? cam.bearing : reduce ? -17 : 0, maxPitch: 70, attributionControl: false, antialias: true, preserveDrawingBuffer: true });
      lmap.remove = (function (rm) { return function () { if (mapTimer) { clearInterval(mapTimer); mapTimer = null; } rm.call(map); }; })(map.remove);
      map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: 'DLD · <a href="https://openfreemap.org">OpenFreeMap</a> · © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }), 'bottom-right');
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
      if (document.fullscreenEnabled || document.webkitFullscreenEnabled) map.addControl(new maplibregl.FullscreenControl({ container: document.querySelector('.map-wrap') }), 'top-right');

      function features(monthIdx) {
        var mo = monthIdx < months.length ? months[monthIdx] : null;
        return { cols: { type: 'FeatureCollection', features: rows.map(function (r) {
            var v = mapVal(r, MAPM), n = mo ? (monthly[r.id][mo] || 0) : r.n12, k = mo ? n / mMax : n / nMax;
            return { type: 'Feature', properties: { id: r.id, color: colorOf(v), h: 60 + 5200 * Math.sqrt(k) * Math.sqrt(k) },
                     geometry: { type: 'Polygon', coordinates: ring(r.ll, 330 + 520 * Math.sqrt(r.n12 / nMax), 28) } };
          }) },
          bub: { type: 'FeatureCollection', features: rows.filter(function (r) { return shapes[r.id]; }).map(function (r) {
            var n = mo ? (monthly[r.id][mo] || 0) / mMax : r.n12 / nMax;
            return { type: 'Feature', properties: { id: r.id, color: colorOf(mapVal(r, MAPM)), k: Math.sqrt(n) }, geometry: shapes[r.id] };
          }) },
          nums: { type: 'FeatureCollection', features: rows.filter(function (r) { return mapVal(r, MAPM) != null; }).map(function (r, i) {
            return { type: 'Feature', properties: { txt: shortVal(mapVal(r, MAPM)), rank: i }, geometry: { type: 'Point', coordinates: [r.ll[1], r.ll[0]] } };
          }) },
          heat: { type: 'FeatureCollection', features: rows.map(function (r) {
            var n = mo ? (monthly[r.id][mo] || 0) / mMax : r.n12 / nMax;
            return { type: 'Feature', properties: { w: n }, geometry: { type: 'Point', coordinates: [r.ll[1], r.ll[0]] } };
          }) } };
      }
      // handover wave: units in active / not started projects due within 3 years
      var Y = +(months[months.length - 1] || '2026').slice(0, 4), pipe = {};
      projects.forEach(function (p) {
        var y = +(p.end || '').slice(0, 4), u = p.units || p.villas || 0;
        if (!u || !y || y < Y || y > Y + 2 || ['ACTIVE', 'NOT_STARTED', 'PENDING'].indexOf(p.status) < 0 || !geo[p.area]) return;
        var P = pipe[p.area] || (pipe[p.area] = { u: 0, late: 0 }); P.u += u; if (p.overdue) P.late += u;
      });
      var pMax = Math.max.apply(null, Object.keys(pipe).map(function (k) { return pipe[k].u; }).concat([1]));
      var pipeFC = { type: 'FeatureCollection', features: Object.keys(pipe).map(function (id) {
        return { type: 'Feature', properties: { id: id, u: pipe[id].u, r: 6 + 34 * Math.sqrt(pipe[id].u / pMax), late: pipe[id].late / pipe[id].u,
          name: base[id] ? aname(base[id]) : id }, geometry: { type: 'Point', coordinates: [geo[id][1], geo[id][0]] } };
      }) };
      var labelsFC = { type: 'FeatureCollection', features: rows.slice(0, 30).map(function (r) {
        return { type: 'Feature', properties: { name: r.name, txt: shortVal(mapVal(r, MAPM)), rank: rows.indexOf(r) }, geometry: { type: 'Point', coordinates: [r.ll[1], r.ll[0]] } };
      }) };

      map.on('load', function () {
        // English-only base labels, quieter base map
        map.getStyle().layers.forEach(function (l) {
          if (l.type === 'symbol' && l.layout && l.layout['text-field']) map.setLayoutProperty(l.id, 'text-field', ['coalesce', ['get', 'name:latin'], ['get', 'name_en'], ['get', 'name']]);
          if (l.type === 'symbol' && /poi|housenumber/.test(l.id)) map.setLayoutProperty(l.id, 'visibility', 'none');
        });
        if (night) map.getStyle().layers.forEach(function (l) {
          if (l.type === 'background') map.setPaintProperty(l.id, 'background-color', '#03050a');
          else if (/water/.test(l.id) && l.type === 'fill') map.setPaintProperty(l.id, 'fill-color', '#04101a');
          else if (l.type === 'line' && /road|highway|motorway|trunk|primary/.test(l.id)) map.setPaintProperty(l.id, 'line-color', '#1c3a4a');
        });
        // 3D buildings: Liberty ships its own extrusion layer, the dark/light styles get ours
        if (!map.getLayer('building-3d')) map.addLayer({ id: 'bld3d', type: 'fill-extrusion', source: 'openmaptiles', 'source-layer': 'building', minzoom: 13.5, paint: {
          'fill-extrusion-color': night ? '#0f2230' : dark ? '#1d2731' : '#d6dce1', 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 13.5, 0, 14.5, .8] } });
        var f = features(months.length);
        map.addSource('heat', { type: 'geojson', data: f.heat });
        map.addLayer({ id: 'heat', type: 'heatmap', source: 'heat', maxzoom: 15, paint: {
          'heatmap-weight': ['get', 'w'], 'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 9, 1.1, 13, 2.2],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 9, 28, 12, 70, 14, 120], 'heatmap-opacity': night ? .95 : dark ? .75 : .6,
          'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', .15, 'rgba(17,65,84,.55)', .35, '#1f7fa6', .55, '#6bbfe0', .75, '#f5c85b', 1, '#ff7a45'] } });
        if (metro) {
          map.addSource('metro', { type: 'geojson', data: metro });
          var lc = ['match', ['get', 'line'], 'red', '#ff3b47', 'green', '#34c759', '#a78bfa'];
          map.addLayer({ id: 'metro-glow', type: 'line', source: 'metro', filter: ['!=', ['geometry-type'], 'Point'], paint: { 'line-color': lc, 'line-width': 9, 'line-opacity': .22, 'line-blur': 6 } });
          map.addLayer({ id: 'metro', type: 'line', source: 'metro', filter: ['!=', ['geometry-type'], 'Point'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': lc, 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.6, 13, 3.5] } });
          map.addLayer({ id: 'metro-st', type: 'circle', source: 'metro', filter: ['==', ['geometry-type'], 'Point'], minzoom: 11, paint: { 'circle-radius': 3.2, 'circle-color': dark ? '#0a0d0f' : '#fff', 'circle-stroke-width': 2, 'circle-stroke-color': lc } });
        }
        map.addSource('cols', { type: 'geojson', data: f.cols });
        map.addLayer({ id: 'cols', type: 'fill-extrusion', source: 'cols', paint: {
          'fill-extrusion-color': ['get', 'color'], 'fill-extrusion-height': ['get', 'h'], 'fill-extrusion-base': 0, 'fill-extrusion-opacity': night ? .95 : .88, 'fill-extrusion-vertical-gradient': true } });
        map.addLayer({ id: 'flat', type: 'fill', source: 'cols', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': .78, 'fill-outline-color': dark ? 'rgba(255,255,255,.5)' : '#fff' } });
        map.addSource('bub', { type: 'geojson', data: f.bub });
        map.addLayer({ id: 'bub', type: 'fill', source: 'bub', paint: { 'fill-color': ['get', 'color'],
          'fill-opacity': ['+', dark ? .12 : .16, ['*', ['get', 'k'], dark ? .42 : .38]], 'fill-opacity-transition': { duration: 450 } } });
        map.addLayer({ id: 'bub-glow', type: 'line', source: 'bub', layout: { 'line-join': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 7, 'line-blur': 5, 'line-opacity': night ? .55 : dark ? .3 : .18 } });
        map.addLayer({ id: 'bub-line', type: 'line', source: 'bub', layout: { 'line-join': 'round' }, paint: { 'line-color': ['get', 'color'],
          'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.2, 13, 2.4], 'line-opacity': .95 } });
        map.addSource('nums', { type: 'geojson', data: f.nums });
        map.addLayer({ id: 'nums', type: 'symbol', source: 'nums', minzoom: 9.6, layout: { 'text-field': ['get', 'txt'], 'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 10, 13, 13, 17], 'symbol-sort-key': ['get', 'rank'], 'text-allow-overlap': false, 'text-padding': 4 },
          paint: { 'text-color': dark ? '#ffffff' : '#0d1418', 'text-halo-color': dark ? 'rgba(5,7,10,.85)' : 'rgba(255,255,255,.95)', 'text-halo-width': 1.8 } });
        map.addSource('pipe', { type: 'geojson', data: pipeFC });
        map.addLayer({ id: 'pipe', type: 'circle', source: 'pipe', paint: {
          'circle-radius': ['get', 'r'], 'circle-color': ['interpolate', ['linear'], ['get', 'late'], 0, '#34c759', .3, '#f5c85b', .6, '#ff3b47'], 'circle-opacity': .28,
          'circle-stroke-width': 1.5, 'circle-stroke-color': ['interpolate', ['linear'], ['get', 'late'], 0, '#34c759', .3, '#f5c85b', .6, '#ff3b47'], 'circle-pitch-alignment': 'map' } });
        map.addSource('labels', { type: 'geojson', data: labelsFC });
        map.addLayer({ id: 'labels', type: 'symbol', source: 'labels', layout: { 'text-field': ['format', ['get', 'name'], {}, '\n', {}, ['get', 'txt'], { 'font-scale': 1.3 }], 'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 9, 11, 13, 14],
          'text-offset': [0, -1.4], 'text-anchor': 'bottom', 'symbol-sort-key': ['get', 'rank'], 'text-allow-overlap': false },
          paint: { 'text-color': dark ? '#f2f5f7' : '#0d1418', 'text-halo-color': dark ? 'rgba(5,7,10,.9)' : 'rgba(255,255,255,.95)', 'text-halo-width': 1.6 } });
        applyLayers();
        if (!reduce && !cam) map.flyTo({ center: [55.235, 25.12], zoom: innerWidth < 700 ? 10.1 : 10.8, pitch: flatPitch != null ? 0 : 55, bearing: flatPitch != null ? 0 : -17, duration: 2600, essential: true });

        var pop = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12, className: 'mpop' });
        var byId = {}; rows.forEach(function (r) { byId[r.id] = r; });
        ['cols', 'flat', 'bub'].forEach(function (lid) {
          map.on('mousemove', lid, function (e) {
            var r = byId[e.features[0].properties.id]; map.getCanvas().style.cursor = 'pointer';
            pop.setLngLat(e.lngLat).setHTML('<b>' + esc(r.name) + '</b><br>' + mapFmt(mapVal(r, MAPM), MAPM) + ' · ' + fmt(r.n12) + ' ' + mt('sales')).addTo(map);
          });
          map.on('mouseleave', lid, function () { map.getCanvas().style.cursor = ''; pop.remove(); });
          map.on('click', lid, function (e) { showCard(byId[e.features[0].properties.id]); });
        });
        map.on('mousemove', 'pipe', function (e) {
          if (map.queryRenderedFeatures(e.point, { layers: ['cols', 'flat', 'bub'].filter(function (l) { return map.getLayoutProperty(l, 'visibility') !== 'none'; }) }).length) return;
          var p = e.features[0].properties; map.getCanvas().style.cursor = 'pointer';
          pop.setLngLat(e.lngLat).setHTML('<b>' + esc(p.name) + '</b><br>' + fmt(p.u) + ' ' + mt('units') + (p.late > 0 ? ' · ' + fmt(100 * p.late) + '% ' + mt('overdue') : '')).addTo(map);
        });
        map.on('mouseleave', 'pipe', function () { map.getCanvas().style.cursor = ''; pop.remove(); });
      });

      function applyLayers() {
        if (!map.getLayer('cols')) return;
        var vis = function (id, on) { if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'); };
        vis('cols', LAYERS.cols && MAPVIEW === 'cols'); vis('flat', LAYERS.cols && MAPVIEW === 'flat');
        ['bub', 'bub-glow', 'bub-line'].forEach(function (id) { vis(id, LAYERS.cols && MAPVIEW === 'bubbles'); });
        vis('nums', LAYERS.cols && MAPVIEW !== 'cols');
        if (map.getLayer('nums')) map.setFilter('nums', LAYERS.labels ? ['>=', ['get', 'rank'], 30] : null);
        vis('bld3d', LAYERS.bld); vis('building-3d', LAYERS.bld); vis('heat', LAYERS.heat); vis('pipe', LAYERS.pipe && isPro()); vis('labels', LAYERS.labels);
        ['metro', 'metro-glow', 'metro-st'].forEach(function (id) { vis(id, LAYERS.metro); });
        $('#legend').hidden = !LAYERS.cols;
        $('#m-dim').hidden = MAPVIEW === 'flat';
      }
      view.querySelectorAll('[data-layer]').forEach(function (cb) {
        cb.onchange = function () { LAYERS[cb.dataset.layer] = cb.checked; store('pro_layers', JSON.stringify(LAYERS)); applyLayers(); };
      });
      view.querySelectorAll('[data-mstyle]').forEach(function (b) {
        b.onclick = function () {
          if (b.getAttribute('aria-pressed') === 'true') return;
          MAPSTYLE = b.dataset.mstyle; store('pro_mapstyle', MAPSTYLE);
          MAPCAM = { center: map.getCenter(), zoom: map.getZoom(), pitch: map.getPitch(), bearing: map.getBearing() };
          vMap();
        };
      });
      view.querySelectorAll('[data-mview]').forEach(function (b) {
        b.onclick = function () {
          MAPVIEW = b.dataset.mview; store('pro_mapview', MAPVIEW);
          view.querySelectorAll('[data-mview]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
          applyLayers();
          if (MAPVIEW === 'flat') map.easeTo({ pitch: 0, bearing: 0, duration: reduce ? 0 : 700 });
          else if (map.getPitch() < 10) map.easeTo({ pitch: MAPVIEW === 'cols' ? 55 : 35, bearing: -17, duration: reduce ? 0 : 700 });
        };
      });
      $('#mp-toggle').onclick = function () { var c = $('#mpanel').classList.toggle('collapsed'); this.setAttribute('aria-expanded', !c); };
      // 2D / 3D and reset
      $('#m-dim').onclick = function () {
        var to3 = map.getPitch() < 10; this.setAttribute('aria-pressed', to3); this.textContent = to3 ? mt('d3') : mt('d2');
        map.easeTo({ pitch: to3 ? 55 : 0, bearing: to3 ? -17 : 0, duration: reduce ? 0 : 800 });
      };
      $('#m-reset').onclick = function () { map.flyTo({ center: [55.235, 25.12], zoom: 10.8, pitch: 55, bearing: -17, duration: reduce ? 0 : 1200 }); };
      // the month-by-month timelapse was removed: the map always shows the last 12 months
      // legend
      var stops = [0, .2, .4, .6, .8, 1].map(function (k) { return rampColor(k, div); }).join(',');
      $('#legend').innerHTML = '<span>' + esc(MAPM === 'ppm' ? 'AED/' + uLabel() : mt('metrics')[MAPM]) + '</span><i style="background:linear-gradient(90deg,' + stops + ')"></i><div><em>' +
        mapFmt(lo, MAPM).replace('AED ', '') + '</em>' + (div ? '' : '<em>' + mapFmt(q(.5), MAPM).replace('AED ', '') + '</em>') + '<em>' + mapFmt(hi, MAPM).replace('AED ', '') + '</em></div>';
      function showCard(r) {
        var c = $('#mcard');
        c.hidden = false;
        c.innerHTML = '<button type="button" class="mclose" aria-label="Close">×</button><h3>' + esc(r.name) + '</h3><p class="muted">' + esc(r.dld) + '</p><dl>' +
          [[mt('metrics').ppm, mapFmt(ppmv(r.ppm12), 'ppm') + '/' + uLabel()], [mt('yoy'), mapFmt(r.yoy, 'yoy')], [mt('metrics').yld, mapFmt(r.yld, 'yld')],
           [mt('metrics').n12, fmt(r.n12)], [mt('metrics').off, mapFmt(r.off12, 'off')]].map(function (x) { return '<div><dt>' + esc(x[0]) + '</dt><dd>' + x[1] + '</dd></div>'; }).join('') +
          '</dl><a class="btn" href="#/area/' + r.id + '">' + mt('open') + ' →</a>';
        c.querySelector('.mclose').onclick = function () { c.hidden = true; };
        map.flyTo({ center: [r.ll[1], r.ll[0]], zoom: Math.max(map.getZoom(), 12.4), pitch: 58, duration: reduce ? 0 : 1400, essential: true });
      }
      var top = rows.filter(function (r) { return mapVal(r, MAPM) != null && r.n12 >= (SEG === 'all' ? 100 : 25); }).sort(function (a, b) { return mapVal(b, MAPM) - mapVal(a, MAPM); }).slice(0, 10);
      $('#mtop').innerHTML = top.map(function (r, i) {
        var v = mapVal(r, MAPM);
        return '<button type="button" data-id="' + r.id + '"><b>' + (i + 1) + '</b><span>' + esc(r.name) + '</span><i style="background:' + colorOf(v) + '"></i><em>' + mapFmt(v, MAPM) + '</em></button>';
      }).join('');
      $('#mtop').querySelectorAll('button').forEach(function (b) {
        b.onclick = function () { showCard(rows.filter(function (x) { return x.id === b.dataset.id; })[0]); $('#map').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); };
      });
    });
  }

  // ------------------------------------------------------------------ subscription: pricing, account, paywall, sign-in
  var PLANS = { display: { month: 'AED 179', year: 'AED 1,490' }, trial_days: 14 }, afterSignIn = null;
  var PR = {
    ru: { eyebrow: 'PromptEstates Pro', h: 'Аналитика рынка Дубая, которой пользуются профессионалы', sub: 'Все сделки Земельного департамента Дубая, аренда, реестр проектов и ИИ-аналитик — в одном дашборде. Решения на данных, а не на рекламе застройщиков.',
      stats: [['sales', 'сделок DLD в базе'], ['rents', 'договоров аренды'], ['projects', 'проектов в реестре'], ['n_areas', 'районов на карте']],
      trial: '14 дней бесплатно', upd: 'Данные DLD на {d} · обновление каждую неделю', month: 'Месяц', year: 'Год', save: '−34%', perM: '/ мес', perY: '/ год', yearNote: '≈ {m} в месяц при оплате за год',
      popular: 'Выбор инвесторов', cta: 'Получить Pro', ctaFree: 'Начать бесплатно', current: 'Ваш тариф', free: 'Бесплатно',
      freeL: ['Обзор рынка Дубая', 'Карта районов (все типы жилья)', 'Ежемесячная динамика цен и сделок'],
      proL: ['Все разделы: районы, проекты, сделки, застройщики', 'Фильтры по типу жилья на карте и в инфографике', 'ИИ-аналитик: вопросы обычными словами', 'ИИ-меморандум по любому проекту за 30 секунд', 'Справедливая цена по реальным сделкам', 'Инфографика в PNG и выгрузка сделок в CSV'],
      cmpH: 'Free или Pro', cmpRows: [['Обзор рынка и карта', 1, 1], ['Фильтры: студии, 1–4 спальни, виллы', 0, 1], ['Районы: цены, аренда, доходность', 0, 1], ['3 353 проекта: готовность, сдача, эскроу', 0, 1], ['Все сделки за 24 месяца + CSV', 0, 1], ['Надёжность застройщиков и просрочки', 0, 1], ['ИИ-аналитик и ИИ-меморандумы', 0, 1], ['Справедливая цена по аналогам', 0, 1], ['Инфографика в PNG для постов', 0, 1]],
      featH: 'Что внутри Pro', feats: [['map', '3D-карта рынка', 'Цена, доходность, рост и off-plan по районам, слои метро и волны сдачи, таймлапс за 3 года'], ['ai', 'ИИ-аналитик', '«Где самая высокая доходность 1-спальных до 1 млн?» — ответ по реальным сделкам, со ссылками'],
        ['memo', 'Инвест-меморандум', 'Разбор проекта: цена против района, застройщик, риск сдачи, аренда — готов к отправке клиенту'], ['fair', 'Справедливая цена', 'Сколько реально стоит юнит по аналогам за 6 месяцев и насколько продавец завышает цену'],
        ['risk', 'Риски застройщиков', 'Доля просроченных проектов, средняя готовность и эскроу-банк по каждому застройщику'], ['png', 'Инфографика', 'Готовые карточки для Telegram, LinkedIn и презентаций с вашими фильтрами']],
      trustH: 'Без рисков', trust: [['Отмена в один клик', 'В личном кабинете Stripe, без писем и звонков'], ['Безопасная оплата', 'Карты, Apple Pay и Google Pay через Stripe'], ['Официальные данные', 'Только открытые данные Dubai Land Department'], ['Один аккаунт', 'Тот же вход, что в приложении PromptEstates']],
      faqH: 'Вопросы', faq: [['Откуда данные?', 'Из открытых данных Dubai Land Department: зарегистрированные сделки, договоры аренды Ejari и реестр проектов. Мы не используем цены из рекламы.'],
        ['Как часто обновляется?', 'Каждую неделю после новой выгрузки DLD. Дата данных указана внизу каждой страницы.'], ['Чем годовой тариф лучше?', 'Он на 31% дешевле помесячной оплаты: AED 1,490 вместо AED 2,148 в год.'],
        ['Можно ли отменить?', 'Да, в любой момент в личном кабинете. Доступ сохранится до конца оплаченного периода.'], ['Это инвестиционный совет?', 'Нет. Это аналитика по фактическим сделкам; решение о покупке остаётся за вами.']],
      finalH: 'Покупайте недвижимость в Дубае по данным, а не по обещаниям', note: 'Оплата через Stripe. Цены в AED. Первые 14 дней бесплатно.' },
    en: { eyebrow: 'PromptEstates Pro', h: 'Dubai market intelligence built for professionals', sub: 'Every Dubai Land Department sale, rents, the project registry and an AI analyst in one dashboard. Decide on data, not developer marketing.',
      stats: [['sales', 'DLD sales in the database'], ['rents', 'rent contracts'], ['projects', 'registry projects'], ['n_areas', 'areas on the map']],
      trial: '14 days free', upd: 'DLD data to {d} · updated weekly', month: 'Monthly', year: 'Yearly', save: '−34%', perM: '/ mo', perY: '/ yr', yearNote: '≈ {m} per month billed yearly',
      popular: 'Investors’ choice', cta: 'Get Pro', ctaFree: 'Start free', current: 'Your plan', free: 'Free',
      freeL: ['Dubai market overview', 'Area map (all property types)', 'Monthly price and sales trends'],
      proL: ['Every section: areas, projects, transactions, developers', 'Property-type filters on the map and infographics', 'AI analyst: ask in plain words', 'AI memo for any project in 30 seconds', 'Fair price from actual sales', 'PNG infographics and CSV export'],
      cmpH: 'Free or Pro', cmpRows: [['Market overview and map', 1, 1], ['Filters: studios, 1–4 bed, villas', 0, 1], ['Areas: prices, rents, yields', 0, 1], ['3,353 projects: progress, handover, escrow', 0, 1], ['Every sale for 24 months + CSV', 0, 1], ['Developer reliability and delays', 0, 1], ['AI analyst and AI memos', 0, 1], ['Fair price from comparables', 0, 1], ['PNG infographics for posts', 0, 1]],
      featH: 'Inside Pro', feats: [['map', '3D market map', 'Price, yield, growth and off-plan by area, metro and handover layers, a 3-year timelapse'], ['ai', 'AI analyst', '“Where are 1-bed yields highest under AED 1M?” — answered from actual sales, with links'],
        ['memo', 'Investment memo', 'Project breakdown: price vs area, developer, delivery risk, rents — ready to send to a client'], ['fair', 'Fair price', 'What a unit is really worth from 6 months of comparables and how much the seller is over asking'],
        ['risk', 'Developer risk', 'Share of overdue projects, average completion and escrow bank for every developer'], ['png', 'Infographics', 'Ready-made cards for Telegram, LinkedIn and decks with your filters']],
      trustH: 'No risk', trust: [['Cancel in one click', 'From your Stripe portal, no emails or calls'], ['Secure payments', 'Cards, Apple Pay and Google Pay via Stripe'], ['Official data', 'Dubai Land Department open data only'], ['One account', 'Same sign-in as the PromptEstates app']],
      faqH: 'FAQ', faq: [['Where does the data come from?', 'Dubai Land Department open data: registered sales, Ejari rent contracts and the project registry. No listing prices.'],
        ['How often is it updated?', 'Weekly, after each new DLD export. The data date is shown at the bottom of every page.'], ['Why yearly?', 'It is 31% cheaper than monthly: AED 1,490 instead of AED 2,148 a year.'],
        ['Can I cancel?', 'Yes, anytime from your account. Access stays until the end of the paid period.'], ['Is this investment advice?', 'No. It is analytics from actual transactions; the buying decision is yours.']],
      finalH: 'Buy Dubai property on data, not promises', note: 'Payments by Stripe. Prices in AED. First 14 days free.' }
  };
  var ICONS = {
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>', ai: '<path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/>',
    memo: '<path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6"/>', fair: '<path d="M12 3v18M5 7h14M7 7l-3 7a3 3 0 0 0 6 0zM17 7l-3 7a3 3 0 0 0 6 0z"/>',
    risk: '<path d="M12 3 3 20h18zM12 10v4M12 17v.5"/>', png: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m3 16 5-5 4 4 3-3 6 6M15.5 8.5h.01"/>'
  };
  function vPricing() {
    var L = PR[lang] || PR.en, cur = isPro();
    get('meta.json').then(function (m) {
      var pm = function (s) { return parseFloat(String(s).replace(/[^\d.]/g, '')) || 0; };
      var money = function (n) { return 'AED ' + Math.round(n).toLocaleString('en-US'); };
      var monthly = PLANS.display.month, yearly = PLANS.display.year, perMonthYearly = money(pm(yearly) / 12);
      var save = '−' + Math.round(100 * (1 - pm(yearly) / (pm(monthly) * 12))) + '%', trial = PLANS.trial_days ? (L.trial || '') : '';
      var ico = function (k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[k] + '</svg>'; };
      var check = '<svg class="ck" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7"/></svg>', dash = '<span class="dash" aria-hidden="true">—</span>';
      page('<div class="pricing">' +
        '<section class="pr-hero"><p class="eyebrow">' + L.eyebrow + '</p><h1>' + esc(L.h) + '</h1><p class="lead">' + esc(L.sub) + '</p>' +
        '<div class="pr-stats">' + L.stats.map(function (s) { return '<div><b>' + fmt(m[s[0]]) + '</b><span>' + esc(s[1]) + '</span></div>'; }).join('') + '</div>' +
        '<p class="pr-upd">' + esc(L.upd.replace('{d}', fdate(m.tx_date))) + '</p>' +
        (USER || APP ? '' : '<p class="pr-have">' + t('haveSub') + ' <button type="button" class="link-btn" id="pr-in">' + t('signIn') + '</button></p>') + '</section>' +
        '<div class="plans plans-3">' +
          '<div class="plan"><h2>' + L.free + '</h2><p class="price"><b>' + money(0) + '</b></p><p class="pnote">&nbsp;</p><ul>' + L.freeL.map(function (x) { return '<li>' + check + esc(x) + '</li>'; }).join('') + '</ul>' +
          (!cur ? (USER ? '<p class="cur">' + L.current + '</p>' : '<a class="btn btn-ghost" href="#/">' + L.ctaFree + '</a>') : '') + '</div>' +
          '<div class="plan"><h2>Pro · ' + L.month + '</h2><p class="price"><b>' + monthly + '</b><span> ' + L.perM + '</span></p><p class="pnote">' + (trial ? esc(trial) : '&nbsp;') + '</p><ul>' +
          L.proL.map(function (x) { return '<li>' + check + esc(x) + '</li>'; }).join('') + '</ul>' +
          (cur ? '<p class="cur">' + L.current + '</p>' : '<button type="button" class="btn btn-ghost" data-buy="month">' + L.cta + ' →</button>') + '</div>' +
          '<div class="plan plan-pro"><span class="badge-pop">' + L.popular + ' · ' + save + '</span><h2>Pro · ' + L.year + '</h2><p class="price"><s>' + money(pm(monthly) * 12) + '</s> <b>' + yearly + '</b><span> ' + L.perY + '</span></p><p class="pnote">' + esc(L.yearNote.replace('{m}', perMonthYearly)) + (trial ? ' · ' + esc(trial) : '') + '</p><ul>' +
          L.proL.map(function (x) { return '<li>' + check + esc(x) + '</li>'; }).join('') + '</ul>' +
          (cur ? '<p class="cur">' + L.current + '</p>' : '<button type="button" class="btn" data-buy="year">' + L.cta + ' →</button>') + '</div>' +
        '</div><p class="note center">' + esc(L.note) + '</p>' +
        '<section class="pr-sec"><h2>' + L.featH + '</h2><div class="feats">' + L.feats.map(function (f) { return '<div class="feat"><i>' + ico(f[0]) + '</i><h3>' + esc(f[1]) + '</h3><p>' + esc(f[2]) + '</p></div>'; }).join('') + '</div></section>' +
        '<section class="pr-sec"><h2>' + L.cmpH + '</h2><div class="tw cmp"><table><thead><tr><th></th><th class="c">' + L.free + '</th><th class="c pro">Pro</th></tr></thead><tbody>' +
          L.cmpRows.map(function (r) { return '<tr><td class="wrap">' + esc(r[0]) + '</td><td class="c">' + (r[1] ? check : dash) + '</td><td class="c pro">' + (r[2] ? check : dash) + '</td></tr>'; }).join('') + '</tbody></table></div></section>' +
        '<section class="pr-sec"><h2>' + L.trustH + '</h2><div class="trust">' + L.trust.map(function (x) { return '<div><b>' + esc(x[0]) + '</b><span>' + esc(x[1]) + '</span></div>'; }).join('') + '</div></section>' +
        '<section class="pr-sec"><h2>' + L.faqH + '</h2><div class="faq">' + L.faq.map(function (q) { return '<details><summary>' + esc(q[0]) + '</summary><p>' + esc(q[1]) + '</p></details>'; }).join('') + '</div></section>' +
        (cur ? '' : '<section class="pr-final"><h2>' + esc(L.finalH) + '</h2><button type="button" class="btn" id="pr-cta2">' + L.cta + ' →</button></section>') +
        '</div>' + (cur ? '' : '<div class="pr-sticky"><span id="pr-sticky-price"><b>' + monthly + '</b> ' + L.perM + '</span><button type="button" class="btn" id="pr-cta3">' + L.cta + '</button></div>'));
      var interval = 'year';
      var go = function () {
        if (!BILLING_LIVE) { toast(t('prSoon')); return; }
        track('begin_checkout', { plan: interval, currency: 'AED', value: interval === 'year' ? 1490 : 179, signed_in: !!USER });
        var run = function () {
          view.querySelectorAll('[data-buy],#pr-cta2,#pr-cta3').forEach(function (b) { b.disabled = true; });
          api('/api/billing/checkout', { interval: interval, lang: lang, ga_cid: gaCid() }).then(function (r) { location.href = r.url; })
            .catch(function (e) { view.querySelectorAll('[data-buy],#pr-cta2,#pr-cta3').forEach(function (b) { b.disabled = false; }); toast(e.status === 503 ? t('prSoon') : t('apiDown')); });
        };
        if (USER) run(); else openSignIn(run);
      };
      view.querySelectorAll('[data-buy]').forEach(function (b) { b.onclick = function () { interval = b.dataset.buy; go(); }; });
      if ($('#pr-in')) $('#pr-in').onclick = function () { openSignIn(); };
      if ($('#pr-cta2')) $('#pr-cta2').onclick = function () { interval = 'year'; go(); };
      if ($('#pr-cta3')) $('#pr-cta3').onclick = function () { interval = 'month'; go(); };
    });
  }
  function vAccount() {
    if (BILLING_LIVE && !USER && !APP) { location.replace('#/pricing'); return; }
    if (BILLING_LIVE && !USER) { page('<div class="lock"><h1 class="page">' + t('acH') + '</h1><p class="sub">' + t('siSub') + '</p><button type="button" class="btn" id="ac-in">' + t('signIn') + '</button></div>'); $('#ac-in').onclick = function () { openSignIn(); }; return; }
    var a = ACCOUNT, st = a.status ? (t('acStatus')[a.status] || a.status) : '';
    var end = a.period_end ? fdate(new Date(a.period_end * 1000).toISOString()) : '—';
    page('<h1 class="page">' + t('acH') + '</h1><div class="group-card">' +
      '<div class="row"><span>Email</span><b>' + esc(a.email || (USER && USER.email) || '—') + '</b></div>' +
      '<div class="row"><span>' + t('acPlan') + '</span><b>' + (isPro() ? 'Pro' : t('prFree')) + (st ? ' · ' + esc(st) : '') + '</b></div>' +
      (a.period_end ? '<div class="row"><span>' + t(a.status === 'canceled' ? 'acEnds' : 'acRenew') + '</span><b>' + esc(end) + '</b></div>' : '') + '</div>' +
      (APP ? (isPro() ? '' : '<p class="sub">' + t('lockApp') + '</p>') : '<div class="actions">' + (a.can_manage ? '<button type="button" class="btn" id="ac-portal">' + t('acManage') + '</button>' : '<a class="btn" href="#/pricing">' + t('acUpgrade') + '</a>') +
      (USER ? '<button type="button" class="chip" id="ac-out">' + t('acOut') + '</button>' : '') + '</div>'));
    if ($('#ac-portal')) $('#ac-portal').onclick = function () { api('/api/billing/portal').then(function (r) { location.href = r.url; }).catch(function () { toast(t('apiDown')); }); };
    if ($('#ac-out')) $('#ac-out').onclick = function () { firebase.auth().signOut(); location.hash = '#/pricing'; };
  }
  function vLocked(r) {
    page('<div class="lock"><div class="lock-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg></div>' +
      '<h1 class="page">' + t('lockH') + '</h1><p class="sub">' + t('lockSub') + '</p><ul class="lock-list">' + t('prProL').slice(0, 5).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      (APP ? '<p class="sub">' + t('lockApp') + '</p>' + (USER ? '' : '<div class="actions center"><button type="button" class="btn" id="lk-in">' + t('signIn') + '</button></div>') + '</div>'
        : '<div class="actions center"><a class="btn" href="#/pricing">' + t('lockSee') + '</a>' + (USER ? '' : '<button type="button" class="chip" id="lk-in">' + t('signIn') + '</button>') + '</div></div>'));
    if ($('#lk-in')) $('#lk-in').onclick = function () { openSignIn(); };
  }
  function toast(msg) {
    var el = $('#toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('show'); clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('show'); }, 3500);
  }
  // analytics: the same GA4 / Clarity / PostHog the site loads (absent on localhost or after "Decline")
  function track(name, params) {
    params = params || {};
    try { if (typeof window.gtag === 'function') window.gtag('event', name, params); } catch (e) {}
    try { if (typeof window.clarity === 'function') { window.clarity('event', name); if (/^(sign_up|login|begin_checkout|purchase)$/.test(name)) window.clarity('upgrade', name); } } catch (e) {}
    try { if (window.posthog && window.posthog.capture) window.posthog.capture(name, params); } catch (e) {}
  }
  function gaCid() {   // GA4 client id from the _ga cookie (GA1.1.123.456 -> 123.456)
    var m = document.cookie.match(/(?:^|; )_ga=GA\d\.\d\.([^;]+)/); return m ? m[1] : '';
  }
  function authEvent(cred) {
    var info = cred && cred.additionalUserInfo;
    track(info && info.isNewUser ? 'sign_up' : 'login', { method: (info && info.providerId) || 'password' });
  }
  var siMode = 'in';
  function openSignIn(then) {
    if (APP) { toApp({ type: 'signin' }); return; }
    afterSignIn = then || null;
    var m = $('#signin'); m.hidden = false; $('#si-err').hidden = true;
    setTimeout(function () { m.classList.add('open'); $('#si-email').focus(); }, 16);
  }
  function closeSignIn() { var m = $('#signin'); m.classList.remove('open'); setTimeout(function () { m.hidden = true; }, 200); }
  function wireSignIn() {
    var err = function (e) {
      var code = (e && e.code) || '', el = $('#si-err');
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') { el.hidden = true; return; }
      el.textContent = (t('siErrs')[code] || t('siErr')) + (code && !t('siErrs')[code] ? ' (' + code.replace('auth/', '') + ')' : '');
      el.hidden = false;
    };
    var done = function (cred) { authEvent(cred); closeSignIn(); var f = afterSignIn; afterSignIn = null; if (f) setTimeout(f, 400); };
    $('#signin').addEventListener('click', function (e) { if (e.target.closest('[data-sclose]')) closeSignIn(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#signin').hidden) closeSignIn(); });
    document.querySelectorAll('[data-provider]').forEach(function (b) {
      b.onclick = function () {
        var p = b.dataset.provider === 'google' ? new firebase.auth.GoogleAuthProvider() : new firebase.auth.OAuthProvider('apple.com');
        if (b.dataset.provider === 'apple') { p.addScope('email'); p.addScope('name'); }
        firebase.auth().signInWithPopup(p).then(done).catch(function (e) {
          // in-app browsers (Telegram, Instagram) and strict popup blockers: fall back to a full-page redirect
          if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) {
            err(e); try { sessionStorage.setItem('pe_after_signin', location.hash); } catch (x) {}
            firebase.auth().signInWithRedirect(p).catch(err);
          } else err(e);
        });
      };
    });
    $('#si-mode').onclick = function () {
      siMode = siMode === 'in' ? 'up' : 'in';
      $('#si-submit').textContent = t(siMode === 'in' ? 'siSignIn' : 'siSignUp'); this.textContent = t(siMode === 'in' ? 'siToSignUp' : 'siToSignIn');
      $('#si-pass').setAttribute('autocomplete', siMode === 'in' ? 'current-password' : 'new-password');
    };
    $('#si-reset').onclick = function () {
      var em = $('#si-email').value.trim(); if (!em) { $('#si-email').focus(); return; }
      firebase.auth().sendPasswordResetEmail(em).then(function () { toast(t('siResetSent')); }).catch(err);
    };
    $('#signin-form').onsubmit = function (e) {
      e.preventDefault();
      var em = $('#si-email').value.trim(), pw = $('#si-pass').value;
      (siMode === 'in' ? firebase.auth().signInWithEmailAndPassword(em, pw) : firebase.auth().createUserWithEmailAndPassword(em, pw)).then(done).catch(err);
    };
  }
  function refreshAccount() {
    return api('/api/me', null, 'GET').then(function (a) { ACCOUNT = a; }).catch(function () { ACCOUNT = { plan: 'free', email: USER && USER.email }; })
      .then(function () { cache = {}; paintAccount(); });
  }
  function paintAccount() {
    var el = $('#acct'); if (!el) return;
    el.hidden = !BILLING_LIVE;
    el.innerHTML = USER ? '<span class="av">' + esc(((USER.email || USER.displayName || '?')[0] || '?').toUpperCase()) + '</span>' + (isPro() ? '<span class="badge">Pro</span>' : '') : '<span>' + t('signIn') + '</span>';
    el.setAttribute('aria-label', USER ? t('navAccount') : t('signIn'));
    el.onclick = function (e) { if (!USER) { e.preventDefault(); openSignIn(); } };
  }
  function jwtEmail(tk) {
    try { return JSON.parse(decodeURIComponent(escape(atob(tk.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))))).email || ''; } catch (e) { return ''; }
  }
  function startApp() {
    document.documentElement.classList.add('in-app');
    var setUser = function (tk) { APP.token = tk || ''; USER = tk ? { email: jwtEmail(tk), getIdToken: function () { return Promise.resolve(APP.token); } } : null; };
    // the app pushes a fresh token every 45 min and after a 401; re-render only when the signed-in state changes
    window.PE_APP_SET_TOKEN = function (tk) {
      var was = !!USER; setUser(tk);
      if (was !== !!USER) refreshAccount().then(function () { chrome(); route(); });
    };
    setUser(APP.token);
    fetch(API + '/api/plans').then(function (r) { return r.json(); }).then(function (p) { PLANS = p; }).catch(function () {});
    refreshAccount().then(start);
  }
  function startLive() {
    if (APP) { startApp(); return; }
    var first = true;
    // never leave a blank page if Firebase is blocked or slow: open as a guest, auth state catches up later
    var guard = setTimeout(function () { if (first) { first = false; paintAccount(); start(); } }, 4000);
    if (!window.firebase) { clearTimeout(guard); first = false; start(); return; }
    firebase.initializeApp(FIREBASE);
    firebase.auth().getRedirectResult().then(function (r) {
      if (r && r.user) { authEvent(r); var h = null; try { h = sessionStorage.getItem('pe_after_signin'); sessionStorage.removeItem('pe_after_signin'); } catch (x) {} if (h) location.hash = h; }
    }).catch(function (e) { if (e && e.code) { toast((t('siErrs')[e.code] || t('siErr')) + ' (' + e.code.replace('auth/', '') + ')'); } });
    fetch(API + '/api/plans').then(function (r) { return r.json(); }).then(function (p) { PLANS = p; }).catch(function () {});
    wireSignIn();
    if (/checkout=cancel/.test(location.search)) { track('checkout_cancel', {}); history.replaceState(null, '', location.pathname + location.hash); }
    var paid = /checkout=success/.test(location.search), signedIn = null;
    firebase.auth().onAuthStateChanged(function (u) {
      USER = u; clearTimeout(guard);
      refreshAccount().then(function () {
        var wasIn = signedIn; signedIn = !!USER;
        if (first) { first = false; start(); } else { chrome(); route(); }
        if (!wasIn && USER && !isPro() && !afterSignIn && !paid) location.hash = '#/pricing';
        if (paid && USER) {
          paid = false; history.replaceState(null, '', location.pathname + location.hash);
          if (isPro()) { track(PLANS.mp ? 'pro_activated' : 'purchase', { currency: 'AED' }); toast(t('okPaid')); return; }
          toast(t('waitPaid'));
          var tries = 0, poll = setInterval(function () {   // the Stripe webhook usually lands within seconds
            refreshAccount().then(function () { if (isPro() || ++tries > 10) { clearInterval(poll); if (isPro()) { track(PLANS.mp ? 'pro_activated' : 'purchase', { currency: 'AED' }); toast(t('okPaid')); route(); } } });
          }, 2000);
        }
      });
    });
  }

  // ------------------------------------------------------------------ onboarding tour (spotlight + coach marks)
  var TOUR = {
    ru: { next: 'Далее', back: 'Назад', skip: 'Пропустить', done: 'Готово', of: 'из', replay: 'Обучение', start: 'Начать тур', hi: 'Добро пожаловать в PromptEstates Pro', hiSub: 'Рынок Дубая по официальным данным DLD — в одном окне. Покажем главное за 30 секунд.',
      steps: [
        { route: '', sel: ['#tabs', '#tabbar'], t: 'Разделы дашборда', d: 'Рынок, карта, районы, проекты, сделки и застройщики — всё по официальным данным Dubai Land Department.' },
        { route: '', sel: ['.kpis'], t: 'Главные цифры за 12 месяцев', d: 'Сколько сделок, на какую сумму, медиана цены, доля off-plan, аренда и доходность. Цифры обновляются каждую неделю.' },
        { route: '', sel: ['.top .tools', '#more-btn'], t: 'Единицы, язык и тема', d: 'Переключайте м² и sq ft, язык интерфейса, светлую и тёмную тему.' },
        { route: 'map', sel: ['#mpanel'], t: 'Вид карты и слои', d: 'Выберите стиль, отображение (столбцы, границы районов, 2D) и включите слои: тепловую карту, метро, 3D-здания, волну сдачи.' },
        { route: 'map', sel: ['#legend'], t: 'Цвет и цифры', d: 'Цвет района — его место среди других районов по выбранному показателю, цифра внутри — само значение.' },
        { route: 'map', sel: ['#acct', '#more-btn'], t: 'Pro открывает всё', d: 'ИИ-аналитик, все проекты и сделки, фильтры по типу жилья, меморандумы и справедливая цена. Войдите тем же аккаунтом, что в приложении.' }
      ] },
    en: { next: 'Next', back: 'Back', skip: 'Skip', done: 'Done', of: 'of', replay: 'Tour', start: 'Start the tour', hi: 'Welcome to PromptEstates Pro', hiSub: 'The Dubai market from official DLD data, in one window. Here are the essentials in 30 seconds.',
      steps: [
        { route: '', sel: ['#tabs', '#tabbar'], t: 'Dashboard sections', d: 'Market, map, areas, projects, transactions and developers — all from official Dubai Land Department data.' },
        { route: '', sel: ['.kpis'], t: 'Key numbers for 12 months', d: 'Sales count and value, median price, off-plan share, rents and yields. Updated every week.' },
        { route: '', sel: ['.top .tools', '#more-btn'], t: 'Units, language and theme', d: 'Switch between m² and sq ft, pick the language, light or dark.' },
        { route: 'map', sel: ['#mpanel'], t: 'Map view and layers', d: 'Pick a style and a display (columns, district outlines, 2D) and turn on layers: heatmap, metro, 3D buildings, handover wave.' },
        { route: 'map', sel: ['#legend'], t: 'Colours and numbers', d: 'A district\'s colour shows where it ranks among all districts on the chosen metric; the number inside is the value itself.' },
        { route: 'map', sel: ['#acct', '#more-btn'], t: 'Pro unlocks everything', d: 'The AI analyst, every project and transaction, property-type filters, memos and fair price. Sign in with your PromptEstates app account.' }
      ] }
  };
  var tour = null;
  function visibleEl(sels) {
    for (var i = 0; i < sels.length; i++) {
      var el = document.querySelector(sels[i]);
      if (el && (el.offsetParent !== null || getComputedStyle(el).position === 'fixed')) { var r = el.getBoundingClientRect(); if (r.width && r.height) return el; }
    }
    return null;
  }
  function startTour() {
    if (tour) return;
    var L = TOUR[lang] || TOUR.en, i = -1, n = L.steps.length;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var mobile = function () { return innerWidth <= 640; };
    var dots = ''; for (var k = 0; k < n; k++) dots += '<i></i>';
    var ov = document.createElement('div'); ov.className = 'tour is-intro'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', L.hi);
    ov.innerHTML = '<div class="tour-hole"></div>' +
      '<div class="tour-intro" role="document"><div class="ti-media"><video src="/shots/app-tour.mp4" autoplay muted loop playsinline preload="auto"></video><span class="ti-badge">DLD · live</span></div>' +
      '<div class="ti-body"><h2>' + esc(L.hi) + '</h2><p>' + esc(L.hiSub) + '</p><div class="ti-stats"></div>' +
      '<div class="tour-btns"><button type="button" class="link-btn tour-skip">' + L.skip + '</button><span></span><button type="button" class="btn tour-go">' + L.start + '</button></div></div></div>' +
      '<div class="tour-card" role="document" hidden><div class="tour-dots" aria-hidden="true">' + dots + '</div><p class="tour-step"></p><h3></h3><p class="tour-text"></p>' +
      '<div class="tour-btns"><button type="button" class="link-btn tour-skip">' + L.skip + '</button><span></span><button type="button" class="chip tour-back">' + L.back + '</button><button type="button" class="btn tour-next"></button></div></div>';
    document.body.appendChild(ov);
    var hole = ov.querySelector('.tour-hole'), card = ov.querySelector('.tour-card'), intro = ov.querySelector('.tour-intro');
    tour = { close: function () {
      window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); document.removeEventListener('keydown', key);
      tour = null; try { localStorage.setItem('pe_tour_done', '1'); } catch (e) {}
      ov.classList.add('is-out'); setTimeout(function () { ov.remove(); }, reduce ? 0 : 220);
    } };

    // live numbers from the market KPIs, counted up from zero
    var stats = ov.querySelector('.ti-stats');
    Array.prototype.slice.call(document.querySelectorAll('.kpis .kpi'), 0, 3).forEach(function (el) {
      var lab = el.querySelector('span'), val = el.querySelector('b'); if (!lab || !val) return;
      var txt = Array.prototype.map.call(val.childNodes, function (x) { return x.textContent.trim(); }).filter(Boolean).join(' ').replace(/\s+/g, ' '), m = txt.match(/\d[\d\s.,]*/);
      var d = document.createElement('div'); d.className = 'ti-stat'; d.innerHTML = '<b></b><span></span>';
      d.querySelector('span').textContent = lab.textContent; stats.appendChild(d);
      var out = d.querySelector('b');
      if (!m || reduce) { out.textContent = txt; return; }
      var raw = m[0].replace(/[\s.,]+$/, ''), ds = lang === 'ru' ? ',' : '.';
      var num = parseFloat(raw.replace(lang === 'ru' ? /\s/g : /,/g, '').replace(ds, '.')), dec = (raw.split(ds)[1] || '').length;
      if (!isFinite(num)) { out.textContent = txt; return; }
      var pre = txt.slice(0, m.index), post = txt.slice(m.index + raw.length), t0 = performance.now();
      var nf = new Intl.NumberFormat(loc() + '-u-nu-latn', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      (function step() {
        var p = Math.min(1, (performance.now() - t0) / 1600), e = 1 - Math.pow(1 - p, 3);
        out.textContent = p < 1 ? pre + nf.format(num * e) + post : txt;
        if (p < 1 && document.body.contains(out)) requestAnimationFrame(step);
      })();
    });

    function place() {
      if (i < 0) return;
      var s = L.steps[i], el = visibleEl(s.sel), vw = innerWidth, vh = innerHeight;
      if (!el) {
        hole.style.opacity = 0; ov.classList.add('no-target'); card.classList.remove('at-top');
        if (mobile()) { card.style.left = card.style.top = card.style.width = card.style.transform = ''; return; }
        card.style.left = '50%'; card.style.top = '50%'; card.style.transform = 'translate(-50%,-50%)'; return;
      }
      var r = el.getBoundingClientRect(), pad = 8;
      var hl = Math.max(4, r.left - pad), ht = Math.max(4, r.top - pad), hw = Math.min(vw - 8, r.width + pad * 2), hh = Math.min(vh - 8, r.height + pad * 2);
      if (mobile()) {
        // bottom sheet; flips to the top when the target sits low (e.g. the tab bar)
        var low = r.top + r.height / 2 > vh * 0.55;
        card.classList.toggle('at-top', low);
        card.style.left = card.style.top = card.style.width = card.style.transform = '';
        var sh = card.offsetHeight + 24;
        if (!low) hh = Math.max(36, Math.min(hh, vh - sh - ht));
        else if (ht < sh) { hh = Math.max(36, hh - (sh - ht)); ht = sh; }
      } else {
        var cw = Math.min(360, vw - 24), ch = card.offsetHeight || 180, below = r.bottom + pad + 14, above = r.top - pad - 14 - ch;
        var top = below + ch < vh ? below : above > 8 ? above : Math.max(8, vh - ch - 12);
        var left = Math.min(Math.max(12, r.left + r.width / 2 - cw / 2), vw - cw - 12);
        card.style.transform = 'none'; card.style.width = cw + 'px'; card.style.left = left + 'px'; card.style.top = top + 'px';
      }
      ov.classList.remove('no-target'); hole.style.opacity = 1; hole.style.left = hl + 'px'; hole.style.top = ht + 'px'; hole.style.width = hw + 'px'; hole.style.height = hh + 'px';
    }
    function show() {
      var s = L.steps[i], here = (location.hash.replace(/^#\/?/, '').split('/')[0] || '');
      ov.querySelector('.tour-step').textContent = (i + 1) + ' ' + L.of + ' ' + n;
      ov.querySelector('h3').textContent = s.t; ov.querySelector('.tour-text').textContent = s.d;
      ov.querySelector('.tour-back').hidden = i === 0;
      ov.querySelector('.tour-next').textContent = i === n - 1 ? L.done : L.next;
      ov.querySelectorAll('.tour-dots i').forEach(function (d, j) { d.className = j === i ? 'on' : j < i ? 'done' : ''; });
      card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
      var go = function () {
        var el = visibleEl(s.sel);
        if (el && getComputedStyle(el).position !== 'fixed') el.scrollIntoView({ block: mobile() ? 'start' : 'center', behavior: reduce ? 'auto' : 'smooth' });
        setTimeout(place, 350); setTimeout(place, 900);
      };
      if (here !== s.route && !(s.route === '' && here === 'market')) { location.hash = '#/' + s.route; setTimeout(go, 1400); } else go();
      place();
      ov.querySelector('.tour-next').focus();
    }
    function begin() { ov.classList.remove('is-intro'); intro.remove(); card.hidden = false; i = 0; show(); }
    function key(e) {
      if (e.key === 'Escape') tour.close();
      else if (i < 0) { if (e.key === 'Enter') { e.preventDefault(); begin(); } }
      else if (e.key === 'ArrowRight') next(); else if (e.key === 'ArrowLeft' && i > 0) { i--; show(); }
    }
    function next() { if (i < n - 1) { i++; show(); } else tour.close(); }
    ov.querySelector('.tour-go').onclick = begin;
    ov.querySelector('.tour-next').onclick = next;
    ov.querySelector('.tour-back').onclick = function () { if (i > 0) { i--; show(); } };
    ov.querySelectorAll('.tour-skip').forEach(function (b) { b.onclick = function () { tour.close(); }; });
    window.addEventListener('resize', place); window.addEventListener('scroll', place, true); document.addEventListener('keydown', key);
    ov.querySelector('.tour-go').focus();
  }
  function maybeTour() {
    var seen = false; try { seen = localStorage.getItem('pe_tour_done') === '1'; } catch (e) { seen = true; }
    if (!seen) setTimeout(function () { if (!document.querySelector('.modal:not([hidden])') && !/^#\/(pricing|ask|account)/.test(location.hash)) startTour(); }, 1800);
  }

  // ------------------------------------------------------------------ router & chrome
  var routeSeen = false;
  function route() {
    if (routeSeen) track('page_view', { page_location: location.href, page_title: 'Pro · ' + (location.hash.replace(/^#\/?/, '').split('/')[0] || 'market') });
    routeSeen = true;
    var h = location.hash.replace(/^#\/?/, '').split('/');
    var r = h[0] || 'market';
    var cur = { area: 'areas', project: 'projects', developer: 'developers', adarea: 'areas' }[r] || r;
    var bar = { info: 'more', map: 'more', tx: 'more', developers: 'more' }[cur] || cur;
    document.querySelectorAll('#tabs a').forEach(function (a) { var on = a.dataset.route === cur; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    document.querySelectorAll('#tabbar [data-route]').forEach(function (a) { var on = a.dataset.route === bar; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (r === 'ad' || r === 'adarea') { if (CITY !== 'ad') { CITY = 'ad'; store('pro_city', 'ad'); chrome(); } if (r === 'ad') { location.replace('#/'); return; } }
    if (CITY === 'shj') {
      if (r === 'area' || r === 'project' || r === 'developer') { CITY = 'dxb'; store('pro_city', 'dxb'); chrome(); }
      else { ({ market: vSHJ, ask: function () { vAsk(h[1]); }, pricing: vPricing, account: vAccount }[r] || vSHJNone)(); return; }
    }
    if (CITY === 'ad' && (r === 'area' || r === 'project' || r === 'developer')) { CITY = 'dxb'; store('pro_city', 'dxb'); chrome(); }   // Dubai links from AI answers
    if (CITY === 'ad') {
      var adv = { market: function () { vAD('market'); }, map: function () { vAD('map'); }, areas: function () { vAD('areas'); }, ask: function () { vAsk(h[1]); }, pricing: vPricing, account: vAccount,
        adarea: function () { if (BILLING_LIVE && !isPro()) vLocked(r); else vADArea(h[1]); } }[r];
      (adv || vADNone)(); return;
    }
    if (BILLING_LIVE && !isPro() && FREE_ROUTES.indexOf(r) < 0) { vLocked(r); return; }
    if (APP && r === 'pricing') { if (isPro()) location.replace('#/'); else vLocked(r); return; }
    ({ pricing: vPricing, account: vAccount, market: vMarket, ask: function () { vAsk(h[1]); }, adarea: function () { location.replace('#/areas'); }, info: vInfo, map: vMap, areas: vAreas, area: function () { vArea(h[1]); }, projects: vProjects, project: function () { vProject(h[1]); },
       tx: function () { vTx(h[1]); }, developers: vDevelopers, developer: function () { vDeveloper(h[1]); } }[r] || vMarket)();
  }
  function chrome() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = t(el.dataset.t); });
    document.querySelectorAll('[data-ph]').forEach(function (el) { el.placeholder = t(el.dataset.ph); });
    paintAccount();
    var th = document.documentElement.getAttribute('data-theme');
    document.querySelectorAll('[data-unit]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.unit === unit); if (b.dataset.unit === 'm2') b.textContent = lang === 'ru' ? 'м²' : 'm²'; });
    document.querySelectorAll('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lang === lang); });
    paintLang();
    document.querySelectorAll('select[data-city-sel]').forEach(function (sel) {
      sel.innerHTML = [['dxb', 'cityDxb'], ['ad', 'navAD'], ['shj', 'citySHJ']].map(function (c) { return '<option value="' + c[0] + '">' + esc(t(c[1])) + '</option>'; }).join('');
      sel.value = CITY; sel.onchange = function () { setCity(sel.value); };
    });
    document.documentElement.setAttribute('data-region', CITY);
    document.querySelectorAll('[data-theme-set]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.themeSet === th); });
    get('meta.json').then(function (m) {
      $('#foot').textContent = t('source').replace('{tx}', m.tx_date).replace('{rent}', m.rent_date).replace('{rs}', m.rent_sample).replace('{reg}', m.registry_date);
    });
  }
  function start() {
    $('#gate').hidden = true; $('#app').hidden = false;
    chrome(); route();
    window.addEventListener('hashchange', route);
    var hb = document.getElementById('tour-btn'); if (hb) hb.onclick = function () { closeSet(); startTour(); };
    var sb = $('#set-btn'), sp = $('#set-pop');
    function closeSet() { if (sp && !sp.hidden) { sp.hidden = true; sb.setAttribute('aria-expanded', 'false'); } }
    if (sb) {
      sb.onclick = function (e) { e.stopPropagation(); sp.hidden = !sp.hidden; sb.setAttribute('aria-expanded', String(!sp.hidden)); };
      document.addEventListener('click', function (e) { if (!e.target.closest('.set-wrap')) closeSet(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSet(); });
    }
    maybeTour();
    document.addEventListener('click', function (e) {
      var cg = e.target.closest('button[data-city],[data-city-go]');
      if (cg) { setCity(cg.dataset.city || cg.dataset.cityGo); return; }
      var b = e.target.closest('[data-unit],[data-lang],[data-theme-set]');
      if (!b) return;
      if (b.dataset.unit && b.dataset.unit !== unit) { unit = b.dataset.unit; store('pro_unit', unit); }
      else if (b.dataset.lang && b.dataset.lang !== lang) { lang = b.dataset.lang; store('pro_lang', lang); }
      else if (b.dataset.themeSet) { document.documentElement.setAttribute('data-theme', b.dataset.themeSet); store('pe_theme', b.dataset.themeSet); }
      else return;
      chrome(); route();
    });
    // "More" sheet (iOS-style): secondary sections + settings on phones
    var sheet = $('#sheet'), opener;
    var closeSheet = function () { sheet.classList.remove('open'); setTimeout(function () { sheet.hidden = true; }, 220); if (opener) opener.focus(); };
    $('#more-btn').onclick = function () {
      opener = this; sheet.hidden = false;
      setTimeout(function () { sheet.classList.add('open'); $('.sheet-head [data-close]').focus(); }, 16);
    };
    sheet.addEventListener('click', function (e) { if (e.target.closest('[data-tour]')) setTimeout(startTour, 400); if (e.target.closest('[data-close]')) closeSheet(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });
  }
  // ------------------------------------------------------------------ extra languages (src/pro/pro-i18n.js)
  function deepMerge(base, over) {
    if (Array.isArray(base)) {
      if (!Array.isArray(over)) return base;
      return base.map(function (b, i) { return over[i] === undefined ? b : (b && typeof b === 'object' ? deepMerge(b, over[i]) : over[i]); });
    }
    if (base && typeof base === 'object') {
      var out = {}; Object.keys(base).forEach(function (k) { out[k] = over && over[k] !== undefined ? deepMerge(base[k], over[k]) : base[k]; }); return out;
    }
    return over === undefined || over === null || over === '' ? base : over;
  }
  function applyI18n() {
    var dicts = { T: T, PR: PR, TOUR: TOUR, MT: MT, IT: IT };
    Object.keys(I18N).forEach(function (code) {
      Object.keys(dicts).forEach(function (k) { dicts[k][code] = deepMerge(dicts[k].en, (I18N[code] || {})[k] || {}); });
    });
  }
  function paintLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll('select[data-lang-sel]').forEach(function (sel) {
      if (!sel.options.length) LANGS.forEach(function (c) { var o = document.createElement('option'); o.value = c; o.textContent = LNAMES[c] || c.toUpperCase(); sel.appendChild(o); });
      sel.value = lang;
      sel.onchange = function () { if (sel.value !== lang) { lang = sel.value; store('pro_lang', lang); if (CHAT) CHAT.welcome = null; chrome(); route(); } };
    });
  }

  function sha256(s) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  }
  // gate (prototype access control; real auth moves to app.promptestates.com with subscriptions)
  applyI18n();
  if (BILLING_LIVE) { startLive(); return; }
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
