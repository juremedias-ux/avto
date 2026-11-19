import type { ReactNode } from "react";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { PageIntro } from "@/components/platform/ui";
import { brand, contact, controller } from "@/content";
import { requireViewer } from "@/lib/cms";
import { routes } from "@/lib/platform";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Pogoji uporabe",
  description: `Pogoji uporabe spletne strani ${brand.name}.`,
  path: routes.terms,
});

function Missing({ children }: { children: ReactNode }) {
  return <mark className="rounded-md bg-[#fbe9c8] px-1.5 py-0.5 font-semibold text-ink">[DOPOLNI: {children}]</mark>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-sand-300 py-7 first:border-t-0 first:pt-0">
      <h2 className="text-xl font-semibold tracking-[-0.01em]">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-ink-muted [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6">{children}</div>
    </section>
  );
}

/** Osnutek pogojev uporabe. Pred javno objavo platforme ga mora pregledati pravnik. */
export default async function TermsPage() {
  const viewer = await requireViewer();
  return (
    <PlatformShell preview={viewer.preview}>
      <PageIntro crumbs={[{ label: "Pogoji uporabe" }]} title="Pogoji uporabe">
        <p role="note" className="sample-notice mt-5 max-w-3xl">
          <strong>Osnutek.</strong> Besedilo še ni pravno pregledano in ni dokončno.
        </p>
      </PageIntro>
      <div className="container-page pb-16">
        <div className="max-w-3xl">
          <Section title="1. Upravljavec strani">
            <p>
              Stran upravlja {controller.name}
              {controller.address ? `, ${controller.address}` : null}. Kontakt:{" "}
              <a href={`mailto:${controller.email || contact.email}`} className="text-link">
                {controller.email || contact.email}
              </a>
              .
            </p>
            {!controller.address ? (
              <p>
                <Missing>naslov in matična številka upravljavca</Missing>
              </p>
            ) : null}
          </Section>
          <Section title="2. Namen vsebin">
            <p>
              Vodiči, videi in učne poti so splošne informacije o predelavi kombija. Niso nadomestilo za strokovni nasvet,
              navodila proizvajalca opreme ali predpise, ki veljajo za tvoje vozilo.
            </p>
            <p>
              Dela na elektriki, plinski napeljavi, nosilnih delih in varnostni opremi lahko ogrozijo varnost. Če nisi
              prepričan, jih prepusti usposobljeni osebi.
            </p>
            <p>
              Predelava lahko vpliva na registracijo in homologacijo vozila. Pred posegi preveri zahteve pri pristojnih
              organih.
            </p>
          </Section>
          <Section title="3. Izdelki in povpraševanja">
            <ul>
              <li>Na strani ni spletnega nakupa in plačila. Oddaja povpraševanja ni naročilo in ne zavezuje nobene strani.</li>
              <li>Podatki o izdelkih, cenah in dobavljivosti so informativni. Veljavni so podatki iz pisne ponudbe.</li>
              <li>Izdelki, označeni kot »vzorec«, so primeri za prikaz strani in niso v prodaji.</li>
            </ul>
            <p>
              <Missing>pogoji prodaje, dobave, vračil in garancije, ko bo prodaja vzpostavljena</Missing>
            </p>
          </Section>
          <Section title="4. Avtorske pravice">
            <p>
              Za besedila, fotografije in videe na strani veljajo avtorske pravice njihovih avtorjev. Brez dovoljenja jih ni
              dovoljeno kopirati za objavo drugje.
            </p>
          </Section>
          <Section title="5. Zasebnost">
            <p>
              Obdelava osebnih podatkov je opisana v{" "}
              <a href={routes.privacy} className="text-link">
                politiki zasebnosti
              </a>
              .
            </p>
          </Section>
        </div>
      </div>
    </PlatformShell>
  );
}
