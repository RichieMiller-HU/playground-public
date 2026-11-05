/* XL-FittLesz – fake client-side booking flow. Public API: window.XLBooking */
(function () {
  'use strict';
  var XL = window.XL || { gym: {}, rooms: [], trainers: [], classes: [], schedule: [], days: [] };
  var DAYS = XL.days && XL.days.length ? XL.days : ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
  var DAY3 = ['Hét', 'Ked', 'Sze', 'Csü', 'Pén', 'Szo', 'Vas'];
  var MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
  var STEPS = ['Mit foglalsz?', 'Mikor?', 'Adataid', 'Összegzés'];
  var TYPES = [
    { id: 'class', icon: 'M4 14h3l2-6 3 10 2-6h6', name: 'Csoportos óra', sub: 'Spinning, Kangoo, WeStep, Latin Cardio…' },
    { id: 'court', icon: 'M5 4h14v16H5zM5 12h14M12 4v8', name: 'Fallabda pálya', sub: '3 pálya, óránként foglalható' },
    { id: 'pt', icon: 'M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12', name: 'Személyi edzés (PT)', sub: 'Egyéni edzés edzővel' },
    { id: 'wellness', icon: 'M12 3c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9z', name: 'Wellness', sub: 'Infraszauna, szolárium' }
  ];
  var PASSES = [['', 'Válassz…'], ['napijegy', 'Napijegy'], ['havi', 'Havi bérlet'], ['10', '10 alkalmas'], ['nincs', 'Még nincs bérletem']];
  var PASS_LABEL = { napijegy: 'Napijegy', havi: 'Havi bérlet', '10': '10 alkalmas bérlet', nincs: 'Még nincs bérletem' };
  var LS_DRAFT = 'xl_booking_draft', LS_LIST = 'xl_bookings';

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function dow(d) { return (d.getDay() + 6) % 7; }
  function ft(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Ft'; }
  function lsGet(k, def) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function byId(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id || arr[i].slug === id) return arr[i]; return null; }
  function dateLabel(d) { return MONTHS[d.getMonth()] + ' ' + d.getDate() + '., ' + DAYS[dow(d)].toLowerCase(); }
  function toMin(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }
  function addMin(t, m) { var x = toMin(t) + m; return pad(Math.floor(x / 60) % 24) + ':' + pad(x % 60); }

  /* ---------- days ---------- */
  var now = new Date();
  var days = [];
  for (var di = 0; di < 7; di++) days.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() + di));
  function dayByDow(n) { for (var i = 0; i < days.length; i++) if (dow(days[i]) === n) return days[i]; return days[0]; }
  function hoursFor(d) { return dow(d) >= 5 ? { open: 8, close: 20 } : { open: 6, close: 22 }; }
  function isPast(d, time) {
    var n = new Date();
    if (iso(d) !== iso(n)) return false;
    return toMin(time) <= n.getHours() * 60 + n.getMinutes();
  }

  /* ---------- state ---------- */
  var blank = { step: 0, type: '', date: '', slotId: '', waitlist: false, time: '', resource: '', minutes: 10, fRoom: '', fTrainer: '', classSlug: '', view: 'list', name: '', email: '', phone: '', pass: '', note: '', terms: false };
  var S = {}, k;
  for (k in blank) S[k] = blank[k];
  var touched = {};
  var done = null; // confirmed booking shown in success view

  function save() { lsSet(LS_DRAFT, S); }
  function load() {
    var d = lsGet(LS_DRAFT, null);
    if (d && typeof d === 'object') for (var key in blank) if (d[key] !== undefined) S[key] = d[key];
    if (S.date && days.map(iso).indexOf(S.date) < 0) { S.date = ''; S.slotId = ''; S.time = ''; S.waitlist = false; }
    S.terms = false;
  }
  function bookings() { var l = lsGet(LS_LIST, []); return Array.isArray(l) ? l : []; }

  /* ---------- domain ---------- */
  function slotInfo(sl) {
    var c = byId(XL.classes, sl.classSlug) || {}, tr = byId(XL.trainers, sl.trainerId || c.trainerId) || {}, rm = byId(XL.rooms, sl.roomId) || {};
    return { cls: c, trainer: tr, room: rm };
  }
  function localCount(slotId, date) {
    return bookings().filter(function (b) { return b.slotId === slotId && b.date === date && !b.waitlist; }).length;
  }
  function freeSeats(sl, date) { return Math.max(0, sl.capacity - sl.booked - localCount(sl.id, date)); }
  function slotsOn(d) {
    return XL.schedule.filter(function (s) { return s.day === dow(d); }).sort(function (a, b) { return toMin(a.time) - toMin(b.time); });
  }
  function resOptions() {
    if (S.type === 'court') return XL.rooms.filter(function (r) { return r.type === 'court'; }).map(function (r) { return [r.id, r.name]; });
    if (S.type === 'pt') return XL.trainers.filter(function (t) { return t.pt; }).map(function (t) { return [t.id, t.name]; });
    if (S.type === 'wellness') return [['infra', 'Infraszauna (30 perc)'], ['szolarium', 'Szolárium']];
    return [];
  }
  function resName(id) { var o = resOptions().filter(function (x) { return x[0] === id; })[0]; return o ? o[1] : ''; }
  function ensureResource() {
    var o = resOptions();
    if (o.length && !o.some(function (x) { return x[0] === S.resource; })) S.resource = o[0][0];
  }
  function isBusy(date, hour) {
    var key = S.type + '|' + S.resource + '|' + date + '|' + hour;
    if (hash(key) % 100 < 30) return true;
    return bookings().some(function (b) { return b.type === S.type && b.resource === S.resource && b.date === date && b.time === pad(hour) + ':00' && !b.waitlist; });
  }
  function hourSlots(d) {
    var h = hoursFor(d), out = [];
    var last = S.type === 'wellness' ? h.close - 1 : h.close - 1;
    for (var x = h.open; x <= last; x++) out.push(x);
    return out;
  }

  function selectedSlot() { return S.slotId ? byId(XL.schedule, S.slotId) : null; }

  function detail() {
    var d = S.date ? parseIso(S.date) : null, o = { title: '', where: '', who: '', duration: 0, time: S.time, date: d, price: null, priceNote: '', cancel: '' };
    if (!S.type) return o;
    if (S.type === 'class') {
      var sl = selectedSlot();
      if (sl) {
        var i = slotInfo(sl);
        o.title = i.cls.name || 'Csoportos óra'; o.where = i.room.name; o.who = i.trainer.name; o.duration = i.cls.duration; o.time = sl.time;
        var morning = toMin(sl.time) < 12 * 60;
        o.cancel = morning ? 'Délelőtti óra: díjmentesen az előző nap 17:00-ig mondható le.' : 'Esti óra: díjmentesen aznap 13:00-ig mondható le.';
        if (S.pass === 'havi' || S.pass === '10') { o.price = 0; o.priceNote = S.pass === 'havi' ? 'Havi bérletedből' : 'Alkalmas bérletedből levonva'; }
        else { o.price = 3500; o.priceNote = 'Napijegy (diák/nyugdíjas: 2 900 Ft)'; }
      } else { o.title = 'Csoportos óra'; }
    } else if (S.type === 'court') {
      o.title = 'Fallabda – ' + (resName(S.resource) || 'pálya'); o.where = resName(S.resource); o.duration = 60;
      if (d && S.time) { var day = dow(d) < 5 && toMin(S.time) < 16 * 60; o.price = day ? 5500 : 7100; o.priceNote = day ? '1 óra, napközbeni ár' : '1 óra'; }
      o.cancel = 'Pályafoglalás díjmentesen a kezdés előtt 2 órával mondható le (+36 30 082 8181).';
    } else if (S.type === 'pt') {
      o.title = 'Személyi edzés'; o.who = resName(S.resource); o.duration = 60; o.where = 'XL-FittLesz, Kaposvár';
      o.price = null; o.priceNote = 'Az árat az edzővel egyeztetitek';
      o.cancel = 'Személyi edzés díjmentesen a kezdés előtt 12 órával mondható le.';
    } else {
      var sz = S.resource === 'szolarium';
      o.title = sz ? 'Szolárium' : 'Infraszauna'; o.where = 'Wellness'; o.duration = sz ? S.minutes : 30;
      o.price = sz ? 130 * S.minutes : 1500; o.priceNote = sz ? S.minutes + ' perc × 130 Ft' : '30 perc';
      o.cancel = 'Wellness időpont díjmentesen a kezdés előtt 1 órával mondható le.';
    }
    return o;
  }
  function priceText(o) { return o.price === null ? 'Egyeztetés szerint' : (o.price === 0 ? '0 Ft' : ft(o.price)); }

  /* ---------- validation ---------- */
  function errors() {
    var e = {};
    if (!S.name || S.name.trim().length < 3 || S.name.trim().indexOf(' ') < 0) e.name = 'Add meg a teljes neved (vezeték- és keresztnév).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(S.email || '')) e.email = 'Adj meg egy érvényes e-mail címet.';
    if (!/^\+?[0-9 ()\/-]{8,18}$/.test(S.phone || '') || (S.phone.replace(/\D/g, '').length < 8)) e.phone = 'Adj meg egy érvényes telefonszámot, pl. +36 30 123 4567.';
    if (!S.pass) e.pass = 'Válaszd ki a bérlet típusát.';
    return e;
  }
  function stepValid(i) {
    if (i === 0) return !!S.type;
    if (i === 1) {
      if (S.type === 'class') return !!selectedSlot() && !!S.date;
      return !!S.date && !!S.time && !!S.resource;
    }
    if (i === 2) return !Object.keys(errors()).length;
    return true;
  }
  function reach() { var r = 0; while (r < 3 && stepValid(r)) r++; return r; }

  /* ---------- rendering ---------- */
  var elPanel = $('#bk-panel'), elSteps = $('#bk-steps'), elBack = $('#bk-back'), elNext = $('#bk-next'), elActions = $('#bk-actions');
  var elProg = $('#bk-progress'), elBar = $('#bk-progress-bar'), elSum = $('#bk-sum'), elSumBody = $('#bk-sum-body'), elSumMini = $('#bk-sum-mini');

  function svgIcon(path) { return '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + path + '"/></svg>'; }

  function renderSteps() {
    var r = reach();
    elSteps.innerHTML = STEPS.map(function (n, i) {
      var st = i === S.step ? 'is-current' : (i < S.step ? 'is-done' : '');
      var dis = i > r ? ' disabled' : '';
      return '<li class="bk-step ' + st + '"><button type="button" data-goto="' + i + '"' + dis + (i === S.step ? ' aria-current="step"' : '') + '><b>' + (i < S.step && stepValid(i) ? '&#10003;' : i + 1) + '</b><span>' + n + '</span></button></li>';
    }).join('');
    elBar.style.width = ((S.step + 1) / 4 * 100) + '%';
    elProg.setAttribute('aria-valuenow', S.step + 1);
    elProg.setAttribute('aria-valuetext', (S.step + 1) + '. lépés a 4-ből: ' + STEPS[S.step]);
  }

  function renderNav() {
    elActions.hidden = !!done;
    elBack.disabled = S.step === 0;
    elNext.hidden = S.step === 3;
    elNext.disabled = !stepValid(S.step);
    elNext.setAttribute('aria-disabled', elNext.disabled ? 'true' : 'false');
  }

  function stepHead(n, t, sub) {
    return '<header class="bk-head"><p class="eyebrow">' + n + '. lépés / 4</p><h2 tabindex="-1" id="bk-h">' + t + '</h2>' + (sub ? '<p class="bk-sub">' + sub + '</p>' : '') + '</header>';
  }

  function renderStep1() {
    return stepHead(1, 'MIT FOGLALSZ?', 'Válaszd ki, mire szeretnél időpontot. Konditerem használatához nem kell foglalni.') +
      '<div class="bk-types" role="radiogroup" aria-label="Foglalás típusa">' + TYPES.map(function (t) {
        var on = S.type === t.id;
        return '<button type="button" class="bk-type' + (on ? ' is-on' : '') + '" role="radio" aria-checked="' + on + '" data-type="' + t.id + '" data-k="t-' + t.id + '"' + (on || (!S.type && t.id === 'class') ? '' : ' tabindex="-1"') + '>' + svgIcon(t.icon) + '<strong>' + t.name + '</strong><span>' + t.sub + '</span></button>';
      }).join('') + '</div>';
  }

  function ring(free, cap) {
    var r = 17, c = 2 * Math.PI * r, pct = cap ? free / cap : 0;
    var col = free === 0 ? 'rgba(255,255,255,.25)' : (free <= 3 ? '#ff2d55' : '#c6ff3d');
    return '<span class="bk-ring" role="img" aria-label="' + free + ' szabad hely ' + cap + '-ből"><svg viewBox="0 0 44 44" width="52" height="52" aria-hidden="true"><circle cx="22" cy="22" r="' + r + '" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="4"/><circle cx="22" cy="22" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + (c * pct).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 22 22)"/></svg><b>' + free + '</b><small>szabad</small></span>';
  }

  function weekStrip() {
    return '<div class="bk-week" role="group" aria-label="Nap kiválasztása">' + days.map(function (d, i) {
      var on = S.date === iso(d);
      return '<button type="button" class="bk-day' + (on ? ' is-on' : '') + (i === 0 ? ' is-today' : '') + '" data-date="' + iso(d) + '" data-k="d-' + iso(d) + '" aria-pressed="' + on + '" aria-label="' + dateLabel(d) + (i === 0 ? ' (ma)' : '') + '"><small>' + DAY3[dow(d)] + '</small><b>' + d.getDate() + '</b><em>' + (i === 0 ? 'Ma' : MONTHS[d.getMonth()].slice(0, 3) + '.') + '</em></button>';
    }).join('') + '</div>';
  }

  function selectHtml(id, label, opts, val) {
    return '<label class="bk-field bk-field--sel"><span>' + label + '</span><select id="' + id + '" data-k="' + id + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
  }

  function classFilters() {
    var rooms = [['', 'Minden terem']].concat(XL.rooms.filter(function (r) { return r.type === 'class'; }).map(function (r) { return [r.id, r.name]; }));
    var trs = [['', 'Minden edző']];
    var seen = {};
    XL.schedule.forEach(function (s) { var t = slotInfo(s).trainer; if (t.id && !seen[t.id]) { seen[t.id] = 1; trs.push([t.id, t.name]); } });
    var cs = S.classSlug ? byId(XL.classes, S.classSlug) : null;
    return '<div class="bk-filters">' + selectHtml('f-room', 'Terem', rooms, S.fRoom) + selectHtml('f-trainer', 'Edző', trs, S.fTrainer) +
      '<div class="bk-view" role="group" aria-label="Nézet"><button type="button" data-view="list" aria-pressed="' + (S.view === 'list') + '">Lista</button><button type="button" data-view="grid" aria-pressed="' + (S.view === 'grid') + '">Rács</button></div></div>' +
      (cs ? '<p class="bk-chip">Óra: <b>' + esc(cs.name) + '</b> <button type="button" data-clear-class aria-label="Óraszűrő törlése">&times;</button></p>' : '');
  }
  function slotPass(s) {
    var i = slotInfo(s);
    if (S.classSlug && s.classSlug !== S.classSlug) return false;
    if (S.fRoom && s.roomId !== S.fRoom) return false;
    if (S.fTrainer && i.trainer.id !== S.fTrainer) return false;
    return true;
  }

  function slotCard(s, d) {
    var i = slotInfo(s), free = freeSeats(s, iso(d)), past = isPast(d, s.time), full = free === 0;
    var on = S.slotId === s.id && S.date === iso(d);
    var bars = ''; for (var b = 1; b <= 5; b++) bars += '<i class="' + (b <= (i.cls.intensity || 0) ? 'on' : '') + '"></i>';
    var btn;
    if (past) btn = '<button class="btn btn--ghost" type="button" disabled>Elmúlt</button>';
    else if (full) btn = '<button class="btn btn--ghost bk-wait' + (on ? ' is-on' : '') + '" type="button" data-slot="' + s.id + '" data-wait="1" data-k="s-' + s.id + '" aria-pressed="' + on + '">' + (on ? 'Várólistára kérem &#10003;' : 'Betelt – várólista') + '</button>';
    else btn = '<button class="btn ' + (on ? 'btn--primary' : 'btn--ghost') + '" type="button" data-slot="' + s.id + '" data-k="s-' + s.id + '" aria-pressed="' + on + '">' + (on ? 'Kiválasztva &#10003;' : 'Kiválasztom') + '</button>';
    return '<li class="bk-slot' + (on ? ' is-on' : '') + (full ? ' is-full' : '') + (past ? ' is-past' : '') + '" style="--cc:' + (i.cls.color || '#19e3ff') + '">' +
      '<div class="bk-slot__time"><b>' + s.time + '</b><small>' + (i.cls.duration || 60) + ' perc</small></div>' +
      '<div class="bk-slot__body"><h3>' + esc(i.cls.name) + '</h3><p>' + esc(i.trainer.name || '') + ' &middot; ' + esc(i.room.name || '') + '</p><span class="bk-int" title="Intenzitás: ' + i.cls.intensity + '/5" aria-label="Intenzitás: ' + i.cls.intensity + ' az 5-ből">' + bars + '</span></div>' +
      ring(free, s.capacity) + '<div class="bk-slot__act">' + btn + '</div></li>';
  }

  function classList() {
    var d = parseIso(S.date), list = slotsOn(d).filter(slotPass);
    if (!list.length) return '<p class="bk-empty">Ezen a napon nincs a szűrőnek megfelelő óra. Próbálj másik napot, vagy töröld a szűrőket.</p>';
    return '<ul class="bk-slots">' + list.map(function (s) { return slotCard(s, d); }).join('') + '</ul>';
  }
  function classGrid() {
    var times = {};
    XL.schedule.filter(slotPass).forEach(function (s) { times[s.time] = 1; });
    var ts = Object.keys(times).sort();
    if (!ts.length) return '<p class="bk-empty">Nincs a szűrőnek megfelelő óra.</p>';
    var h = '<div class="bk-gridwrap" tabindex="0" role="region" aria-label="Heti órarend"><table class="bk-grid"><thead><tr><th scope="col"><span class="sr">Idő</span></th>' + days.map(function (d, i) { return '<th scope="col" class="' + (S.date === iso(d) ? 'is-on' : '') + '">' + DAY3[dow(d)] + '<small>' + (i === 0 ? 'Ma' : d.getDate() + '.') + '</small></th>'; }).join('') + '</tr></thead><tbody>';
    ts.forEach(function (t) {
      h += '<tr><th scope="row">' + t + '</th>';
      days.forEach(function (d) {
        var s = slotsOn(d).filter(function (x) { return x.time === t && slotPass(x); })[0];
        if (!s) { h += '<td></td>'; return; }
        var i = slotInfo(s), free = freeSeats(s, iso(d)), past = isPast(d, t), on = S.slotId === s.id && S.date === iso(d);
        h += '<td><button type="button" class="bk-cell' + (on ? ' is-on' : '') + (free === 0 ? ' is-full' : '') + '" style="--cc:' + (i.cls.color || '#19e3ff') + '" data-slot="' + s.id + '" data-date="' + iso(d) + '"' + (free === 0 ? ' data-wait="1"' : '') + ' data-k="g-' + s.id + '"' + (past ? ' disabled' : '') + ' aria-pressed="' + on + '" aria-label="' + esc(i.cls.name) + ', ' + dateLabel(d) + ' ' + t + (free === 0 ? ', betelt' : ', ' + free + ' szabad hely') + '"><b>' + esc(i.cls.name.replace(' – kezdő', '')) + '</b><small>' + (free === 0 ? 'betelt' : free + ' hely') + '</small></button></td>';
      });
      h += '</tr>';
    });
    return h + '</tbody></table></div><p class="bk-hint">Koppints egy órára a kiválasztáshoz. A betelt órákra várólistára iratkozhatsz fel.</p>';
  }

  function hourGrid() {
    ensureResource();
    var d = parseIso(S.date), label = S.type === 'court' ? 'Pálya' : (S.type === 'pt' ? 'Edző' : 'Szolgáltatás');
    var extra = '';
    if (S.type === 'wellness' && S.resource === 'szolarium') extra = selectHtml('f-min', 'Időtartam', [[5, '5 perc'], [8, '8 perc'], [10, '10 perc'], [15, '15 perc'], [20, '20 perc']], S.minutes);
    var hs = hourSlots(d), h = hoursFor(d);
    return '<div class="bk-filters">' + selectHtml('f-res', label, resOptions(), S.resource) + extra + '</div>' +
      '<p class="bk-hint">Nyitvatartás ezen a napon: ' + pad(h.open) + ':00–' + pad(h.close) + ':00. A szürke időpontok már foglaltak.</p>' +
      '<div class="bk-hours" role="group" aria-label="Időpont kiválasztása">' + hs.map(function (x) {
        var t = pad(x) + ':00', busy = isBusy(S.date, x), past = isPast(d, t), on = S.time === t;
        return '<button type="button" class="bk-hour' + (on ? ' is-on' : '') + (busy ? ' is-busy' : '') + '" data-time="' + t + '" data-k="h-' + x + '"' + (busy || past ? ' disabled' : '') + ' aria-pressed="' + on + '"><b>' + t + '</b><small>' + (busy ? 'foglalt' : (past ? 'elmúlt' : 'szabad')) + '</small></button>';
      }).join('') + '</div>';
  }

  function renderStep2() {
    var out = stepHead(2, 'MIKOR?', S.type === 'class' ? 'Válassz napot a következő 7 napból, majd egy órát.' : 'Válassz napot és időpontot.') + weekStrip();
    if (!S.date) return out + '<p class="bk-empty">Először válassz egy napot fent.</p>';
    if (S.type === 'class') {
      out += classFilters();
      out += S.view === 'grid' ? classGrid() : classList();
    } else out += hourGrid();
    return out;
  }

  function fieldHtml(id, label, type, ac, extra) {
    var e = touched[id] ? errors()[id] : '';
    return '<div class="bk-field' + (e ? ' has-err' : '') + '"><label for="' + id + '">' + label + '</label><input id="' + id + '" name="' + id + '" type="' + type + '" autocomplete="' + ac + '" value="' + esc(S[id]) + '" ' + (extra || '') + ' aria-describedby="' + id + '-e"' + (e ? ' aria-invalid="true"' : '') + '><p class="bk-err" id="' + id + '-e">' + (e || '') + '</p></div>';
  }
  function renderStep3() {
    var pe = touched.pass ? errors().pass : '';
    return stepHead(3, 'ADATAID', 'Csak ennyi kell – a visszaigazolást a megadott e-mail címre küldjük (a foglalás demó, nem történik valódi mentés).') +
      '<form class="bk-form" id="bk-form" novalidate>' +
      fieldHtml('name', 'Teljes név', 'text', 'name', 'required placeholder="Kovács Anna"') +
      '<div class="bk-two">' + fieldHtml('email', 'E-mail', 'email', 'email', 'required inputmode="email" placeholder="anna@email.hu"') + fieldHtml('phone', 'Telefonszám', 'tel', 'tel', 'required inputmode="tel" placeholder="+36 30 123 4567"') + '</div>' +
      '<div class="bk-field' + (pe ? ' has-err' : '') + '"><label for="pass">Bérlet típusa</label><select id="pass" name="pass" required aria-describedby="pass-e"' + (pe ? ' aria-invalid="true"' : '') + '>' + PASSES.map(function (o) { return '<option value="' + o[0] + '"' + (S.pass === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select><p class="bk-err" id="pass-e">' + pe + '</p></div>' +
      '<div class="bk-field"><label for="note">Megjegyzés <small>(nem kötelező)</small></label><textarea id="note" name="note" rows="3" placeholder="Pl. kezdő vagyok, kérek segítséget a beállításhoz.">' + esc(S.note) + '</textarea></div>' +
      '</form>';
  }
  function renderStep4() {
    var o = detail();
    return stepHead(4, 'ÖSSZEGZÉS', 'Nézd át a foglalásod, és erősítsd meg.') +
      '<div class="bk-review"><p class="bk-rule"><b>Lemondási szabály:</b> ' + esc(o.cancel) + '</p>' +
      (S.type === 'class' && S.waitlist ? '<p class="bk-rule bk-rule--warn"><b>Várólista:</b> az óra betelt. Ha felszabadul a hely, e-mailben értesítünk.</p>' : '') +
      '<label class="bk-check"><input type="checkbox" id="terms"' + (S.terms ? ' checked' : '') + '><span>Elfogadom a lemondási szabályt és a házirendet.</span></label>' +
      '<button class="btn btn--primary btn--lg bk-confirm" type="button" id="bk-confirm"' + (S.terms ? '' : ' disabled') + '>' + (S.waitlist ? 'Feliratkozás a várólistára' : 'Foglalás megerősítése') + '</button></div>';
  }

  function renderSuccess() {
    var b = done;
    elPanel.innerHTML = '<div class="bk-success"><div class="bk-check-anim" aria-hidden="true"><svg viewBox="0 0 80 80" width="96" height="96"><circle cx="40" cy="40" r="36" fill="none" stroke="#c6ff3d" stroke-width="3"/><path d="M24 41l11 11 21-24" fill="none" stroke="#c6ff3d" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<p class="eyebrow">' + (b.waitlist ? 'Várólistán vagy' : 'Sikeres foglalás') + '</p><h2 tabindex="-1" id="bk-h">' + (b.waitlist ? 'FELIRATKOZTÁL!' : 'LEHETETLEN MÁRPEDIG NINCS!') + '</h2>' +
      '<p class="bk-sub">' + esc(b.title) + ' &middot; ' + esc(b.dateText) + ', ' + b.time + '</p>' +
      '<div class="bk-code"><small>Foglalási kód</small><b>' + b.code + '</b></div>' +
      '<p class="bk-sub">Megerősítést küldtünk ide: ' + esc(b.email) + ' <em>(demó)</em></p>' +
      '<div class="bk-success__act"><button class="btn btn--primary" type="button" data-ics="' + b.code + '">Add to calendar (.ics)</button><button class="btn btn--ghost" type="button" id="bk-new">Új foglalás</button><button class="btn btn--ghost" type="button" data-open-mine>Foglalásaim</button></div></div>';
    renderSteps(); renderNav(); renderSummary();
    elProg.setAttribute('aria-valuenow', 4);
    elBar.style.width = '100%';
  }

  function renderPanel(focusHead) {
    if (done) { renderSuccess(); return; }
    var fk = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('data-k');
    elPanel.innerHTML = [renderStep1, renderStep2, renderStep3, renderStep4][S.step]();
    renderSteps(); renderNav(); renderSummary();
    if (focusHead) { var h = $('#bk-h'); if (h) h.focus({ preventScroll: true }); }
    else if (fk) { var el = $('[data-k="' + fk + '"]', elPanel); if (el) el.focus({ preventScroll: true }); }
  }

  function renderSummary() {
    var o = detail(), rows = [];
    function row(l, v) { if (v) rows.push('<div><dt>' + l + '</dt><dd>' + v + '</dd></div>'); }
    var typeName = (TYPES.filter(function (t) { return t.id === S.type; })[0] || {}).name;
    row('Mit', typeName ? esc(o.title && S.type !== 'class' ? typeName + ' – ' + o.title.replace(/^.* – /, '') : (o.title || typeName)) : '');
    if (S.type === 'class' && o.title !== 'Csoportos óra') rows[0] = '<div><dt>Mit</dt><dd>' + esc(o.title) + '</dd></div>';
    var when = o.date ? dateLabel(o.date) + (o.time ? ', ' + o.time + (o.duration ? '–' + addMin(o.time, o.duration) : '') : '') : '';
    row('Mikor', esc(when));
    row('Hol', esc(o.where));
    row('Edző', esc(o.who));
    row('Név', esc(S.name));
    row('Bérlet', S.pass ? esc(PASS_LABEL[S.pass]) : '');
    if (S.waitlist && S.type === 'class') row('Státusz', '<span class="bk-tag">Várólista</span>');
    var any = rows.length > 0;
    var ready = S.type && (S.type === 'class' ? selectedSlot() : S.time);
    elSumBody.innerHTML = (any ? '<dl class="bk-dl">' + rows.join('') + '</dl>' : '<p class="bk-empty">Itt jelenik meg a foglalásod összegzése.</p>') +
      (ready ? '<div class="bk-price"><span>Fizetendő<small>' + esc(o.priceNote) + '</small></span><b>' + priceText(o) + '</b></div>' : '') +
      '<p class="bk-rule">' + esc(o.cancel || XL.cancellation || 'Esti óráknál aznap 13:00-ig, délelőtti óráknál az előző nap 17:00-ig mondható le.') + '</p>';
    elSumMini.textContent = ready ? (o.title + (o.time ? ' · ' + o.time : '')) : 'Még nincs választás';
  }

  /* ---------- actions ---------- */
  function go(n, focus) {
    if (n < 0 || n > 3) return;
    if (n > reach() && n > S.step) return;
    S.step = n; S.terms = false; save();
    renderPanel(focus !== false);
    if (focus !== false) { var top = $('.bk-steps').getBoundingClientRect().top + window.pageYOffset - 80; if (top < window.pageYOffset) window.scrollTo({ top: top, behavior: 'smooth' }); }
  }
  function resetSel() { S.slotId = ''; S.waitlist = false; S.time = ''; }
  function setType(t) {
    if (S.type !== t) { S.type = t; resetSel(); S.resource = ''; S.classSlug = t === 'class' ? S.classSlug : ''; ensureResource(); }
    if (!S.date) S.date = iso(days[0]);
    save();
  }
  function pickSlot(id, date, wait) {
    S.slotId = id; S.date = date || S.date; S.waitlist = !!wait; save();
  }

  function confirmBooking() {
    var o = detail(), code = 'XL-', chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (var i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    var b = { code: code, type: S.type, title: o.title, where: o.where, who: o.who, date: S.date, dateText: dateLabel(o.date), time: o.time, duration: o.duration || 60, slotId: S.slotId, resource: S.resource, waitlist: S.waitlist, name: S.name, email: S.email, price: priceText(o), created: Date.now() };
    var l = bookings(); l.unshift(b); lsSet(LS_LIST, l);
    done = b; lsDel(LS_DRAFT);
    renderPanel(true); renderCount(); renderDrawer();
    window.scrollTo({ top: $('.bk-hero').offsetHeight, behavior: 'smooth' });
  }
  function resetAll() {
    var keep = { name: S.name, email: S.email, phone: S.phone, pass: S.pass };
    for (var key in blank) S[key] = blank[key];
    for (key in keep) S[key] = keep[key];
    touched = {}; done = null; lsDel(LS_DRAFT); save(); renderPanel(true);
  }

  /* ---------- ICS ---------- */
  function icsStamp(dateIso, time) { return dateIso.replace(/-/g, '') + 'T' + time.replace(':', '') + '00'; }
  function downloadIcs(b) {
    var end = addMin(b.time, b.duration || 60);
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//XL-FittLesz//Foglalas//HU', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      'UID:' + b.code + '@xlfittlesz.hu', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''),
      'DTSTART:' + icsStamp(b.date, b.time), 'DTEND:' + icsStamp(b.date, end),
      'SUMMARY:' + b.title + ' – XL-FittLesz', 'LOCATION:' + (XL.gym.address || 'Arany János u. 2/A, 7400 Kaposvár'),
      'DESCRIPTION:Foglalási kód: ' + b.code + (b.waitlist ? ' (várólista)' : '') + '\\nLEHETETLEN MÁRPEDIG NINCS!',
      'BEGIN:VALARM', 'TRIGGER:-PT60M', 'ACTION:DISPLAY', 'DESCRIPTION:Hamarosan kezdődik: ' + b.title, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'];
    var blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = b.code + '.ics';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ---------- drawer ---------- */
  var drawer = $('#bk-drawer'), scrim = $('#bk-scrim'), lastFocus = null;
  function renderCount() {
    var n = bookings().length, c = $('#bk-count');
    c.textContent = n; c.hidden = !n;
  }
  function renderDrawer() {
    var l = bookings(), body = $('#bk-drawer-body');
    if (!l.length) { body.innerHTML = '<p class="bk-empty">Még nincs foglalásod. Foglalj egy időpontot, és itt fogod látni.</p>'; return; }
    body.innerHTML = '<ul class="bk-list">' + l.map(function (b) {
      return '<li><div><b>' + esc(b.title) + '</b> ' + (b.waitlist ? '<span class="bk-tag">Várólista</span>' : '') + '<p>' + esc(b.dateText) + ', ' + b.time + (b.where ? ' &middot; ' + esc(b.where) : '') + '</p><code>' + b.code + '</code></div>' +
        '<div class="bk-list__act"><button type="button" class="bk-mini" data-ics="' + b.code + '">.ics</button><button type="button" class="bk-mini bk-mini--del" data-cancel="' + b.code + '">Lemondás</button></div></li>';
    }).join('') + '</ul>';
  }
  function openDrawer() {
    lastFocus = document.activeElement; renderDrawer();
    drawer.hidden = false; scrim.hidden = false;
    requestAnimationFrame(function () { drawer.classList.add('is-open'); scrim.classList.add('is-open'); });
    $('#bk-close-mine').focus();
    document.body.classList.add('bk-lock');
  }
  function closeDrawer() {
    drawer.classList.remove('is-open'); scrim.classList.remove('is-open');
    document.body.classList.remove('bk-lock');
    setTimeout(function () { drawer.hidden = true; scrim.hidden = true; }, 250);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button, [data-view]');
    if (!t) return;
    if (t.hasAttribute('data-goto')) { go(+t.getAttribute('data-goto')); return; }
    if (t.hasAttribute('data-type')) { setType(t.getAttribute('data-type')); renderPanel(); return; }
    if (t.hasAttribute('data-date') && !t.hasAttribute('data-slot')) {
      S.date = t.getAttribute('data-date');
      if (S.type !== 'class' || (selectedSlot() && selectedSlot().day !== dow(parseIso(S.date)))) resetSel();
      else if (S.slotId && S.type === 'class') resetSel();
      if (S.type !== 'class') S.time = '';
      save(); renderPanel(); return;
    }
    if (t.hasAttribute('data-slot')) { pickSlot(t.getAttribute('data-slot'), t.getAttribute('data-date'), t.hasAttribute('data-wait')); renderPanel(); return; }
    if (t.hasAttribute('data-view')) { S.view = t.getAttribute('data-view'); save(); renderPanel(); return; }
    if (t.hasAttribute('data-clear-class')) { S.classSlug = ''; save(); renderPanel(); return; }
    if (t.hasAttribute('data-time')) { S.time = t.getAttribute('data-time'); save(); renderPanel(); return; }
    if (t.id === 'bk-back') { go(S.step - 1); return; }
    if (t.id === 'bk-next') {
      if (S.step === 2) { touched = { name: 1, email: 1, phone: 1, pass: 1 }; if (!stepValid(2)) { renderPanel(); var bad = $('.has-err input, .has-err select', elPanel); if (bad) bad.focus(); return; } }
      go(S.step + 1); return;
    }
    if (t.id === 'bk-confirm') { if (S.terms) confirmBooking(); return; }
    if (t.id === 'bk-new') { resetAll(); return; }
    if (t.id === 'bk-open-mine' || t.hasAttribute('data-open-mine')) { openDrawer(); return; }
    if (t.id === 'bk-close-mine') { closeDrawer(); return; }
    if (t.hasAttribute('data-ics')) {
      var code = t.getAttribute('data-ics'), b = bookings().filter(function (x) { return x.code === code; })[0] || (done && done.code === code ? done : null);
      if (b) downloadIcs(b); return;
    }
    if (t.hasAttribute('data-cancel')) {
      if (t.getAttribute('data-sure')) {
        var c = t.getAttribute('data-cancel');
        lsSet(LS_LIST, bookings().filter(function (x) { return x.code !== c; }));
        renderDrawer(); renderCount(); renderPanel();
      } else { t.setAttribute('data-sure', '1'); t.textContent = 'Biztosan?'; setTimeout(function () { if (t.isConnected) { t.removeAttribute('data-sure'); t.textContent = 'Lemondás'; } }, 3500); }
    }
  });
  scrim.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) {
    if (!drawer.hidden) {
      if (e.key === 'Escape') { closeDrawer(); return; }
      if (e.key === 'Tab') {
        var f = $$('button, a[href]', drawer).filter(function (x) { return !x.disabled; });
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    }
    var r = e.target.closest && e.target.closest('[role="radiogroup"]');
    if (r && /^Arrow/.test(e.key)) {
      var rs = $$('[role="radio"]', r), i = rs.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      var n = rs[(i + (/Right|Down/.test(e.key) ? 1 : rs.length - 1)) % rs.length];
      setType(n.getAttribute('data-type')); renderPanel();
      var again = $('[data-type="' + n.getAttribute('data-type') + '"]', elPanel); if (again) again.focus();
    }
  });
  elPanel.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'f-room') { S.fRoom = t.value; }
    else if (t.id === 'f-trainer') { S.fTrainer = t.value; }
    else if (t.id === 'f-res') { S.resource = t.value; S.time = ''; }
    else if (t.id === 'f-min') { S.minutes = +t.value; }
    else if (t.id === 'terms') { S.terms = t.checked; $('#bk-confirm').disabled = !t.checked; return; }
    else if (t.id === 'pass') { S.pass = t.value; touched.pass = 1; save(); renderPanel(); var p = $('#pass'); if (p) p.focus(); return; }
    else return;
    save(); renderPanel();
  });
  elPanel.addEventListener('input', function (e) {
    var t = e.target;
    if (!/^(name|email|phone|note)$/.test(t.id)) return;
    S[t.id] = t.value; save(); renderSummary(); renderNav(); renderSteps();
    if (touched[t.id]) showErr(t.id);
  });
  elPanel.addEventListener('focusout', function (e) {
    var t = e.target;
    if (/^(name|email|phone)$/.test(t.id)) { touched[t.id] = 1; showErr(t.id); }
  });
  function showErr(id) {
    var e = errors()[id] || '', f = $('#' + id), p = $('#' + id + '-e');
    if (!f || !p) return;
    p.textContent = e; f.parentNode.classList.toggle('has-err', !!e);
    if (e) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid');
  }

  /* summary collapse on mobile */
  var mq = window.matchMedia ? window.matchMedia('(min-width: 980px)') : { matches: true };
  function syncSum() { if (mq.matches) elSum.open = true; }
  if (mq.addEventListener) mq.addEventListener('change', syncSum);
  elSum.addEventListener('click', function (e) { if (mq.matches && e.target.closest('summary')) e.preventDefault(); });

  /* mobile nav toggle + scrolled state */
  var nav = $('#nav'), tog = $('.nav__toggle');
  if (tog) tog.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    document.body.classList.toggle('nav-open', open);
    tog.setAttribute('aria-expanded', open);
    tog.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
  });
  function onScroll() { nav.classList.toggle('is-scrolled', window.pageYOffset > 10); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- public API ---------- */
  var ALIAS = { class: 'class', csoportos: 'class', ora: 'class', court: 'court', squash: 'court', fallabda: 'court', pt: 'pt', szemelyi: 'pt', wellness: 'wellness', szauna: 'wellness', infraszauna: 'wellness', szolarium: 'wellness' };
  function prefill(opts) {
    opts = opts || {};
    done = null;
    var type = ALIAS[String(opts.type || (opts.classSlug ? 'class' : '')).toLowerCase()] || '';
    if (/szolarium/i.test(opts.type || '')) S.resource = 'szolarium';
    if (/szauna/i.test(opts.type || '')) S.resource = 'infra';
    if (type) { var keepRes = S.resource; S.type = ''; setType(type); if (type === 'wellness' && keepRes && /infra|szolarium/.test(keepRes) && /szauna|szolarium/i.test(opts.type)) S.resource = keepRes; }
    var step = type ? 1 : S.step;
    if (opts.classSlug) { S.type = 'class'; S.classSlug = byId(XL.classes, opts.classSlug) ? opts.classSlug : ''; resetSel(); step = 1; }
    if (opts.day !== undefined && opts.day !== null && opts.day !== '' && !isNaN(+opts.day)) { S.date = iso(dayByDow(+opts.day)); resetSel(); step = 1; }
    else if (S.type && !S.date) S.date = iso(days[0]);
    if (S.type === 'class') {
      if (S.classSlug && !(opts.day !== undefined && opts.day !== null && opts.day !== '')) {
        for (var i = 0; i < days.length; i++) {
          var cand = slotsOn(days[i]).filter(function (s) { return s.classSlug === S.classSlug && !isPast(days[i], s.time); });
          if (cand.length) { S.date = iso(days[i]); break; }
        }
      }
      var d = S.date ? parseIso(S.date) : null;
      if (d) {
        var list = slotsOn(d).filter(function (s) { return (!S.classSlug || s.classSlug === S.classSlug) && (!opts.time || s.time === opts.time); });
        if (opts.slot) list = list.filter(function (s) { return s.id === opts.slot; });
        if ((opts.time || opts.slot) && list.length) { pickSlot(list[0].id, S.date, freeSeats(list[0], S.date) === 0); step = 2; }
      }
    } else if (S.type && opts.time) {
      var tm = /^\d{1,2}:\d{2}$/.test(opts.time) ? pad(+opts.time.split(':')[0]) + ':00' : '';
      var hh = tm ? +tm.slice(0, 2) : -1;
      if (tm && S.date && hourSlots(parseIso(S.date)).indexOf(hh) >= 0 && !isBusy(S.date, hh)) { S.time = tm; step = 2; }
    }
    S.step = Math.min(step, reach() >= step ? step : reach());
    save(); renderPanel(true);
    var anchor = $('.bk-steps'); if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return { step: S.step + 1, type: S.type, date: S.date, slotId: S.slotId, time: S.time };
  }
  window.XLBooking = {
    prefill: prefill,
    getState: function () { return JSON.parse(JSON.stringify(S)); },
    goToStep: function (n) { done = null; go((n | 0) - 1); },
    reset: resetAll,
    bookings: bookings
  };

  /* ---------- init ---------- */
  if (!window.XL) { elPanel.innerHTML = '<p class="bk-empty">Az adatok nem tölthetők be. Hívj minket: +36 30 082 8181.</p>'; return; }
  load();
  var qs = {};
  try { new URLSearchParams(location.search).forEach(function (v, k2) { qs[k2] = v; }); } catch (e) {}
  if (S.type === 'class' || S.type === 'court' || S.type === 'pt' || S.type === 'wellness') { ensureResource(); }
  S.step = Math.min(S.step, reach());
  renderCount(); syncSum();
  if (qs.slot && qs.day !== undefined) {
    var sl0 = byId(XL.schedule, qs.slot);
    if (sl0) prefill({ type: 'class', classSlug: sl0.classSlug, day: sl0.day, time: sl0.time, slot: sl0.id });
    else prefill({ type: 'class', day: qs.day });
  } else if (qs.class) prefill({ type: 'class', classSlug: qs.class });
  else if (qs.day !== undefined && qs.day !== '') prefill({ type: 'class', day: qs.day });
  else renderPanel(false);
  if (qs.slot || qs.class || qs.day) { try { history.replaceState(null, '', location.pathname); } catch (e) {} }
})();
