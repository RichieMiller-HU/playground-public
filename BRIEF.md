# XL-FittLesz concept – shared design brief (all agents MUST follow)

Client: XL-FittLesz gym, Kaposvár (Arany János u. 2/A, 7400). Phone +36 30 082 8181, hello@xlfittlesz.hu.
Hours: Mon–Fri 06:00–22:00, Sat–Sun 08:00–20:00. Slogan: "LEHETETLEN MÁRPEDIG NINCS!"
Language of ALL UI copy: Hungarian. Code comments may be English.

## Files (static, no build step, open directly from file://)
- `index.html`           – homepage (agent A)
- `foglalas.html`        – interactive booking page (agent B)
- `assets/style.css`     – SHARED tokens + nav + footer + buttons (agent A owns it; B/C only add their own prefixed classes in their own files)
- `assets/booking.css` / `assets/booking.js` – booking page only (agent B)
- `assets/chatbot.css` / `assets/chatbot.js` – floating fake chatbot, self-injecting (agent C). Both pages include:
  `<link rel="stylesheet" href="assets/chatbot.css"><script src="assets/chatbot.js" defer></script>`
- `assets/data.js` – shared data (classes, trainers, rooms, weekly schedule, prices) exposed as `window.XL = {...}` (agent B writes it; A and C may read it but must NOT depend on it to render – fall back gracefully).

## Design tokens (put in assets/style.css `:root`; others reuse the variable names)
--bg: #07080b; --bg-2: #0e1015; --bg-3: #15181f; --line: rgba(255,255,255,.08);
--text: #f2f4f7; --muted: #8b93a1;
--cyan: #19e3ff; --cyan-2: #0aa9c2; --red: #ff2d55; --lime: #c6ff3d;
--font-display: 'Bebas Neue', 'Oswald', Impact, sans-serif;  --font-body: 'Inter', system-ui, sans-serif;
--radius: 18px; --radius-sm: 10px; --shadow-glow: 0 0 40px rgba(25,227,255,.35);
Google Fonts: Bebas Neue + Inter (400/500/600/700) + Oswald 500 via one <link>.
Dark only. Cyan = primary action/glow, red = urgency/energy accents, lime = "available"/success.
Vibe: brutal, cinematic, high-energy – huge display type, grain/noise overlay, glow, bold motion. Not generic SaaS.
Motion: IntersectionObserver reveal (`.reveal` → `.in`), respect `prefers-reduced-motion`.

## Shared components (class names, defined in assets/style.css by agent A)
- `.btn`, `.btn--primary` (cyan fill, dark text, glow on hover), `.btn--ghost` (1px cyan border), `.btn--lg`
- `.nav` sticky glass header: logo text "XL FITTLESZ" (display font, "XL" in cyan) + links: Főoldal (index.html), Óráink (index.html#orak), Órarend (index.html#orarend), Edzőink (index.html#edzok), Árak (index.html#arak), Foglalás (foglalas.html, rendered as .btn--primary). Mobile: hamburger.
- `.footer` with hours, contact, address, nav links, socials.
- `.container` max-width 1240px, padding 0 20px. `.eyebrow` small uppercase cyan label with tracking.

## Real content (use it – no lorem ipsum anywhere)
Classes & trainers: WeStep (Kálmán Ági, cardio step), Kangoo Power & Kangoo Tabata (Betty), Spinracing (Adri), Spinning (Éva, Kata), Latin Cardio (Bíbor), Gyerekjóga 4–12 év (Horog Andrea), Jóga (Ági), Nihon Ju Jitsu (Kisterem), Fallabda (squash, 3 pálya, edzővel is), Szolárium, Infraszauna, Konditerem.
Rooms: Nagyterem, Kisterem, Funkcionális terem, Spinning terem, Fallabda 1, Fallabda 2, Fallabda 3.
Weekly schedule (room: trainer – class):
Hétfő 18:00 Spinning: Éva; 18:30 Nagyterem: Bíbor Latin Cardio
Kedd 09:00 Spinning: Adri Spinracing; 16:00 Kisterem: Nihon Ju Jitsu; 17:00 Nagyterem: Betty Kangoo Power; 18:00 Spinning: Kata; 18:30 Nagyterem: Ági WeStep
Szerda 16:30 Spinning: Adri Spinracing; 17:00 Nagyterem: Betty Kangoo Tabata
Csütörtök 09:00 Spinning: Adri Spinracing; 16:00 Kisterem: Nihon Ju Jitsu; 17:00 Nagyterem: Andi Gyerekjóga; 18:00 Spinning: Kata; 18:30 Nagyterem: Ági WeStep; 19:30 Nagyterem: Bíbor Latin Cardio
Péntek 17:00 Nagyterem: Betty Kangoo Power; 18:00 Spinning: Éva
Szombat 09:00 Nagyterem: Betty Kangoo Power – kezdő
Vasárnap 17:00 Spinning: Kata
Squash courts bookable hourly 06–21 (Mon–Fri) / 08–20 (weekend). Konditerem: no booking needed.
Cancellation rule: evening classes cancel until 13:00 same day, morning classes until 17:00 previous day.
Prices (Ft): Napijegy 3 500 (diák/nyugdíjas 2 900); Havi bérlet konditerem 19 800 (diák 15 900); Havi bérlet plusz 24 500 (napi 2 belépés); Éves hűség 16 500/hó; 10 alkalmas vegyes 21 500 (diák 19 900); 20 alkalmas 39 900; 5 alkalmas 12 000; Fallabda 1 óra 7 100 (napközben 5 500); Infraszauna 30 perc 1 500; Szolárium 130 Ft/perc; Klubkártya kaució 1 500. Diákkedvezmény 25 éves korig. Belépés 14 éves kortól.

## Imagery
Use royalty-free Unsplash hotlinks (https://images.unsplash.com/photo-...?auto=format&fit=crop&w=1600&q=80) for gym/fitness photos, with meaningful alt text, `loading="lazy"` below the fold. CSS gradients/noise are preferred over many photos. No external JS libraries except optional CDN of nothing – vanilla JS only.

## Quality bar
Valid HTML, mobile-first responsive (390px → 1440px+), no horizontal scroll, keyboard accessible, visible focus, aria labels on icon buttons. Everything works offline from file:// except the fonts/photos.
