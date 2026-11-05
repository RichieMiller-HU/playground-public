/* XL-FittLesz shared data – window.XL (day: 0 = Hétfő ... 6 = Vasárnap) */
window.XL = {
  gym: {
    name: 'XL-FittLesz',
    address: 'Arany János u. 2/A, 7400 Kaposvár',
    phone: '+36 30 082 8181',
    email: 'hello@xlfittlesz.hu',
    slogan: 'LEHETETLEN MÁRPEDIG NINCS!',
    hours: { weekday: { label: 'Hétfő–Péntek', open: 6, close: 22 }, weekend: { label: 'Szombat–Vasárnap', open: 8, close: 20 } }
  },
  days: ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'],
  rooms: [
    { id: 'nagyterem', name: 'Nagyterem', type: 'class', capacity: 25 },
    { id: 'kisterem', name: 'Kisterem', type: 'class', capacity: 16 },
    { id: 'funkcionalis', name: 'Funkcionális terem', type: 'class', capacity: 14 },
    { id: 'spinning', name: 'Spinning terem', type: 'class', capacity: 20 },
    { id: 'fallabda1', name: 'Fallabda 1', type: 'court', capacity: 4 },
    { id: 'fallabda2', name: 'Fallabda 2', type: 'court', capacity: 4 },
    { id: 'fallabda3', name: 'Fallabda 3', type: 'court', capacity: 4 },
    { id: 'konditerem', name: 'Konditerem', type: 'gym', capacity: 40 }
  ],
  trainers: [
    { id: 'agi', name: 'Kálmán Ági', bio: 'WeStep és jóga – cardio step, mozgásöröm és rugalmasság.', pt: true },
    { id: 'betty', name: 'Betty', bio: 'Kangoo Power és Kangoo Tabata – ugrálócipős, maximális tempó.', pt: true },
    { id: 'adri', name: 'Adri', bio: 'Spinracing – versenytempó, zenére, csapatban.', pt: true },
    { id: 'eva', name: 'Éva', bio: 'Spinning – kitartás és lendület.', pt: false },
    { id: 'kata', name: 'Kata', bio: 'Spinning – esti pörgés minden szinten.', pt: true },
    { id: 'bibor', name: 'Bíbor', bio: 'Latin Cardio – tánc, ritmus, kalóriaégetés.', pt: false },
    { id: 'andi', name: 'Horog Andrea', bio: 'Gyerekjóga 4–12 éveseknek.', pt: false },
    { id: 'jujitsu', name: 'Nihon Ju Jitsu edzők', bio: 'Önvédelem és küzdősport a Kisteremben.', pt: false }
  ],
  classes: [
    { slug: 'westep', name: 'WeStep', trainerId: 'agi', roomId: 'nagyterem', duration: 60, intensity: 4, color: '#19e3ff', description: 'Cardio step koreográfiával: lábak, fenék, kitartás – és rengeteg jókedv.' },
    { slug: 'kangoo-power', name: 'Kangoo Power', trainerId: 'betty', roomId: 'nagyterem', duration: 60, intensity: 5, color: '#ff2d55', description: 'Ugrálócipős cardio edzés: kíméli az ízületeket, de alaposan megdolgoztat.' },
    { slug: 'kangoo-power-kezdo', name: 'Kangoo Power – kezdő', trainerId: 'betty', roomId: 'nagyterem', duration: 60, intensity: 3, color: '#ff7a45', description: 'Kezdőbarát Kangoo óra: ismerkedés a cipővel és az alap mozgásokkal.' },
    { slug: 'kangoo-tabata', name: 'Kangoo Tabata', trainerId: 'betty', roomId: 'nagyterem', duration: 45, intensity: 5, color: '#ff2d55', description: 'Intervallumos Tabata ugrálócipőben – rövid, kemény, hatékony.' },
    { slug: 'spinracing', name: 'Spinracing', trainerId: 'adri', roomId: 'spinning', duration: 45, intensity: 5, color: '#c6ff3d', description: 'Teljesítményalapú csoportos tekerés, versenyhangulat és fények.' },
    { slug: 'spinning', name: 'Spinning', trainerId: 'eva', roomId: 'spinning', duration: 45, intensity: 4, color: '#19e3ff', description: 'Klasszikus indoor cycling zenére: domb, sprint, hajrá.' },
    { slug: 'latin-cardio', name: 'Latin Cardio', trainerId: 'bibor', roomId: 'nagyterem', duration: 60, intensity: 3, color: '#ff2d55', description: 'Latin ritmusok, egyszerű lépések, nagyon sok mozgás.' },
    { slug: 'gyerekjoga', name: 'Gyerekjóga (4–12 év)', trainerId: 'andi', roomId: 'nagyterem', duration: 45, intensity: 1, color: '#c6ff3d', description: 'Játékos jóga gyerekeknek: mozgás, koncentráció, nyugalom.' },
    { slug: 'joga', name: 'Jóga', trainerId: 'agi', roomId: 'funkcionalis', duration: 60, intensity: 2, color: '#19e3ff', description: 'Nyújtás, légzés, egyensúly – időpont egyeztetés szerint.' },
    { slug: 'nihon-ju-jitsu', name: 'Nihon Ju Jitsu', trainerId: 'jujitsu', roomId: 'kisterem', duration: 60, intensity: 4, color: '#ff7a45', description: 'Japán önvédelmi küzdősport – technika, erő, fegyelem.' }
  ],
  schedule: [
    { id: 's01', day: 0, time: '18:00', classSlug: 'spinning', roomId: 'spinning', capacity: 20, booked: 20 },
    { id: 's02', day: 0, time: '18:30', classSlug: 'latin-cardio', roomId: 'nagyterem', capacity: 25, booked: 17 },
    { id: 's03', day: 1, time: '09:00', classSlug: 'spinracing', roomId: 'spinning', capacity: 20, booked: 12 },
    { id: 's04', day: 1, time: '16:00', classSlug: 'nihon-ju-jitsu', roomId: 'kisterem', capacity: 16, booked: 9 },
    { id: 's05', day: 1, time: '17:00', classSlug: 'kangoo-power', roomId: 'nagyterem', capacity: 18, booked: 18 },
    { id: 's06', day: 1, time: '18:00', classSlug: 'spinning', trainerId: 'kata', roomId: 'spinning', capacity: 20, booked: 19 },
    { id: 's07', day: 1, time: '18:30', classSlug: 'westep', roomId: 'nagyterem', capacity: 25, booked: 14 },
    { id: 's08', day: 2, time: '16:30', classSlug: 'spinracing', roomId: 'spinning', capacity: 20, booked: 8 },
    { id: 's09', day: 2, time: '17:00', classSlug: 'kangoo-tabata', roomId: 'nagyterem', capacity: 18, booked: 15 },
    { id: 's10', day: 3, time: '09:00', classSlug: 'spinracing', roomId: 'spinning', capacity: 20, booked: 5 },
    { id: 's11', day: 3, time: '16:00', classSlug: 'nihon-ju-jitsu', roomId: 'kisterem', capacity: 16, booked: 11 },
    { id: 's12', day: 3, time: '17:00', classSlug: 'gyerekjoga', roomId: 'nagyterem', capacity: 12, booked: 9 },
    { id: 's13', day: 3, time: '18:00', classSlug: 'spinning', trainerId: 'kata', roomId: 'spinning', capacity: 20, booked: 17 },
    { id: 's14', day: 3, time: '18:30', classSlug: 'westep', roomId: 'nagyterem', capacity: 25, booked: 22 },
    { id: 's15', day: 3, time: '19:30', classSlug: 'latin-cardio', roomId: 'nagyterem', capacity: 25, booked: 10 },
    { id: 's16', day: 4, time: '17:00', classSlug: 'kangoo-power', roomId: 'nagyterem', capacity: 18, booked: 16 },
    { id: 's17', day: 4, time: '18:00', classSlug: 'spinning', roomId: 'spinning', capacity: 20, booked: 18 },
    { id: 's18', day: 5, time: '09:00', classSlug: 'kangoo-power-kezdo', roomId: 'nagyterem', capacity: 18, booked: 7 },
    { id: 's19', day: 6, time: '17:00', classSlug: 'spinning', trainerId: 'kata', roomId: 'spinning', capacity: 20, booked: 11 }
  ],
  prices: [
    { group: 'Belépők és bérletek', items: [
      { name: 'Napijegy', price: '3 500 Ft', note: 'diák/nyugdíjas: 2 900 Ft' },
      { name: 'Havi bérlet – konditerem', price: '19 800 Ft', note: 'diák: 15 900 Ft' },
      { name: 'Havi bérlet plusz', price: '24 500 Ft', note: 'napi 2 belépés' },
      { name: 'Éves hűség', price: '16 500 Ft/hó' },
      { name: '5 alkalmas', price: '12 000 Ft' },
      { name: '10 alkalmas vegyes', price: '21 500 Ft', note: 'diák: 19 900 Ft' },
      { name: '20 alkalmas', price: '39 900 Ft' },
      { name: 'Klubkártya kaució', price: '1 500 Ft' }
    ] },
    { group: 'Fallabda és wellness', items: [
      { name: 'Fallabda – 1 óra', price: '7 100 Ft', note: 'napközben: 5 500 Ft' },
      { name: 'Infraszauna – 30 perc', price: '1 500 Ft' },
      { name: 'Szolárium', price: '130 Ft/perc' }
    ] },
    { group: 'Tudnivalók', items: [
      { name: 'Diákkedvezmény', price: '25 éves korig' },
      { name: 'Belépés', price: '14 éves kortól' }
    ] }
  ],
  cancellation: 'Esti óráknál aznap 13:00-ig, délelőtti óráknál az előző nap 17:00-ig mondható le díjmentesen.'
};
