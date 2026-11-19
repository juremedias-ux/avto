# GradimoCamper

Slovenska platforma v nastajanju za domačo predelavo kombijev v camperje. Obiskovalec se prijavi na obvestilo ob zagonu; prijave se shranijo v bazo Supabase; lastnik jih pregleduje v zasebni administraciji na `/admin`.

Projekt vsebuje tudi platformo (središče znanja, katalog izdelkov s povpraševanjem, urejevalnik vsebin na `/cms`), ki je do potrditve lastnika vidna samo prijavljenim urednikom. Glej [17. Platforma](#17-platforma-učenje-izdelki-in-urejevalnik-vsebin).

**Stanje:** prva različica, pripravljena za nastavitev in preverjanje. Gostovanje: Vercel (ekipa `gradimo-camper`), baza: Supabase (projekt `rplgjmogsajzzfkohxwy`). Stran **še ni objavljena**. Pred javno objavo glej [16. Odprte naloge pred javno objavo](#16-odprte-naloge-pred-javno-objavo).

---

## Kazalo

- [Kaj vsebuje projekt](#kaj-vsebuje-projekt)
- [Stroški in brezplačni paketi](#stroški-in-brezplačni-paketi)
- [1. Lokalni zagon](#1-lokalni-zagon)
- [2. Nastavitev Supabase](#2-nastavitev-supabase)
- [3. Izvedba migracij](#3-izvedba-migracij)
- [4. Okoljske spremenljivke](#4-okoljske-spremenljivke)
- [5. Ustvarjanje lastniškega računa](#5-ustvarjanje-lastniškega-računa)
- [6. Nastavitev lastniškega ID-ja](#6-nastavitev-lastniškega-id-ja)
- [7. Dostop do administracije](#7-dostop-do-administracije)
- [8. Upravljanje in izvoz prijav](#8-upravljanje-in-izvoz-prijav)
- [9. Dodajanje in zamenjava priloženih datotek](#9-dodajanje-in-zamenjava-priloženih-datotek)
- [10. Urejanje besedil, barv in slik](#10-urejanje-besedil-barv-in-slik)
- [11. Podatki upravljavca in kontakt](#11-podatki-upravljavca-in-kontakt)
- [12. Priprava in objava na gostovanju](#12-priprava-in-objava-na-gostovanju)
- [13. Naslov gradimocamper.vercel.app](#13-naslov-gradimocampervercelapp)
- [14. Omejitve: lastništvo e-pošte ni preverjeno](#14-omejitve-lastništvo-e-pošte-ni-preverjeno)
- [15. Varnostne kopije in skrivnosti](#15-varnostne-kopije-in-skrivnosti)
- [16. Odprte naloge pred javno objavo](#16-odprte-naloge-pred-javno-objavo)
- [17. Platforma: učenje, izdelki in urejevalnik vsebin](#17-platforma-učenje-izdelki-in-urejevalnik-vsebin)
- [Varnost na kratko](#varnost-na-kratko)
- [Preverjanje kakovosti](#preverjanje-kakovosti)

---

## Kaj vsebuje projekt

| Del | Opis |
| --- | --- |
| Javna stran `/` | Prvi zaslon s prijavo, »Kaj pripravljamo«, vizualna zgodba, pogosta vprašanja, zaključna prijava, noga. |
| Prijavni obrazec | En gradnik (`components/WaitlistForm.tsx`) z eno strežniško akcijo (`app/actions/waitlist.ts`), prikazan dvakrat z različnimi HTML-identifikatorji. Deluje tudi brez JavaScripta. |
| Privolitev | Za prijavo zadostuje e-poštni naslov: privolitev za obvestilo ob zagonu je dana s klikom na »Obvesti me ob zagonu« (besedilo je ob gumbu) in se shrani s časom in različico besedila. Polja za novice obrazec od 5. 11. 2026 ne prikazuje; nove prijave imajo novice »ne«. Že dane privolitve za novice ostanejo v bazi, izvoz »Novice« v administraciji jih še vedno vključuje. |
| Politika zasebnosti `/zasebnost` | Dopolnjeno besedilo brez odprtih mest. Pravno ni pregledano. |
| Administracija `/admin` | Prijava lastnika (Supabase Auth), povzetek, tabela, iskanje, straničenje, razvrščanje, CSV-izvoz, preklic privolitve, trajni izbris. |
| Baza | `supabase/migrations/20261102120000_waitlist.sql` |

Tehnologija: Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Supabase (Postgres in Auth). Zunanjih skript, sledilnikov, analitike ali oglaševalskih piškotkov ni.

### Struktura

```
app/
  (frontend)/             javni del (lastna korenska postavitev)
    page.tsx              stran za prijavo ali domača stran platforme
    actions/              strežniški akciji za prijavo in povpraševanje
    zasebnost/            politika zasebnosti
    admin/                administracija prijav (stran, prijava, akcije, CSV-izvoz)
    ucenje/, vodici/, izdelki/, iskanje/, povprasevanje/, kontakt/, o-nas/, pogoji/
    globals.css           oblikovni žetoni (barve, pisava, razmiki) in skupni slogi
  (payload)/              urejevalnik /cms in REST API /api (Payload CMS)
  global-not-found.tsx    stran 404
  robots.ts, sitemap.ts   robots.txt in sitemap
  icon.svg, apple-icon.png, favicon.ico, opengraph-image.png
cms/                      zbirke, pravila dostopa, migracije in vzorčne vsebine urejevalnika
payload.config.ts         nastavitve urejevalnika
payload-types.ts          samodejno ustvarjeni tipi (npm run cms:types)
components/               gradniki (landing/, platform/, admin/, obrazec)
lib/                      validacija, podatkovni sloj, avtentikacija, omejevanje zahtev, CSV, platforma
content.ts                ime znamke, besedila, kontakt, podatki upravljavca, slike
public/vzorci/            vzorčni video, podnapisi in naslovnica
public/images/            slike za splet
assets/izvirne-priloge/   nespremenjene izvirne priložene slike
supabase/migrations/      migracije baze
proxy.ts                  osvežitev seje za /admin
tests/                    enotski testi (Vitest)
.env.example              primer nastavitev
```

Datoteke `index.html`, `script.js` in `styles.css` v korenu repozitorija so ostanek prejšnjega statičnega prototipa »Avto« in **niso del GradimoCamper** (Next.js jih ne uporablja). Pustili smo jih nespremenjene; če jih ne potrebuješ, jih lahko izbrišeš.

---

## Stroški in brezplačni paketi

Cilj je 0 EUR na mesec. Stanje na dan priprave (2. 11. 2026). Uradnih strani ponudnikov iz razvojnega okolja ni bilo mogoče odpreti neposredno; spodnje navedbe temeljijo na rezultatih iskanja, ki citirajo uradno dokumentacijo. **Pred odločitvijo preveri aktualne pogoje na straneh ponudnikov.**

### ⚠️ Vercel Hobby (brezplačno) ni namenjen poslovni rabi

Po [Vercelovih smernicah poštene rabe](https://vercel.com/docs/limits/fair-use-guidelines) in [opisu paketa Hobby](https://vercel.com/docs/plans/hobby) je Hobby omejen na **nekomercialno osebno rabo**; vsaka komercialna raba zahteva paket Pro ali Enterprise. GradimoCamper je poslovni projekt (prihodnje ponudbe, povezovanje s ponudniki), zato **Hobby po teh pogojih ni primeren**.

Možnosti:

1. **Netlify Free** (najpreprostejša brezplačna alternativa). Netlify v [objavi brezplačnega paketa](https://www.netlify.com/blog/introducing-netlify-free-plan) navaja, da je namenjen tudi komercialnim projektom; Next.js 16 podpira prek svojega adapterja ([obvestilo](https://www.netlify.com/changelog/next-js-16-deploy-on-netlify/)). Pred uporabo preveri razdelek »Free Usage Tier« v [pogodbi Netlify](https://www.netlify.com/legal/self-serve-subscription-agreement). Naslov bo `ime.netlify.app` (ne `vercel.app`).
2. **Vercel Pro** (plačljivo). Ohrani naslov `gradimocamper.vercel.app`, vendar je plačljiv. Ne uvajamo ga brez tvoje potrditve.

**Izbrano gostovanje:** Vercel, ekipa [`gradimo-camper`](https://vercel.com/gradimo-camper) (odločitev lastnika). Paket ekipe ni bil preverjen. Če je ekipa na paketu Hobby, zanjo velja zgornja omejitev nekomercialne rabe. Koda deluje tudi na Netlifyju (glej [12](#12-priprava-in-objava-na-gostovanju)).

### Supabase Free

- Komercialna raba na brezplačnem paketu: **nepreverjeno** (v iskanju ni bilo jasnega vira). Preveri [pogoje Supabase](https://supabase.com/terms).
- Projekt na brezplačnem paketu se po [uradnem pojasnilu](https://supabase.com/kb/faqs/platform/free-project-pausing) **zaustavi po tednu dni premajhne aktivnosti baze**. Zaustavljen projekt ne sprejema prijav (obrazec prikaže »Prijave trenutno ni bilo mogoče shraniti«). Projekt v nadzorni plošči ponovno zaženeš ročno.
- Samodejne varnostne kopije na brezplačnem paketu po [ceniku Supabase](https://supabase.com/pricing) **niso vključene**. Glej [15](#15-varnostne-kopije-in-skrivnosti).
- Omejitve (po virih tretjih oseb, preveri na ceniku): 2 aktivna projekta, 500 MB baze, 50.000 aktivnih uporabnikov na mesec. Za seznam prijav to zadošča.

---

## 1. Lokalni zagon

Potrebuješ [Node.js](https://nodejs.org) 20.9 ali novejši.

```bash
npm install
```

```bash
cp .env.example .env.local
```

V `.env.local` vpiši nastavitve Supabase (glej [4](#4-okoljske-spremenljivke)). Brez njih se stran prikaže, prijava pa javi napako in ničesar ne shrani (uspeh se nikoli ne simulira).

```bash
npm run dev
```

Stran je na `http://localhost:3000`. Lokalni razvoj ne potrebuje produkcijskega naslova.

---

## 2. Nastavitev Supabase

Uporablja se projekt Supabase **`rplgjmogsajzzfkohxwy`**:

- naslov API: `https://rplgjmogsajzzfkohxwy.supabase.co` (vrednost za `SUPABASE_URL`),
- nadzorna plošča: <https://supabase.com/dashboard/project/rplgjmogsajzzfkohxwy>.

1. Odpri projekt v nadzorni plošči. Regijo projekta (prikazana v nastavitvah projekta) vpiši v `content.ts` → `dataLocation.supabaseRegion` (npr. `"EU – Frankfurt"`); prikaže se v politiki zasebnosti.
2. **Izklopi javno registracijo:** Authentication → Sign In / Providers → izklopi »Allow new users to sign up«. Ponudnik »Email« naj ostane vklopljen (prijava z e-pošto in geslom). *(Imena menijev se lahko sčasoma spremenijo.)*
3. Izvedi migracijo (glej [3](#3-izvedba-migracij)).
4. Ustvari lastniški račun (glej [5](#5-ustvarjanje-lastniškega-računa)).
5. Prepiši ključe v nastavitve (glej [4](#4-okoljske-spremenljivke)).

---

## 3. Izvedba migracij

Migracija ustvari tabelo `public.waitlist`, zasebno shemo `private` s kratkotrajnimi števci za omejevanje zahtev in funkciji `waitlist_subscribe` ter `check_rate_limit`. Vklopi RLS in **odvzame vse pravice javnima vlogama `anon` in `authenticated`**.

**Najpreprosteje (brez dodatnih orodij):**

1. Odpri SQL Editor projekta: <https://supabase.com/dashboard/project/rplgjmogsajzzfkohxwy/sql/new>.
2. Kopiraj celotno vsebino datoteke `supabase/migrations/20261102120000_waitlist.sql`.
3. Klikni »Run«. Rezultat mora biti brez napak.

**Z orodjem Supabase CLI** (za razvijalce):

```bash
npx supabase login
```

```bash
npx supabase link --project-ref rplgjmogsajzzfkohxwy
```

```bash
npx supabase db push
```

Migracijo je varno pognati večkrat (ne podvoji tabel in ne briše podatkov).

---

## 4. Okoljske spremenljivke

| Ime | Javno? | Opis |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | da | Osnovni naslov strani, npr. `https://gradimocamper.vercel.app`. Uporablja se za kanonični URL, sitemap in predogled deljenja. Lokalno pusti prazno. |
| `SUPABASE_URL` | ne | Supabase → Project Settings → Data API → Project URL. |
| `SUPABASE_PUBLISHABLE_KEY` | ne | Publishable key (`sb_publishable_…`) ali starejši ključ `anon`. Uporablja se samo za prijavo lastnika. |
| `SUPABASE_SECRET_KEY` | ne – **skrivnost** | Secret key (`sb_secret_…`) ali starejši ključ `service_role`. Obide RLS; samo na strežniku. |
| `ADMIN_USER_ID` | ne | UUID lastniškega računa (glej [6](#6-nastavitev-lastniškega-id-ja)). |
| `RATE_LIMIT_SECRET` | ne – skrivnost | Neobvezno. Ključ za psevdonimizacijo IP-naslovov. Če je prazen, se izpelje iz `SUPABASE_SECRET_KEY`. |
| `CLIENT_IP_HEADER` | ne | Neobvezno. Na Vercelu pusti prazno. Na Netlifyju: `x-nf-client-connection-ip`. |
| `ALLOW_INDEXING` | ne | `true` dovoli indeksiranje v iskalnikih. Privzeto izklopljeno; vklopi šele ob javni objavi. |

Pravila:

- Skrivnosti **nikoli** ne poimenuj s predpono `NEXT_PUBLIC_` (te vrednosti dobi brskalnik).
- Datoteka `.env.local` je izključena iz Gita (`.gitignore`). V Git gre samo `.env.example` brez vrednosti.
- Supabase postopoma uvaja nove ključe (`sb_publishable_…`, `sb_secret_…`) namesto starejših `anon`/`service_role`; aplikacija sprejme oboje.

---

## 5. Ustvarjanje lastniškega računa

Javne registracije ni. Lastniški račun ustvariš ročno:

1. Supabase → Authentication → Users → »Add user« → »Create new user«.
2. Vpiši svoj e-poštni naslov in **močno, edinstveno geslo** (vsaj 16 znakov; uporabi upravitelja gesel).
3. Označi »Auto Confirm User«.
4. Shrani.

Geslo hrani samo Supabase Auth; aplikacija ga ne shranjuje v svoje tabele ali kodo.

**Pozabljeno geslo:** ponastavitev gesla po e-pošti v tej različici ni izvedena. Ustvari nov lastniški račun (koraki zgoraj), v nastavitvah zamenjaj `ADMIN_USER_ID` in star račun izbriši.

---

## 6. Nastavitev lastniškega ID-ja

1. Supabase → Authentication → Users → klikni svoj račun.
2. Kopiraj »User UID« (oblika `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).
3. Vpiši ga v `ADMIN_USER_ID` (lokalno v `.env.local`, na gostovanju v nastavitvah okolja) in ponovno zaženi oziroma objavi aplikacijo.

Dostop do administracije ima **samo** račun s tem ID-jem. Vsak drug prijavljen račun je zavrnjen.

---

## 7. Dostop do administracije

- Naslov: `/admin` (diskretna povezava »Administracija« je v nogi).
- Prijava: `/admin/prijava` z e-pošto in geslom lastniškega računa.
- Odjava: gumb »Odjava« zgoraj desno.
- Ob potekli seji te stran preusmeri na prijavo s sporočilom »Seja je potekla«.
- Poskusi prijave so omejeni (8 v 15 minutah z istega IP-naslova).

Skrita povezava in `robots.txt` **nista** varnostna zaščita. Zaščito zagotavlja preverjanje identitete in ID-ja na strežniku pri vsaki zaščiteni strani, akciji in izvozu.

---

## 8. Upravljanje in izvoz prijav

V administraciji:

- **Povzetek:** število aktivnih prijav za obvestilo ob zagonu, število aktivnih privolitev za novice in število vseh zapisov.
- **Tabela:** naslov, datum prijave, različica besedila, stanje obeh privolitev, vir (prvi zaslon ali zaključek strani).
- **Iskanje** po delu naslova, **razvrščanje** po datumu, **straničenje** (25 na stran).
- **Izvoz CSV:** ločeno »Obvestilo ob zagonu« in »Novice«. Preklicane privolitve niso vključene. Ime datoteke vsebuje namen in datum, npr. `gradimocamper-zagon-2026-11-02.csv`. Datoteka je v UTF-8 (z oznako BOM), ločilo je podpičje (privzeto za slovenski Excel); vrednosti, ki bi jih preglednica lahko izvedla kot formulo, dobijo predpono `'`.
- **Preklic privolitve:** »Prekliči zagon« ali »Prekliči novice« → potrditev. Preklic je dokončen; ponovna javna oddaja istega naslova ga ne aktivira.
- **Trajni izbris:** »Izbriši« → »Trajno izbriši«.

**Zahteve posameznikov** (dokler ni samodejne odjave): ko kdo pošlje zahtevo na kontaktni naslov, poišči njegov naslov v administraciji in izvedi preklic ustrezne privolitve ali trajni izbris.

---

## 9. Dodajanje in zamenjava priloženih datotek

Izvirne priložene slike so nespremenjene v `assets/izvirne-priloge/`. Za splet so pripravljene kopije v `public/images/`:

| Izvirnik | Spletna kopija | Uporaba | Obdelava |
| --- | --- | --- | --- |
| `4-camper-spredaj-olivno-ozadje.png` (459 × 314) | `camper-spredaj-olivno-ozadje.png` (459 × 312) | Glavna slika prvega zaslona | Odstranjeni zgornji 2 vrstici z ostankom odrezanega besedila |
| `2-avtodom-spredaj-pesceno-ozadje.png` (459 × 303) | `avtodom-spredaj-pesceno-ozadje.png` | Vizualna zgodba, levo | Brez sprememb |
| `1-avtodom-bocno-olivno-ozadje.png` (1417 × 555) | `avtodom-bocno-olivno-ozadje.png` (1409 × 555) | Vizualna zgodba, širok poudarek | Odstranjen bel rob 8 px na levi |
| `3-camper-kombi-spredaj-bordo-ozadje.png` (462 × 313) | – | Ni uporabljena | Bordo ozadje ni skladno z barvno paleto strani |

Logotipi in oznake na vozilih niso odstranjeni. Slike so majhne ločljivosti (pribl. 460 px širine), zato so prikazane največ v izvirni širini, da ne postanejo neostre.

Spletne kopije iz izvirnikov ponoviš tako: `4-…png` obreži za zgornji 2 vrstici, `1-…png` za levih 8 px, `2-…png` uporabi nespremenjeno; shrani pod imeni iz tabele.

**Zamenjava slike:**

1. Novo datoteko (PNG ali JPG, čim večja ločljivost) shrani v `public/images/`.
2. V `content.ts` v razdelku `images` popravi `src` (pot, npr. `/images/nova-slika.png`), `width` in `height` (dejanske mere v slikovnih pikah), `alt` (opis dejanske vsebine) in `background` (barva ozadja fotografije, da se okvir zlije s sliko).
3. Barvo ozadja določiš npr. s kapalko v programu za urejanje slik (vrednost `#rrggbb`).
4. `npm test` preveri, ali se mere v `content.ts` ujemajo z datotekami PNG.

**Pravice za javno uporabo:** na slikah 3 in 4 je viden napis BÜRSTNER, na sliki 1 napis SIGNATURE. Dovoljenje imetnika pravic ni preverjeno. Fotografije so po odločitvi lastnika objavljene v javnem repozitoriju brez predhodnega preverjanja pravic; tveganje glede avtorskih pravic in znamk ostaja odprto (glej [16](#16-odprte-naloge-pred-javno-objavo)). Stran pod slikami navaja, da so fotografije simbolične in vozila niso izdelki ali predelave GradimoCamper.

---

## 10. Urejanje besedil, barv in slik

- **Besedila, ime znamke, kontakt, slike:** `content.ts`. Ime `GradimoCamper` je na enem mestu (`brand`).
- **Besedila privolitev** (`consent`): ob vsebinski spremembi povečaj `consent.version` (npr. `v1` → `v2`). Sistem k različici samodejno doda prstni odtis besedila (npr. `v1+5ecb6aa2`), ki se shrani ob vsaki prijavi.
- **Barve, pisava, polmeri, sence:** žetoni na vrhu `app/globals.css` (`--color-paper`, `--color-ink`, `--color-olive`, `--color-action` …). Pri spremembi barve preveri kontrast (besedilo vsaj 4,5 : 1).
- **Pisava:** Figtree (podpira slovenske znake), naložena prek `next/font` in strežena z lastne domene.
- **Logotip:** `components/Logo.tsx` in simbol `components/VanMark.tsx`; ikona zavihka `app/icon.svg`, `app/apple-icon.png`, `app/favicon.ico`; predogled deljenja `app/opengraph-image.png`.

---

## 11. Podatki upravljavca in kontakt

Nastavljeno v `content.ts`:

```ts
export const contact = { email: "gradimo.camper@gmail.com", phone: "", phoneHref: "" };
export const controller = { name: "Gradimo Camper", address: "", registrationNumber: "", email: "" };
export const dataLocation = { supabaseRegion: "EU – Irska (AWS eu-west-1)" };
export const privacyPage = { updated: "5. 11. 2026", legallyReviewed: false, … };
```

- E-pošta `gradimo.camper@gmail.com` se prikaže v nogi in v politiki zasebnosti (povezava `mailto:`). Telefon se prikaže, če ga izpolniš.
- Naslov in matična številka upravljavca se prikažeta, ko ju izpolniš.
- Regija baze Supabase (`dataLocation.supabaseRegion`) je vpisana; na `/zasebnost` ni več označenih mest `[DOPOLNI: …]`.
- Ob spremembi besedila politike posodobi `privacyPage.updated`.
- Obvestilo »Besedilo še ni pravno pregledano« izgine, ko nastaviš `legallyReviewed: true`. Besedilo ni pravni nasvet; priporočljiv je pregled pravnega strokovnjaka.

**Obveznosti iz politike zasebnosti** (izvajaš jih ročno v administraciji):

- zahteve za preklic ali izbris (prejete na `gradimo.camper@gmail.com`) izvedi najpozneje v enem mesecu;
- prijave brez aktivne privolitve za novice izbriši najpozneje 30 dni po poslanem obvestilu ob zagonu;
- prijave, ki po preklicu nimajo nobene aktivne privolitve, izbriši najpozneje v 30 dneh.

---

## 12. Priprava in objava na gostovanju

Pred objavo:

```bash
npm run check
```

(lint, preverjanje tipov, testi in produkcijska gradnja).

### Vercel

Gostovanje je v ekipi [`gradimo-camper`](https://vercel.com/gradimo-camper).

1. Združi PR z vejo `main` (Vercel privzeto objavlja produkcijo iz `main`).
2. <https://vercel.com/gradimo-camper> → »Add New… → Project« → uvozi repozitorij `juremedias-ux/avto` z GitHuba (ob prvem uvozu Vercel zahteva dostop do repozitorija).
3. Ime projekta: `gradimocamper` (glej [13](#13-naslov-gradimocampervercelapp)). Ogrodje se zazna samodejno (Next.js).
4. Settings → Environment Variables, okolje **Production**:
   - `NEXT_PUBLIC_SITE_URL` = `https://gradimocamper.vercel.app` (oziroma dejanski naslov projekta),
   - `SUPABASE_URL` = `https://rplgjmogsajzzfkohxwy.supabase.co`,
   - `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `ADMIN_USER_ID` (glej [4](#4-okoljske-spremenljivke)–[6](#6-nastavitev-lastniškega-id-ja)).

   Za predoglede (Preview) produkcijskih ključev Supabase ne vnašaj, sicer predogledi pišejo v produkcijsko bazo.
5. »Deploy«. Indeksiranje ostane izklopljeno, dokler ne nastaviš `ALLOW_INDEXING=true`.

Upoštevaj opozorilo o paketu Hobby v [Stroških](#stroški-in-brezplačni-paketi).

### Netlify (brezplačna alternativa za poslovno rabo)

1. Na [netlify.com](https://www.netlify.com) → »Add new site → Import an existing project« → izberi repozitorij.
2. Netlify zazna Next.js (gradnja `npm run build`).
3. Site configuration → Environment variables: spremenljivke iz [4](#4-okoljske-spremenljivke) in `CLIENT_IP_HEADER=x-nf-client-connection-ip`; `NEXT_PUBLIC_SITE_URL=https://<ime>.netlify.app`.
4. Po objavi preveri prijavo na obvestilo, prijavo v administracijo in izvoz. *(Podpora datoteke `proxy.ts` na Netlifyju ni bila preverjena; brez nje se lahko seja lastnika po eni uri izteče in je treba ponovno prijavo.)*

**Pomembno pri drugih gostovanjih:** omejevanje zahtev uporablja IP iz glave `CLIENT_IP_HEADER`. Uporabi glavo, ki jo nastavi gostovanje samo; glavo, ki jo lahko pošlje obiskovalec, je mogoče ponarediti.

---

## 13. Naslov gradimocamper.vercel.app

- Naslov `ime-projekta.vercel.app` Vercel dodeli po imenu projekta. Razpoložljivost imena `gradimocamper` ni bila preverjena.
- Če je ime prosto, bo produkcijski naslov `https://gradimocamper.vercel.app`; vpiši ga v `NEXT_PUBLIC_SITE_URL`.
- Če ni prosto, Vercel dodeli drugačen naslov. **Pred izbiro drugega imena se odloči sam** (in naslov vpiši v `NEXT_PUBLIC_SITE_URL`).
- Gre za poddomeno ponudnika, ne za lastno domeno. Lastno domeno lahko dodaš pozneje (Settings → Domains).

---

## 14. Omejitve: lastništvo e-pošte ni preverjeno

- Prijava ne pošlje potrditvenega sporočila (ni double opt-in). Kdorkoli lahko vpiše tuj naslov.
- Zato administracija ne uporablja oznake »potrjene prijave«, privolitve pa so shranjene kot izjave, oddane prek obrazca.
- Ponovna oddaja istega naslova ne spremeni obstoječih privolitev in ne aktivira preklicanih (brez preverjanja lastništva tega ni mogoče varno dovoliti). Kdor želi spremembo, piše na kontakt.
- Odziv je za nov in že prijavljen naslov enak, da stran ne razkriva, kdo je prijavljen.
- **Pred pošiljanjem kampanj** (novice, ponudbe) bo treba urediti storitev za pošiljanje e-pošte, odjavno povezavo v vsakem sporočilu in po možnosti potrditev naslova. To ni del te različice.

---

## 15. Varnostne kopije in skrivnosti

**Varnostne kopije** (brezplačni paket Supabase nima samodejnih kopij):

- Redno (npr. tedensko) izvozi celotno tabelo: Supabase → Table Editor → `waitlist` → Export → CSV. Ta izvoz vsebuje tudi preklicane privolitve (dokaz preklica), zato ga hrani varno in šifrirano.
- CSV-izvoza v administraciji nista popolna kopija (vsebujeta samo aktivne privolitve).
- Za razvijalce: `npx supabase db dump --data-only` (po `supabase link`).

**Skrivnosti:**

- `SUPABASE_SECRET_KEY` in `RATE_LIMIT_SECRET` hrani samo v nastavitvah gostovanja in v lokalni `.env.local`. Nikoli v Git, e-pošto ali klepet.
- Ob sumu razkritja v Supabase ustvari nov skrivni ključ, ga vpiši na gostovanje, objavi in star ključ prekliči.
- Aplikacija v dnevnike ne zapisuje e-poštnih naslovov, gesel, žetonov ali podrobnosti napak baze (samo kodo napake).

**Hramba podatkov za zaščito pred zlorabami:** števci vsebujejo samo HMAC-psevdonim IP-naslova in se brišejo ob naslednji oddaji po izteku okna. Za redno brisanje ne glede na promet lahko v Supabase (SQL Editor) vklopiš razširitev `pg_cron`, če je v tvojem projektu na voljo:

```sql
create extension if not exists pg_cron;
select cron.schedule('gradimocamper-ciscenje-stevcev', '*/15 * * * *',
  $$delete from private.rate_limits where expires_at < now()$$);
```

---

## 16. Odprte naloge pred javno objavo

Javno objavo **preprečujejo**:

- [x] Podatki upravljavca in kontakt (`Gradimo Camper`, gradimo.camper@gmail.com).
- [x] Gostovanje: Vercel, ekipa `gradimo-camper`; projekt Supabase `rplgjmogsajzzfkohxwy`.
- [x] Regija baze Supabase: EU – Irska (`eu-west-1`).
- [ ] **Pogodbi o obdelavi podatkov (DPA)** s Supabase in Vercel: preveri, da sta sprejeti (politika zasebnosti se nanju sklicuje).
- [ ] **Supabase:** migracija, izklopljena javna registracija, lastniški račun, `ADMIN_USER_ID`.
- [ ] **Vercel:** uvoz repozitorija, spremenljivke okolja, preverjen naslov v `NEXT_PUBLIC_SITE_URL`.
- [ ] Priporočeno: pravni pregled politike zasebnosti (nato `legallyReviewed: true`).

Ob objavi:

- [ ] Preizkus na objavljeni strani: prijava (oba obrazca), administracija, izvoz, preklic, izbris.
- [ ] `ALLOW_INDEXING=true`, ko je stran pripravljena za iskalnike.
- [ ] Načrt rednih varnostnih kopij in odziva na zahteve posameznikov.

Odprto tveganje (po odločitvi lastnika ne ustavlja objave):

- [ ] **Pravice za slike:** dovoljenje za javno uporabo treh fotografij (vidne oznake BÜRSTNER in SIGNATURE) ni preverjeno. Fotografije so že v javnem repozitoriju. Če imetnik pravic ugovarja, jih zamenjaj z lastnimi (glej [9](#9-dodajanje-in-zamenjava-priloženih-datotek)); odstranitev iz zgodovine Gita zahteva prepis zgodovine.

Pozneje (ni v tej različici): potrditveno sporočilo (double opt-in), storitev za pošiljanje z odjavo, samodejni preklic prek povezave.

## 17. Platforma: učenje, izdelki in urejevalnik vsebin

Poleg strani za prijavo projekt vsebuje platformo z dvema deloma:

| Del | Poti | Opis |
| --- | --- | --- |
| Domača stran platforme | `/` | Prvi zaslon, oba dela platforme, vodiči za začetek, načrt gradnje po fazah, področja izdelkov, »Kako delamo«, poziv h kontaktu. |
| Središče znanja | `/ucenje`, `/ucenje/teme/…`, `/ucenje/clanki/…`, `/ucenje/videi/…` | Članki in video lekcije s filtri (faza, tema, zahtevnost, vrsta), ključni poudarki, varnostne opombe, kontrolni seznami za prenos, uporabljeni izdelki, sorodne vsebine. |
| Vodiči gradnje | `/vodici`, `/vodici/nacrt-gradnje`, `/vodici/…` | Učne poti z označevanjem opravljenih korakov (shrani se v brskalniku) in načrt gradnje po fazah z vsebinami in opremo za vsako fazo. |
| Izdelki | `/izdelki`, `/izdelki/<področje>`, `/izdelki/<področje>/<izdelek>` | Katalog s filtri (področje, faza, dobavljivost), tehnični podatki, združljivost, vodiči za vgradnjo, pogosta vprašanja. Ni košarice in plačila. |
| Povpraševanje | `/povprasevanje`, `/kontakt` | Seznam izbranih izdelkov s količinami in obrazec »Prosim za ponudbo« ali »Želim rezervirati«; obrazec za vprašanje (tudi o posameznem izdelku). |
| Ostalo | `/iskanje`, `/o-nas`, `/pogoji` | Iskanje po vodičih, videih, izdelkih in temah; stran O nas; osnutek pogojev uporabe. |
| Urejevalnik | `/cms` | Payload CMS v slovenščini: vse vsebine, izdelki, datoteke, povpraševanja, uredniki. |

Vse vsebine so v slovenščini. Urejevalnik (Payload CMS 3) teče v isti aplikaciji in uporablja isto bazo Supabase (ločena shema `cms`, tabele prijav na obvestilo ostanejo nespremenjene).

### 17.1 Kdo vidi platformo

- **Dokler `PLATFORM_PUBLIC` ni `true`**, obiskovalci vidijo obstoječo stran za prijavo na obvestilo; strani platforme zanje ne obstajajo (404). Prijavljeni uredniki vidijo platformo s pasico »Predogled za urednike«.
- **Ko je `PLATFORM_PUBLIC=true`** (in je stran ponovno objavljena), je platforma javna. Obiskovalci vidijo samo **objavljene** vsebine; osnutke vidijo samo uredniki.
- Platforme **ne objavljaj** brez potrditve lastnika.

### 17.2 Nastavitev urejevalnika na Vercelu (enkrat)

1. **Geslo baze.** Supabase → projekt `rplgjmogsajzzfkohxwy` → Project Settings → Database. Če gesla baze ne poznaš, ga ponastavi (»Reset database password«). Geslo baze ni isto kot ključi API; ponastavitev ne vpliva na obstoječo prijavo na obvestilo.
2. **Povezava do baze.** Supabase → gumb **Connect** (zgoraj) → zavihek povezave → način **Session pooler** → kopiraj URI (`postgresql://postgres.rplgjmogsajzzfkohxwy:[YOUR-PASSWORD]@…pooler.supabase.com:5432/postgres`). `[YOUR-PASSWORD]` zamenjaj z geslom iz koraka 1.
3. **Spremenljivke na Vercelu.** Vercel → projekt → Settings → Environment Variables. Dodaj (vse kot skrivnosti, **brez** predpone `NEXT_PUBLIC_`):
   - `DATABASE_URL` = URI iz koraka 2,
   - `PAYLOAD_SECRET` = vsaj 32 naključnih znakov (npr. rezultat ukaza `openssl rand -hex 32`),
   - `CMS_SETUP_TOKEN` = vsaj 16 naključnih znakov (potreben samo za prvega urednika).
4. **Shramba datotek.** Vercel → projekt → Storage → Create → **Blob** → poveži s projektom. Vercel sam doda `BLOB_READ_WRITE_TOKEN`. Brez tega naložene slike in videi na Vercelu ne bodo shranjeni trajno.
5. **Ponovna objava.** Vercel → Deployments → zadnja objava → Redeploy. Ob prvem zagonu urejevalnik sam ustvari tabele v shemi `cms` (migracije v `cms/migrations/`).
6. **Prvi urednik.** Odpri `https://gradimocamper.vercel.app/cms`. Prikaže se obrazec za prvega urednika: vpiši e-pošto, geslo in **nastavitveni žeton** (`CMS_SETUP_TOKEN`). Brez pravilnega žetona prvega urednika ni mogoče ustvariti. Žeton se ne shrani. Ko urednik obstaja, lahko `CMS_SETUP_TOKEN` izbrišeš.

Dodatne urednike dodaš v urejevalniku: Nastavitve → Uredniki → Ustvari. Prijava: 5 napačnih poskusov zaklene račun za 15 minut; seja traja 8 ur.

### 17.3 Vzorčne vsebine

Na nadzorni plošči urejevalnika (`/cms`) klikni **Ustvari vzorčne vsebine**. Ustvari se:

- 8 faz gradnje, 5 tem, 3 področja izdelkov,
- članek »Prvi koraki: kako načrtovati predelavo kombija«,
- video lekcija »Poraba elektrike: kako določiti velikost baterije« (s kratkim vzorčnim posnetkom in podnapisi),
- učna pot »Začni tukaj: od ideje do načrta«,
- 3 vzorčni izdelki na področju »Elektrika in solarni sistem« (brez cene, brez certifikatov, z oznako »vzorec«),
- besedila domače strani in strani O nas.

Vse vzorčne vsebine imajo oznako **Vzorčna vsebina** in na strani prikažejo opozorilo. Ponoven klik ne podvoji vnosov. Pred javno objavo vzorce zamenjaj z resničnimi vsebinami ali jih izbriši.

### 17.4 Dodajanje vsebin

Vse vsebine dodajaš v `/cms`. Članki, videi, učne poti in izdelki imajo **osnutek in objavo**: »Shrani osnutek« ni viden obiskovalcem, »Objavi« oziroma »Objavi spremembe« je. URL (slug) se ustvari iz naslova, če ga pustiš praznega.

| Kaj | Kje v urejevalniku | Obvezno | Nasvet |
| --- | --- | --- | --- |
| Faza gradnje | Razvrščanje → Faze gradnje | naziv, številka, kratek opis | Številka določa vrstni red v načrtu gradnje. |
| Tema | Razvrščanje → Teme | naziv | Teme povezujejo vsebine (npr. Elektrika). |
| Članek | Učenje → Članki | naslov, povzetek, čas branja, zahtevnost, faza, vsebina | Ključni poudarki in varnostna opomba se prikažejo na vrhu. Pod »Izdelki« izberi opremo, uporabljeno v vodiču. |
| Video lekcija | Učenje → Video lekcije | naslov, povzetek, vir, trajanje, zahtevnost, faza | Vir: povezava YouTube ali naložena datoteka. Poglavja vpiši kot `4:30` + naslov. |
| Učna pot | Učenje → Učne poti | naslov, opis, koraki | Vsak korak je članek ali video. Pot z oznako »Prikaži kot »Začni tukaj«« se prikaže na domači strani. |
| Področje izdelkov | Izdelki → Kategorije izdelkov | naziv | »Vodič »Kako izbrati«« je članek, ki se priporoči na vrhu področja. |
| Izdelek | Izdelki → Izdelki | naziv, področje, kratek opis, zahtevnost vgradnje, dobavljivost | Cena je neobvezna (brez cene: »Cena na povpraševanje«). Ne vpisuj ocen, mnenj ali certifikatov, ki jih nimaš dokazanih. |
| Slika | Datoteke → Slike | datoteka, opis slike | Opis (alt) je obvezen. V »Avtor/vir« zapiši, od kod je slika in ali jo smeš uporabiti. |
| Domača stran, O nas | Strani | – | Prazna polja domače strani uporabijo privzeta besedila. |

**Videi.** Brezplačni paket Vercel Blob ima 1 GB prostora in 10 GB prenosa na mesec (stanje ob pripravi; preveri na Vercelu). Na platformo nalagaj samo kratke posnetke (MP4); daljše objavi na YouTubu in v video lekcijo vpiši povezavo. Predvajalnik YouTube se naloži šele ob kliku (youtube-nocookie.com), zato do klika ni povezave z YouTubom. Podnapise naložiš kot datoteko `.vtt` (Datoteke → Dokumenti).

### 17.5 Povpraševanja

Oddana povpraševanja in vprašanja so v urejevalniku: **Povpraševanja → Povpraševanja** (vidijo jih samo uredniki). Vsako ima vrsto (povpraševanje, vprašanje, rezervacija), e-pošto, neobvezno ime, sporočilo, izdelke s količinami in stanje (nova, v obdelavi, zaključeno). Na povpraševanje odgovoriš po e-pošti.

- **Obvestila po e-pošti ni**: nova povpraševanja preverjaj v urejevalniku.
- Zaščita: preverjanje izvora, past za robote, omejitev 5 oddaj v 15 minutah z istega IP-naslova (enak mehanizem kot pri prijavi na obvestilo; IP se ne shrani).
- Rok hrambe po politiki zasebnosti: 12 mesecev od zadnjega stika. Brisanje je ročno (izberi in izbriši v seznamu).

### 17.6 Merjenje dogodkov (pripravljeno, ni vklopljeno)

Stran ne uporablja analitike in ne nastavlja piškotkov za sledenje. Ključni dogodki se sprožijo kot dogodek brskalnika `gc:dogodek` in se dodajo v `window.dataLayer`, če ta obstaja (`lib/analytics.ts`):

`video_predvajanje`, `vodic_prebran`, `korak_poti_opravljen`, `izdelek_ogled`, `klik_izdelka_iz_vodica`, `dodano_v_povprasevanje`, `povprasevanje_oddano`, `kontakt_oddan`, `iskanje`.

Ko izbereš orodje za analitiko, ga priklopiš v `lib/analytics.ts`. Orodje, ki uporablja piškotke ali podobne tehnologije, zahteva predhodno privolitev obiskovalca in dopolnitev politike zasebnosti.

### 17.7 Objava platforme (po potrditvi lastnika)

- [ ] Vzorčne vsebine zamenjane z resničnimi ali izbrisane.
- [ ] Pravni pregled pogojev uporabe (`/pogoji` je označen kot osnutek, z mesti za dopolnitev) in politike zasebnosti (deli o povpraševanjih se prikažejo, ko je platforma javna).
- [ ] Preverjene pravice za vse slike in videe.
- [ ] `PLATFORM_PUBLIC=true` na Vercelu in ponovna objava.
- [ ] Preizkus na objavljeni strani: povpraševanje, vprašanje, video, iskanje.
- [ ] Ko je stran pripravljena za iskalnike: `ALLOW_INDEXING=true`. Sitemap tedaj vključi objavljene vsebine.

### 17.8 Česa ta različica ne vsebuje (faza 2)

Uporabniški računi za obiskovalce, plačila in spletna prodaja, obvestila po e-pošti ob novem povpraševanju, novice, ocene in mnenja, več jezikov, orodja (npr. kalkulator porabe), napredno iskanje. Pravne in homologacijske vsebine po odločitvi lastnika še niso pripravljene.

---

## Varnost na kratko

- Oddaja prek strežniške akcije; strežnik preveri obliko in dolžino, normalizira naslov, preveri past za robote (skrito polje), omejitev zahtev in izvor zahteve.
- Omejevanje zahtev je v bazi (deluje pri več strežniških instancah): 5 oddaj v 10 minutah z istega IP-naslova.
- Dvojnike prepreči enolična omejitev v bazi (`INSERT … ON CONFLICT DO NOTHING`), tudi pri sočasnih zahtevah.
- RLS je vklopljen; vloge `anon` in `authenticated` nimajo pravic do tabel in funkcij.
- Administracija: identiteta se preveri pri strežniku Supabase Auth in primerja z `ADMIN_USER_ID` pri vsaki strani, akciji in izvozu. Piškotek seje je `HttpOnly`, omejen na `/admin`, `SameSite=Lax`, v produkciji `Secure`.
- Zasebni odzivi imajo `Cache-Control: private, no-store` in `X-Robots-Tag: noindex`.
- Varnostne glave (CSP, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) v `next.config.ts`.
- Urejevalnik: skrivnosti (`DATABASE_URL`, `PAYLOAD_SECRET`, `CMS_SETUP_TOKEN`, `BLOB_READ_WRITE_TOKEN`) samo na strežniku; prvega urednika ni mogoče ustvariti brez nastavitvenega žetona; zaklep po 5 napačnih prijavah; GraphQL izklopljen; povpraševanja in uredniki niso dostopni brez prijave; `/cms` in `/api` imata `noindex`, `/cms` tudi `no-store`. Brez nastavitev urejevalnika `/cms` in `/api` vrneta 404.

---

## Preverjanje kakovosti

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npm run build
```

Enotski testi (`tests/`) pokrivajo normalizacijo in preverjanje naslovov, logiko obrazca, CSV (ubežanje, zaščita pred formulami, BOM), parametre administracije, psevdonimizacijo IP-naslovov, časovne žige, pravila indeksiranja, URL-je (slug), povezave YouTube, slovensko množino ter preverjanje povpraševanj.

Ukazi urejevalnika (lokalno, z `DATABASE_URL` in `PAYLOAD_SECRET` v `.env.local`):

```bash
npm run cms:migrate
```

```bash
npm run cms:types
```

Po spremembi zbirk v `cms/collections/` ustvari novo migracijo z `npm run cms:migrate:create` in jo dodaj v Git.
