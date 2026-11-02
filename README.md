# GradimoCamper

Pristajalna stran za slovensko platformo v nastajanju za domačo predelavo kombijev v camperje. Obiskovalec se prijavi na obvestilo ob zagonu; prijave se shranijo v bazo Supabase; lastnik jih pregleduje v zasebni administraciji na `/admin`.

**Stanje:** prva različica, pripravljena za nastavitev in preverjanje. Stran **še ni objavljena**. Pred javno objavo glej [16. Odprte naloge pred javno objavo](#16-odprte-naloge-pred-javno-objavo).

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
- [Varnost na kratko](#varnost-na-kratko)
- [Preverjanje kakovosti](#preverjanje-kakovosti)

---

## Kaj vsebuje projekt

| Del | Opis |
| --- | --- |
| Javna stran `/` | Prvi zaslon s prijavo, »Kaj pripravljamo«, vizualna zgodba, pogosta vprašanja, zaključna prijava, noga. |
| Prijavni obrazec | En gradnik (`components/WaitlistForm.tsx`) z eno strežniško akcijo (`app/actions/waitlist.ts`), prikazan dvakrat z različnimi HTML-identifikatorji. Deluje tudi brez JavaScripta. |
| Privolitvi | Obvezna (obvestilo ob zagonu) in neobvezna (nasveti, novice, ponudbe), obe privzeto neoznačeni, shranjeni ločeno s časom in različico besedila. |
| Politika zasebnosti `/zasebnost` | Osnutek z rumeno označenimi mesti `[DOPOLNI: …]`. |
| Administracija `/admin` | Prijava lastnika (Supabase Auth), povzetek, tabela, iskanje, straničenje, razvrščanje, CSV-izvoz, preklic privolitve, trajni izbris. |
| Baza | `supabase/migrations/20261102120000_waitlist.sql` |

Tehnologija: Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Supabase (Postgres in Auth). Zunanjih skript, sledilnikov, analitike ali oglaševalskih piškotkov ni.

### Struktura

```
app/                      strani in strežniške poti
  page.tsx                javna stran
  actions/waitlist.ts     strežniška akcija za prijavo
  zasebnost/page.tsx      osnutek politike zasebnosti
  admin/                  administracija (stran, prijava, akcije, CSV-izvoz)
  robots.ts, sitemap.ts   robots.txt in sitemap
  icon.svg, apple-icon.png, favicon.ico, opengraph-image.png
components/               gradniki (logotip, obrazec, odseki, administracija)
lib/                      validacija, podatkovni sloj, avtentikacija, omejevanje zahtev, CSV
content.ts                ime znamke, besedila, kontakt, podatki upravljavca, slike
app/globals.css           oblikovni žetoni (barve, pisava, razmiki) in skupni slogi
public/images/            slike za splet (fotografije vozil niso v Gitu, glej 9)
assets/izvirne-priloge/   nespremenjene izvirne priložene slike (niso v Gitu, glej 9)
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

Koda je pripravljena za Vercel in deluje tudi na Netlifyju (glej [12](#12-priprava-in-objava-na-gostovanju)). **Izbira gostovanja je tvoja odločitev.**

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

1. Ustvari račun in nov projekt na [supabase.com](https://supabase.com). Za regijo izberi EU (npr. Frankfurt), če je na voljo, in si jo zapiši za politiko zasebnosti.
2. **Izklopi javno registracijo:** Authentication → Sign In / Providers → izklopi »Allow new users to sign up«. Ponudnik »Email« naj ostane vklopljen (prijava z e-pošto in geslom). *(Imena menijev se lahko sčasoma spremenijo.)*
3. Izvedi migracijo (glej [3](#3-izvedba-migracij)).
4. Ustvari lastniški račun (glej [5](#5-ustvarjanje-lastniškega-računa)).
5. Prepiši ključe v nastavitve (glej [4](#4-okoljske-spremenljivke)).

---

## 3. Izvedba migracij

Migracija ustvari tabelo `public.waitlist`, zasebno shemo `private` s kratkotrajnimi števci za omejevanje zahtev in funkciji `waitlist_subscribe` ter `check_rate_limit`. Vklopi RLS in **odvzame vse pravice javnima vlogama `anon` in `authenticated`**.

**Najpreprosteje (brez dodatnih orodij):**

1. Supabase → SQL Editor → New query.
2. Kopiraj celotno vsebino datoteke `supabase/migrations/20261102120000_waitlist.sql`.
3. Klikni »Run«. Rezultat mora biti brez napak.

**Z orodjem Supabase CLI** (za razvijalce):

```bash
npx supabase login
```

```bash
npx supabase link --project-ref <ref-projekta>
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

> **Slike vozil niso v Gitu.** Repozitorij je javen, zato so fotografije do potrditve pravic izključene v `.gitignore` (`/public/images/*.png`, `/assets/izvirne-priloge/`). Kdor projekt prenese z GitHuba, mora slike dodati sam; brez njih se stran zgradi in deluje, namesto fotografij pa se prikažejo opisi (`alt`). Ko so pravice urejene, odstrani ti vrstici iz `.gitignore` in slike dodaj v Git.
>
> Spletne kopije iz izvirnikov ponoviš tako: `4-…png` obreži za zgornji 2 vrstici, `1-…png` za levih 8 px, `2-…png` uporabi nespremenjeno; shrani pod imeni iz tabele.

**Zamenjava slike:**

1. Novo datoteko (PNG ali JPG, čim večja ločljivost) shrani v `public/images/`.
2. V `content.ts` v razdelku `images` popravi `src` (pot, npr. `/images/nova-slika.png`), `width` in `height` (dejanske mere v slikovnih pikah), `alt` (opis dejanske vsebine) in `background` (barva ozadja fotografije, da se okvir zlije s sliko).
3. Barvo ozadja določiš npr. s kapalko v programu za urejanje slik (vrednost `#rrggbb`).
4. `npm test` preveri, ali se mere v `content.ts` ujemajo z datotekami PNG.

**Pravice za javno uporabo:** na slikah 3 in 4 je viden napis BÜRSTNER, na sliki 1 napis SIGNATURE. Priložena datoteka ni dokaz dovoljenja za javno uporabo. Pred objavo pridobi pisno dovoljenje imetnika pravic ali slike zamenjaj z lastnimi (glej [16](#16-odprte-naloge-pred-javno-objavo)). Stran pod slikami navaja, da so fotografije simbolične in vozila niso izdelki ali predelave GradimoCamper.

---

## 10. Urejanje besedil, barv in slik

- **Besedila, ime znamke, kontakt, slike:** `content.ts`. Ime `GradimoCamper` je na enem mestu (`brand`).
- **Besedila privolitev** (`consent`): ob vsebinski spremembi povečaj `consent.version` (npr. `v1` → `v2`). Sistem k različici samodejno doda prstni odtis besedila (npr. `v1+5ecb6aa2`), ki se shrani ob vsaki prijavi.
- **Barve, pisava, polmeri, sence:** žetoni na vrhu `app/globals.css` (`--color-paper`, `--color-ink`, `--color-olive`, `--color-action` …). Pri spremembi barve preveri kontrast (besedilo vsaj 4,5 : 1).
- **Pisava:** Figtree (podpira slovenske znake), naložena prek `next/font` in strežena z lastne domene.
- **Logotip:** `components/Logo.tsx` in simbol `components/VanMark.tsx`; ikona zavihka `app/icon.svg`, `app/apple-icon.png`, `app/favicon.ico`; predogled deljenja `app/opengraph-image.png`.

---

## 11. Podatki upravljavca in kontakt

V `content.ts`:

```ts
export const contact = { email: "" };          // javni kontakt (noga)
export const controller = {                    // politika zasebnosti
  name: "", address: "", registrationNumber: "", email: "",
};
```

- Ko je `contact.email` izpolnjen, se kontakt prikaže v nogi.
- Prazna polja upravljavca so v politiki zasebnosti prikazana kot `[DOPOLNI: …]`.
- Dopolni še ostala označena mesta na `/zasebnost` (pravna podlaga za zaščito pred zlorabami, obdelovalci in regije, roki hrambe, prenosi v tretje države, rok odziva, datum).
- Besedilo je osnutek in ni pravni nasvet. Priporočljiv je pregled pravnega strokovnjaka.

**Manjkajoči podatki upravljavca in kontakt so ovira za javno objavo.**

---

## 12. Priprava in objava na gostovanju

Pred objavo:

```bash
npm run check
```

(lint, preverjanje tipov, testi in produkcijska gradnja).

### Vercel

1. Na [vercel.com](https://vercel.com) → »Add New… → Project« → uvozi repozitorij z GitHuba.
2. Ime projekta: `gradimocamper` (glej [13](#13-naslov-gradimocampervercelapp)). Ogrodje se zazna samodejno (Next.js).
3. Settings → Environment Variables: vnesi spremenljivke iz [4](#4-okoljske-spremenljivke) za okolje **Production**. Za predoglede (Preview) produkcijskih ključev Supabase ne vnašaj ali uporabi ločen testni projekt Supabase, sicer predogledi pišejo v produkcijsko bazo.
4. »Deploy«. Indeksiranje ostane izklopljeno, dokler ne nastaviš `ALLOW_INDEXING=true`.

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

- [ ] **Pravice za slike:** pisno dovoljenje za javno uporabo vseh treh fotografij (vidne oznake BÜRSTNER in SIGNATURE) ali zamenjava z lastnimi fotografijami. Nato slike dodaj v Git oziroma na gostovanje (glej [9](#9-dodajanje-in-zamenjava-priloženih-datotek)).
- [ ] **Podatki upravljavca in kontakt** v `content.ts` (`controller`, `contact`).
- [ ] **Politika zasebnosti:** dopolnitev vseh mest `[DOPOLNI: …]` in pravni pregled.
- [ ] **Izbira gostovanja** glede na pogoje poslovne rabe (Vercel Hobby ni namenjen poslovni rabi).
- [ ] **Supabase:** migracija, izklopljena javna registracija, lastniški račun, `ADMIN_USER_ID`, spremenljivke okolja na gostovanju.
- [ ] Preverjen naslov (`gradimocamper.vercel.app` ali drug, ki ga izbereš) v `NEXT_PUBLIC_SITE_URL`.

Ob objavi:

- [ ] Preizkus na objavljeni strani: prijava (oba obrazca), administracija, izvoz, preklic, izbris.
- [ ] `ALLOW_INDEXING=true`, ko je stran pripravljena za iskalnike.
- [ ] Načrt rednih varnostnih kopij in odziva na zahteve posameznikov.

Pozneje (ni v tej različici): potrditveno sporočilo (double opt-in), storitev za pošiljanje z odjavo, samodejni preklic prek povezave.

---

## Varnost na kratko

- Oddaja prek strežniške akcije; strežnik preveri obliko in dolžino, normalizira naslov, preveri obvezno privolitev, past za robote (skrito polje), omejitev zahtev in izvor zahteve.
- Omejevanje zahtev je v bazi (deluje pri več strežniških instancah): 5 oddaj v 10 minutah z istega IP-naslova.
- Dvojnike prepreči enolična omejitev v bazi (`INSERT … ON CONFLICT DO NOTHING`), tudi pri sočasnih zahtevah.
- RLS je vklopljen; vloge `anon` in `authenticated` nimajo pravic do tabel in funkcij.
- Administracija: identiteta se preveri pri strežniku Supabase Auth in primerja z `ADMIN_USER_ID` pri vsaki strani, akciji in izvozu. Piškotek seje je `HttpOnly`, omejen na `/admin`, `SameSite=Lax`, v produkciji `Secure`.
- Zasebni odzivi imajo `Cache-Control: private, no-store` in `X-Robots-Tag: noindex`.
- Varnostne glave (CSP, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) v `next.config.ts`.

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

Enotski testi (`tests/`) pokrivajo normalizacijo in preverjanje naslovov, logiko obrazca, CSV (ubežanje, zaščita pred formulami, BOM), parametre administracije, psevdonimizacijo IP-naslovov, časovne žige in pravila indeksiranja.
