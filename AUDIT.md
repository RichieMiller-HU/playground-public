# XL-FittLesz – weboldal audit és újratervezési koncepció

**Vizsgált oldal:** https://xlfittlesz.hu/ → átirányít ide: https://www.xl-fittlesz.hu/
**Dátum:** 2026-11-05 · **Technológia:** WordPress 7.1 + Divi theme + Divi Builder

Képernyőképek a jelenlegi oldalról: `audit/old-site-desktop.png`, `audit/old-site-mobile.png`.

---

## 1. Összefoglaló (a kliensnek, 30 másodpercben)

A mostani oldal egy 2021-es Divi sablon, amely **nem ad el**: a főoldal egyetlen konkrét ajánlatot, árat, órarendet vagy foglalási lehetőséget sem mutat, a hajtás alatt kb. 1 200 px üres fehér felület van, és a foglalás egy külön aloldalon, iframe-be ágyazva, hat termenként szétszedve él. Egy edzőteremnél a weboldal célja egyetlen dolog: **a látogató foglaljon vagy jöjjön el próbaedzésre.** A mostani oldalon ez 4–5 kattintás és egy külső rendszer.

Az új koncepció: egy mozgás-alapú, "brutál" sötét/neon hangulatú főoldal, amely 1 görgetésben megmutatja az órákat, az órarendet, az edzőket és az árakat, plusz egy **mindig elérhető foglaló chatbot** jobb alul és egy **interaktív időpontfoglaló oldal** (`foglalas.html`).

---

## 2. Talált problémák

### UX / konverzió
| # | Probléma | Hatás |
|---|---|---|
| 1 | A főoldalon nincs ár, órarend, óraleírás, edző, vélemény – csak egy szlogen és három gomb. | A látogató nem tud dönteni, elmegy. |
| 2 | Az "Aktualitások:" blokk **üres**, utána ~1 200 px fehér semmi, majd egy random jógaszőnyeg-fotó. | Töröttnek tűnik az oldal, bizalomvesztés. |
| 3 | A foglalás aloldalon 6 külön gomb van termenként (Nagyterem, Funkcionális, Spinning, Fallabda1–3), mindegyik külső iframe-et nyit. | Nem lehet óra vagy edző szerint foglalni, csak terem szerint. |
| 4 | Nincs elsődleges CTA: a három hero-gomb (Óráink / Foglalás / Edzőink) azonos súlyú. | Nincs vezetett út a konverzió felé. |
| 5 | "Árak" menüpont az Elérhetőség oldalra visz; az árlista egy ~60 soros, formázatlan szövegtömb, elgépelésekkel ("12.00 0,- Ft", "7.10 0,- Ft"). | Áttekinthetetlen, hibás, nem mobilbarát. |
| 6 | Az Óráink oldalon ott maradt a Divi placeholder szöveg: *"Your Title Goes Here – Your content goes here. Edit or remove this text…"* | Befejezetlen, amatőr hatás. |
| 7 | Az órarend egy teljes 7×30-as táblázat, ahol a cellák 85%-a "-", mobilon olvashatatlan. | Nem lehet gyorsan megtalálni az esti órát. |
| 8 | Nincs próbaedzés / "első alkalom" ajánlat, nincs social proof (vélemény, tagszám). | Hiányzik a belépési küszöb csökkentése. |
| 9 | Lemondási szabály (13:00 / előző nap 17:00) csak az aloldalon, apró betűvel. | Félreértések, no-show. |

### UI / vizuális
| # | Probléma |
|---|---|
| 10 | A hero "XL Fittlesz" felirat **kép** (header-text-min.png), nem szöveg – nem skálázódik, nem kereshető. |
| 11 | Három különböző betűcsalád keveredik (Oswald, Oxanium, Palanquin, Open Sans), nincs tipográfiai hierarchia. |
| 12 | A fejlécben a Széchenyi Terv Plusz pályázati logó ugyanakkora, mint a gym logója – ez a hero fölött a legfeltűnőbb elem. |
| 13 | Füst PNG-k és egy fa doboz PNG "ráúsztatva" – 2015-ös Divi-esztétika, ami a mobil nézetben szétesik. |
| 14 | A fekete szövegdoboz a hajtás alatt 7 sor, középre zárt bekezdés – nehezen olvasható. |
| 15 | A hero fotók (férfi/nő) alacsony felbontásúak, látható JPEG-tömörítés 1440 px-en. |

### Technikai / SEO / hozzáférhetőség
| # | Probléma |
|---|---|
| 16 | 5 képből 5-nek üres az `alt` attribútuma; a logó az egyetlen kivétel. |
| 17 | Egyetlen `<h1>` sincs a főoldalon (csak egy `<h2>`); a `<title>` "Főoldal - XL-FittLesz", nincs meta description. |
| 18 | A domain (xlfittlesz.hu) egy meta-refresh/JS átirányítással megy a www.xl-fittlesz.hu-ra – ez SEO-érték veszteség, 301 kellene. |
| 19 | jQuery + jQuery Migrate + Divi JS: ~66 wp-content asset egy ilyen egyszerű oldalhoz; lassú mobil betöltés. |
| 20 | Nincs nyitva/zárva állapot, nincs `tel:` link a telefonszámon mobilon (csak szöveg). |
| 21 | A foglaló iframe harmadik féltől jön – nincs kontroll a kinézet és a mobil UX fölött, nem kapcsolható össze a chatbot/CRM flow-val. |

---

## 3. Az új koncepció – mit old meg

| Új elem | Melyik problémát oldja |
|---|---|
| Cinematic hero valódi szöveggel, egy elsődleges CTA-val ("Foglalj időpontot") + "Most nyitva" pill | 4, 10, 17, 20 |
| Marquee + "Óráink" kártyák intenzitás-skálával, mindegyiken Foglalás gomb | 1, 3, 6 |
| Napi fülekre bontott órarend, a mai nap előválasztva, minden chip foglalható | 7 |
| Edzőink kártyák | 1 |
| Árak: 3 kiemelt csomag + lenyitható teljes árlista, tisztított adatok | 5 |
| "Ingyenes próbaedzés" CTA sáv + vélemény blokk | 8 |
| Kapcsolat + térkép + nyitvatartás + `tel:` link | 20 |
| **Chatbot jobb alul** (XL Asszisztens): foglalás, árak, nyitvatartás, próbaedzés 5 kattintásból | 3, 4, 8 |
| **Interaktív foglaló oldal** (`foglalas.html`): típus → nap/idő szabad helyekkel → adatok → összegzés + .ics letöltés, lemondási szabály mindig látható | 3, 7, 9, 21 |
| Egy betűpáros (Bebas Neue + Inter), tokenizált színrendszer, sötét téma | 11, 13, 14 |
| Minden kép alt-tal, egy h1, szemantikus szakaszok, vanilla JS, nulla framework | 16, 17, 19 |

---

## 4. Ami a koncepción túl kell a valódi bevezetéshez (ajánlat a kliensnek)

1. **Valódi foglalási backend** – a chatbot és a foglaló most szimulált (localStorage). Köthető a jelenlegi rendszer API-jához, vagy saját (Supabase/Firebase + Stripe) megoldáshoz.
2. **Fotózás** – a koncepció Unsplash képeket használ; saját teremfotók/videó hero kell.
3. **301 átirányítás** a régi domainről, meta description, Open Graph képek, Google Business profil összekötés.
4. Pályázati logók a láblécbe (jogszabályi megfelelés, de nem a hero fölé).
5. Vélemények begyűjtése (Google Reviews widget) a social proof blokkhoz.
