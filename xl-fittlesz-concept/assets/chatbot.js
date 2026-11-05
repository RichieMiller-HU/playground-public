/* XL-FittLesz – scripted fake booking chatbot (no network, vanilla JS) */
(function () {
  'use strict';
  if (window.__xlcLoaded) return;
  window.__xlcLoaded = true;

  var KEY = 'xlc_state_v1';
  var PHONE = '+36 30 082 8181', PHONE_TEL = 'tel:+36300828181', EMAIL = 'hello@xlfittlesz.hu';
  var MAPS = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Kaposvár, Arany János u. 2/A');
  var DAYS = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
  var MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'];
  var TYPES = { group: 'Csoportos óra', squash: 'Fallabda', pt: 'Személyi edzés', wellness: 'Wellness' };
  var FALLBACK = {
    'Hétfő': [['18:00', 'Spinning', 'Éva'], ['18:30', 'Latin Cardio', 'Bíbor']],
    'Kedd': [['09:00', 'Spinracing', 'Adri'], ['16:00', 'Nihon Ju Jitsu', 'Kisterem'], ['17:00', 'Kangoo Power', 'Betty'], ['18:00', 'Spinning', 'Kata'], ['18:30', 'WeStep', 'Ági']],
    'Szerda': [['16:30', 'Spinracing', 'Adri'], ['17:00', 'Kangoo Tabata', 'Betty']],
    'Csütörtök': [['09:00', 'Spinracing', 'Adri'], ['16:00', 'Nihon Ju Jitsu', 'Kisterem'], ['17:00', 'Gyerekjóga', 'Andi'], ['18:00', 'Spinning', 'Kata'], ['18:30', 'WeStep', 'Ági'], ['19:30', 'Latin Cardio', 'Bíbor']],
    'Péntek': [['17:00', 'Kangoo Power', 'Betty'], ['18:00', 'Spinning', 'Éva']],
    'Szombat': [['09:00', 'Kangoo Power – kezdő', 'Betty']],
    'Vasárnap': [['17:00', 'Spinning', 'Kata']]
  };

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ---------- helpers ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ő/g, 'o').replace(/ű/g, 'u').trim(); }
  function slug(s) { return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function hhmm(d) { return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function rnd(a, b) { return reduce ? 150 : a + Math.random() * (b - a); }
  function code() { var c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = 'XL-'; for (var i = 0; i < 5; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
  function store(get, v) {
    try { if (get) return JSON.parse(sessionStorage.getItem(KEY) || 'null'); sessionStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
    return null;
  }

  function dayList() {
    var out = [], now = new Date();
    for (var i = 0; i < 7; i++) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      var name = DAYS[d.getDay()];
      var date = MONTHS[d.getMonth()] + ' ' + d.getDate() + '.';
      out.push({ idx: d.getDay(), name: name, label: (i === 0 ? 'Ma' : i === 1 ? 'Holnap' : name) + ' · ' + date, full: name + ', ' + date });
    }
    return out;
  }

  function classesFor(dayName) {
    try {
      var sch = window.XL && window.XL.schedule, list = [];
      var di = DAYS.indexOf(dayName);
      var matchDay = function (v) {
        if (typeof v === 'number') return v === ((di + 6) % 7) || false; /* 0 = Monday */
        return norm(v).slice(0, 3) === norm(dayName).slice(0, 3);
      };
      var push = function (it, day) {
        if (!it || typeof it !== 'object') return;
        var cls = null, tr = null, X = window.XL || {};
        (X.classes || []).forEach(function (c) { if (c.slug === (it.classSlug || it.slug)) cls = c; });
        (X.trainers || []).forEach(function (t) { if (t.id === (it.trainerId || (cls && cls.trainerId))) tr = t; });
        if (cls && !it.name) { it = Object.assign({}, it, { name: cls.name, trainer: tr ? (tr.short || tr.nick || tr.name) : '' }); }
        var name = it.name || it.class || it.title || it.className || it.classSlug || it.slug;
        var time = it.time || it.start || it.from;
        if (!name || !time) return;
        list.push([String(time).slice(0, 5), String(name), it.trainer || it.coach || it.room || '', it.slug || it.classSlug || it.classId || it.id, day]);
      };
      if (Array.isArray(sch)) {
        sch.forEach(function (it) { var dv = it && (it.day !== undefined ? it.day : it.nap); if (dv !== undefined && matchDay(dv)) push(it); });
      } else if (sch && typeof sch === 'object') {
        Object.keys(sch).forEach(function (k) {
          if (matchDay(k) && Array.isArray(sch[k])) sch[k].forEach(function (it) { push(it); });
        });
      }
      if (list.length) return list.sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
    } catch (e) {}
    return (FALLBACK[dayName] || []).map(function (c) { return [c[0], c[1], c[2], slug(c[1])]; });
  }

  function hourSlots(dayName, kind) {
    var wk = !(dayName === 'Szombat' || dayName === 'Vasárnap');
    var a = wk ? 6 : 8, b = wk ? 21 : 20;
    if (kind === 'pt') { a = wk ? 7 : 9; b = wk ? 20 : 17; }
    if (kind === 'wellness') { a = wk ? 10 : 10; b = wk ? 21 : 19; }
    var r = [];
    for (var h = a; h <= b; h++) r.push(('0' + h).slice(-2) + ':00');
    return r;
  }

  /* ---------- state ---------- */
  var saved = store(true);
  var S = saved && saved.msgs ? saved : { msgs: [], chips: [], step: 'idle', data: {}, open: false, unread: 0, greeted: false };
  var busy = false, root, el = {}, tipTimer, lastFocus;

  function save() { store(false, S); }

  /* ---------- DOM ---------- */
  var AV = '<svg viewBox="0 0 24 24" fill="none" stroke="#19e3ff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="7" width="16" height="12" rx="4"/><path d="M12 7V4"/><circle cx="12" cy="3.4" r="1" fill="#19e3ff"/><circle cx="9" cy="13" r="1.4" fill="#c6ff3d" stroke="none"/><circle cx="15" cy="13" r="1.4" fill="#c6ff3d" stroke="none"/><path d="M10 16.2h4"/></svg>';

  function build() {
    root = document.createElement('div');
    root.className = 'xlc-root';
    root.innerHTML =
      '<div class="xlc-tip" id="xlc-tip" role="status">Foglalj 2 perc alatt</div>' +
      '<button type="button" class="xlc-launcher" aria-label="Foglalási asszisztens megnyitása" aria-haspopup="dialog" aria-expanded="false">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" stroke-width="2.6"/></svg>' +
      '<span class="xlc-pulse" aria-hidden="true"></span><span class="xlc-badge" aria-hidden="true"></span></button>' +
      '<section class="xlc-panel" role="dialog" aria-modal="true" aria-label="XL Asszisztens – foglalás chat">' +
      '<header class="xlc-head"><div class="xlc-avatar">' + AV + '</div><div class="xlc-title"><div class="xlc-name">XL Asszisztens</div><div class="xlc-status"><i></i>Most elérhető</div></div>' +
      '<button type="button" class="xlc-close" aria-label="Chat bezárása"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>Bezár</button></header>' +
      '<div class="xlc-msgs" role="log" aria-live="polite" aria-label="Beszélgetés" tabindex="0"></div>' +
      '<div class="xlc-chips" role="group" aria-label="Gyors válaszok"></div>' +
      '<form class="xlc-form" autocomplete="off"><label class="xlc-sr" for="xlc-in">Írd be az üzeneted</label><input id="xlc-in" class="xlc-input" type="text" placeholder="Írj üzenetet…" maxlength="200" enterkeyhint="send"><button class="xlc-btn" type="submit" aria-label="Üzenet küldése"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg></button></form></section>';
    document.body.appendChild(root);
    el.launcher = root.querySelector('.xlc-launcher');
    el.badge = root.querySelector('.xlc-badge');
    el.tip = root.querySelector('.xlc-tip');
    el.panel = root.querySelector('.xlc-panel');
    el.msgs = root.querySelector('.xlc-msgs');
    el.chips = root.querySelector('.xlc-chips');
    el.form = root.querySelector('.xlc-form');
    el.input = root.querySelector('.xlc-input');
    el.close = root.querySelector('.xlc-close');

    el.launcher.addEventListener('click', function () { openChat(true); });
    el.close.addEventListener('click', function () { closeChat(); });
    el.form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = el.input.value.trim();
      if (!v || busy) return;
      el.input.value = '';
      userSay(v);
      handle(v, false);
    });
    el.chips.addEventListener('click', function (e) {
      var b = e.target.closest('button.xlc-chip');
      if (!b || busy) return;
      var i = +b.getAttribute('data-i'), c = S.chips[i];
      if (!c) return;
      userSay(c.l);
      handle(c.v, true);
    });
    root.addEventListener('keydown', function (e) {
      if (!S.open) return;
      if (e.key === 'Escape') { e.preventDefault(); closeChat(); return; }
      if (e.key !== 'Tab') return;
      var f = Array.prototype.filter.call(el.panel.querySelectorAll('button,a[href],input,[tabindex="0"]'), function (n) { return !n.disabled && n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!el.panel.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    });
  }

  function setBadge() {
    el.badge.textContent = S.unread;
    el.badge.classList.toggle('xlc-on', S.unread > 0 && !S.open);
  }

  function scrollDown() {
    var go = function () { try { el.msgs.scrollTo({ top: el.msgs.scrollHeight, behavior: reduce ? 'auto' : 'smooth' }); } catch (e) { el.msgs.scrollTop = el.msgs.scrollHeight; } };
    go(); setTimeout(go, 60);
  }

  function renderMsg(m) {
    var row = document.createElement('div');
    row.className = 'xlc-row xlc-row--' + m.who;
    row.innerHTML = (m.who === 'bot' ? '<div class="xlc-avatar xlc-avatar--sm">' + AV + '</div>' : '') +
      '<div class="xlc-col"><div class="xlc-bubble">' + m.html + '</div><time class="xlc-time">' + esc(m.t) + '</time></div>';
    el.msgs.appendChild(row);
    return row;
  }

  function renderChips() {
    el.chips.innerHTML = '';
    if (busy) return;
    S.chips.forEach(function (c, i) {
      var n;
      if (c.href) {
        n = document.createElement('a'); n.href = c.href;
        if (/^https?:/.test(c.href)) { n.target = '_blank'; n.rel = 'noopener'; }
      } else { n = document.createElement('button'); n.type = 'button'; n.setAttribute('data-i', i); }
      n.className = 'xlc-chip' + (c.cls ? ' ' + c.cls : '');
      n.textContent = c.l;
      el.chips.appendChild(n);
    });
  }

  function addMsg(who, html) {
    var m = { who: who, html: html, t: hhmm(new Date()) };
    S.msgs.push(m); save();
    renderMsg(m); scrollDown();
    return m;
  }
  function userSay(text) { S.chips = []; renderChips(); addMsg('user', esc(text)); }

  /* bot says a list of html strings sequentially with typing indicator, then shows chips */
  var queue = Promise.resolve();
  function say(parts, chips) {
    busy = true; S.chips = []; renderChips();
    queue = queue.then(function () {
      return parts.reduce(function (p, html) {
        return p.then(function () {
          return new Promise(function (res) {
            var t = document.createElement('div');
            t.className = 'xlc-row xlc-row--bot xlc-typing';
            t.innerHTML = '<div class="xlc-avatar xlc-avatar--sm">' + AV + '</div><div class="xlc-col"><div class="xlc-bubble" aria-label="Az asszisztens ír"><i></i><i></i><i></i></div></div>';
            el.msgs.appendChild(t); scrollDown();
            setTimeout(function () {
              t.remove();
              addMsg('bot', html);
              if (!S.open) { S.unread++; setBadge(); save(); }
              res();
            }, rnd(500, 900));
          });
        });
      }, Promise.resolve());
    }).then(function () {
      busy = false; S.chips = chips || []; save(); renderChips(); scrollDown();
    });
  }

  /* ---------- conversation ---------- */
  var MAIN = [
    { l: 'Időpontfoglalás', v: 'book' }, { l: 'Árak', v: 'prices' }, { l: 'Nyitvatartás & elérhetőség', v: 'hours' },
    { l: 'Ingyenes próbaedzés', v: 'trial' }, { l: 'Ember kell', v: 'human' }
  ];
  var BACK = { l: 'Főmenü', v: 'menu', cls: 'xlc-chip--alt' };

  function link(href, text, ext) { return '<a class="xlc-link" href="' + href + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + text + '</a>'; }

  function greet() {
    S.step = 'menu';
    say(['Szia! Én vagyok az <b>XL Asszisztens</b>. 💪 Segítek időpontot foglalni, árakat nézni, vagy bármi másban – miben segíthetek?'], MAIN);
  }
  function menu(msg) { S.step = 'menu'; S.data = {}; say([msg || 'Miben segíthetek még?'], MAIN); }

  function askType() {
    S.step = 'b_type'; S.data = {};
    say(['Szuper, foglaljunk! Mire szeretnél időpontot?'],
      [{ l: TYPES.group, v: 'group' }, { l: TYPES.squash, v: 'squash' }, { l: TYPES.pt, v: 'pt' }, { l: TYPES.wellness, v: 'wellness' }, BACK]);
  }
  function askDay(type) {
    S.data.type = type; S.step = 'b_day';
    var extra = type === 'group' ? ' Az órarendből tudsz majd választani.' : '';
    say(['<b>' + TYPES[type] + '</b> – melyik napra?' + extra],
      dayList().map(function (d) { return { l: d.label, v: 'day:' + d.idx + ':' + d.full }; }).concat([BACK]));
  }
  function askTime(dayStr) {
    var p = dayStr.split(':'); var full = p.slice(2).join(':'); var dayName = full.split(',')[0];
    S.data.day = full; S.data.dayName = dayName; S.step = 'b_time';
    var t = S.data.type, chips = [], msg;
    if (t === 'group') {
      var cl = classesFor(dayName);
      if (!cl.length) { say(['Ezen a napon nincs csoportos óra. 🙁 Válassz másik napot!'], dayList().map(function (d) { return { l: d.label, v: 'day:' + d.idx + ':' + d.full }; }).concat([BACK])); S.step = 'b_day'; return; }
      msg = 'Ezek az óráink ezen a napon (' + esc(full) + '):';
      chips = cl.map(function (c) { return { l: c[0] + ' · ' + c[1] + (c[2] ? ' (' + c[2] + ')' : ''), v: 'time:' + c[0] + '|' + c[1] + '|' + (c[3] || slug(c[1])) }; });
    } else {
      msg = 'Melyik időpont jó? (' + esc(full) + ')';
      chips = hourSlots(dayName, t).map(function (h) { return { l: h, v: 'time:' + h + '||' }; });
    }
    say([msg], chips.concat([{ l: 'Másik nap', v: 'back_day', cls: 'xlc-chip--alt' }, BACK]));
  }
  function askName() { S.step = 'b_name'; say(['Rendben! Hogy hívnak?'], [BACK]); }
  function askPhone() { S.step = 'b_phone'; say(['Örülök, <b>' + esc(S.data.name) + '</b>! Mi a telefonszámod? (pl. 30 123 4567)'], [BACK]); }
  function summary() {
    var d = S.data; S.step = 'b_confirm';
    var rows = [['Típus', TYPES[d.type]]];
    if (d.className) rows.push(['Óra', d.className]);
    rows.push(['Nap', d.day], ['Időpont', d.time], ['Név', d.name], ['Telefon', d.phone]);
    var h = rows.map(function (r) { return '<div><span>' + r[0] + '</span><em>' + esc(r[1]) + '</em></div>'; }).join('');
    say(['Majdnem kész! Ellenőrizd az adatokat:<div class="xlc-sum">' + h + '</div>'],
      [{ l: 'Megerősítem', v: 'confirm', cls: 'xlc-chip--go' }, { l: 'Módosítom', v: 'book', cls: 'xlc-chip--alt' }, BACK]);
  }
  function done() {
    var c = code(); S.data.code = c; S.step = 'b_done';
    say(['Kész, a helyed le van foglalva! 🎉<br>Foglalási kód:<br><span class="xlc-code">' + c + '</span><br>Lemondás: esti óráknál aznap 13:00-ig, reggelieknél az előző nap 17:00-ig. Várunk szeretettel!'],
      [{ l: 'Megnyitom a foglalóban', v: 'openbooking', cls: 'xlc-chip--go' }, { l: 'Főmenü', v: 'menu', cls: 'xlc-chip--alt' }]);
  }
  function openBooking() {
    var d = S.data, payload = { type: d.type, classSlug: d.classSlug || '', day: d.day, time: d.time };
    try { sessionStorage.setItem('xlc_prefill', JSON.stringify(payload)); } catch (e) {}
    if (window.XLBooking && typeof window.XLBooking.prefill === 'function') {
      try { window.XLBooking.prefill(payload); closeChat(); return; } catch (e) {}
    }
    window.location.href = 'foglalas.html';
  }
  function prices() {
    S.step = 'menu';
    var cards = [['Napijegy', '3 500 Ft'], ['Havi bérlet', '19 800 Ft'], ['10 alkalmas', '21 500 Ft'], ['Fallabda / óra', '7 100 Ft']]
      .map(function (c) { return '<div class="xlc-card"><small>' + c[0] + '</small><strong>' + c[1] + '</strong></div>'; }).join('');
    say(['Íme a legnépszerűbb jegyeink:<div class="xlc-cards">' + cards + '</div>Diákkedvezmény 25 éves korig. Teljes árlista: ' + link('index.html#arak', 'index.html#arak')],
      [{ l: 'Időpontfoglalás', v: 'book' }, { l: 'Teljes árlista', v: 'x', href: 'index.html#arak' }, BACK]);
  }
  function hours() {
    S.step = 'menu';
    say(['<b>Nyitvatartás</b><br>Hétfő–péntek: 06:00–22:00<br>Szombat–vasárnap: 08:00–20:00',
      '<b>Cím:</b> 7400 Kaposvár, Arany János u. 2/A<br><b>Telefon:</b> ' + link(PHONE_TEL, PHONE) + '<br><b>E-mail:</b> ' + link('mailto:' + EMAIL, EMAIL)],
      [{ l: 'Útvonal', v: 'x', href: MAPS }, { l: 'Hívás', v: 'x', href: PHONE_TEL }, { l: 'Időpontfoglalás', v: 'book' }, BACK]);
  }
  function human() {
    S.step = 'menu';
    say(['Természetesen, kollégáink szívesen segítenek!<br>Telefon: ' + link(PHONE_TEL, PHONE) + '<br>E-mail: ' + link('mailto:' + EMAIL, EMAIL) + '<br>Nyitvatartási időben azonnal elérsz minket.'],
      [{ l: 'Hívás', v: 'x', href: PHONE_TEL }, BACK]);
  }
  function trial() {
    S.step = 't_name'; S.data = { trial: true };
    say(['Az első próbaedzésed <b>ingyenes</b>! 🔥 Add meg a neved, és felvesszük a kapcsolatot.'], [BACK]);
  }
  function fallback() {
    say(['Ezt sajnos nem értettem pontosan. 🤔 Válassz az alábbiak közül, vagy írd le másképp (pl. „foglalás”, „árak”, „nyitvatartás”).'], MAIN);
    S.step = 'menu';
  }

  function validPhone(v) { var d = v.replace(/\D/g, ''); return d.length >= 9 && d.length <= 13 && /^[0-9+\s()\-\/]+$/.test(v); }

  function route(text) {
    var n = norm(text);
    if (/\b(ember|emberi|munkatars|operator|kollega|recepcio)\b|beszelni valakivel/.test(n)) return 'human';
    if (/probaedz|ingyen|proba\b/.test(n)) return 'trial';
    if (/fallabda|squash/.test(n)) return 'squash';
    if (/szemelyi|szemelyi edzo|\bpt\b/.test(n)) return 'pt';
    if (/wellness|szauna|szolarium/.test(n)) return 'wellness';
    if (/spinning|spinracing|kangoo|westep|latin|joga|jitsu|csoportos|orarend|\bora\b|\borak\b|zumba/.test(n)) return 'group';
    if (/foglal|idopont|jelentkez|lefoglal|szabad hely/.test(n)) return 'book';
    if (/\b(ar|arak|ara|aru)\b|berlet|jegy|mennyibe|koltseg|mibe kerul|fizet/.test(n)) return 'prices';
    if (/nyitva|nyitvatart|\bcim\b|hol vagytok|hol van|elerhet|telefon|e-?mail|nyitas|zaras|utvonal|merre/.test(n)) return 'hours';
    if (/^(szia|hello|helo|hali|udv|jo napot|jo estet|csao|cső|hey)/.test(n)) return 'greet';
    if (/^(menu|fomenu|megse|vissza|kezdjuk elolrol)/.test(n)) return 'menu';
    return null;
  }

  function dispatch(r) {
    switch (r) {
      case 'menu': return menu();
      case 'greet': return greet();
      case 'book': return askType();
      case 'prices': return prices();
      case 'hours': return hours();
      case 'trial': return trial();
      case 'human': return human();
      case 'group': case 'squash': case 'pt': case 'wellness': S.data = {}; return askDay(r);
    }
  }

  function handle(v, fromChip) {
    var step = S.step, t = String(v);
    if (fromChip) {
      if (t === 'back_day') return askDay(S.data.type);
      if (t === 'confirm') return done();
      if (t === 'openbooking') { openBooking(); return say(['Nyitom a foglalót…'], [BACK]); }
      if (/^day:/.test(t)) return askTime(t);
      if (/^time:/.test(t)) {
        var p = t.slice(5).split('|');
        S.data.time = p[0]; if (p[1]) { S.data.className = p[1]; S.data.classSlug = p[2]; }
        return askName();
      }
      return dispatch(t);
    }
    var r = route(t);
    if (step === 'b_name' || step === 't_name') {
      if (r === 'menu') return menu('Semmi gond, visszaléptünk.');
      if (t.length < 2 || /\d{4,}/.test(t)) return say(['Kérlek, a nevedet add meg (pl. Kovács Anna).'], [BACK]);
      S.data.name = t; return step === 'b_name' ? askPhone() : (S.step = 't_phone', say(['Köszi, <b>' + esc(t) + '</b>! Mi a telefonszámod, ahol visszahívhatunk?'], [BACK]));
    }
    if (step === 'b_phone' || step === 't_phone') {
      if (r === 'menu') return menu('Semmi gond, visszaléptünk.');
      if (!validPhone(t)) return say(['Ez nem tűnik érvényes telefonszámnak. 📱 Kérlek, add meg újra (pl. +36 30 123 4567).'], [BACK]);
      S.data.phone = t;
      if (step === 'b_phone') return summary();
      S.step = 'menu';
      return say(['Köszönjük, <b>' + esc(S.data.name) + '</b>! Az ingyenes próbaedzésedhez 1 munkanapon belül hívunk a(z) <b>' + esc(t) + '</b> számon. Foglalási kód: <span class="xlc-code">' + code() + '</span>'],
        [{ l: 'Időpontfoglalás', v: 'book' }, BACK]);
    }
    if (step === 'b_day') {
      var dl = dayList().filter(function (d) { return norm(t).indexOf(norm(d.name).slice(0, 4)) >= 0 || (norm(t) === 'ma' && d.label.indexOf('Ma') === 0) || (norm(t) === 'holnap' && d.label.indexOf('Holnap') === 0); })[0];
      if (dl && !(r && r !== 'menu' && r !== 'book')) return askTime('day:' + dl.idx + ':' + dl.full);
    }
    if (step === 'b_time') {
      var m = t.match(/(\d{1,2})[:.]?(\d{2})?/), ch = S.chips.filter(function (c) { return /^time:/.test(c.v); });
      if (m) {
        var hh = ('0' + m[1]).slice(-2) + ':' + (m[2] || '00');
        var hit = ch.filter(function (c) { return c.v.slice(5, 10) === hh; })[0];
        if (hit) { var p2 = hit.v.slice(5).split('|'); S.data.time = p2[0]; if (p2[1]) { S.data.className = p2[1]; S.data.classSlug = p2[2]; } return askName(); }
      }
      if (!r || r === 'menu') return say(['Ilyen időpontot nem találok. Válassz az alábbi lehetőségek közül:'], ch.concat([{ l: 'Másik nap', v: 'back_day', cls: 'xlc-chip--alt' }, BACK]));
    }
    if (step === 'b_confirm' && /^(igen|ok|oke|rendben|megerosit|jo)/.test(norm(t))) return done();
    if (r) return dispatch(r);
    if (step === 'b_type' || step === 'b_day' || step === 'b_time' || step === 'b_confirm') {
      return say(['Kérlek, válassz a lehetőségek közül, vagy lépj vissza a főmenübe.'], S.chips.length ? S.chips : [BACK]);
    }
    fallback();
  }

  /* ---------- open / close ---------- */
  function openChat(focus) {
    S.open = true; S.unread = 0; setBadge();
    root.classList.add('xlc-open'); el.launcher.setAttribute('aria-expanded', 'true');
    el.tip.classList.remove('xlc-on'); clearTimeout(tipTimer); S.tipDone = true;
    lastFocus = el.launcher;
    if (!S.msgs.length && !S.greeted) { S.greeted = true; greet(); }
    save(); scrollDown();
    if (focus) setTimeout(function () { el.input.focus(); }, 50);
  }
  function closeChat() {
    S.open = false; save();
    root.classList.remove('xlc-open'); el.launcher.setAttribute('aria-expanded', 'false');
    setBadge();
    setTimeout(function () { el.launcher.focus(); }, 0);
  }

  function init() {
    build();
    S.msgs.forEach(renderMsg); renderChips(); setBadge();
    if (S.step === 'idle' && S.msgs.length) S.step = 'menu';
    if (S.open) { root.classList.add('xlc-open'); el.launcher.setAttribute('aria-expanded', 'true'); scrollDown(); }
    else if (!S.tipDone) {
      tipTimer = setTimeout(function () {
        if (S.open) return;
        el.tip.classList.add('xlc-on');
        setTimeout(function () { el.tip.classList.remove('xlc-on'); }, 12000);
      }, 4000);
    }
    /* proactive greeting while closed */
    if (!S.greeted && !S.open) {
      setTimeout(function () {
        if (S.greeted || S.open) return;
        S.greeted = true; greet();
      }, 8000);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
