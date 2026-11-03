import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { brand, consent, contact, controller, dataLocation, privacyPage } from "@/content";
import { RATE_LIMITS } from "@/lib/rate-limit";

export const metadata: Metadata = {
  title: privacyPage.title,
  description: `Politika zasebnosti za prijavo na obvestilo ob zagonu ${brand.name}.`,
  alternates: { canonical: "/zasebnost" },
};

/** Jasno označeno mesto, ki ga mora lastnik dopolniti. */
function Missing({ children }: { children: ReactNode }) {
  return (
    <mark className="rounded-md bg-[#fbe9c8] px-1.5 py-0.5 font-semibold text-ink">
      [DOPOLNI: {children}]
    </mark>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-sand-300 py-8 first:border-t-0 first:pt-0">
      <h2 className="text-2xl font-semibold tracking-[-0.02em]">{title}</h2>
      <div className="mt-4 space-y-4 text-[1.0625rem] leading-relaxed text-ink-muted [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
        {children}
      </div>
    </section>
  );
}

/** Kontaktni podatki upravljavca (telefon in/ali e-pošta). */
function ContactDetails() {
  const email = controller.email || contact.email;
  const items: ReactNode[] = [];
  if (contact.phone) {
    items.push(
      <a key="tel" href={`tel:${contact.phoneHref}`} className="text-link">
        {contact.phone}
      </a>,
    );
  }
  if (email) {
    items.push(
      <a key="mail" href={`mailto:${email}`} className="text-link">
        {email}
      </a>,
    );
  }
  if (items.length === 0) return <Missing>kontakt upravljavca</Missing>;
  return (
    <>
      {items.map((item, index) => (
        <span key={index}>
          {index > 0 ? " ali " : null}
          {item}
        </span>
      ))}
    </>
  );
}

export default function PrivacyPage() {
  const minutes = (seconds: number) => Math.round(seconds / 60);
  const contactMethod = contact.phone
    ? "pokliči ali pošlji sporočilo SMS na številko"
    : "piši na";

  return (
    <>
      <SiteHeader />
      <main id="vsebina" tabIndex={-1} className="container-page py-14 outline-none sm:py-20">
        <div className="mx-auto max-w-[44rem]">
          <h1 className="display-2">{privacyPage.title}</h1>
          <p className="mt-4 text-[0.9375rem] text-ink-muted">Zadnja sprememba: {privacyPage.updated}</p>
          {privacyPage.legallyReviewed ? null : (
            <p
              role="note"
              className="mt-6 rounded-2xl border border-[#e8c98f] bg-[#fdf4e3] px-5 py-4 text-[0.9375rem] font-medium leading-relaxed text-ink"
            >
              {privacyPage.reviewNotice}
            </p>
          )}

          <div className="mt-10">
            <Section title="1. Upravljavec in kontakt">
              <p>
                Upravljavec osebnih podatkov: <strong>{controller.name || <Missing>naziv upravljavca</Missing>}</strong>
                {controller.address ? (
                  <>
                    <br />
                    Naslov: {controller.address}
                  </>
                ) : null}
                {controller.registrationNumber ? (
                  <>
                    <br />
                    Matična številka: {controller.registrationNumber}
                  </>
                ) : null}
                <br />
                Kontakt za vprašanja o zasebnosti, preklic privolitve in izbris: <ContactDetails />
              </p>
            </Section>

            <Section title="2. Katere podatke obdelujemo">
              <ul>
                <li>
                  <strong>E-poštni naslov</strong>, ki ga vpišeš v prijavni obrazec.
                </li>
                <li>
                  <strong>Privolitve</strong>: privolitev za obvestilo ob zagonu in morebitna privolitev za
                  nasvete, novice in občasne ponudbe, čas posamezne privolitve, čas morebitnega preklica in
                  različica prikazanega besedila privolitev.
                </li>
                <li>
                  <strong>Vir prijave</strong>: kateri od dveh obrazcev na strani je bil uporabljen.
                </li>
                <li>
                  <strong>Podatki za zaščito pred zlorabami</strong>: za omejevanje števila oddaj se iz
                  IP-naslova izračuna psevdonim (HMAC-SHA256 s strežniško skrivnostjo). Sam IP-naslov se ne
                  shrani. Psevdonim je vezan na časovno okno {minutes(RATE_LIMITS.waitlist.windowSeconds)} minut
                  (pri prijavi lastnika v administracijo {minutes(RATE_LIMITS.adminLogin.windowSeconds)} minut);
                  potekli zapisi se samodejno izbrišejo ob naslednji oddaji obrazca.
                </li>
                <li>
                  <strong>Tehnični podatki zahtev</strong>: ponudnik gostovanja pri dostavi strani obdeluje tehnične
                  podatke, kot je IP-naslov, v skladu s svojimi pogoji. Aplikacija GradimoCamper teh podatkov ne
                  shranjuje.
                </li>
              </ul>
              <p>
                Imena, telefonske številke ali drugih podatkov ne zbiramo. Uporabniškega računa za obiskovalce ni.
              </p>
            </Section>

            <Section title="3. Nameni in pravna podlaga">
              <ul>
                <li>
                  <strong>Obvestilo ob zagonu platforme</strong> – na podlagi tvoje privolitve (točka (a) prvega
                  odstavka 6. člena Splošne uredbe o varstvu podatkov): »{consent.launch}«
                </li>
                <li>
                  <strong>Praktični nasveti, novice in občasne ponudbe</strong> – samo, če je bila zanje dana
                  ločena, neobvezna privolitev (točka (a) prvega odstavka 6. člena Splošne uredbe o varstvu
                  podatkov): »{consent.newsletter}«
                </li>
                <li>
                  <strong>Zaščita obrazca pred zlorabami</strong> – na podlagi zakonitega interesa upravljavca
                  (točka (f) prvega odstavka 6. člena Splošne uredbe o varstvu podatkov), da obrazec in bazo zaščiti
                  pred samodejnimi in množičnimi oddajami.
                </li>
              </ul>
              <p>
                Naslovov ne posredujemo partnerjem ali drugim podjetjem za njihovo samostojno trženje.
              </p>
              <p>
                Lastništva e-poštnega naslova trenutno ne preverjamo s potrditvenim sporočilom. Če je kdo vpisal
                tvoj naslov brez tvoje vednosti, nam to sporoči (točka 1) in naslov bomo izbrisali.
              </p>
            </Section>

            <Section title="4. Obdelovalci (ponudniki storitev)">
              <p>Podatke za nas obdelujeta ponudnika storitev:</p>
              <ul>
                <li>
                  <strong>Supabase</strong> – podatkovna baza s prijavami in prijava lastnika v administracijo.
                  Lokacija baze:{" "}
                  {dataLocation.supabaseRegion || <Missing>regija projekta Supabase</Missing>}.
                </li>
                <li>
                  <strong>Vercel</strong> – gostovanje spletne strani in izvajanje strežniške kode, ki obdela oddani
                  obrazec.
                </li>
              </ul>
              <p>
                Ponudnika obdelujeta podatke po naročilu upravljavca na podlagi pogodbe o obdelavi osebnih podatkov
                in jih ne smeta uporabljati za lastne namene.
              </p>
            </Section>

            <Section title="5. Rok hrambe">
              <ul>
                <li>
                  <strong>Obvestilo ob zagonu</strong>: do zagona platforme in poslanega obvestila. Prijave brez
                  aktivne privolitve za novice izbrišemo najpozneje 30 dni po poslanem obvestilu.
                </li>
                <li>
                  <strong>Nasveti, novice in ponudbe</strong>: do preklica privolitve.
                </li>
                <li>
                  <strong>Po preklicu</strong>: ko prijava nima več nobene aktivne privolitve, jo izbrišemo
                  najpozneje v 30 dneh.
                </li>
                <li>
                  <strong>Podatki za zaščito pred zlorabami</strong>: kot je navedeno v točki 2.
                </li>
              </ul>
            </Section>

            <Section title="6. Prenos podatkov v tretje države">
              <p>
                Če ponudnika iz točke 4 ali njuni podobdelovalci obdelujejo podatke zunaj Evropske unije oziroma
                Evropskega gospodarskega prostora, se prenos izvaja na podlagi ustreznih zaščitnih ukrepov iz
                46. člena Splošne uredbe o varstvu podatkov, zlasti standardnih pogodbenih klavzul Evropske
                komisije, ki so del pogodb o obdelavi podatkov teh ponudnikov.
              </p>
            </Section>

            <Section title="7. Tvoje pravice">
              <p>
                Imaš pravico do dostopa do svojih podatkov, popravka, izbrisa, omejitve obdelave, prenosljivosti
                in ugovora ter pravico, da privolitev kadar koli prekličeš. Preklic ne vpliva na zakonitost
                obdelave pred preklicem.
              </p>
              <p>
                Pritožbo lahko vložiš pri nadzornem organu. V Sloveniji je to Informacijski pooblaščenec,{" "}
                <a href="https://www.ip-rs.si" className="text-link" rel="noopener noreferrer">
                  www.ip-rs.si
                </a>
                .
              </p>
            </Section>

            <Section title="8. Preklic privolitve in izbris">
              <p>
                Privolitvi za obvestilo ob zagonu in za novice lahko prekličeš ločeno. Za preklic ali izbris{" "}
                {contactMethod} <ContactDetails /> in navedi e-poštni naslov iz prijave ter katero privolitev
                prekličeš oziroma da želiš izbris vseh podatkov. Zahtevo izvedemo ročno v
                administraciji brez nepotrebnega odlašanja, najpozneje v enem mesecu od prejema.
              </p>
            </Section>

            <Section title="9. Piškotki">
              <p>
                Javna stran ne uporablja piškotkov za analitiko, oglaševanje ali sledenje. Prijava na obvestilo ne
                nastavi piškotkov.
              </p>
              <p>
                Administracija (dostop samo za lastnika) uporablja nujno potrebne piškotke Supabase Auth za
                prijavljeno sejo. Piškotki so omejeni na pot /admin.
              </p>
            </Section>

            <Section title="10. Spremembe">
              <p>
                O bistvenih spremembah te politike bomo obvestili na tej strani. Datum zadnje spremembe:{" "}
                {privacyPage.updated}.
              </p>
            </Section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
