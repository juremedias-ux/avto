/**
 * Osrednja vsebina strani GradimoCamper.
 *
 * Tu urejaš ime znamke, besedila, kontakt, podatke upravljavca in slike.
 * Besedila privolitev so vezana na različico (glej `consent.version`):
 * ob vsaki vsebinski spremembi privolitve povečaj različico (npr. v1 -> v2).
 * Sistem poleg tega samodejno doda kratek prstni odtis besedila, zato je
 * vsaka sprememba besedila v bazi vedno ločljiva.
 */

export const brand = {
  name: "GradimoCamper",
  /** Prvi in drugi del imena za dvobarvni besedilni logotip. */
  nameParts: ["Gradimo", "Camper"] as const,
  tagline:
    "Predelava kombijev, oprema in povezave za bolj premišljeno potovanje.",
  description:
    "GradimoCamper je slovenska platforma v nastajanju za domačo predelavo kombija v camper: praktični nasveti, razlage opreme in povezave s pravimi ponudniki. Prijavi se na obvestilo ob zagonu.",
};

/**
 * Kontakt za javni prikaz (noga, politika zasebnosti).
 * Pusti prazno, dokler naslov ni dejansko nastavljen.
 */
export const contact = {
  email: "",
};

/**
 * Podatki upravljavca osebnih podatkov za politiko zasebnosti.
 * Prazna polja se na strani prikažejo kot jasno označena manjkajoča mesta.
 * Brez teh podatkov strani ni primerno javno objaviti.
 */
export const controller = {
  name: "",
  address: "",
  registrationNumber: "",
  email: "",
};

export const nav = {
  preparing: "Kaj pripravljamo",
  faq: "Pogosta vprašanja",
  cta: "Obvesti me ob zagonu",
};

export const hero = {
  eyebrow: "Slovenska platforma v nastajanju",
  title: "Tvoj camper. Od ideje do poti.",
  lead: "Načrtuješ domačo predelavo kombija? Pripravljamo praktične nasvete, razlage opreme in povezave s pravimi ponudniki. Prijavi se na obvestilo ob zagonu.",
};

export const form = {
  emailLabel: "Tvoj e-poštni naslov",
  emailPlaceholder: "ime@primer.si",
  submit: "Obvesti me ob zagonu",
  submitting: "Shranjujem …",
  note: "Brezplačno in brez uporabniškega računa.",
  requiredTag: "obvezno",
  optionalTag: "neobvezno",
  honeypotLabel: "Tega polja ne izpolnjuj",
};

export const consent = {
  /** Povečaj ob vsebinski spremembi besedil spodaj. */
  version: "v1",
  launch: "Želim prejeti obvestilo ob zagonu platforme GradimoCamper.",
  newsletter:
    "Želim prejemati tudi praktične nasvete, novice in občasne ponudbe GradimoCamper.",
  infoBeforeLink: "Privolitev lahko kadar koli prekličeš. Več o obdelavi podatkov v ",
  infoLink: "politiki zasebnosti",
  infoAfterLink: ".",
};

export const messages = {
  success:
    "Hvala! Če ta naslov še ni prijavljen, smo prijavo shranili. Ob zagonu te bomo obvestili.",
  invalidEmail: "Vpiši veljaven e-poštni naslov.",
  missingLaunchConsent: "Za obvestilo ob zagonu označi ustrezno polje.",
  rateLimited: "Počakaj trenutek in poskusi znova.",
  saveFailed: "Prijave trenutno ni bilo mogoče shraniti. Poskusi znova.",
};

export const preparing = {
  eyebrow: "Kaj pripravljamo",
  title: "Manj ugibanja. Več jasnih korakov.",
  intro:
    "Platforma je še v pripravi. Spodnji sklopi opisujejo, kaj nastaja, in še niso na voljo.",
  items: [
    {
      title: "Načrtuj predelavo",
      text: "Praktične vsebine za prve odločitve, razporeditev prostora in načrtovanje camperja.",
      status: "V pripravi",
    },
    {
      title: "Spoznaj opremo",
      text: "Razumljive razlage rešitev za elektriko, vodo, izolacijo in udobje na poti.",
      status: "V pripravi",
    },
    {
      title: "Poišči prave povezave",
      text: "V prihodnje tudi povezovanje s proizvajalci, izvajalci in ponudniki opreme.",
      status: "V načrtu",
    },
  ],
};

export const story = {
  title: "Dobro premišljen prostor. Več svobode na poti.",
  text: "Od prvih skic do premišljenih odločitev. GradimoCamper nastaja za vse, ki želijo svoj kombi oblikovati po svoje.",
};

export const imageNotice =
  "Fotografije so simbolične. Prikazana vozila niso izdelki ali predelave GradimoCamper in ne nakazujejo sodelovanja s proizvajalci. Znamke in oznake pripadajo njihovim imetnikom.";

export const faq = {
  title: "Pogosta vprašanja",
  items: [
    {
      q: "Kaj bo ponujala platforma?",
      a: "Praktične vsebine o načrtovanju camperja, domači predelavi kombija in opremi ter pozneje povezovanje s ponudniki.",
    },
    {
      q: "Komu je namenjena?",
      a: "Predvsem ljudem, ki načrtujejo domačo predelavo kombija ali iščejo primernejšo opremo. V prihodnje bo namenjena tudi sodelovanju s ponudniki in izvajalci.",
    },
    {
      q: "Kdaj bo na voljo?",
      a: "Platforma je v pripravi. Prijavljene bomo obvestili ob zagonu.",
    },
    {
      q: "Ali s prijavo ustvarim račun?",
      a: "Ne. Oddaš samo e-poštni naslov za izbrana obvestila. Uporabniškega računa ne potrebuješ.",
    },
  ],
};

export const closing = {
  title: "Naj se naslednja pot začne z dobro idejo.",
};

export const footer = {
  privacy: "Politika zasebnosti",
  admin: "Administracija",
  contactLabel: "Kontakt",
};

/**
 * Slike. Datoteke so v `public/images/`. Ob zamenjavi slike posodobi
 * `src`, `width` in `height` (dejanske mere datoteke v slikovnih pikah),
 * `alt` (opis dejanske vsebine) in `background` (barva ozadja fotografije,
 * da se okvir zlije s sliko).
 */
export const images = {
  hero: {
    src: "/images/camper-spredaj-olivno-ozadje.png",
    width: 459,
    height: 312,
    alt: "Bel kompaktni avtodom z rdečimi poudarki in prižganimi žarometi, fotografiran s sprednje strani pod kotom na olivno zelenem ozadju.",
    background: "#434124",
  },
  front: {
    src: "/images/avtodom-spredaj-pesceno-ozadje.png",
    width: 459,
    height: 303,
    alt: "Avtodom v svetli bež barvi s temnimi stranskimi okni, fotografiran s sprednje strani pod kotom na peščeno bež ozadju.",
    background: "#957c5d",
  },
  side: {
    src: "/images/avtodom-bocno-olivno-ozadje.png",
    width: 1409,
    height: 555,
    alt: "Svetlo siv avtodom s temno grafiko in rdečimi črtami na boku, fotografiran od strani na olivno zelenem ozadju.",
    background: "#555229",
  },
};

export const privacyPage = {
  title: "Politika zasebnosti",
  draftNotice:
    "Osnutek. Besedilo še ni pravno pregledano in ni dokončno. Označena mesta je treba dopolniti pred javno objavo strani.",
};
