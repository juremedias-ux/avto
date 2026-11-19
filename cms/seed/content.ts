/**
 * Vzorčne vsebine za prikaz platforme. Vse so označene kot »vzorec«.
 * Besedila so splošna in ne vsebujejo izmišljenih ocen, certifikatov,
 * partnerstev ali pravnih trditev. Izdelki niso resnični.
 */

export const sampleStages = [
  {
    stevilka: 1,
    naziv: "Načrtovanje in proračun",
    kratekOpis: "Namen uporabe, razporeditev prostora, proračun in vrstni red del.",
    opis: "Preden kupiš material, določi, kako boš camper uporabljal, nariši razporeditev in sestavi proračun po fazah. Dober načrt prepreči, da bi moral že narejeno delo podirati.",
    cilji: ["Zapisan namen uporabe in število oseb", "Razporeditev v merilu z dejanskimi merami", "Proračun po fazah z rezervo"],
  },
  {
    stevilka: 2,
    naziv: "Izbira in priprava vozila",
    kratekOpis: "Pregled vozila, čiščenje, zaščita pred rjo in priprava površin.",
    opis: "Preveri stanje karoserije in tal, odstrani staro oblogo, očisti in zaščiti mesta z rjo. Na čisto in suho podlago se izolacija in lepila bolje primejo.",
    cilji: ["Pregledana karoserija in tla", "Odpravljena rja", "Čiste in suhe površine"],
  },
  {
    stevilka: 3,
    naziv: "Okna, strešne odprtine in prezračevanje",
    kratekOpis: "Rezanje odprtin, tesnjenje in kroženje zraka.",
    opis: "Odprtine za okna in strešne line izreži pred izolacijo. Prezračevanje zmanjša kondenzacijo in izboljša zrak v bivalnem prostoru.",
    cilji: ["Odprtine na načrtovanih mestih", "Zatesnjeni robovi", "Načrtovan dovod in odvod zraka"],
  },
  {
    stevilka: 4,
    naziv: "Izolacija in parna zapora",
    kratekOpis: "Toplotna izolacija, zvočna zaščita in preprečevanje kondenzacije.",
    opis: "Izolacija zmanjša izgube toplote in hrup. Pomembno je, da vlaga ne kondenzira za oblogami, kjer je ne vidiš.",
    cilji: ["Izolirane stene, strop in tla", "Premišljena zaščita pred vlago"],
  },
  {
    stevilka: 5,
    naziv: "Elektrika in solarni sistem",
    kratekOpis: "Poraba, baterija, polnjenje in varna napeljava.",
    opis: "Najprej izračunaj porabo, nato izberi baterijo in načine polnjenja. Kable položi pred oblaganjem sten, vsak tokokrog pa zaščiti z ustrezno varovalko.",
    cilji: ["Izračunana dnevna poraba", "Izbrana baterija in polnjenje", "Položena in zavarovana napeljava"],
  },
  {
    stevilka: 6,
    naziv: "Voda in plin",
    kratekOpis: "Rezervoarji, črpalka, odtok in varna plinska napeljava.",
    opis: "Načrtuj rezervoarje za čisto in odpadno vodo ter dostop za čiščenje. Plinsko napeljavo naj izvede ali pregleda usposobljena oseba.",
    cilji: ["Nameščeni rezervoarji in črpalka", "Tesni priključki", "Pregledana plinska napeljava, če jo imaš"],
  },
  {
    stevilka: 7,
    naziv: "Pohištvo in notranja oprema",
    kratekOpis: "Ogrodje, pritrditve, postelja, kuhinja in shranjevanje.",
    opis: "Pohištvo mora zdržati vožnjo in nenadno zaviranje. Teža naj bo čim nižje in čim bližje sredini vozila.",
    cilji: ["Trdno pritrjeno ogrodje", "Postelja, kuhinja in shranjevanje"],
  },
  {
    stevilka: 8,
    naziv: "Končna oprema in preverjanje",
    kratekOpis: "Tekstil, osvetlitev, preizkus vseh sistemov in kontrolni seznam pred potjo.",
    opis: "Preizkusi elektriko, vodo in ogrevanje, preveri pritrditve in stehtaj vozilo. Šele nato na prvo daljšo pot.",
    cilji: ["Preizkušeni vsi sistemi", "Preverjene pritrditve", "Stehtano vozilo"],
  },
];

export const sampleTopics = [
  { naziv: "Načrtovanje", opis: "Prve odločitve, razporeditev prostora in proračun." },
  { naziv: "Elektrika", opis: "Poraba, baterije, solarni paneli, polnjenje in napeljava." },
  { naziv: "Izolacija", opis: "Toplotna in zvočna izolacija ter preprečevanje kondenzacije." },
  { naziv: "Prezračevanje", opis: "Okna, strešne line in kroženje zraka." },
  { naziv: "Varnost", opis: "Pritrditve, električna zaščita, plin in nosilnost vozila." },
];

export const sampleCategories = [
  {
    naziv: "Elektrika in solarni sistem",
    opis: "Baterije, solarni paneli, polnilniki in oprema za varno napeljavo.",
    vrstniRed: 1,
  },
  {
    naziv: "Izolacija",
    opis: "Materiali za toplotno in zvočno izolacijo ter zaščito pred vlago.",
    vrstniRed: 2,
  },
  {
    naziv: "Okna in prezračevanje",
    opis: "Okna, strešne line in ventilatorji za kroženje zraka.",
    vrstniRed: 3,
  },
];

export const sampleArticle = {
  naslov: "Prvi koraki: kako načrtovati predelavo kombija",
  povzetek:
    "Preden kupiš prvi material: kako določiti namen uporabe, izmeriti prostor, preveriti nosilnost, postaviti vrstni red del in sestaviti proračun.",
  kljucniPoudarki: [
    "Najprej zapiši, kako boš camper uporabljal. Iz tega sledijo vse druge odločitve.",
    "Razporeditev nariši z dejanskimi merami in jo preizkusi v vozilu.",
    "Preveri nosilnost: vsak kilogram opreme zmanjša dovoljeno obremenitev.",
    "Upoštevaj vrstni red del, da ti ni treba podirati že narejenega.",
  ],
  varnostnaOpomba:
    "Pred rezanjem odprtin in vrtanjem preveri, kje potekajo kabli, cevi in nosilni deli karoserije. Plinsko napeljavo in posege v varnostne sisteme vozila naj izvede usposobljena oseba.",
  markdown: `Predelava kombija v camper je projekt z veliko odločitvami. Večina težav nastane, ker se delo začne pred načrtom. Ta vodič te vodi skozi prve korake, ki jih narediš še pred nakupom materiala.

## 1. Določi, kako boš camper uporabljal

Odgovori na nekaj preprostih vprašanj in odgovore zapiši:

- Koliko oseb bo spalo in potovalo v vozilu?
- Ali bodo to vikendi, poletni dopust ali daljša potovanja?
- Ali boš potoval tudi pozimi?
- Ali boš večinoma v kampih z elektriko ali tudi brez priključka?

Iz odgovorov sledijo velikost postelje, potreba po ogrevanju, količina vode in velikost električnega sistema.

## 2. Izmeri prostor in nariši razporeditev

Izmeri notranjost: dolžino, širino na več mestih, višino ter položaj kolesnih lokov, vrat in sedežev. Razporeditev nariši v merilu. Preden kaj zgradiš, jo preizkusi v vozilu, na primer z lepilnim trakom na tleh ali kartonastimi maketami.

## 3. Preveri nosilnost vozila

Vsak kilogram pohištva, baterij, vode in prtljage zmanjša preostalo dovoljeno obremenitev. Največjo dovoljeno maso vozila najdeš v prometnem dovoljenju. Prazno vozilo stehtaj in si zapiši, koliko teže lahko še dodaš.

## 4. Postavi vrstni red del

Dela si sledijo v logičnem zaporedju. Priporočen vrstni red:

1. Priprava vozila: čiščenje in zaščita pred rjo.
2. Odprtine za okna, strešne line in prezračevanje.
3. Izolacija.
4. Napeljava za elektriko in vodo (pred oblaganjem sten).
5. Obloge, pohištvo in notranja oprema.
6. Preizkus vseh sistemov.

## 5. Sestavi proračun po fazah

Za vsako fazo zapiši material, orodje in dela, ki jih ne boš naredil sam. Dodaj rezervo za nepredvidene stroške. Proračun po fazah ti pokaže, kje lahko varčuješ in kje ne bi smel.

## 6. Odloči, kaj prepustiš strokovnjakom

Nekatera dela zahtevajo znanje in izkušnje: plinska napeljava, zahtevnejša elektrika in posegi v nosilno strukturo. Predelava lahko vpliva tudi na registracijo vozila, zato pred večjimi posegi preveri zahteve pri pristojnih.

## Kontrolni seznam pred začetkom

- Zapisan namen uporabe
- Razporeditev v merilu, preizkušena v vozilu
- Znana preostala nosilnost
- Vrstni red del
- Proračun po fazah z rezervo
- Seznam del za strokovnjake`,
};

export const sampleVideo = {
  naslov: "Poraba elektrike: kako določiti velikost baterije",
  povzetek:
    "Kako iz seznama naprav izračunati dnevno porabo in iz nje določiti potrebno zmogljivost baterije ter načine polnjenja.",
  trajanje: 1,
  poglavja: [
    { cas: "0:00", naslov: "Uvod" },
    { cas: "0:06", naslov: "Kako zamenjati vzorčni posnetek" },
  ],
  kljucniPoudarki: [
    "Dnevna poraba naprave = moč (W) × čas delovanja (h).",
    "Zmogljivost baterije v Wh = kapaciteta (Ah) × napetost (V).",
    "Del zmogljivosti baterije ni uporaben; koliko, je odvisno od vrste baterije.",
    "Upoštevaj dneve, ko polnjenje ni mogoče.",
  ],
  varnostnaOpomba:
    "Baterije shranjujejo veliko energije. Vsak tokokrog zaščiti z ustrezno varovalko čim bližje bateriji in uporabi kable ustreznega preseka. Če nimaš izkušenj z enosmernimi napeljavami, delo prepusti usposobljeni osebi.",
  markdown: `Velikost električnega sistema izhaja iz porabe. Zato najprej izračunaj, koliko energije porabiš v enem dnevu.

## 1. Seznam naprav

Zapiši vse naprave, ki jih boš uporabljal: hladilnik, luči, črpalko za vodo, ventilator, polnjenje telefonov in računalnika. Za vsako napravo poišči moč v vatih (W) na nalepki ali v navodilih.

## 2. Dnevna poraba

Za vsako napravo oceni, koliko ur na dan dejansko deluje. Pomnoži moč s časom in dobiš porabo v vatnih urah (Wh). Seštej vse naprave.

Primer izračuna (vrednosti so samo za ponazoritev): naprava z močjo 40 W, ki deluje 5 ur, porabi 40 × 5 = 200 Wh na dan.

## 3. Zmogljivost baterije

Zmogljivost baterije v Wh izračunaš kot kapaciteta (Ah) × napetost (V). Upoštevaj, da baterije ne smeš ali ne moreš izprazniti do konca; koliko je uporabne zmogljivosti, je odvisno od vrste baterije in navodil proizvajalca. Dodaj rezervo za dneve, ko polnjenje ni mogoče.

## 4. Načini polnjenja

Baterijo lahko polniš med vožnjo prek alternatorja (s polnilnikom DC-DC), s soncem (solarni panel in regulator) in iz omrežja v kampu (polnilnik 230 V). Izbira je odvisna od tega, koliko voziš, kje stojiš in v katerem letnem času potuješ.`,
  prepis:
    "To je vzorčni video za prikaz strani video lekcije. V urejevalniku ga zamenjaj z lastnim posnetkom ali povezavo na YouTube.",
};

export const sampleProducts = [
  {
    naziv: "Baterija LiFePO4 12 V 100 Ah (vzorec)",
    kratekOpis: "Primer izdelka: litij-železo-fosfatna baterija za bivalni del camperja.",
    tehnicniPodatki: [
      { lastnost: "Vrsta", vrednost: "Litij-železo-fosfatna (LiFePO4)" },
      { lastnost: "Nazivna napetost", vrednost: "12,8 V" },
      { lastnost: "Kapaciteta", vrednost: "100 Ah" },
    ],
    zdruzljivost: "Primer: za sisteme 12 V. Polnilniki in regulatorji morajo podpirati profil polnjenja za LiFePO4.",
    primeriUporabe: ["Napajanje hladilnika, luči in črpalke", "Shranjevanje energije iz solarnega panela"],
    zahtevnostVgradnje: "strokovna",
    stanje: "na-povprasevanje",
    pogostaVprasanja: [
      {
        vprasanje: "Ali lahko baterijo vgradim sam?",
        odgovor:
          "Vgradnja zahteva znanje o enosmernih napeljavah, varovalkah in presekih kablov. Če teh izkušenj nimaš, jo prepusti usposobljeni osebi.",
      },
    ],
  },
  {
    naziv: "Solarni panel 175 W (vzorec)",
    kratekOpis: "Primer izdelka: monokristalni solarni panel za montažo na streho.",
    tehnicniPodatki: [
      { lastnost: "Vrsta celic", vrednost: "Monokristalne" },
      { lastnost: "Nazivna moč", vrednost: "175 W" },
    ],
    zdruzljivost: "Primer: potrebuje regulator polnjenja (MPPT ali PWM), primeren za napetost panela in vrsto baterije.",
    primeriUporabe: ["Polnjenje bivalne baterije med stanjem na soncu"],
    zahtevnostVgradnje: "srednja",
    stanje: "kmalu",
  },
  {
    naziv: "Polnilnik DC-DC 12 V 30 A (vzorec)",
    kratekOpis: "Primer izdelka: polnjenje bivalne baterije iz alternatorja med vožnjo.",
    tehnicniPodatki: [
      { lastnost: "Vhodna napetost", vrednost: "12 V (zaganjalna baterija)" },
      { lastnost: "Izhodni tok", vrednost: "30 A" },
    ],
    zdruzljivost: "Primer: izberi profil polnjenja, ki ustreza vrsti bivalne baterije.",
    primeriUporabe: ["Polnjenje bivalne baterije med vožnjo"],
    zahtevnostVgradnje: "strokovna",
    stanje: "na-povprasevanje",
  },
] as const;

export const samplePath = {
  naslov: "Začni tukaj: od ideje do načrta",
  opis: "Prvi koraki za vse, ki šele začenjajo: načrtovanje predelave in izračun porabe elektrike.",
  zaKoga: "Za začetnike brez izkušenj s predelavo",
  opombe: [
    "Preberi pred nakupom materiala in si zapiši odgovore.",
    "Pripravi seznam naprav, ki jih boš uporabljal.",
  ],
};

export const sampleHome = {
  prviZaslon: {
    oznaka: "Slovenska platforma za domačo predelavo kombija",
    naslov: "Zgradi svoj camper s praktičnimi vodiči in izbranimi izdelki.",
    podnaslov:
      "Od izbire kombija do zadnjega vijaka: razlage po fazah gradnje, video lekcije in oprema, ki jo potrebuješ za posamezen korak.",
  },
  zaupanje: [
    { naslov: "Učenje ločeno od prodaje", besedilo: "Vodiči razlagajo. Izdelki so jasno označeni in ločeni od razlage." },
    { naslov: "Varnost na vidnem mestu", besedilo: "Pri elektriki, plinu in pritrditvah opozorimo na tveganja in na dela za strokovnjake." },
    { naslov: "Brez pritiska", besedilo: "Ni spletne košarice. Povpraševanje je brez obveznosti." },
    { naslov: "V slovenščini", besedilo: "Vse vsebine so napisane v slovenščini." },
  ],
};

export const sampleAbout = {
  naslov: "O nas",
  uvod: "GradimoCamper je slovenska platforma za vse, ki kombi predelujejo sami.",
  markdown: `Platforma združuje dvoje: **učenje** (vodiči, video lekcije in učne poti po fazah gradnje) in **izbor opreme**, ki je povezana z vodiči.

Platforma nastaja postopoma. Vsebine in izdelke dodajamo sproti.

Vprašanja in predlogi so dobrodošli na strani Kontakt.`,
};
