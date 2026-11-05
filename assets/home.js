/* XL-FittLesz – homepage behaviour (index.html only). Vanilla JS, works from file://.
   Does NOT depend on assets/data.js (window.XL) – it keeps its own copy of the schedule. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  /* Day index used across the site: 0 = Hétfő … 6 = Vasárnap */
  var now = new Date();
  var todayIdx = (now.getDay() + 6) % 7;
  var DAYS = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
  var DAYS_SHORT = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
  var HOURS = [[6, 22], [6, 22], [6, 22], [6, 22], [6, 22], [8, 20], [8, 20]];

  /* ---- Open / closed pill ------------------------------------------- */
  function openStatus() {
    var el = $('#open-status'); if (!el) return;
    var d = new Date(), idx = (d.getDay() + 6) % 7, h = d.getHours() + d.getMinutes() / 60;
    var o = HOURS[idx][0], c = HOURS[idx][1], txt, open = h >= o && h < c;
    if (open) {
      txt = 'Most nyitva · zár ' + pad(c) + ':00';
    } else if (h < o) {
      txt = 'Most zárva · ma nyit ' + pad(o) + ':00';
    } else {
      var n = (idx + 1) % 7;
      txt = 'Most zárva · holnap ' + pad(HOURS[n][0]) + ':00-kor nyit';
    }
    el.classList.toggle('is-closed', !open);
    $('.pill__text', el).textContent = txt;
  }
  openStatus(); setInterval(openStatus, 60000);

  /* ---- Hours list: highlight today ---------------------------------- */
  $$('.hours li').forEach(function (li) {
    var days = (li.getAttribute('data-days') || '').split(',').map(Number);
    if (days.indexOf(todayIdx) > -1) li.classList.add('is-today');
  });

  /* ---- Count-up stats ----------------------------------------------- */
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-count')), from = parseFloat(el.getAttribute('data-from') || '0');
    var len = (el.getAttribute('data-pad') || '0') | 0;
    var fmt = function (v) { var s = String(Math.round(v)); while (s.length < len) s = '0' + s; return s; };
    if (reduce) { el.textContent = fmt(to); return; }
    var t0 = null, dur = 1600;
    var step = function (t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  } else counters.forEach(countUp);

  /* ---- Class rail arrows -------------------------------------------- */
  var rail = $('#class-rail');
  if (rail) {
    var prev = $('#rail-prev'), next = $('#rail-next');
    var stepSize = function () { var c = $('.class-card', rail); return c ? c.getBoundingClientRect().width + 18 : 320; };
    var sync = function () {
      prev.disabled = rail.scrollLeft < 8;
      next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8;
    };
    prev.addEventListener('click', function () { rail.scrollBy({ left: -stepSize(), behavior: reduce ? 'auto' : 'smooth' }); });
    next.addEventListener('click', function () { rail.scrollBy({ left: stepSize(), behavior: reduce ? 'auto' : 'smooth' }); });
    rail.addEventListener('scroll', sync, { passive: true }); window.addEventListener('resize', sync); sync();
  }

  /* ---- Weekly schedule ---------------------------------------------- */
  var SCHEDULE = [
    [['18:00', 'Spinning', 'spinning', 'Éva', 'Spinning terem'], ['18:30', 'Latin Cardio', 'latin-cardio', 'Bíbor', 'Nagyterem']],
    [['09:00', 'Spinracing', 'spinracing', 'Adri', 'Spinning terem'], ['16:00', 'Nihon Ju Jitsu', 'nihon-ju-jitsu', '', 'Kisterem'], ['17:00', 'Kangoo Power', 'kangoo-power', 'Betty', 'Nagyterem'], ['18:00', 'Spinning', 'spinning', 'Kata', 'Spinning terem'], ['18:30', 'WeStep', 'westep', 'Ági', 'Nagyterem']],
    [['16:30', 'Spinracing', 'spinracing', 'Adri', 'Spinning terem'], ['17:00', 'Kangoo Tabata', 'kangoo-tabata', 'Betty', 'Nagyterem']],
    [['09:00', 'Spinracing', 'spinracing', 'Adri', 'Spinning terem'], ['16:00', 'Nihon Ju Jitsu', 'nihon-ju-jitsu', '', 'Kisterem'], ['17:00', 'Gyerekjóga', 'gyerekjoga', 'Andi', 'Nagyterem'], ['18:00', 'Spinning', 'spinning', 'Kata', 'Spinning terem'], ['18:30', 'WeStep', 'westep', 'Ági', 'Nagyterem'], ['19:30', 'Latin Cardio', 'latin-cardio', 'Bíbor', 'Nagyterem']],
    [['17:00', 'Kangoo Power', 'kangoo-power', 'Betty', 'Nagyterem'], ['18:00', 'Spinning', 'spinning', 'Éva', 'Spinning terem']],
    [['09:00', 'Kangoo Power – kezdő', 'kangoo-power-kezdo', 'Betty', 'Nagyterem']],
    [['17:00', 'Spinning', 'spinning', 'Kata', 'Spinning terem']]
  ];
  var tabs = $('#day-tabs'), slotsEl = $('#slots');
  var arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  function slotOffset(d) { var n = 0; for (var k = 0; k < d; k++) n += SCHEDULE[k].length; return n; }
  function renderDay(d, focusTab) {
    $$('.day-tab', tabs).forEach(function (t, i) {
      var sel = i === d;
      t.setAttribute('aria-selected', String(sel));
      t.tabIndex = sel ? 0 : -1;
      if (sel && focusTab) t.focus();
    });
    slotsEl.setAttribute('aria-labelledby', 'day-tab-' + d);
    var nowMin = new Date().getHours() * 60 + new Date().getMinutes(), nextMarked = false;
    slotsEl.innerHTML = SCHEDULE[d].map(function (s, i) {
      var hm = s[0].split(':'), mins = (+hm[0]) * 60 + (+hm[1]);
      /* slot ids match window.XL.schedule in assets/data.js: s01…s19 in weekly order */
      var id = 's' + pad(slotOffset(d) + i + 1);
      var past = d === todayIdx && mins <= nowMin, badge = '';
      if (past) badge = '<span class="slot__badge">Elmúlt</span>';
      else if (d === todayIdx && !nextMarked) { badge = '<span class="slot__badge">Következő</span>'; nextMarked = true; }
      var who = s[3] ? s[3] + ' · ' + s[4] : s[4];
      return '<li style="--i:' + i + '"><a class="slot' + (past ? ' is-past' : '') + '" href="foglalas.html?day=' + d + '&amp;slot=' + id + '&amp;class=' + s[2] + '" aria-label="' + esc(DAYS[d] + ' ' + s[0] + ' – ' + s[1] + ', ' + who + '. Foglalás') + '">' +
        badge + '<span class="slot__time">' + s[0] + '</span><span class="slot__info"><span class="slot__name">' + esc(s[1]) + '</span><br><span class="slot__meta">' + esc(who) + '</span></span><span class="slot__go">' + arrow + '</span></a></li>';
    }).join('');
  }
  if (tabs && slotsEl) {
    tabs.innerHTML = DAYS.map(function (n, i) {
      return '<button class="day-tab" role="tab" id="day-tab-' + i + '" aria-controls="slots" aria-selected="false" tabindex="-1" data-day="' + i + '">' +
        (i === todayIdx ? '<span class="today">Ma</span>' : '') + '<b>' + n + '</b><small>' + SCHEDULE[i].length + ' óra · ' + DAYS_SHORT[i] + '</small></button>';
    }).join('');
    tabs.addEventListener('click', function (e) { var b = e.target.closest('.day-tab'); if (b) renderDay(+b.getAttribute('data-day')); });
    tabs.addEventListener('keydown', function (e) {
      var cur = +(document.activeElement.getAttribute('data-day') || 0), n = null;
      if (e.key === 'ArrowRight') n = (cur + 1) % 7; else if (e.key === 'ArrowLeft') n = (cur + 6) % 7;
      else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = 6;
      if (n !== null) { e.preventDefault(); renderDay(n, true); }
    });
    renderDay(todayIdx);
    var sel = $('#day-tab-' + todayIdx);
    if (sel && tabs.scrollWidth > tabs.clientWidth) tabs.scrollLeft += sel.getBoundingClientRect().left - tabs.getBoundingClientRect().left - 40;
  }

  /* ---- Trainer hover tilt (fine pointers only) ---------------------- */
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.trainer').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.classList.add('is-tilting');
        card.style.transform = 'rotateX(' + ((0.5 - py) * 12).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 14).toFixed(2) + 'deg) translateZ(0)';
        card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', function () { card.classList.remove('is-tilting'); card.style.transform = ''; });
    });
  }

  /* ---- Scrollspy for nav active state ------------------------------- */
  var links = $$('.nav__link[href*="#"]'), home = $('.nav__link[data-home]');
  var sections = links.map(function (a) { return document.getElementById(a.getAttribute('href').split('#')[1]); });
  function spy() {
    var y = window.scrollY + window.innerHeight * 0.35, active = -1;
    sections.forEach(function (s, i) { if (s && s.offsetTop <= y) active = i; });
    links.forEach(function (a, i) { a.classList.toggle('is-active', i === active); });
    if (home) {
      home.classList.toggle('is-active', active === -1);
      if (active === -1) home.setAttribute('aria-current', 'page'); else home.removeAttribute('aria-current');
    }
  }
  window.addEventListener('scroll', spy, { passive: true }); spy();

  /* ---- Hero parallax (subtle) --------------------------------------- */
  var heroContent = $('.hero__content');
  if (heroContent && !reduce) {
    window.addEventListener('scroll', function () {
      var y = window.scrollY; if (y > window.innerHeight) return;
      heroContent.style.transform = 'translate3d(0,' + (y * 0.18).toFixed(1) + 'px,0)';
      heroContent.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.9)));
    }, { passive: true });
  }

  /* ---- Unclip hero lines once the kinetic reveal is finished (lets glows breathe) */
  var heroEl = $('.hero'); if (heroEl) setTimeout(function () { heroEl.classList.add('is-done'); }, reduce ? 0 : 1900);

  /* ---- Year in footer ----------------------------------------------- */
  var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
})();
