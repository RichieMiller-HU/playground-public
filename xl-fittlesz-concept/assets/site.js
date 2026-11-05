/* XL-FittLesz – shared site behaviour (nav, reveals, cursor glow).
   Safe to include on any page: <script src="assets/site.js" defer></script> */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.remove('no-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Nav: hamburger + scrolled state */
  var nav = document.querySelector('.nav');
  if (nav) {
    var toggle = nav.querySelector('.nav__toggle');
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
      if (toggle) {
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
      }
    };
    if (toggle) toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle && toggle.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 900) setOpen(false); });
    var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 24); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Reveal on scroll */
  var reveals = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduce) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* Cursor glow – fine pointer + hover-capable devices only */
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);
    doc.classList.add('has-cursor');
    var tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    var loop = function () {
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      glow.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      raf = (Math.abs(tx - x) + Math.abs(ty - y) > 0.5) ? requestAnimationFrame(loop) : 0;
    };
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY; glow.classList.add('is-on');
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerleave', function () { glow.classList.remove('is-on'); });
  }
})();
