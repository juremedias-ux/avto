import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { brand, consent, contact, controller, privacyPage } from "@/content";
import { RATE_LIMITS } from "@/lib/rate-limit";

export const metadata: Metadata = {
  title: privacyPage.title,
  description: `Osnutek politike zasebnosti za prijavo na obvestilo ob zagonu ${brand.name}.`,
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

function Value({ value, label }: { value: string; label: string }) {
  return value ? <>{value}</> : <Missing>{label}</Missing>;
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

export default function PrivacyPage() {
  const contactEmail = controller.email || contact.email;
  const minutes = (seconds: number) => Math.round(seconds / 60);

  return (
    <>
      <SiteHeader />
      <main id="vsebina" tabIndex={-1} className="container-page py-14 outline-none sm:py-20">
        <div className="mx-auto max-w-[44rem]">
          <h1 className="display-2">{privacyPage.title}</h1>
          <p
            role="note"
            className="mt-6 rounded-2xl border border-[#e8c98f] bg-[#fdf4e3] px-5 py-4 text-[0.9375rem] font-medium leading-relaxed text-ink"
          >
            {privacyPage.draftNotice}
          </p>

          <div className="mt-10">
            <Section title="1. Upravljavec in kontakt">
              <p>
                Upravljavec osebnih podatkov: <Value value={controller.name} label="ime oziroma naziv upravljavca" />
                <br />
                Naslov: <Value value={controller.address} label="naslov upravljavca" />
                <br />
                Matična številka: <Value value={controller.registrationNumber} label="matična številka, če obstaja" />
                <br />
                Kontakt za vprašanja o zasebnosti, preklic in izbris:{" "}
                {contactEmail ? (
                  <a href={`mailto:${contactEmail}`} className="text-link">
                    {contactEmail}
                  </a>
                ) : (
                  <Missing>kontaktni e-poštni naslov</Missing>
                )}
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
              </ul>
              <p>
                Imena, telefonske številke ali drugih podatkov ne zbiramo. Uporabniškega računa za obiskovalce ni.
              </p>
            </Section>

            <Section title="3. Nameni in pravna podlaga">
              <ul>
                <li>
                  <strong>Obvestilo ob zagonu platforme</strong> – na podlagi tvoje privolitve: »{consent.launch}«
                </li>
                <li>
                  <strong>Praktični nasveti, novice in občasne ponudbe</strong> – samo, če je bila zanje dana
                  ločena, neobvezna privolitev: »{consent.newsletter}«
                </li>
                <li>
                  <strong>Zaščita obrazca pred zlorabami</strong> –{" "}
                  <Missing>pravna podlaga (predlog: zakoniti interes), preveri s pravnim svetovalcem</Missing>
                </li>
              </ul>
              <p>
                Naslovov ne posredujemo partnerjem ali drugim podjetjem za njihovo samostojno trženje.
              </p>
              <p>
                Lastništvo e-poštnega naslova trenutno ne preverjamo s potrditvenim sporočilom. Če je kdo vpisal
                tvoj naslov brez tvoje vednosti, nam piši in naslov bomo izbrisali.
              </p>
            </Section>

            <Section title="4. Obdelovalci (ponudniki storitev)">
              <ul>
                <li>
                  <strong>Supabase</strong> – podatkovna baza in prijava lastnika v administracijo.{" "}
                  <Missing>izbrana regija strežnikov in sklenjena pogodba o obdelavi (DPA)</Missing>
                </li>
                <li>
                  <strong>Ponudnik gostovanja spletne strani</strong> –{" "}
                  <Missing>ime ponudnika (npr. Vercel), regija in pogodba o obdelavi (DPA)</Missing>
                </li>
              </ul>
            </Section>

            <Section title="5. Rok hrambe">
              <p>
                <Missing>
                  rok hrambe e-poštnih naslovov in privolitev (npr. do preklica oziroma določen čas po zagonu)
                </Missing>
              </p>
              <p>
                Podatki za zaščito pred zlorabami se izbrišejo samodejno, ko poteče časovno okno iz točke 2 in je
                oddan naslednji obrazec. <Missing>po potrebi dodaj redno brisanje (glej README, razdelek o hrambi)</Missing>
              </p>
            </Section>

            <Section title="6. Prenos podatkov v tretje države">
              <p>
                <Missing>
                  ali se podatki prenašajo izven EU/EGP (odvisno od izbranih ponudnikov in regij) in na kateri
                  podlagi
                </Missing>
              </p>
            </Section>

            <Section title="7. Tvoje pravice">
              <p>
                Imaš pravico do dostopa do svojih podatkov, popravka, izbrisa, omejitve obdelave, prenosljivosti
                in ugovora ter pravico, da privolitev kadar koli prekličeš. Preklic ne vpliva na zakonitost
                obdelave pred preklicem.
              </p>
              <p>
                Pritožbo lahko vložiš pri nadzornem organu; v Sloveniji je to Informacijski pooblaščenec.{" "}
                <Missing>preveri in dopolni kontaktne podatke nadzornega organa</Missing>
              </p>
            </Section>

            <Section title="8. Preklic privolitve in izbris">
              <p>
                Privolitvi za obvestilo ob zagonu in za novice lahko prekličeš ločeno. Pošlji sporočilo na{" "}
                {contactEmail ? (
                  <a href={`mailto:${contactEmail}`} className="text-link">
                    {contactEmail}
                  </a>
                ) : (
                  <Missing>kontaktni e-poštni naslov</Missing>
                )}{" "}
                in navedi, katero privolitev prekličeš ali da želiš izbris vseh podatkov. Zahtevo izvedemo
                ročno v administraciji. <Missing>rok odziva na zahtevo</Missing>
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
                Datum zadnje spremembe: <Missing>datum objave</Missing>
              </p>
            </Section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
